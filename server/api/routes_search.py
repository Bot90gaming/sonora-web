"""Search API routes."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query

from server.services.music_service import music_service

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search")
def search(
    q: str = Query(..., description="Search query string"),
    filter: Optional[str] = Query("songs", description="Filter by songs, albums, artists, playlists, or all"),
    limit: int = Query(20, ge=1, le=50, description="Max results"),
) -> Dict[str, Any]:
    """
    Search YouTube Music.
    Filter options:
      - 'songs' (default)
      - 'albums'
      - 'artists'
      - 'playlists'
      - 'all'
    """
    filter_val = (filter or "songs").lower()
    if filter_val == "all":
        results = music_service.search_all(query=q, limit=min(limit, 10))
        return {
            "query": q,
            "filter": "all",
            "results": results,
            "songs": results.get("songs", []),
            "albums": results.get("albums", []),
            "artists": results.get("artists", []),
            "playlists": results.get("playlists", []),
        }

    items = music_service.search(query=q, filter_=filter_val, limit=limit)
    return {
        "query": q,
        "filter": filter_val,
        "results": items,
        "items": items,
        "count": len(items),
    }


@router.get("/suggestions")
@router.get("/search/suggestions")
def get_suggestions(
    q: str = Query(..., description="Query string for search autocomplete suggestions"),
) -> Dict[str, Any]:
    """
    Return real-time search autocomplete suggestions from YouTube Music.
    Returns both list in 'suggestions' and 'results' for universal frontend compatibility.
    """
    suggestions = music_service.get_search_suggestions(query=q)
    return {
        "query": q,
        "suggestions": suggestions,
        "results": suggestions,
        "count": len(suggestions),
    }
