"""Lyrics API routes."""
from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Query

from server.services.lyrics_service import lyrics_service

router = APIRouter(prefix="/api", tags=["lyrics"])


@router.get("/lyrics")
def get_lyrics(
    title: Optional[str] = Query(None, description="Track title"),
    artist: Optional[str] = Query("", description="Artist name"),
    duration: Optional[float] = Query(0, description="Track duration in seconds"),
    video_id: Optional[str] = Query("", description="YouTube video ID for local cache or YT fallback"),
) -> Dict[str, Any]:
    """
    Fetch synchronized LRC lyrics for a track.
    Falls back to LRCLIB, local SQLite cache, or YouTube Music timed/auto-paced lyrics.
    """
    return lyrics_service.get_lyrics(
        title=title or "",
        artist=artist or "",
        duration=int(duration or 0),
        video_id=video_id or "",
    )
