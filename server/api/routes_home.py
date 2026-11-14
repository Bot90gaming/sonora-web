"""Home and Discover API routes."""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, Query

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["home"])


@router.get("/home")
def get_home_feed(
    limit: int = Query(6, ge=1, le=20, description="Max sections to return"),
) -> Dict[str, Any]:
    """Retrieve personalized / trending home feed sections from YouTube Music."""
    sections = music_service.get_home(limit=limit)
    return {
        "sections": sections,
        "count": len(sections),
    }
