#!/usr/bin/env python3
"""
Test Library browsing, collections, and album/playlist track loading
"""
import sys
import os
import time
from pathlib import Path

os.environ["QT_API"] = "pyside6"
os.environ["QT_QPA_PLATFORM"] = "offscreen"
sonora_dir = Path("/home/hoshirun/Sonora")
sys.path.insert(0, str(sonora_dir))

import gi
gi.require_version("Gst", "1.0")
from gi.repository import Gst
if not Gst.is_initialized():
    Gst.init(None)

from PySide6.QtGui import QGuiApplication
from ui.qt_bridge import SonoraBridge

def test_library_and_collections():
    app = QGuiApplication(sys.argv)
    bridge = SonoraBridge()

    t0 = time.time()
    while not bridge._api and time.time() - t0 < 5.0:
        app.processEvents()
        time.sleep(0.05)

    print("--- TEST 1: Unauthenticated library load ---")
    bridge.loadLibrary()
    t0 = time.time()
    while bridge.busy and time.time() - t0 < 3.0:
        app.processEvents()
        time.sleep(0.05)
    print(f"Library items count (unauthenticated): {len(bridge.libraryItems)}")
    assert len(bridge.libraryItems) == 0

    print("--- TEST 2: Open Collection (Album: Radiohead - OK Computer) ---")
    album_collection = {
        "collectionId": "MPREb_yXhSI4FCUo6",
        "collectionKind": "album",
        "title": "OK Computer",
    }
    bridge.openCollection(album_collection)
    t0 = time.time()
    while bridge.busy and time.time() - t0 < 8.0:
        app.processEvents()
        time.sleep(0.05)

    print(f"Album tracks loaded into library: {len(bridge.libraryItems)}")
    assert len(bridge.libraryItems) > 0, "No tracks loaded from OK Computer"
    first_track = bridge.libraryItems[0]
    print("First track:", {k: first_track.get(k) for k in ("videoId", "title", "artist", "duration")})
    assert first_track.get("videoId"), "Album track missing videoId"

    print("--- TEST 3: Open Invalid Collection ---")
    toasts = []
    bridge.toast.connect(lambda msg: toasts.append(msg))
    bridge.openCollection({})
    print("Toast emitted on empty collection:", toasts)
    assert any("unavailable" in t for t in toasts)

    print("\n--- ALL LIBRARY & COLLECTION TESTS COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_library_and_collections()
