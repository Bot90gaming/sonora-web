"""Audio stream API routes."""
from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, Header, Query
from starlette.responses import RedirectResponse, Response

from server.services.stream_service import stream_service

router = APIRouter(prefix="/api", tags=["stream"])


@router.get("/stream/{video_id}")
def stream_audio(
    video_id: str,
    range: Optional[str] = Header(None),
    redirect: bool = Query(False, description="Redirect directly to audio URL instead of proxying"),
) -> Response:
    """
    Stream audio for a given YouTube video_id.
    Supports HTTP Range requests (206 Partial Content) for standard HTML5 <audio> seeking.
    If redirect=true is passed, returns a 307 temporary redirect to the direct CDN stream URL.
    """
    if redirect:
        info = stream_service.resolve_audio_url(video_id)
        return RedirectResponse(url=info["url"], status_code=307)

    return stream_service.stream_audio(video_id=video_id, range_header=range)


@router.get("/stream/{video_id}/url")
@router.get("/stream/{video_id}/info")
def get_stream_url(video_id: str) -> Dict[str, Any]:
    """Return stream URL and audio metadata in JSON format."""
    return stream_service.resolve_audio_url(video_id)
