#!/usr/bin/env python3
"""
Test Queue Management in SonoraBridge
"""
import sys
import os
from pathlib import Path

os.environ["QT_API"] = "pyside6"
os.environ["QT_QPA_PLATFORM"] = "offscreen"
sonora_dir = Path("/home/hoshirun/Sonora")
sys.path.insert(0, str(sonora_dir))

import gi
gi.require_version("Gst", "1.0")
from gi.repository import Gst
Gst.init(None)

from PySide6.QtGui import QGuiApplication
from ui.qt_bridge import SonoraBridge

def test_queue_operations():
    app = QGuiApplication(sys.argv)
    bridge = SonoraBridge()

    print("--- TEST 1: Enqueue & Basic Structure ---")
    bridge.clearQueue()
    assert len(bridge.queueItems) == 0
    assert bridge.queueIndex == -1

    track1 = {"videoId": "id1", "title": "Song 1", "artist": "Artist 1"}
    track2 = {"videoId": "id2", "title": "Song 2", "artist": "Artist 2"}
    track3 = {"videoId": "id3", "title": "Song 3", "artist": "Artist 3"}
    track4 = {"videoId": "id4", "title": "Song 4", "artist": "Artist 4"}

    bridge.enqueue(track1)
    bridge.enqueue(track2)
    bridge.enqueue(track3)
    bridge.enqueue(track4)

    assert len(bridge.queueItems) == 4
    print("Enqueue successful. Queue length:", len(bridge.queueItems))

    print("--- TEST 2: Move Queue Item Normal ---")
    # Set queueIndex to 0 (playing track 1)
    bridge._queue_index = 0
    # Move item at index 2 (Song 3) up by -1 to index 1
    bridge.moveQueueItem(2, -1)
    items = [t["title"] for t in bridge.queueItems]
    print("Queue order after moving index 2 by -1:", items)
    assert items == ["Song 1", "Song 3", "Song 2", "Song 4"], f"Unexpected items: {items}"

    print("--- TEST 3: Move Queue Item into currently playing item (target <= queue_index) ---")
    # Try to move index 1 up to index 0 (which is playing)
    bridge.moveQueueItem(1, -1)
    items = [t["title"] for t in bridge.queueItems]
    print("Queue order after attempting move to playing slot:", items)
    assert items == ["Song 1", "Song 3", "Song 2", "Song 4"], "Should not move into playing slot"

    print("--- TEST 4: Move Queue Item Out-Of-Bounds (Bug Hunt) ---")
    # Current queue length is 4.
    # What if index = 4 (out of bounds! len is 4, valid indices are 0..3) and offset = -1?
    # target = 3. 
    try:
        bridge.moveQueueItem(4, -1)
        print("moveQueueItem(4, -1) executed without unhandled exception.")
    except IndexError as e:
        print(f"BUG CONFIRMED: moveQueueItem(4, -1) raised IndexError: {e}")

    try:
        bridge.moveQueueItem(10, -7)
        print("moveQueueItem(10, -7) executed without unhandled exception.")
    except IndexError as e:
        print(f"BUG CONFIRMED: moveQueueItem(10, -7) raised IndexError: {e}")

    print("--- TEST 5: removeQueueItem at playing index clearing state ---")
    bridge.clearQueue()
    bridge.enqueue(track1)
    bridge._queue_index = 0
    bridge._now_playing = dict(track1)
    bridge._lyrics = {"available": True, "lines": ["line 1"]}
    bridge._dynamic_color = "#123456"

    # Remove the only item in queue
    bridge.removeQueueItem(0)
    print("After removing current & only item:")
    print("  queueIndex:", bridge.queueIndex)
    print("  nowPlaying:", bridge.nowPlaying)
    print("  lyrics:", bridge.lyrics)
    print("  dynamicColor:", bridge.dynamicColor)
    if bridge.lyrics.get("available") or bridge.lyrics.get("lines"):
        print("ANOMALY: Lyrics were not reset after queue emptied via removeQueueItem!")
    if bridge._dynamic_color:
        print("ANOMALY: dynamicColor was not reset after queue emptied via removeQueueItem!")

    print("--- TEST 6: previousTrack when position <= 3000ms & queueIndex == 0 ---")
    bridge.enqueue(track1)
    bridge._queue_index = 0
    bridge._position = 1500
    seek_called = []
    bridge.seek = lambda f: seek_called.append(f)
    bridge.previousTrack()
    if not seek_called:
        print("BEHAVIOR NOTE: previousTrack() does nothing when queueIndex == 0 and position <= 3000ms (does not restart track)")
    else:
        print("previousTrack() seeked to:", seek_called)

    print("--- TEST 7: clearUpcoming behavior ---")
    bridge.clearQueue()
    bridge.enqueue(track1)
    bridge.enqueue(track2)
    bridge.enqueue(track3)
    bridge._queue_index = 1 # playing song 2
    bridge.clearUpcoming()
    items = [t["title"] for t in bridge.queueItems]
    print("Queue items after clearUpcoming with playing index 1:", items)
    assert items == ["Song 1", "Song 2"], f"Expected ['Song 1', 'Song 2'], got {items}"

    # Now test clearUpcoming when queue_index == -1
    bridge.enqueue(track3)
    bridge.enqueue(track4)
    bridge._queue_index = -1
    bridge.clearUpcoming()
    print("Queue length after clearUpcoming with queueIndex == -1:", len(bridge.queueItems))
    assert len(bridge.queueItems) == 0

    print("Queue tests finished.")

if __name__ == "__main__":
    test_queue_operations()
