# Sonora Web

Standalone web client and FastAPI backend for Sonora. This project contains its own Vite app and a bundled API under `api/`; it does not depend on the desktop Python application's root modules.

## Local Development

Requirements: Node.js/npm, Python 3.10+, and `ffmpeg` for audio downloads.

```bash
npm install
python3 -m pip install -r api/requirements.txt
cp .env.example .env
./run_web.sh
```

Open `http://localhost:5173`. The API docs are at `http://localhost:8000/docs`.

Firebase web configuration uses `VITE_FIREBASE_*` variables. YouTube device OAuth credentials must remain server-only in `SONORA_GOOGLE_CLIENT_ID` and `SONORA_GOOGLE_CLIENT_SECRET`; never rename them to `VITE_*` or commit `.env`.

## Production Build

```bash
npm run build
```

## Vercel

The repository root is the Vite app root. `vercel.json` routes `/api/*` to the bundled Python function at `api/index.py` and all other routes to the SPA. Link this directory to a new Vercel project, then configure the Firebase `VITE_FIREBASE_*` values and server-only `SONORA_GOOGLE_CLIENT_ID` / `SONORA_GOOGLE_CLIENT_SECRET` values in that project's environment settings.

Apply `firestore.rules` to the Firebase project before enabling user-data persistence.
