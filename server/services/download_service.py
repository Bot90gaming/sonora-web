"""
Audio download manager service using yt-dlp with FFmpeg audio extraction and job progress tracking.
"""
from __future__ import annotations

import logging
import re
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

import yt_dlp

logger = logging.getLogger(__name__)

DEFAULT_DOWNLOAD_DIR = Path.home() / "Music" / "Sonora"


class DownloadService:
    def __init__(self, download_dir: Optional[Path] = None) -> None:
        self.download_dir = download_dir or DEFAULT_DOWNLOAD_DIR
        self.download_dir.mkdir(parents=True, exist_ok=True)
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def _sanitize(self, s: str) -> str:
        return "".join(c for c in s if c.isalnum() or c in " _-.").strip()

    def start_download(
        self,
        video_id: str,
        title: str = "",
        artist: str = "",
        audio_format: str = "mp3",
    ) -> Dict[str, Any]:
        """Start an asynchronous download job."""
        if not video_id:
            raise ValueError("video_id is required")

        valid_formats = {"mp3", "m4a", "opus", "flac", "wav"}
        fmt = audio_format.lower() if audio_format.lower() in valid_formats else "mp3"

        job_id = f"dl-{uuid.uuid4().hex[:8]}"
        job = {
            "jobId": job_id,
            "videoId": video_id,
            "title": title or "Track",
            "artist": artist or "Unknown Artist",
            "format": fmt,
            "status": "queued",
            "progress": 0,
            "filePath": None,
            "fileName": None,
            "error": None,
            "createdAt": time.time(),
        }

        with self._lock:
            self._jobs[job_id] = job

        threading.Thread(
            target=self._run_download,
            args=(job_id, video_id, title, artist, fmt),
            daemon=True,
        ).start()

        return job

    def _run_download(
        self,
        job_id: str,
        video_id: str,
        title: str,
        artist: str,
        fmt: str,
    ) -> None:
        logger.info("Starting download job %s for video %s (%s)", job_id, video_id, fmt)
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id]["status"] = "downloading"

        url = f"https://music.youtube.com/watch?v={video_id}"
        safe_title = self._sanitize(title)
        safe_artist = self._sanitize(artist)

        if safe_artist and safe_title:
            base_name = f"{safe_artist} - {safe_title}"
        elif safe_title:
            base_name = safe_title
        elif safe_artist:
            base_name = safe_artist
        else:
            base_name = f"track_{video_id}"

        template = str(self.download_dir / f"{base_name}.%(ext)s")

        def hook(d: Dict[str, Any]) -> None:
            if d.get("status") == "downloading":
                total = d.get("total_bytes") or d.get("total_bytes_estimate") or 1
                downloaded = d.get("downloaded_bytes", 0)
                pct = int(downloaded / total * 100)
                with self._lock:
                    if job_id in self._jobs:
                        self._jobs[job_id]["progress"] = min(99, pct)

        ydl_opts: Dict[str, Any] = {
            "format": "bestaudio/best",
            "outtmpl": template,
            "progress_hooks": [hook],
            "quiet": True,
            "no_warnings": True,
            "nocheckcertificate": True,
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": fmt,
                "preferredquality": "192",
            }],
            "http_headers": {
                "User-Agent": (
                    "Mozilla/5.0 (X11; Linux x86_64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/125.0.0.0 Safari/537.36"
                ),
            },
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])

            target_file = self.download_dir / f"{base_name}.{fmt}"
            if not target_file.exists():
                candidates = list(self.download_dir.glob(f"{base_name}.*"))
                if candidates:
                    target_file = candidates[0]

            with self._lock:
                if job_id in self._jobs:
                    self._jobs[job_id]["status"] = "completed"
                    self._jobs[job_id]["progress"] = 100
                    self._jobs[job_id]["filePath"] = str(target_file)
                    self._jobs[job_id]["fileName"] = target_file.name

            logger.info("Download job %s completed: %s", job_id, target_file)
        except Exception as e:
            logger.exception("Download job %s failed: %s", job_id, e)
            with self._lock:
                if job_id in self._jobs:
                    self._jobs[job_id]["status"] = "error"
                    self._jobs[job_id]["error"] = str(e)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._jobs.get(job_id)

    def get_all_jobs(self) -> List[Dict[str, Any]]:
        with self._lock:
            jobs_list = list(self._jobs.values())
        jobs_list.sort(key=lambda j: j["createdAt"], reverse=True)
        return jobs_list


download_service = DownloadService()
