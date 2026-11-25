"""Library and Authentication API routes."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
import json
import random
import time
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


class PairGenerateRequest(BaseModel):
    payload: Optional[Dict[str, Any]] = Field(None, description="Auth session payload to pair (defaults to active session)")
    expires_in: int = Field(600, ge=60, le=3600, description="Pairing code expiry in seconds")


class PairClaimRequest(BaseModel):
    code: str = Field(..., description="6-digit pairing code entered on mobile")


_PAIRING_STORE: Dict[str, Tuple[Dict[str, Any], float]] = {}
_PAIRING_FILE = Path("/tmp/sonora_pairing_store.json")


def _load_pairing_store() -> Dict[str, Tuple[Dict[str, Any], float]]:
    global _PAIRING_STORE
    now = time.time()
    _PAIRING_STORE = {k: v for k, v in _PAIRING_STORE.items() if v[1] > now}
    if _PAIRING_FILE.is_file():
        try:
            raw = json.loads(_PAIRING_FILE.read_text(encoding="utf-8"))
            for k, item in raw.items():
                if isinstance(item, dict) and item.get("expires_at", 0) > now:
                    _PAIRING_STORE[k] = (item["payload"], item["expires_at"])
        except Exception:
            pass
    return _PAIRING_STORE


def _save_pairing_store() -> None:
    now = time.time()
    data = {}
    for k, v in _PAIRING_STORE.items():
        if v[1] > now:
            data[k] = {"payload": v[0], "expires_at": v[1]}
    try:
        _PAIRING_FILE.write_text(json.dumps(data), encoding="utf-8")
    except Exception:
        pass


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


@router.post("/auth/pair/generate")
def generate_pair_code(req: PairGenerateRequest) -> Dict[str, Any]:
    """Generate a temporary 6-digit PIN to pair mobile devices."""
    payload = req.payload or music_service.get_stored_auth_payload()
    if not payload:
        raise HTTPException(
            status_code=400,
            detail="No authenticated YouTube Music session found to pair. Please sign in on this device first.",
        )

    _load_pairing_store()
    code = ""
    for _ in range(15):
        candidate = f"{random.randint(100000, 999999)}"
        if candidate not in _PAIRING_STORE:
            code = candidate
            break
    if not code:
        code = f"{random.randint(100000, 999999)}"

    expires_at = time.time() + req.expires_in
    _PAIRING_STORE[code] = (payload, expires_at)
    _save_pairing_store()

    return {
        "success": True,
        "code": code,
        "expires_in": req.expires_in,
        "expires_at": int(expires_at),
        "authPayload": payload,
    }


@router.post("/auth/pair/claim")
def claim_pair_code(req: PairClaimRequest) -> Dict[str, Any]:
    """Claim a 6-digit PIN on mobile and restore the session."""
    clean_code = req.code.strip().replace(" ", "").replace("-", "")
    _load_pairing_store()

    if clean_code not in _PAIRING_STORE:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired pairing code. Please generate a fresh code on your PC.",
        )

    payload, expires_at = _PAIRING_STORE.pop(clean_code)
    _save_pairing_store()

    if time.time() > expires_at:
        raise HTTPException(
            status_code=400,
            detail="This pairing code has expired. Please generate a fresh code on your PC.",
        )

    ok = music_service.restore_session(payload)
    return {
        "success": ok,
        "authenticated": ok,
        "authType": payload.get("authType", "headers"),
        "authPayload": payload,
    }


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
