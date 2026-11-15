"""Station and Radio API routes."""
from __future__ import annotations

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["station"])


@router.get("/station/{video_id}")
def get_station(
    video_id: str,
    limit: int = Query(10, ge=1, le=50, description="Max similar tracks"),
) -> Dict[str, Any]:
    """Generate a radio queue of similar tracks based on a seed song video_id."""
    try:
        tracks = music_service.get_station(video_id=video_id, limit=limit)
        return {
            "videoId": video_id,
            "tracks": tracks,
            "count": len(tracks),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate station: {str(e)}")
