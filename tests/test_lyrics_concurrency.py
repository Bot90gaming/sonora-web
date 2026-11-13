#!/usr/bin/env python3
"""
Test lyrics concurrency and dual thread execution
"""
import sys
import os
import time
import threading
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

def test_lyrics_threads():
    app = QGuiApplication(sys.argv)
    bridge = SonoraBridge()

    active_threads_before = threading.active_count()
    lyrics_emitted = []
    bridge.lyricsReceived.connect(lambda d: lyrics_emitted.append(d))

    print("Active threads before _fetch_lyrics:", active_threads_before)
    
    # We fetch lyrics for a track
    bridge._fetch_lyrics("dQw4w9WgXcQ", title="Never Gonna Give You Up", artist="Rick Astley", duration=213)
    
    # Check active threads immediately
    active_threads_during = threading.active_count()
    print("Active threads immediately after _fetch_lyrics:", active_threads_during)
    print("New threads spawned:", active_threads_during - active_threads_before)

    t0 = time.time()
    while len(lyrics_emitted) < 2 and time.time() - t0 < 3.0:
        app.processEvents()
        time.sleep(0.05)

    print(f"Number of lyricsReceived emissions received: {len(lyrics_emitted)}")
    if len(lyrics_emitted) >= 2:
        print("BUG CONFIRMED: lyricsReceived emitted multiple times for a single _fetch_lyrics call due to duplicate thread startup at lines 651 and 653 in qt_bridge.py!")

if __name__ == "__main__":
    test_lyrics_threads()
