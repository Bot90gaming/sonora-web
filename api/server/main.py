"""
Sonora Web Backend — FastAPI Application Entrypoint.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from server.services.music_service import music_service
from server.api.routes_download import router as download_router
from server.api.routes_home import router as home_router
from server.api.routes_library import router as library_router
from server.api.routes_lyrics import router as lyrics_router
from server.api.routes_playlist import router as playlist_router
from server.api.routes_search import router as search_router
from server.api.routes_song import router as song_router
from server.api.routes_station import router as station_router
from server.api.routes_stream import router as stream_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sonora.server")

app = FastAPI(
    title="Sonora Music API",
    version="1.0.0",
    description="Modern web backend for Sonora Music player exposing streaming, search, synchronized lyrics, library, and downloads.",
)

# Enable CORS for frontend web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_rehydration_middleware(request: Request, call_next):
    """Rehydrate YouTube Music authentication in stateless serverless environments."""
    if request.method != "OPTIONS":
        auth_header = request.headers.get("x-sonora-auth")
        if auth_header and not music_service.get_auth_status()["authenticated"]:
            try:
                music_service.rehydrate_if_needed(auth_header)
            except Exception as e:
                logger.debug("Auth rehydration error: %s", e)
    return await call_next(request)


# Register API Routers
app.include_router(search_router)
app.include_router(stream_router)
app.include_router(song_router)
app.include_router(lyrics_router)
app.include_router(station_router)
app.include_router(playlist_router)
app.include_router(download_router)
app.include_router(library_router)
app.include_router(home_router)


@app.get("/")
@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "app": "Sonora Music API",
        "version": "1.0.0",
    }


def start():
    """Run uvicorn server directly."""
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
