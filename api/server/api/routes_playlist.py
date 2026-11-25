"""Playlist, Album, and Artist API routes."""
from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["browse"])


@router.get("/playlist/{playlist_id}")
def get_playlist_details(playlist_id: str) -> Dict[str, Any]:
    """Retrieve full playlist details including track listing."""
    try:
        return music_service.get_playlist(playlist_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch playlist: {str(e)}")


@router.get("/album/{browse_id}")
def get_album_details(browse_id: str) -> Dict[str, Any]:
    """Retrieve album details and track listing."""
    try:
        return music_service.get_album(browse_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch album: {str(e)}")


@router.get("/artist/{channel_id}")
def get_artist_details(channel_id: str) -> Dict[str, Any]:
    """Retrieve artist profile, top tracks, and albums."""
    try:
        return music_service.get_artist(channel_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch artist: {str(e)}")
