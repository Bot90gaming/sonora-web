"""
Music service wrapping core.api.MusicAPI and auth.auth_manager for the Sonora backend.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from auth import auth_manager
from core.api import AuthenticationRequiredError, MusicAPI

logger = logging.getLogger(__name__)


class MusicService:
    def __init__(self) -> None:
        self._yt_client = None
        self._api: Optional[MusicAPI] = None
        self._init_api()

    def _init_api(self) -> None:
        try:
            self._yt_client = auth_manager.get_ytmusic_client()
            self._api = MusicAPI(self._yt_client)
        except Exception as e:
            logger.warning("Failed to initialize authenticated MusicAPI client, falling back: %s", e)
            from ytmusicapi import YTMusic
            self._yt_client = YTMusic()
            self._api = MusicAPI(self._yt_client)

    @property
    def api(self) -> MusicAPI:
        if self._api is None:
            self._init_api()
        return self._api

    # ── Search ────────────────────────────────────────────────────────────────

    def search(self, query: str, filter_: str = "songs", limit: int = 20) -> List[Dict[str, Any]]:
        """Search YouTube Music by filter (songs, albums, artists, playlists)."""
        valid_filters = {"songs", "albums", "artists", "playlists"}
        clean_filter = filter_.lower() if filter_.lower() in valid_filters else "songs"
        return self.api.search(query, filter_=clean_filter, limit=limit)

    def search_all(self, query: str, limit: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """Multi-category search returning songs, albums, artists, and playlists."""
        results: Dict[str, List[Dict[str, Any]]] = {
            "songs": [],
            "albums": [],
            "artists": [],
            "playlists": [],
        }
        for category in ("songs", "albums", "artists", "playlists"):
            try:
                results[category] = self.api.search(query, filter_=category, limit=limit)
            except Exception as e:
                logger.debug("Failed search for category %s: %s", category, e)
                results[category] = []
        return results

    def get_search_suggestions(self, query: str) -> List[str]:
        """Fetch search autocomplete suggestions from YouTube Music."""
        if not query or not query.strip():
            return []
        try:
            suggestions = self._yt_client.get_search_suggestions(query.strip())
            return suggestions if isinstance(suggestions, list) else []
        except Exception as e:
            logger.debug("Failed to get search suggestions: %s", e)
            return []

    # ── Home / Discover ───────────────────────────────────────────────────────

    def get_home(self, limit: int = 6) -> List[Dict[str, Any]]:
        """Fetch home feed / quick picks / recommendations."""
        try:
            return self.api.get_home(limit=limit)
        except Exception as e:
            logger.warning("Error fetching home feed: %s", e)
            return []

    # ── Song Info ─────────────────────────────────────────────────────────────

    def get_song(self, video_id: str) -> Dict[str, Any]:
        """Fetch metadata and track info for a song."""
        if not video_id:
            raise ValueError("video_id is required")

        try:
            song_data = self._yt_client.get_song(video_id)
            details = song_data.get("videoDetails", {}) if isinstance(song_data, dict) else {}
            
            thumbnails = details.get("thumbnail", {}).get("thumbnails", [])
            thumb_url = thumbnails[-1].get("url", "") if thumbnails else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

            try:
                duration_sec = int(details.get("lengthSeconds", 0))
            except (ValueError, TypeError):
                duration_sec = 0

            return {
                "videoId": video_id,
                "title": details.get("title", "Unknown Title"),
                "artist": details.get("author", "Unknown Artist"),
                "album": "",
                "duration": duration_sec,
                "thumbnail": thumb_url,
                "viewCount": details.get("viewCount", "0"),
                "streamUrl": f"/api/stream/{video_id}",
            }
        except Exception as e:
            logger.warning("get_song error for %s: %s. Using fallback...", video_id, e)
            return {
                "videoId": video_id,
                "title": "Track",
                "artist": "Unknown Artist",
                "album": "",
                "duration": 0,
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "streamUrl": f"/api/stream/{video_id}",
            }

    # ── Station / Similar ─────────────────────────────────────────────────────

    def get_station(self, video_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Return similar / radio tracks given a seed video_id."""
        return self.api.get_station(video_id, limit=limit)

    # ── Playlist & Album Details ──────────────────────────────────────────────

    def get_playlist(self, playlist_id: str) -> Dict[str, Any]:
        """Return playlist info and tracks list."""
        if not playlist_id:
            raise ValueError("playlist_id is required")

        raw_pl = self._yt_client.get_playlist(playlist_id, limit=None)
        if not isinstance(raw_pl, dict):
            raise RuntimeError(f"Could not load playlist {playlist_id}")

        thumbnails = raw_pl.get("thumbnails") or []
        thumb_url = thumbnails[-1].get("url", "") if isinstance(thumbnails, list) and thumbnails else ""

        tracks = []
        for t in raw_pl.get("tracks", []):
            if not isinstance(t, dict):
                continue
            parsed = self.api._parse_song(t)
            if not parsed.get("thumbnail") and thumb_url:
                parsed["thumbnail"] = thumb_url
            tracks.append(parsed)

        return {
            "id": playlist_id,
            "title": raw_pl.get("title", "Unknown Playlist"),
            "author": (raw_pl.get("author") or {}).get("name", "") if isinstance(raw_pl.get("author"), dict) else str(raw_pl.get("author") or ""),
            "description": raw_pl.get("description", ""),
            "trackCount": raw_pl.get("trackCount") or len(tracks),
            "thumbnail": thumb_url,
            "duration": raw_pl.get("duration", ""),
            "tracks": tracks,
        }

    def get_album(self, browse_id: str) -> Dict[str, Any]:
        """Return album info and tracks list."""
        if not browse_id:
            raise ValueError("browse_id is required")

        raw_album = self._yt_client.get_album(browse_id)
        if not isinstance(raw_album, dict):
            raise RuntimeError(f"Could not load album {browse_id}")

        thumbnails = raw_album.get("thumbnails") or []
        album_thumb = thumbnails[-1].get("url", "") if isinstance(thumbnails, list) and thumbnails else ""

        artists = raw_album.get("artists") or []
        artist_name = (
            ", ".join(a.get("name", "") for a in artists if isinstance(a, dict))
            if isinstance(artists, list) else str(artists)
        )

        tracks = []
        for t in raw_album.get("tracks", []):
            if not isinstance(t, dict):
                continue
            parsed = self.api._parse_song(t)
            if not parsed.get("thumbnail") and album_thumb:
                parsed["thumbnail"] = album_thumb
            if not parsed.get("album"):
                parsed["album"] = raw_album.get("title", "")
            if not parsed.get("artist") and artist_name:
                parsed["artist"] = artist_name
            tracks.append(parsed)

        return {
            "browseId": browse_id,
            "title": raw_album.get("title", "Unknown Album"),
            "artist": artist_name,
            "year": raw_album.get("year", ""),
            "trackCount": raw_album.get("trackCount") or len(tracks),
            "thumbnail": album_thumb,
            "description": raw_album.get("description", ""),
            "tracks": tracks,
        }

    def get_artist(self, channel_id: str) -> Dict[str, Any]:
        """Return artist profile, top tracks, and albums."""
        if not channel_id:
            raise ValueError("channel_id is required")

        raw_artist = self._yt_client.get_artist(channel_id)
        if not isinstance(raw_artist, dict):
            raise RuntimeError(f"Could not load artist {channel_id}")

        thumbnails = raw_artist.get("thumbnails") or []
        thumb_url = thumbnails[-1].get("url", "") if isinstance(thumbnails, list) and thumbnails else ""

        # Normalize songs
        songs_raw = (raw_artist.get("songs") or {}).get("results", [])
        parsed_songs = [self.api._parse_song(s) for s in songs_raw if isinstance(s, dict)]

        # Albums
        albums_raw = (raw_artist.get("albums") or {}).get("results", [])
        
        return {
            "channelId": channel_id,
            "name": raw_artist.get("name", "Unknown Artist"),
            "description": raw_artist.get("description", ""),
            "thumbnail": thumb_url,
            "subscribers": raw_artist.get("subscribers", ""),
            "songs": parsed_songs,
            "albums": albums_raw,
        }

    # ── Like / Rate ───────────────────────────────────────────────────────────

    def like_song(self, video_id: str) -> bool:
        """Like a track in YouTube Music."""
        self.api.like_song(video_id)
        return True

    def unlike_song(self, video_id: str) -> bool:
        """Remove like from a track in YouTube Music."""
        self.api.unlike_song(video_id)
        return True

    # ── Library ───────────────────────────────────────────────────────────────

    def get_liked_songs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Return user liked songs (if authenticated)."""
        try:
            return self.api.get_liked_songs(limit=limit)
        except AuthenticationRequiredError:
            logger.info("Liked songs requested but user is not authenticated")
            return []
        except Exception as e:
            logger.warning("Failed to fetch liked songs: %s", e)
            return []

    def get_library_playlists(self) -> List[Dict[str, Any]]:
        """Return user library playlists."""
        try:
            return self.api.get_library_playlists() or []
        except Exception as e:
            logger.warning("Failed to fetch library playlists: %s", e)
            return []

    def get_library_albums(self) -> List[Dict[str, Any]]:
        """Return user library albums."""
        try:
            return self.api.get_library_albums() or []
        except Exception as e:
            logger.warning("Failed to fetch library albums: %s", e)
            return []

    # ── Auth Status & Management ──────────────────────────────────────────────

    def get_auth_status(self) -> Dict[str, Any]:
        """Check authentication status."""
        is_auth = auth_manager.is_authenticated()
        has_google = auth_manager._GOOGLE_TOKEN_FILE.exists()
        has_headers = auth_manager._TOKEN_FILE.exists()

        auth_type = "none"
        if has_google:
            auth_type = "google_oauth"
        elif has_headers:
            auth_type = "headers"

        return {
            "authenticated": is_auth,
            "authType": auth_type,
            "canGoogleSignIn": auth_manager.is_google_oauth_configured(),
        }

    def login_with_headers(self, headers_raw: str) -> bool:
        """Authenticate with pasted browser headers."""
        auth_manager.setup_from_headers(headers_raw)
        self._init_api()
        return auth_manager.is_authenticated()

    def logout(self) -> bool:
        """Log out and reset authenticated client."""
        auth_manager.logout()
        self._init_api()
        return True


# Global music service singleton
music_service = MusicService()
