# Sonora Web Backend API

A modern, high-performance Python web backend built with FastAPI and Uvicorn that powers the Sonora Web Music Player.

## Features

- **Search**: Fast, filterable search for songs, albums, artists, and playlists using `ytmusicapi`.
- **Audio Streaming**: Native HTTP Range (206 Partial Content) streaming for HTML5 `<audio>` playback with seeking support, direct URL resolution via `yt-dlp`, and disk caching.
- **Synchronized Lyrics**: Millisecond-precision synced LRC lyrics fetched from LRCLIB, local SQLite cache, and YouTube Music timed lyrics with auto-paced fallback.
- **Station & Radio**: Context-aware queue generation with similar tracks for infinite playback.
- **Browse & Library**: Detailed playlists, albums, and artist views, plus user library (liked songs, playlists, albums).
- **Download Manager**: Background multi-format audio downloads (MP3, M4A, Opus, FLAC, WAV) with real-time job progress tracking and direct browser download.
- **CORS & Proxy Ready**: Built-in CORS middleware configured for Vite frontend (`http://localhost:5173` or any origin).

---

## Getting Started

### 1. Requirements

Ensure Python 3.10+ and `ffmpeg` are installed:
```bash
sudo apt install ffmpeg
```

Install python dependencies:
```bash
pip install -r server/requirements.txt
```

### 2. Running the Server

Start the backend with Uvicorn:
```bash
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```
Or directly with Python:
```bash
python3 server/main.py
```

The interactive Swagger UI documentation is available at:
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

---

## API Endpoints Reference

### Health
- `GET /api/health`
  - Returns: `{ "status": "ok", "app": "Sonora Music API", "version": "1.0.0" }`

### Search
- `GET /api/search?q={query}&filter={songs|albums|artists|playlists|all}&limit={20}`
  - Searches YouTube Music.
  - When `filter=all`, returns an object with `songs`, `albums`, `artists`, and `playlists` lists.

### Audio Streaming
- `GET /api/stream/{video_id}`
  - Streams audio directly with HTTP Range (206 Partial Content) support for HTML5 `<audio src="/api/stream/{video_id}">`.
  - Pass `?redirect=true` to obtain a 307 redirect to the direct CDN URL instead.
- `GET /api/stream/{video_id}/info` (or `/url`)
  - Returns JSON metadata with direct CDN URL:
    ```json
    {
      "videoId": "FXovf5dsRTw",
      "url": "https://...",
      "ext": "webm",
      "mimeType": "audio/webm",
      "duration": 229,
      "title": "Despacito"
    }
    ```

### Song Details & Rating
- `GET /api/song/{video_id}`
  - Returns metadata: `title`, `artist`, `album`, `duration`, `thumbnail`, `streamUrl`.
- `POST /api/song/{video_id}/like`
  - Marks track as liked on YouTube Music (requires auth).
- `DELETE /api/song/{video_id}/like` (or `POST /api/song/{video_id}/unlike`)
  - Removes like rating.

### Synchronized Lyrics
- `GET /api/lyrics?title={title}&artist={artist}&duration={duration}&video_id={video_id}`
  - Returns synced LRC lyrics with milliseconds timestamps:
    ```json
    {
      "loading": false,
      "available": true,
      "hasTimestamps": true,
      "lines": [
        { "id": 0, "text": "Ay, ¡Fonsi! ¡D.Y.", "startTime": 6920, "endTime": 10990 },
        { "id": 1, "text": "Ohhh, oh, no, oh, no, oh", "startTime": 10990, "endTime": 15000 }
      ],
      "source": "LRCLIB (Synced)"
    }
    ```

### Station / Radio
- `GET /api/station/{video_id}?limit={10}`
  - Generates recommended queue tracks similar to the seed song.

### Playlist & Album Browse
- `GET /api/playlist/{playlist_id}`
  - Retrieves full playlist details and parsed track list.
- `GET /api/album/{browse_id}`
  - Retrieves album metadata, cover art, release year, and tracks.
- `GET /api/artist/{channel_id}`
  - Retrieves artist profile, top songs, and discography.

### Home / Discover
- `GET /api/home?limit={6}`
  - Retrieves quick picks and personalized home feed sections.

### Library & Authentication
- `GET /api/auth/status`
  - Returns `{ "authenticated": bool, "authType": "google_oauth" | "headers" | "none", "canGoogleSignIn": bool }`.
- `POST /api/auth/headers`
  - Body: `{ "headers": "..." }` — Logs in using browser headers.
- `POST /api/auth/logout`
  - Clears stored session tokens.
- `GET /api/library/liked?limit={100}`
  - List of user's liked songs.
- `GET /api/library/playlists`
  - List of user's saved/created playlists.
- `GET /api/library/albums`
  - List of user's saved albums.

### Audio Downloads
- `POST /api/download`
  - Body: `{ "videoId": "...", "title": "...", "artist": "...", "format": "mp3" }`
  - Formats: `mp3`, `m4a`, `opus`, `flac`, `wav`
  - Returns download job info with `jobId`.
- `GET /api/download/jobs`
  - Returns all download jobs with progress percentage.
- `GET /api/download/status/{job_id}`
  - Returns status and progress for a single job.
- `GET /api/download/file/{job_id}`
  - Downloads the completed audio file as an attachment directly to the browser.
