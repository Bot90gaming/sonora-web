#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

cd "$ROOT_DIR"
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

cleanup() {
  for pid in "${BACKEND_PID:-}" "${FRONTEND_PID:-}"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd "$ROOT_DIR/api" && python3 -m uvicorn server.main:app --host 0.0.0.0 --port "$BACKEND_PORT") &
BACKEND_PID=$!
(cd "$ROOT_DIR" && npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT") &
FRONTEND_PID=$!

printf 'Sonora Web: http://localhost:%s\nAPI docs:   http://localhost:%s/docs\n' "$FRONTEND_PORT" "$BACKEND_PORT"
wait -n "$BACKEND_PID" "$FRONTEND_PID"
