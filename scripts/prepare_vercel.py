#!/usr/bin/env python3
"""
Prepares the frontend/api bundle for Vercel deployment by synchronizing
server, core, and auth modules into frontend/api.
"""
import shutil
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_API = ROOT_DIR / "frontend" / "api"

MODULES_TO_SYNC = ["server", "core", "auth"]

def sync():
    FRONTEND_API.mkdir(parents=True, exist_ok=True)
    for mod in MODULES_TO_SYNC:
        src = ROOT_DIR / mod
        dest = FRONTEND_API / mod
        if not src.exists():
            print(f"[Warning] Source {src} does not exist, skipping.")
            continue
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(
            src,
            dest,
            ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "*.sqlite", "test_*", ".pytest_cache")
        )
        print(f"Synced {mod} -> {dest}")

    # Copy server requirements to frontend/api/requirements.txt
    req_src = ROOT_DIR / "server" / "requirements.txt"
    req_dest = FRONTEND_API / "requirements.txt"
    if req_src.exists():
        shutil.copy2(req_src, req_dest)
        print(f"Synced requirements.txt -> {req_dest}")

if __name__ == "__main__":
    sync()
