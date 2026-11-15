"""Home and Discover API routes."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, Query

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["home"])


@router.get("/home")
def get_home_feed(
    limit: int = Query(6, ge=1, le=20, description="Max sections to return"),
    x_sonora_auth: Optional[str] = Header(None, alias="X-Sonora-Auth"),
) -> Dict[str, Any]:
    """Retrieve personalized / trending home feed sections from YouTube Music."""
    if x_sonora_auth and not music_service.get_auth_status()["authenticated"]:
        music_service.rehydrate_if_needed(x_sonora_auth)
    sections = music_service.get_home(limit=limit)
    return {
        "sections": sections,
        "count": len(sections),
    }
