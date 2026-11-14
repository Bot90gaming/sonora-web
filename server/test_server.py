"""
Comprehensive test suite for Sonora FastAPI Web Backend using TestClient.
Exercises every route and verifies response schemas.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Add repo root to path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from starlette.testclient import TestClient
from server.main import app

client = TestClient(app)

def run_tests():
    passed = 0
    total = 0

    def assert_route(name: str, fn):
        nonlocal passed, total
        total += 1
        try:
            fn()
            print(f" PASS: {name}")
            passed += 1
        except Exception as e:
            print(f" FAIL: {name} - {e}")
            import traceback
            traceback.print_exc()

    # 1. Health check
    def test_health():
        r = client.get("/api/health")
        assert r.status_code == 200, f"Status {r.status_code}"
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("app") == "Sonora Music API"
    assert_route("GET /api/health", test_health)

    # 2. Auth status
    def test_auth():
        r = client.get("/api/auth/status")
        assert r.status_code == 200
        data = r.json()
        assert "authenticated" in data
        assert "authType" in data
        assert "canGoogleSignIn" in data
    assert_route("GET /api/auth/status", test_auth)

    # 3. Search songs
    def test_search_songs():
        r = client.get("/api/search", params={"q": "Despacito", "filter": "songs", "limit": 3})
        assert r.status_code == 200
        data = r.json()
        assert data.get("filter") == "songs"
        assert "results" in data
        assert len(data["results"]) > 0
        first = data["results"][0]
        assert "videoId" in first
        assert "title" in first
        assert "artist" in first
    assert_route("GET /api/search?q=Despacito&filter=songs", test_search_songs)

    # 4. Search all categories
    def test_search_all():
        r = client.get("/api/search", params={"q": "Coldplay", "filter": "all", "limit": 2})
        assert r.status_code == 200
        data = r.json()
        assert data.get("filter") == "all"
        assert "songs" in data
        assert "albums" in data
        assert "artists" in data
        assert "playlists" in data
    assert_route("GET /api/search?q=Coldplay&filter=all", test_search_all)

    # 5. Song info
    def test_song_info():
        r = client.get("/api/song/FXovf5dsRTw")
        assert r.status_code == 200
        data = r.json()
        assert data.get("videoId") == "FXovf5dsRTw"
        assert "Despacito" in data.get("title", "")
        assert "duration" in data
        assert "thumbnail" in data
        assert "streamUrl" in data
    assert_route("GET /api/song/{video_id}", test_song_info)

    # 6. Synced lyrics
    def test_lyrics():
        r = client.get("/api/lyrics", params={"title": "Despacito", "artist": "Luis Fonsi"})
        assert r.status_code == 200
        data = r.json()
        assert data.get("available") is True
        assert data.get("hasTimestamps") is True
        assert len(data.get("lines", [])) > 0
        first_line = data["lines"][0]
        assert "startTime" in first_line
        assert "endTime" in first_line
        assert "text" in first_line
    assert_route("GET /api/lyrics", test_lyrics)

    # 7. Station / Similar tracks
    def test_station():
        r = client.get("/api/station/FXovf5dsRTw", params={"limit": 3})
        assert r.status_code == 200
        data = r.json()
        assert data.get("videoId") == "FXovf5dsRTw"
        assert "tracks" in data
        assert len(data["tracks"]) > 0
    assert_route("GET /api/station/{video_id}", test_station)

    # 8. Playlist details
    def test_playlist():
        r = client.get("/api/playlist/VLPLOHoVaTp8R7dWeCQrKfh7a1a_Gu6KvfWP")
        assert r.status_code == 200
        data = r.json()
        assert "title" in data
        assert "tracks" in data
        assert len(data["tracks"]) > 0
    assert_route("GET /api/playlist/{playlist_id}", test_playlist)

    # 9. Album details
    def test_album():
        r = client.get("/api/album/MPREb_dqWTncCjkSp")
        assert r.status_code == 200
        data = r.json()
        assert data.get("title") == "Thriller"
        assert len(data.get("tracks", [])) > 0
    assert_route("GET /api/album/{browse_id}", test_album)

    # 10. Stream URL info
    def test_stream_info():
        r = client.get("/api/stream/FXovf5dsRTw/info")
        assert r.status_code == 200
        data = r.json()
        assert data.get("videoId") == "FXovf5dsRTw"
        assert "url" in data
        assert "mimeType" in data
    assert_route("GET /api/stream/{video_id}/info", test_stream_info)

    # 11. Stream audio range
    def test_stream_audio():
        headers = {"Range": "bytes=0-1023"}
        r = client.get("/api/stream/FXovf5dsRTw", headers=headers)
        assert r.status_code in (200, 206), f"Status {r.status_code}"
        assert len(r.content) > 0, "No audio content received"
    assert_route("GET /api/stream/{video_id} with Range", test_stream_audio)

    # 12. Library endpoints
    def test_library():
        r_liked = client.get("/api/library/liked")
        assert r_liked.status_code == 200
        assert "tracks" in r_liked.json()

        r_pl = client.get("/api/library/playlists")
        assert r_pl.status_code == 200
        assert "playlists" in r_pl.json()

        r_al = client.get("/api/library/albums")
        assert r_al.status_code == 200
        assert "albums" in r_al.json()
    assert_route("GET /api/library/*", test_library)

    # 13. Home feed
    def test_home():
        r = client.get("/api/home", params={"limit": 2})
        assert r.status_code == 200
        assert "sections" in r.json()
    assert_route("GET /api/home", test_home)

    # 14. Download job creation & status
    def test_download():
        r = client.post("/api/download", json={
            "videoId": "FXovf5dsRTw",
            "title": "Despacito",
            "artist": "Luis Fonsi",
            "format": "mp3",
        })
        assert r.status_code == 200
        job = r.json().get("job")
        assert job is not None
        job_id = job.get("jobId")

        # Check status
        r_status = client.get(f"/api/download/status/{job_id}")
        assert r_status.status_code == 200
        assert r_status.json().get("job", {}).get("jobId") == job_id

        # Check jobs list
        r_list = client.get("/api/download/jobs")
        assert r_list.status_code == 200
        assert len(r_list.json().get("jobs", [])) > 0
    assert_route("POST & GET /api/download/*", test_download)

    # 15. Search suggestions
    def test_suggestions():
        r = client.get("/api/suggestions", params={"q": "Coldplay"})
        assert r.status_code == 200
        data = r.json()
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        assert len(data["suggestions"]) > 0
    assert_route("GET /api/suggestions?q=Coldplay", test_suggestions)

    # 16. Download with snake_case video_id
    def test_download_snake_case():
        r = client.post("/api/download", json={
            "video_id": "FXovf5dsRTw",
            "title": "Despacito",
            "artist": "Luis Fonsi",
            "format": "m4a",
        })
        assert r.status_code == 200
        job = r.json().get("job")
        assert job is not None
        assert job.get("videoId") == "FXovf5dsRTw"
        assert job.get("format") == "m4a"
    assert_route("POST /api/download with snake_case video_id", test_download_snake_case)

    print(f"\n==========================================")
    print(f"Test Results: {passed}/{total} tests passed.")
    print(f"==========================================")
    if passed != total:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
