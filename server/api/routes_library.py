"""Library and Authentication API routes."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["library", "auth"])


class HeadersAuthRequest(BaseModel):
    headers: str = Field(..., description="Raw HTTP request headers from music.youtube.com")


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@router.get("/auth/status")
def get_auth_status() -> Dict[str, Any]:
    """Check current sign-in authentication status."""
    return music_service.get_auth_status()


@router.post("/auth/headers")
def login_with_headers(req: HeadersAuthRequest) -> Dict[str, Any]:
    """Sign in by pasting browser request headers from YouTube Music."""
    try:
        ok = music_service.login_with_headers(req.headers)
        return {"success": ok, "authenticated": ok}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to authenticate with headers: {str(e)}")


@router.post("/auth/logout")
def logout() -> Dict[str, Any]:
    """Log out and clear stored session tokens."""
    music_service.logout()
    return {"success": True, "authenticated": False}


# ── Library Endpoints ─────────────────────────────────────────────────────────

@router.get("/library/liked")
def get_liked_songs(
    limit: int = Query(100, ge=1, le=500, description="Max tracks to return"),
) -> Dict[str, Any]:
    """Retrieve user's liked songs from YouTube Music."""
    tracks = music_service.get_liked_songs(limit=limit)
    return {
        "tracks": tracks,
        "count": len(tracks),
        "authenticated": music_service.get_auth_status()["authenticated"],
    }


@router.get("/library/playlists")
def get_library_playlists() -> Dict[str, Any]:
    """Retrieve user's saved and created playlists."""
    playlists = music_service.get_library_playlists()
    return {
        "playlists": playlists,
        "count": len(playlists),
        "authenticated": music_service.get_auth_status()["authenticated"],
    }


@router.get("/library/albums")
def get_library_albums() -> Dict[str, Any]:
    """Retrieve user's saved library albums."""
    albums = music_service.get_library_albums()
    return {
        "albums": albums,
        "count": len(albums),
        "authenticated": music_service.get_auth_status()["authenticated"],
    }
