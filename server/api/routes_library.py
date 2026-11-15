"""Library and Authentication API routes."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["library", "auth"])


class HeadersAuthRequest(BaseModel):
    headers: str = Field(..., description="Raw HTTP request headers from music.youtube.com")


class AuthRestoreRequest(BaseModel):
    authType: Optional[str] = Field("headers", description="Authentication type: 'headers' or 'google_oauth'")
    headers: Optional[Any] = Field(None, description="Stored raw headers or JSON header string")
    token: Optional[Dict[str, Any]] = Field(None, description="Google OAuth token dict")
    client_data: Optional[Dict[str, Any]] = Field(None, description="Google OAuth client credentials dict")


class OAuthStartRequest(BaseModel):
    client_id: Optional[str] = Field(None, description="Google Cloud OAuth Client ID")
    client_secret: Optional[str] = Field(None, description="Google Cloud OAuth Client Secret")


class OAuthPollRequest(BaseModel):
    device_code: str = Field(..., description="Device verification code from start_oauth")


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@router.get("/auth/status")
def get_auth_status(
    x_sonora_auth: Optional[str] = Header(None, alias="X-Sonora-Auth"),
) -> Dict[str, Any]:
    """Check current sign-in authentication status."""
    if x_sonora_auth and not music_service.get_auth_status()["authenticated"]:
        music_service.rehydrate_if_needed(x_sonora_auth)
    return music_service.get_auth_status()


@router.post("/auth/headers")
def login_with_headers(req: HeadersAuthRequest) -> Dict[str, Any]:
    """Sign in by pasting browser request headers from YouTube Music."""
    try:
        ok = music_service.login_with_headers(req.headers)
        auth_payload = music_service.get_stored_auth_payload()
        return {
            "success": ok,
            "authenticated": ok,
            "authType": "headers",
            "headers": req.headers,
            "authPayload": auth_payload,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to authenticate with headers: {str(e)}")


@router.post("/auth/restore")
def restore_auth(req: AuthRestoreRequest) -> Dict[str, Any]:
    """Restore authentication session from client-persisted storage."""
    try:
        payload = req.model_dump() if hasattr(req, "model_dump") else req.dict()
        ok = music_service.restore_session(payload)
        return {
            "success": ok,
            "authenticated": ok,
            "authType": req.authType if ok else "none",
            "authPayload": music_service.get_stored_auth_payload() if ok else None,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to restore auth session: {str(e)}")


@router.post("/auth/oauth/start")
def start_oauth(req: Optional[OAuthStartRequest] = None) -> Dict[str, Any]:
    """Start Google OAuth device code flow for YouTube Music sign in."""
    try:
        cid = req.client_id if req else None
        csec = req.client_secret if req else None
        return music_service.start_oauth(client_id=cid, client_secret=csec)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/oauth/poll")
def poll_oauth(req: OAuthPollRequest) -> Dict[str, Any]:
    """Poll status of in-progress Google OAuth device flow."""
    try:
        return music_service.poll_oauth(device_code=req.device_code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/logout")
def logout() -> Dict[str, Any]:
    """Log out and clear stored session tokens."""
    music_service.logout()
    return {"success": True, "authenticated": False}


# ── Library Endpoints ─────────────────────────────────────────────────────────

@router.get("/library/liked")
def get_liked_songs(
    limit: int = Query(100, ge=1, le=500, description="Max tracks to return"),
    x_sonora_auth: Optional[str] = Header(None, alias="X-Sonora-Auth"),
) -> Dict[str, Any]:
    """Retrieve user's liked songs from YouTube Music."""
    if x_sonora_auth and not music_service.get_auth_status()["authenticated"]:
        music_service.rehydrate_if_needed(x_sonora_auth)
    tracks = music_service.get_liked_songs(limit=limit)
    return {
        "tracks": tracks,
        "count": len(tracks),
        "authenticated": music_service.get_auth_status()["authenticated"],
    }


@router.get("/library/playlists")
def get_library_playlists(
    x_sonora_auth: Optional[str] = Header(None, alias="X-Sonora-Auth"),
) -> Dict[str, Any]:
    """Retrieve user's saved and created playlists."""
    if x_sonora_auth and not music_service.get_auth_status()["authenticated"]:
        music_service.rehydrate_if_needed(x_sonora_auth)
    playlists = music_service.get_library_playlists()
    return {
        "playlists": playlists,
        "count": len(playlists),
        "authenticated": music_service.get_auth_status()["authenticated"],
    }


@router.get("/library/albums")
def get_library_albums(
    x_sonora_auth: Optional[str] = Header(None, alias="X-Sonora-Auth"),
) -> Dict[str, Any]:
    """Retrieve user's saved library albums."""
    if x_sonora_auth and not music_service.get_auth_status()["authenticated"]:
        music_service.rehydrate_if_needed(x_sonora_auth)
    albums = music_service.get_library_albums()
    return {
        "albums": albums,
        "count": len(albums),
        "authenticated": music_service.get_auth_status()["authenticated"],
    }
