"""
Lyrics service fetching synced LRC lyrics from LRCLIB, local cache, or YouTube Music fallback.
"""
from __future__ import annotations

import json
import logging
import re
import sqlite3
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class LyricsService:
    def __init__(self) -> None:
        self._cache: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def clean_title(title: str) -> str:
        """Strip track metadata tags like (Official Music Video), [Lyric Video], (feat. ...)."""
        if not title:
            return ""
        cleaned = re.sub(
            r"[\(\[](?:official|music\s+video|official\s+video|video|audio|lyric|lyrics|visualizer|remastered|live|deluxe|explicit|hd|4k|mv|remix|prod\.).*?[\)\]]",
            "",
            title,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(r"\s*(?:feat\.|ft\.).*", "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip(" -–—[]()| \t\n\r")

    @staticmethod
    def clean_artist(artist: str) -> str:
        """Clean artist string, picking primary artist if multiple or featured."""
        if not artist:
            return ""
        # e.g. "Luis Fonsi, Daddy Yankee" -> "Luis Fonsi"
        cleaned = artist.split(",")[0].split("&")[0].split(" feat")[0].split(" ft.")[0]
        return cleaned.strip()

    @staticmethod
    def parse_lrc(lrc_text: str) -> List[Dict[str, Any]]:
        """Parse standard LRC synchronized lyrics into timed intervals."""
        pattern = re.compile(r"\[(\d+):(\d+(?:\.\d+)?)\](.*)")
        raw: List[tuple[int, str]] = []
        for line in lrc_text.splitlines():
            m = pattern.match(line.strip())
            if m:
                mins = int(m.group(1))
                secs = float(m.group(2))
                start_ms = int((mins * 60 + secs) * 1000)
                text = m.group(3).strip()
                if text:
                    raw.append((start_ms, text))

        lines: List[Dict[str, Any]] = []
        for i, (start_ms, text) in enumerate(raw):
            end_ms = raw[i + 1][0] if i + 1 < len(raw) else (start_ms + 4000)
            lines.append({
                "id": i,
                "text": text,
                "time": round(start_ms / 1000.0, 3),
                "startTime": start_ms,
                "endTime": end_ms,
            })
        return lines

    @staticmethod
    def format_lrc(lines: List[Dict[str, Any]]) -> str:
        """Format parsed lines back into LRC format string."""
        parts = []
        for line in lines:
            t = line.get("time")
            if t is None or t < 0:
                st = line.get("startTime", 0)
                if st is not None and st >= 0:
                    t = st / 1000.0 if st > 1000 else float(st)
                else:
                    t = 0.0
            mins = int(t // 60)
            secs = t % 60
            parts.append(f"[{mins:02d}:{secs:05.2f}] {line.get('text', '')}")
        return "\n".join(parts)

    @staticmethod
    def _check_local_cache_lyrics(video_id: str) -> Optional[Dict[str, Any]]:
        """Check Sonora desktop's local sqlite cache for cached synced lyrics."""
        if not video_id:
            return None
        try:
            home = Path.home()
            db_path = home / ".cache" / "sonora" / "cache.sqlite"
            if not db_path.exists():
                return None
        except Exception:
            return None
        try:
            con = sqlite3.connect(str(db_path))
            cursor = con.cursor()
            cursor.execute("SELECT value FROM lyrics WHERE key=?", (f"youtube:{video_id}:lyrics",))
            row = cursor.fetchone()
            if not row:
                return None
            val = json.loads(row[0])
            hits = val.get("hits", [])
            for h in hits:
                syn = h.get("lyrics", {}).get("Synced")
                if syn and isinstance(syn, dict) and syn.get("lines"):
                    lines = []
                    for idx, line in enumerate(syn["lines"]):
                        st = line.get("start", {})
                        et = line.get("end", {})
                        st_ms = int(st.get("secs", 0) * 1000 + st.get("nanos", 0) / 1e6)
                        et_ms = int(et.get("secs", 0) * 1000 + et.get("nanos", 0) / 1e6)
                        lines.append({
                            "id": idx,
                            "text": line.get("text", "").strip(),
                            "time": round(st_ms / 1000.0, 3),
                            "startTime": st_ms,
                            "endTime": et_ms,
                        })
                    if lines:
                        synced_lrc = LyricsService.format_lrc(lines)
                        return {
                            "loading": False,
                            "available": True,
                            "hasTimestamps": True,
                            "syncedLyrics": synced_lrc,
                            "plainLyrics": "\n".join(l["text"] for l in lines),
                            "lines": lines,
                            "source": f"{h.get('source', 'Cache')} (Synced)",
                        }
        except Exception as e:
            logger.debug("Cache lyrics read error for %s: %s", video_id, e)
        return None

    def _fetch_lrclib(self, title: str, artist: str = "", duration: int = 0) -> Optional[Dict[str, Any]]:
        """Query LRCLIB API for synced or plain lyrics."""
        if not title:
            return None
        c_title = self.clean_title(title)
        c_artist = self.clean_artist(artist)

        headers = {"User-Agent": "Sonora/1.0"}

        # 1. Try exact GET
        params: Dict[str, Any] = {"track_name": c_title or title}
        if c_artist:
            params["artist_name"] = c_artist
        if duration > 0:
            params["duration"] = int(duration)

        try:
            resp = requests.get("https://lrclib.net/api/get", params=params, headers=headers, timeout=3.5)
            if resp.status_code == 200:
                data = resp.json()
                if data and data.get("syncedLyrics"):
                    parsed = self.parse_lrc(data["syncedLyrics"])
                    if len(parsed) > 2:
                        return data
        except Exception as e:
            logger.debug("LRCLIB exact get failed: %s", e)

        # 2. Try SEARCH API
        q = f"{c_title or title} {c_artist}".strip()
        try:
            resp = requests.get("https://lrclib.net/api/search", params={"q": q}, headers=headers, timeout=3.5)
            if resp.status_code == 200:
                results = resp.json()
                if isinstance(results, list) and results:
                    for item in results:
                        if item.get("syncedLyrics"):
                            parsed = self.parse_lrc(item["syncedLyrics"])
                            if len(parsed) > 2:
                                return item
                    return results[0]
        except Exception as e:
            logger.debug("LRCLIB search failed: %s", e)

        return None

    def get_lyrics(
        self,
        title: str = "",
        artist: str = "",
        duration: int = 0,
        video_id: str = "",
    ) -> Dict[str, Any]:
        """Fetch synchronized LRC lyrics with fallbacks."""
        cache_key = f"{video_id}:{title}:{artist}:{duration}"
        if cache_key in self._cache:
            return self._cache[cache_key]

        # 1. Check local sqlite cache
        if video_id:
            cached = self._check_local_cache_lyrics(video_id)
            if cached:
                self._cache[cache_key] = cached
                return cached

        # 2. Try LRCLIB for synced lyrics
        lrclib_data = None
        if title:
            lrclib_data = self._fetch_lrclib(title, artist, duration)
            if lrclib_data and lrclib_data.get("syncedLyrics"):
                raw_synced = lrclib_data["syncedLyrics"]
                parsed_lines = self.parse_lrc(raw_synced)
                if parsed_lines and len(parsed_lines) > 2:
                    result = {
                        "loading": False,
                        "available": True,
                        "hasTimestamps": True,
                        "syncedLyrics": raw_synced,
                        "plainLyrics": lrclib_data.get("plainLyrics") or "\n".join(l["text"] for l in parsed_lines),
                        "lines": parsed_lines,
                        "source": "LRCLIB (Synced)",
                    }
                    self._cache[cache_key] = result
                    return result

        # 3. Fallback to YouTube Music lyrics (if video_id is provided)
        yt_lyrics_data = None
        if video_id:
            try:
                from server.services.music_service import music_service
                yt_lyrics_data = music_service.api.get_song_lyrics(video_id)
            except Exception as e:
                logger.debug("YouTube lyrics error: %s", e)

        if yt_lyrics_data:
            has_timestamps = bool(yt_lyrics_data.get("hasTimestamps"))
            raw_lines = yt_lyrics_data.get("lyrics", [])
            if has_timestamps and isinstance(raw_lines, list) and len(raw_lines) > 0:
                lines = []
                for idx, line in enumerate(raw_lines):
                    text = line.get("text", "") if isinstance(line, dict) else str(line)
                    start_time = line.get("start_time", 0) if isinstance(line, dict) else 0
                    end_time = line.get("end_time", 0) if isinstance(line, dict) else 0

                    st_sec = 0.0
                    if isinstance(start_time, str):
                        if ":" in start_time:
                            parts = start_time.split(":")
                            st_sec = float(parts[0]) * 60 + float(parts[1])
                        else:
                            st_sec = float(start_time)
                    else:
                        st_sec = float(start_time)

                    if st_sec > 1000:
                        st_ms = int(st_sec)
                        st_sec = round(st_sec / 1000.0, 3)
                    else:
                        st_ms = int(st_sec * 1000)

                    et_ms = int(end_time) if end_time else st_ms + 4000
                    lines.append({
                        "id": idx,
                        "text": text,
                        "time": st_sec,
                        "startTime": st_ms,
                        "endTime": et_ms,
                    })
                synced_lrc = self.format_lrc(lines)
                result = {
                    "loading": False,
                    "available": True,
                    "hasTimestamps": True,
                    "syncedLyrics": synced_lrc,
                    "plainLyrics": "\n".join(l["text"] for l in lines),
                    "lines": lines,
                    "source": yt_lyrics_data.get("source", "YouTube Music (Synced)"),
                }
                self._cache[cache_key] = result
                return result

        # 4. Fallback to plain text lyrics (from LRCLIB or YouTube Music) with auto-paced timing
        plain_text = ""
        source_label = ""
        if lrclib_data and lrclib_data.get("plainLyrics"):
            plain_text = lrclib_data["plainLyrics"]
            source_label = "LRCLIB"
        elif yt_lyrics_data and isinstance(yt_lyrics_data.get("lyrics"), str) and yt_lyrics_data.get("lyrics").strip():
            plain_text = yt_lyrics_data["lyrics"]
            source_label = yt_lyrics_data.get("source", "YouTube Music")

        if plain_text:
            raw_lines_list = [line.strip() for line in plain_text.splitlines() if line.strip()]
            if raw_lines_list:
                dur_ms = int(duration * 1000) if duration > 0 else 0
                lines = []
                has_timed = False

                if dur_ms > 15000 and len(raw_lines_list) > 1:
                    has_timed = True
                    intro_ms = min(12000, max(4000, int(dur_ms * 0.06)))
                    singing_dur = dur_ms - intro_ms - int(dur_ms * 0.04)
                    step_ms = singing_dur / len(raw_lines_list)
                    for idx, text in enumerate(raw_lines_list):
                        st = int(intro_ms + idx * step_ms)
                        et = int(intro_ms + (idx + 1) * step_ms)
                        lines.append({
                            "id": idx,
                            "text": text,
                            "time": round(st / 1000.0, 3),
                            "startTime": st,
                            "endTime": et,
                        })
                    source_label = f"{source_label or 'Lyrics'} (Auto-Paced)"
                else:
                    for idx, text in enumerate(raw_lines_list):
                        lines.append({
                            "id": idx,
                            "text": text,
                            "time": -1,
                            "startTime": -1,
                            "endTime": -1,
                        })

                synced_lrc = self.format_lrc(lines) if has_timed else ""
                result = {
                    "loading": False,
                    "available": True,
                    "hasTimestamps": has_timed,
                    "syncedLyrics": synced_lrc,
                    "plainLyrics": plain_text,
                    "lines": lines,
                    "source": source_label,
                }
                self._cache[cache_key] = result
                return result

        # 5. Empty / not found
        empty = {
            "loading": False,
            "available": False,
            "hasTimestamps": False,
            "syncedLyrics": "",
            "plainLyrics": "",
            "lines": [],
            "source": "",
        }
        self._cache[cache_key] = empty
        return empty


lyrics_service = LyricsService()
