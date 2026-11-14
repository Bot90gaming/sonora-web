#!/usr/bin/env bash
# ==============================================================================
# Sonora Music - Web Application Runner
# Launches FastAPI Backend (port 8000) and Vite React Frontend (port 5173)
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

echo "======================================================"
echo "          Sonora Web - Starting Music App             "
echo "======================================================"

# Check Python environment
if ! command -v python3 &>/dev/null; then
  echo "[Error] python3 is required but not installed." >&2
  exit 1
fi

# Check Node & npm environment
if ! command -v npm &>/dev/null; then
  echo "[Error] npm is required but not installed." >&2
  exit 1
fi

# Ensure frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
  echo "[Info] Installing frontend dependencies..."
  (cd frontend && npm install)
fi

# Trap to kill both background processes on exit
cleanup() {
  echo ""
  echo "[Sonora] Stopping web servers..."
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo "[Sonora] Stopped cleanly. Goodbye!"
}
trap cleanup SIGINT SIGTERM EXIT

# Start FastAPI backend
echo "[Sonora Backend] Starting FastAPI on http://localhost:${BACKEND_PORT}..."
python3 -m uvicorn server.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 1.5

# Start Vite React frontend
echo "[Sonora Frontend] Starting Vite on http://localhost:${FRONTEND_PORT}..."
(cd frontend && npx vite --port "$FRONTEND_PORT" --host) &
FRONTEND_PID=$!

echo "======================================================"
echo " Sonora Web App is Running:"
echo "   -> Frontend UI:      http://localhost:${FRONTEND_PORT}"
echo "   -> Backend API:      http://localhost:${BACKEND_PORT}"
echo "   -> API Interactive:  http://localhost:${BACKEND_PORT}/docs"
echo " Press Ctrl+C to terminate both servers."
echo "======================================================"

# Wait for both processes
wait -n "$BACKEND_PID" "$FRONTEND_PID" || true
