#!/usr/bin/env python3
"""
Test Search across tracks, albums, playlists, and API edge cases
"""
import sys
import os
import time
from pathlib import Path

os.environ["QT_API"] = "pyside6"
os.environ["QT_QPA_PLATFORM"] = "offscreen"
sonora_dir = Path("/home/hoshirun/Sonora")
sys.path.insert(0, str(sonora_dir))

from PySide6.QtGui import QGuiApplication
import gi
gi.require_version("Gst", "1.0")
from gi.repository import Gst
if not Gst.is_initialized():
    Gst.init(None)
from ui.qt_bridge import SonoraBridge
from core.api import MusicAPI
from ytmusicapi import YTMusic

def test_search_and_api():
    app = QGuiApplication(sys.argv)
    bridge = SonoraBridge()

    print("Waiting for bridge API initialization...")
    t0 = time.time()
    while not bridge._api and time.time() - t0 < 5.0:
        app.processEvents()
        time.sleep(0.05)

    assert bridge._api is not None, "Bridge API failed to initialize"
    print("API initialized successfully.")

    # 1. Search Songs
    print("\n--- TEST 1: Search Songs ---")
    results_received = []
    bridge.resultsChanged.connect(lambda: results_received.append(list(bridge.searchResults)))
    
    bridge.setSearchFilter("songs")
    bridge.search("Radiohead Karma Police")

    t0 = time.time()
    while not bridge.searchResults and time.time() - t0 < 8.0:
        app.processEvents()
        time.sleep(0.05)

    print(f"Songs found: {len(bridge.searchResults)}")
    assert len(bridge.searchResults) > 0, "No songs returned for search"
    first = bridge.searchResults[0]
    print("First song:", {k: first.get(k) for k in ("videoId", "title", "artist", "duration")})
    assert first.get("videoId"), "Song missing videoId"
    assert first.get("title"), "Song missing title"

    # 2. Search Albums
    print("\n--- TEST 2: Search Albums ---")
    bridge.setSearchFilter("albums")
    # Setting filter should re-trigger search for last query or we search explicitly
    t0 = time.time()
    while time.time() - t0 < 5.0:
        app.processEvents()
        if bridge.searchResults and bridge.searchResults[0].get("collectionKind") == "album":
            break
        time.sleep(0.05)

    print(f"Albums found: {len(bridge.searchResults)}")
    if bridge.searchResults:
        first_album = bridge.searchResults[0]
        print("First album:", {k: first_album.get(k) for k in ("collectionId", "collectionKind", "title", "artist")})
        assert first_album.get("collectionKind") == "album"
        assert first_album.get("collectionId"), "Album missing collectionId (browseId)"

    # 3. Search Playlists
    print("\n--- TEST 3: Search Playlists ---")
    bridge.setSearchFilter("playlists")
    t0 = time.time()
    while time.time() - t0 < 5.0:
        app.processEvents()
        if bridge.searchResults and bridge.searchResults[0].get("collectionKind") == "playlist":
            break
        time.sleep(0.05)

    print(f"Playlists found: {len(bridge.searchResults)}")
    if bridge.searchResults:
        first_pl = bridge.searchResults[0]
        print("First playlist:", {k: first_pl.get(k) for k in ("collectionId", "collectionKind", "title", "artist")})
        assert first_pl.get("collectionKind") == "playlist"
        assert first_pl.get("collectionId"), "Playlist missing collectionId"

    # 4. Search edge cases: Empty query, whitespace, special characters
    print("\n--- TEST 4: Search Edge Cases ---")
    bridge.search("")
    assert len(bridge.searchResults) == 0, "Empty query should clear results"
    bridge.search("    ")
    assert len(bridge.searchResults) == 0, "Whitespace query should clear results"

    # 5. Station radio query
    print("\n--- TEST 5: Station / Radio fetch ---")
    test_video_id = first.get("videoId")
    station_songs = bridge._api.get_station(test_video_id, limit=5)
    print(f"Station songs returned for {test_video_id}: {len(station_songs)}")
    assert len(station_songs) > 0, "Expected station tracks"
    for s in station_songs:
        assert s.get("videoId"), "Station track missing videoId"
        assert s.get("videoId") != test_video_id, "Station should not include seed videoId"

    print("\n--- ALL SEARCH & API TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_search_and_api()
