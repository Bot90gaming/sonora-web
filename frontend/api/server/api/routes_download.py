"""Download API routes."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from starlette.responses import FileResponse

from server.services.download_service import download_service

router = APIRouter(prefix="/api/download", tags=["download"])


class DownloadRequest(BaseModel):
    videoId: Optional[str] = Field(None, description="YouTube video ID to download")
    video_id: Optional[str] = Field(None, description="YouTube video ID to download (snake_case alias)")
    title: Optional[str] = Field("", description="Song title")
    artist: Optional[str] = Field("", description="Artist name")
    format: Optional[str] = Field("mp3", description="Audio format: mp3, m4a, opus, flac, wav")

    @property
    def resolved_video_id(self) -> str:
        vid = self.videoId or self.video_id
        if not vid:
            raise ValueError("videoId or video_id is required")
        return vid


@router.post("")
def start_download(req: DownloadRequest) -> Dict[str, Any]:
    """Start an audio download job for MP3, M4A, Opus, FLAC, or WAV."""
    try:
        vid = req.resolved_video_id
        job = download_service.start_download(
            video_id=vid,
            title=req.title or "",
            artist=req.artist or "",
            audio_format=req.format or "mp3",
        )
        return {"success": True, "job": job}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
@router.get("/jobs")
def list_downloads() -> Dict[str, Any]:
    """List all current and past download jobs."""
    jobs = download_service.get_all_jobs()
    return {"jobs": jobs, "count": len(jobs)}


@router.get("/status/{job_id}")
def get_download_status(job_id: str) -> Dict[str, Any]:
    """Get the progress and status of a specific download job."""
    job = download_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Download job not found")
    return {"job": job}


@router.get("/file/{job_id}")
def download_completed_file(job_id: str) -> FileResponse:
    """Download the completed audio file directly to the browser."""
    job = download_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Download job not found")

    if job["status"] != "completed" or not job["filePath"]:
        raise HTTPException(
            status_code=400,
            detail=f"File is not ready yet (current status: {job['status']})",
        )

    file_path = Path(job["filePath"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Downloaded file no longer exists on disk")

    return FileResponse(
        path=file_path,
        filename=job["fileName"] or file_path.name,
        media_type="application/octet-stream",
    )
