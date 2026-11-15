"""
Sonora Music API — Vercel Serverless Function entrypoint.
Exposes FastAPI application directly for Vercel's Python ASGI runtime.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Add the directory containing server, core, and auth to sys.path
API_DIR = Path(__file__).resolve().parent
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

# Mark serverless execution environment
os.environ["VERCEL"] = "1"
os.environ["SONORA_CACHE_DIR"] = "/tmp/sonora"

from server.main import app

# Export app for Vercel
__all__ = ["app"]
