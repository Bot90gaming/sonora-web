#!/usr/bin/env python3
"""
Test Downloader and GLib event handling
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
from gi.repository import Gst, GLib
Gst.init(None)

from PySide6.QtGui import QGuiApplication
from ui.qt_bridge import SonoraBridge
from core.downloader import Downloader

def test_glib_idle_infinite_loop():
    print("--- TEST 1: GLib.idle_add return value with Qt Signal.emit ---")
    app = QGuiApplication(sys.argv)
    bridge = SonoraBridge()

    # Track how many times downloadProgressReceived is triggered
    progress_calls = []
    bridge.downloadProgressReceived.connect(lambda idx, p: progress_calls.append((idx, p)))

    # In SonoraBridge line 1265:
    # on_progress = lambda progress: self.downloadProgressReceived.emit(download_id, progress)
    download_id = 0
    on_progress = lambda progress: bridge.downloadProgressReceived.emit(download_id, progress)

    # In Downloader line 53:
    # GLib.idle_add(on_progress, pct)
    print("Scheduling single on_progress via GLib.idle_add...")
    GLib.idle_add(on_progress, 50)

    # Wait 100ms for GLib loop to process
    t0 = time.time()
    while time.time() - t0 < 0.1:
        app.processEvents()
        time.sleep(0.01)

    print(f"Total progressReceived events fired for a SINGLE progress update: {len(progress_calls)}")
    if len(progress_calls) > 1:
        print(f"CRITICAL BUG CONFIRMED: GLib.idle_add repeated {len(progress_calls)} times in 100ms because Signal.emit returns True!")

    # Test on_done lambda as well
    done_calls = []
    bridge.downloadDoneReceived.connect(lambda idx, p: done_calls.append((idx, p)))
    on_done = lambda path: bridge.downloadDoneReceived.emit(download_id, path)
    print("Scheduling single on_done via GLib.idle_add...")
    GLib.idle_add(on_done, "/fake/path/song.mp3")

    t0 = time.time()
    while time.time() - t0 < 0.1:
        app.processEvents()
        time.sleep(0.01)

    print(f"Total downloadDoneReceived events fired for a SINGLE done update: {len(done_calls)}")
    if len(done_calls) > 1:
        print(f"CRITICAL BUG CONFIRMED: GLib.idle_add repeated {len(done_calls)} times in 100ms because Signal.emit returns True!")

    # Test Player on_state_change as well
    state_calls = []
    bridge.stateReceived.connect(lambda s: state_calls.append(s))
    # Player line 119: GLib.idle_add(self.on_state_change, state)
    print("Scheduling single on_state_change via GLib.idle_add...")
    GLib.idle_add(bridge.stateReceived.emit, "playing")

    t0 = time.time()
    while time.time() - t0 < 0.1:
        app.processEvents()
        time.sleep(0.01)

    print(f"Total stateReceived events fired for a SINGLE state change: {len(state_calls)}")
    if len(state_calls) > 1:
        print(f"CRITICAL BUG CONFIRMED: Player on_state_change repeated {len(state_calls)} times in 100ms because stateReceived.emit returns True!")

def test_downloader_filename_sanitization():
    print("\n--- TEST 2: Downloader filename sanitization ---")
    safe = lambda s: "".join(c for c in s if c.isalnum() or c in " _-").strip()

    # Case A: Title with only punctuation
    title = "???"
    artist = ""
    name = f"{safe(artist)} - {safe(title)}" if artist else safe(title)
    print(f"Safe name for title='{title}', artist='{artist}': {repr(name)}")
    if not name:
        print("BUG CONFIRMED: Empty filename resulting in hidden file (e.g. '.mp3')")

    # Case B: Title with slashes
    title = "AC/DC - Thunderstruck"
    artist = "AC/DC"
    name = f"{safe(artist)} - {safe(title)}" if artist else safe(title)
    print(f"Safe name for title='{title}', artist='{artist}': {repr(name)}")

if __name__ == "__main__":
    test_glib_idle_infinite_loop()
    test_downloader_filename_sanitization()
