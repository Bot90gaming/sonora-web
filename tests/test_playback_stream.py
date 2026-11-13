#!/usr/bin/env python3
"""
Comprehensive Playback Verification Test
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

def test_playback_full():
    app = QGuiApplication(sys.argv)
    bridge = SonoraBridge()

    # Wait for API ready
    t0 = time.time()
    while not bridge._api and time.time() - t0 < 5.0:
        app.processEvents()
        time.sleep(0.05)

    track1 = {
        "videoId": "fJ9rUzIMcZQ", # Queen Bohemian Rhapsody
        "title": "Bohemian Rhapsody",
        "artist": "Queen",
        "duration": 354
    }
    track2 = {
        "videoId": "dQw4w9WgXcQ", # Rick Astley
        "title": "Never Gonna Give You Up",
        "artist": "Rick Astley",
        "duration": 213
    }

    print("--- 1. Enqueue & Play First Song ---")
    bridge.playSong(track1)
    bridge.enqueue(track2)
    assert len(bridge.queueItems) == 2
    assert bridge.nowPlaying.get("videoId") == track1["videoId"]

    print("Waiting for audio download/cache and playback to begin...")
    t0 = time.time()
    while not bridge.playing and time.time() - t0 < 20.0:
        app.processEvents()
        time.sleep(0.05)

    print(f"Playback started in {time.time() - t0:.1f}s. Playing state:", bridge.playing)
    assert bridge.playing is True, "Expected playing to be True"
    assert bridge.positionMs >= 0, "Expected valid position"

    print("--- 2. Volume control ---")
    bridge.setVolume(0.4)
    assert abs(bridge.volume - 0.4) < 1e-4, f"Volume not updated, got {bridge.volume}"

    print("--- 3. Seek operation ---")
    bridge.seek(0.2) # seek to 20%
    t0 = time.time()
    while time.time() - t0 < 0.5:
        app.processEvents()
        time.sleep(0.05)
    print(f"Position after seek: {bridge.positionMs}ms")

    print("--- 4. Pause and Resume ---")
    bridge.togglePlayback()
    t0 = time.time()
    while bridge.playing and time.time() - t0 < 1.0:
        app.processEvents()
        time.sleep(0.05)
    print("Playing state after toggle (pause):", bridge.playing)
    assert bridge.playing is False, "Expected playing to be False after pause"

    bridge.togglePlayback()
    t0 = time.time()
    while not bridge.playing and time.time() - t0 < 1.0:
        app.processEvents()
        time.sleep(0.05)
    print("Playing state after toggle (resume):", bridge.playing)
    assert bridge.playing is True, "Expected playing to be True after resume"

    print("--- 5. Next Track ---")
    bridge.nextTrack()
    assert bridge.queueIndex == 1
    assert bridge.nowPlaying.get("videoId") == track2["videoId"]
    print(f"Now playing track 2: {bridge.nowPlaying.get('title')}")

    print("--- 6. Repeat / Loop Toggle ---")
    assert bridge.loopEnabled is False
    bridge.toggleLoop()
    assert bridge.loopEnabled is True
    print("Loop enabled successfully.")

    print("--- 7. Stop / Clear Queue ---")
    bridge.clearQueue()
    assert len(bridge.queueItems) == 0
    assert bridge.nowPlaying == {}
    assert bridge.playing is False
    print("Queue cleared and playback stopped.")

    print("\n--- PLAYBACK TEST COMPLETED SUCCESSFULLY ---")

if __name__ == "__main__":
    test_playback_full()
