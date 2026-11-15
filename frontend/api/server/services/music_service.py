"""
Music service wrapping core.api.MusicAPI and auth.auth_manager for the Sonora backend.
"""
from __future__ import annotations

import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ytmusicapi import OAuthCredentials
from auth import auth_manager
from core.api import AuthenticationRequiredError, MusicAPI

logger = logging.getLogger(__name__)


class MusicService:
    def __init__(self) -> None:
        self._yt_client = None
        self._api: Optional[MusicAPI] = None
        self._active_oauth: Optional[Dict[str, Any]] = None
        self._sc_track_cache: Dict[str, Dict[str, Any]] = {}
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

    def search_soundcloud(self, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        """Search SoundCloud for tracks and remixes using yt-dlp."""
        if not query or not query.strip():
            return []
        import yt_dlp
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,
            "nocheckcertificate": True,
            "skip_download": True,
        }
        tracks: List[Dict[str, Any]] = []
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                search_res = ydl.extract_info(f"scsearch{limit}:{query.strip()}", download=False)
                for entry in (search_res.get("entries") or []):
                    if not entry or not entry.get("id"):
                        continue
                    sc_id = str(entry.get("id"))
                    duration = 0
                    try:
                        duration = int(entry.get("duration") or 0)
                    except (ValueError, TypeError):
                        pass

                    thumbnails = entry.get("thumbnails") or []
                    thumb_url = entry.get("thumbnail") or (thumbnails[-1].get("url") if thumbnails else "")

                    track_item = {
                        "videoId": f"sc_{sc_id}",
                        "id": f"sc_{sc_id}",
                        "title": entry.get("title") or "Unknown Track",
                        "artist": entry.get("uploader") or entry.get("artist") or "SoundCloud Artist",
                        "album": "SoundCloud",
                        "duration": duration,
                        "thumbnail": thumb_url,
                        "source": "soundcloud",
                        "streamUrl": f"/api/stream/sc_{sc_id}",
                    }
                    tracks.append(track_item)
                    self._sc_track_cache[track_item["id"]] = track_item
                    self._sc_track_cache[track_item["videoId"]] = track_item
        except Exception as e:
            logger.warning("SoundCloud search failed for query '%s': %s", query, e)

        # Pre-cache top 2 soundcloud tracks in background thread for instant playback
        if tracks:
            def _precache():
                import threading
                from server.services.stream_service import stream_service
                for t in tracks[:2]:
                    try:
                        vid = t["id"]
                        if not stream_service._check_local_file(vid):
                            stream_service._fetch_soundcloud_to_cache(vid)
                    except Exception as err:
                        logger.debug("SoundCloud pre-cache failed for %s: %s", t.get("id"), err)

            import threading
            threading.Thread(target=_precache, daemon=True).start()

        return tracks

    def search(self, query: str, filter_: str = "songs", limit: int = 20, source: str = "all") -> List[Dict[str, Any]]:
        """Search across music sources (YouTube Music, SoundCloud, or All)."""
        valid_filters = {"songs", "albums", "artists", "playlists"}
        clean_filter = filter_.lower() if filter_.lower() in valid_filters else "songs"
        src = (source or "all").lower()

        if src == "soundcloud":
            if clean_filter == "songs":
                return self.search_soundcloud(query, limit=limit)
            return []

        if src == "ytmusic" or clean_filter != "songs":
            items = self.api.search(query, filter_=clean_filter, limit=limit)
            for item in items:
                item["source"] = "ytmusic"
            return items

        # Default 'all' source for songs: aggregate YouTube Music and SoundCloud
        yt_items = self.api.search(query, filter_="songs", limit=limit)
        for item in yt_items:
            item["source"] = "ytmusic"

        sc_items = self.search_soundcloud(query, limit=min(limit, 8))

        # Interleave results: 2 YouTube Music, 1 SoundCloud
        combined: List[Dict[str, Any]] = []
        y_i, s_i = 0, 0
        while y_i < len(yt_items) or s_i < len(sc_items):
            if y_i < len(yt_items):
                combined.append(yt_items[y_i])
                y_i += 1
            if y_i < len(yt_items):
                combined.append(yt_items[y_i])
                y_i += 1
            if s_i < len(sc_items):
                combined.append(sc_items[s_i])
                s_i += 1
        return combined

    def search_all(self, query: str, limit: int = 5, source: str = "all") -> Dict[str, List[Dict[str, Any]]]:
        """Multi-category search returning songs, albums, artists, and playlists."""
        results: Dict[str, List[Dict[str, Any]]] = {
            "songs": [],
            "albums": [],
            "artists": [],
            "playlists": [],
        }
        src = (source or "all").lower()

        if src == "soundcloud":
            results["songs"] = self.search_soundcloud(query, limit=limit * 2)
            return results

        for category in ("songs", "albums", "artists", "playlists"):
            try:
                results[category] = self.api.search(query, filter_=category, limit=limit)
                for item in results[category]:
                    item["source"] = "ytmusic"
            except Exception as e:
                logger.debug("Failed search for category %s: %s", category, e)
                results[category] = []

        if src in ("all", "soundcloud"):
            sc_tracks = self.search_soundcloud(query, limit=limit)
            # Combine songs
            results["songs"].extend(sc_tracks)

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

        if video_id.startswith("sc_"):
            if video_id in self._sc_track_cache:
                return dict(self._sc_track_cache[video_id])
            try:
                sc_id = video_id[3:]
                import yt_dlp
                with yt_dlp.YoutubeDL({"quiet": True, "nocheckcertificate": True}) as ydl:
                    info = ydl.extract_info(f"https://api.soundcloud.com/tracks/{sc_id}", download=False)
                    thumbnails = info.get("thumbnails") or []
                    thumb_url = info.get("thumbnail") or (thumbnails[-1].get("url") if thumbnails else "")
                    track_data = {
                        "videoId": video_id,
                        "title": info.get("title") or "SoundCloud Track",
                        "artist": info.get("uploader") or info.get("artist") or "SoundCloud Artist",
                        "album": "SoundCloud",
                        "duration": int(info.get("duration") or 0),
                        "thumbnail": thumb_url,
                        "source": "soundcloud",
                        "streamUrl": f"/api/stream/{video_id}",
                    }
                    self._sc_track_cache[video_id] = track_data
                    return track_data
            except Exception as e:
                logger.warning("Failed to resolve soundcloud song %s: %s", video_id, e)
                return {
                    "videoId": video_id,
                    "title": "SoundCloud Track",
                    "artist": "SoundCloud Artist",
                    "album": "SoundCloud",
                    "duration": 0,
                    "thumbnail": "",
                    "source": "soundcloud",
                    "streamUrl": f"/api/stream/{video_id}",
                }

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
        self._active_oauth = None
        self._init_api()
        return True

    def start_oauth(self, client_id: Optional[str] = None, client_secret: Optional[str] = None) -> Dict[str, Any]:
        """Initiate Google OAuth device code flow."""
        cid = (client_id or "").strip() or os.environ.get("SONORA_GOOGLE_CLIENT_ID", "").strip()
        csec = (client_secret or "").strip() or os.environ.get("SONORA_GOOGLE_CLIENT_SECRET", "").strip()

        if not cid or not csec:
            try:
                creds = auth_manager._google_oauth_credentials()
                cid = creds.get("client_id", "").strip()
                csec = creds.get("client_secret", "").strip()
            except Exception:
                pass

        if not cid or not csec:
            raise ValueError(
                "Google Client ID & Client Secret are required for Google OAuth. "
                "Enter your credentials or use the Browser Request Headers tab instead."
            )

        credentials = OAuthCredentials(cid, csec)
        code = credentials.get_code()
        self._active_oauth = {
            "credentials": credentials,
            "device_code": code["device_code"],
            "client_data": {"client_id": cid, "client_secret": csec},
            "expires_at": time.time() + code.get("expires_in", 1800),
        }
        return {
            "verification_url": code.get("verification_url", "https://www.google.com/device"),
            "user_code": code["user_code"],
            "device_code": code["device_code"],
            "expires_in": code.get("expires_in", 1800),
            "interval": code.get("interval", 5),
        }

    def poll_oauth(self, device_code: str) -> Dict[str, Any]:
        """Poll for completion of Google OAuth device flow."""
        if not self._active_oauth:
            raise ValueError("No active OAuth session found. Please start sign-in again.")

        if self._active_oauth.get("device_code") != device_code:
            raise ValueError("Device code does not match active OAuth session.")

        credentials: OAuthCredentials = self._active_oauth["credentials"]
        response = credentials.token_from_code(device_code)
        error = response.get("error")

        if not error:
            token = {
                "scope": response["scope"],
                "token_type": response["token_type"],
                "access_token": response["access_token"],
                "refresh_token": response["refresh_token"],
                "expires_at": int(time.time()) + response["expires_in"],
                "expires_in": response.get("refresh_token_expires_in", response["expires_in"]),
            }
            auth_manager._TOKEN_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
            auth_manager._write_private_json(auth_manager._GOOGLE_TOKEN_FILE, token)
            auth_manager._write_private_json(auth_manager._GOOGLE_CREDENTIALS_FILE, self._active_oauth["client_data"])
            auth_manager._TOKEN_FILE.unlink(missing_ok=True)
            self._active_oauth = None
            self._init_api()
            return {"status": "success", "authenticated": True}

        if error == "authorization_pending":
            return {"status": "pending"}
        if error == "slow_down":
            return {"status": "pending", "slow_down": True}

        return {"status": "error", "error": response.get("error_description", error)}


# Global music service singleton
music_service = MusicService()
