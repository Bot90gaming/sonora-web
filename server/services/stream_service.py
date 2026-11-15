"""
Audio streaming service resolving direct audio stream URLs via yt-dlp and proxying with byte range support.
"""
from __future__ import annotations

import logging
import os
import threading
import time
from pathlib import Path
from typing import Any, Dict, Generator, Optional, Tuple

import requests
import yt_dlp
from fastapi import HTTPException
from starlette.responses import Response, StreamingResponse

logger = logging.getLogger(__name__)

if os.environ.get("VERCEL") or not os.access(Path.home(), os.W_OK):
    CACHE_DIR = Path("/tmp") / "sonora" / "audio_stream"
else:
    CACHE_DIR = Path.home() / ".cache" / "sonora" / "audio_stream"
CHUNK_SIZE = 64 * 1024  # 64 KB


class StreamService:
    def __init__(self) -> None:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        self._url_cache: Dict[str, Dict[str, Any]] = {}  # video_id -> {url, expires_at, mime_type, content_length}
        self._cache_lock = threading.Lock()
        self._sc_locks: Dict[str, threading.Lock] = {}
        self._sc_meta_lock = threading.Lock()

    def _get_sc_lock(self, video_id: str) -> threading.Lock:
        with self._sc_meta_lock:
            if video_id not in self._sc_locks:
                self._sc_locks[video_id] = threading.Lock()
            return self._sc_locks[video_id]

    def _fetch_soundcloud_to_cache(self, video_id: str) -> Optional[Path]:
        """Download and cache a SoundCloud track as a clean standard audio file (M4A/MP3)."""
        sc_id = video_id[3:] if video_id.startswith("sc_") else video_id
        target_pattern = str(CACHE_DIR / f"sonora_{video_id}.%(ext)s")
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": target_pattern,
            "nocheckcertificate": True,
            "quiet": True,
            "no_warnings": True,
        }
        try:
            logger.info("Downloading SoundCloud track %s to cache...", video_id)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://api.soundcloud.com/tracks/{sc_id}"])
            return self._check_local_file(video_id)
        except Exception as e:
            logger.warning("Failed to download soundcloud track %s: %s", video_id, e)
            return None

    def _get_ydl_opts(self) -> Dict[str, Any]:
        return {
            "format": "bestaudio[ext=webm]/bestaudio[ext=opus]/bestaudio[ext=m4a]/bestaudio/best",
            "quiet": True,
            "no_warnings": True,
            "nocache": True,
            "nocheckcertificate": True,
            "http_headers": {
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
            },
        }

    def resolve_audio_url(self, video_id: str, force_refresh: bool = False) -> Dict[str, Any]:
        """Extract and cache the direct audio streaming URL using yt-dlp."""
        now = time.time()
        with self._cache_lock:
            if not force_refresh and video_id in self._url_cache:
                entry = self._url_cache[video_id]
                if entry["expires_at"] > now:
                    return entry

        logger.info("Extracting stream URL for video_id=%s", video_id)
        if video_id.startswith("sc_"):
            sc_id = video_id[3:]
            url = f"https://api.soundcloud.com/tracks/{sc_id}"
        else:
            url = f"https://music.youtube.com/watch?v={video_id}"
        opts = self._get_ydl_opts()

        for attempt in range(1, 3):
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    stream_url = info.get("url")
                    if not stream_url:
                        raise RuntimeError("yt-dlp did not return an audio URL")

                    ext = info.get("ext", "webm")
                    mime_type = "audio/webm"
                    if ext == "m4a":
                        mime_type = "audio/mp4"
                    elif ext == "opus":
                        mime_type = "audio/ogg"
                    elif ext == "mp3":
                        mime_type = "audio/mpeg"

                    duration = info.get("duration", 0)

                    entry = {
                        "videoId": video_id,
                        "url": stream_url,
                        "ext": ext,
                        "mimeType": mime_type,
                        "duration": duration,
                        "title": info.get("title", ""),
                        "expires_at": now + 7200,  # 2 hours
                    }

                    with self._cache_lock:
                        self._url_cache[video_id] = entry
                    return entry
            except Exception as e:
                logger.warning("Stream URL extraction attempt %d failed for %s: %s", attempt, video_id, e)
                if attempt == 2:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed to resolve audio stream for {video_id}: {str(e)}",
                    )
                time.sleep(1.0)

        raise HTTPException(status_code=500, detail="Could not resolve audio stream URL")

    def _check_local_file(self, video_id: str) -> Optional[Path]:
        """Check if audio has been cached locally."""
        cache_dirs = [CACHE_DIR]
        try:
            home_cache = Path.home() / ".cache" / "sonora"
            if home_cache != CACHE_DIR:
                cache_dirs.append(home_cache)
        except Exception:
            pass
        for base_dir in cache_dirs:
            if not base_dir.exists():
                continue
            candidates = [
                p for p in base_dir.glob(f"sonora_{video_id}.*")
                if p.is_file() and not p.name.endswith((".part", ".ytdl"))
            ]
            if candidates:
                return candidates[0]
        return None

    def stream_audio(
        self,
        video_id: str,
        range_header: Optional[str] = None,
    ) -> Response:
        """Stream audio data directly supporting HTTP Range requests for seamless HTML5 <audio> seeking."""
        # 1. If local cached file exists, stream from disk
        local_file = self._check_local_file(video_id)
        if local_file and local_file.exists():
            return self._stream_local_file(local_file, range_header)

        # 2. For SoundCloud tracks (HLS), download to cache and stream directly from disk
        if video_id.startswith("sc_"):
            with self._get_sc_lock(video_id):
                local_file = self._check_local_file(video_id)
                if not local_file or not local_file.exists():
                    local_file = self._fetch_soundcloud_to_cache(video_id)
            if local_file and local_file.exists():
                return self._stream_local_file(local_file, range_header)
            raise HTTPException(
                status_code=502,
                detail=f"Could not download SoundCloud audio stream for {video_id}",
            )

        # 3. Otherwise proxy the direct audio stream from YouTube CDN
        entry = self.resolve_audio_url(video_id)
        stream_url = entry["url"]
        mime_type = entry.get("mimeType", "audio/webm")

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
        }
        if range_header:
            headers["Range"] = range_header

        try:
            req = requests.get(stream_url, headers=headers, stream=True, timeout=10)
            if req.status_code == 403:
                # URL might have expired, refresh once
                logger.info("403 encountered on stream for %s, refreshing URL...", video_id)
                entry = self.resolve_audio_url(video_id, force_refresh=True)
                stream_url = entry["url"]
                req = requests.get(stream_url, headers=headers, stream=True, timeout=10)

            status_code = req.status_code
            response_headers: Dict[str, str] = {
                "Content-Type": req.headers.get("Content-Type", mime_type),
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
            }
            if "Content-Range" in req.headers:
                response_headers["Content-Range"] = req.headers["Content-Range"]
            if "Content-Length" in req.headers:
                response_headers["Content-Length"] = req.headers["Content-Length"]

            def content_iterator() -> Generator[bytes, None, None]:
                try:
                    for chunk in req.iter_content(chunk_size=CHUNK_SIZE):
                        if chunk:
                            yield chunk
                finally:
                    req.close()

            return StreamingResponse(
                content_iterator(),
                status_code=status_code,
                headers=response_headers,
            )
        except Exception as e:
            logger.exception("Error proxying audio stream for %s: %s", video_id, e)
            raise HTTPException(status_code=502, detail=f"Error streaming audio: {str(e)}")

    def _stream_local_file(self, file_path: Path, range_header: Optional[str]) -> Response:
        """Stream a local audio file with HTTP Range support."""
        file_size = file_path.stat().st_size
        mime_type = "audio/mpeg"
        if file_path.suffix == ".webm":
            mime_type = "audio/webm"
        elif file_path.suffix == ".m4a":
            mime_type = "audio/mp4"
        elif file_path.suffix == ".opus":
            mime_type = "audio/ogg"

        if not range_header:
            def file_iterator() -> Generator[bytes, None, None]:
                with open(file_path, "rb") as f:
                    while chunk := f.read(CHUNK_SIZE):
                        yield chunk

            return StreamingResponse(
                file_iterator(),
                status_code=200,
                headers={
                    "Content-Type": mime_type,
                    "Content-Length": str(file_size),
                    "Accept-Ranges": "bytes",
                },
            )

        # Parse Range header: bytes=start-end
        range_str = range_header.replace("bytes=", "")
        parts = range_str.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if len(parts) > 1 and parts[1] else file_size - 1

        if start >= file_size:
            raise HTTPException(
                status_code=416,
                detail="Requested range not satisfiable",
                headers={"Content-Range": f"bytes */{file_size}"},
            )

        end = min(end, file_size - 1)
        content_length = end - start + 1

        def partial_iterator() -> Generator[bytes, None, None]:
            with open(file_path, "rb") as f:
                f.seek(start)
                bytes_left = content_length
                while bytes_left > 0:
                    read_len = min(CHUNK_SIZE, bytes_left)
                    chunk = f.read(read_len)
                    if not chunk:
                        break
                    bytes_left -= len(chunk)
                    yield chunk

        return StreamingResponse(
            partial_iterator(),
            status_code=206,
            headers={
                "Content-Type": mime_type,
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Content-Length": str(content_length),
                "Accept-Ranges": "bytes",
            },
        )


stream_service = StreamService()
