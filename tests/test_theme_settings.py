#!/usr/bin/env python3
"""
Test Theme and Settings configuration & persistence
"""
import sys
import os
import json
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
from core import settings as cfg

def test_themes_and_settings():
    app = QGuiApplication(sys.argv)
    bridge = SonoraBridge()

    settings_file = Path.home() / ".config" / "ytmusic_player" / "settings.json"
    backup_data = None
    if settings_file.exists():
        backup_data = settings_file.read_text()

    try:
        print("--- TEST 1: Theme Switching & Validation ---")
        bridge.setTheme("light")
        assert bridge.theme == "light", f"Expected light, got {bridge.theme}"
        assert bridge.darkTheme is False, f"Expected darkTheme=False, got {bridge.darkTheme}"
        assert cfg.get("theme") == "light", "settings file theme was not updated"

        bridge.setTheme("dark")
        assert bridge.theme == "dark", f"Expected dark, got {bridge.theme}"
        assert bridge.darkTheme is True, f"Expected darkTheme=True, got {bridge.darkTheme}"
        assert cfg.get("theme") == "dark", "settings file theme was not updated"

        bridge.setTheme("system")
        assert bridge.theme == "system", f"Expected system, got {bridge.theme}"
        assert cfg.get("theme") == "system"

        # Invalid theme
        bridge.setTheme("neon_pink")
        assert bridge.theme == "system", "Invalid theme should be rejected"

        print("--- TEST 2: Accent Switching & Validation ---")
        accents = {
            "violet": "#d0bcff",
            "blue": "#b3c5ff",
            "green": "#a8d4ae",
            "rose": "#f2b8b5",
            "orange": "#ffb77d",
        }
        for acc, hex_code in accents.items():
            bridge.setAccent(acc)
            assert bridge.accent == acc, f"Expected {acc}, got {bridge.accent}"
            assert bridge.accentColor == hex_code, f"Expected {hex_code}, got {bridge.accentColor}"
            assert cfg.get("accent") == acc

        # Invalid accent
        bridge.setAccent("hot_pink")
        assert bridge.accent == "orange", "Invalid accent should be rejected"

        print("--- TEST 3: Settings corruption recovery ---")
        cfg._cache = None
        settings_file.write_text("{corrupt json...")
        loaded = cfg.load()
        assert loaded == cfg._DEFAULTS, f"Expected defaults on corrupted json, got {loaded}"
        print("Corrupted settings properly reverted to defaults.")

        print("\n--- ALL THEME & SETTINGS TESTS COMPLETED SUCCESSFULLY ---")
    finally:
        if backup_data is not None:
            settings_file.write_text(backup_data)
        cfg._cache = None

if __name__ == "__main__":
    test_themes_and_settings()
