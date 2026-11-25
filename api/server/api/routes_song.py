"""Song metadata and rating API routes."""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["song"])


@router.get("/song/{video_id}")
def get_song_info(video_id: str) -> Dict[str, Any]:
    """Retrieve detailed metadata for a song."""
    try:
        return music_service.get_song(video_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/song/{video_id}/like")
def like_song(video_id: str) -> Dict[str, Any]:
    """Mark a song as liked."""
    try:
        music_service.like_song(video_id)
        return {"success": True, "videoId": video_id, "liked": True}
    except Exception as e:
        msg = str(e)
        if "401" in msg or "Unauthorized" in msg or "signed in" in msg:
            raise HTTPException(
                status_code=401,
                detail="You must be signed in to like songs on YouTube Music",
            )
        raise HTTPException(status_code=500, detail=f"Failed to like song: {msg}")


@router.delete("/song/{video_id}/like")
@router.post("/song/{video_id}/unlike")
def unlike_song(video_id: str) -> Dict[str, Any]:
    """Remove like from a song."""
    try:
        music_service.unlike_song(video_id)
        return {"success": True, "videoId": video_id, "liked": False}
    except Exception as e:
        msg = str(e)
        if "401" in msg or "Unauthorized" in msg or "signed in" in msg:
            raise HTTPException(
                status_code=401,
                detail="You must be signed in to perform this operation",
            )
        raise HTTPException(status_code=500, detail=f"Failed to unlike song: {msg}")

