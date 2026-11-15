<div align="center">

# 🎵 Sonora

**Modern, High-Performance Music Streaming & Desktop Client**

[![Live Web App](https://img.shields.io/badge/Web%20App-sonora--web--music.vercel.app-7928CA?style=for-the-badge&logo=vercel&logoColor=white)](https://sonora-web-music.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

<p align="center">
  <a href="https://sonora-web-music.vercel.app"><strong>🌐 Try Sonora in Your Browser</strong></a> •
  <a href="#-desktop-app-linux"><strong>🖥️ Desktop App (Linux)</strong></a> •
  <a href="#-features"><strong>✨ Key Features</strong></a> •
  <a href="#-mobile-experience--cross-device-sync"><strong>📱 Mobile Pairing</strong></a> •
  <a href="#-development--self-hosting"><strong>💻 Self-Hosting</strong></a>
</p>

---

</div>

## 🌟 Overview

**Sonora** is an ultra-fast, cross-platform music streaming platform with a unified ecosystem:
1. **🌐 Web & Mobile Web App**: A responsive, PWA-ready web player built with React, Vite, TypeScript, and Tailwind CSS, deployed live at [sonora-web-music.vercel.app](https://sonora-web-music.vercel.app).
2. **🖥️ Native Linux Desktop App**: A lightweight desktop player built with PySide6 (Qt Quick / QML) and GStreamer for audiophile-grade playback.
3. **⚡ High-Throughput Audio Backend**: A unified FastAPI engine offering multi-source search (YouTube Music & SoundCloud), stream extraction, station radio generation, synced lyrics, and offline downloads.

---

## ✨ Features

### 🎧 Universal Audio & Playback
- **Multi-Source Music Engine**: Stream and search seamlessly across **YouTube Music** and **SoundCloud**.
- **Radio & Smart Recommendations**: Auto-generate endless radio stations from any playing track with smart background pre-buffering.
- **Queue Management**: Dynamic playback queue with reordering, shuffle, track removal, and loop modes.
- **Audio Visualizers**: Real-time interactive frequency spectrum and waveform canvas visualizers.
- **Aurora Ambient Mode**: Dynamic fluid background canvas reflecting track thumbnail palette colors.
- **Offline Audio Downloads**: Export audio high quality formats (MP3, M4A, Opus, FLAC, WAV).

### 🎤 Synchronized Karaoke Lyrics
- Real-time auto-scrolling lyrics synchronized with sub-second accuracy (powered by LRCLIB and local cache).
- Dynamic glowing vocal aura with smooth sub-pixel font swells and click-to-seek lyrics navigation.

### 📱 Seamless Cross-Device Sync (Mobile ↔ Desktop)
Signing in on mobile has never been easier. No typing complicated cookies or inspecting network headers on small screens:
- **Instant QR Code Pairing**: Open Sonora on PC, point your phone's camera at the screen, and you're signed in instantly.
- **6-Digit PIN Pairing**: Enter the 6-digit PIN displayed on your PC screen into your phone to connect your account.
- **One-Click Magic Sync Link**: Copy a secure, encrypted sync link to share via Telegram, WhatsApp, Discord, or AirDrop.

---

## 🌐 Web App (Vercel Production)

Experience Sonora directly in your browser on desktop, tablet, or phone without installing any software:

👉 **[https://sonora-web-music.vercel.app](https://sonora-web-music.vercel.app)**

### Highlights:
- **Adaptive Responsive Design**: Dedicated desktop layout with sidebar navigation, combined with an optimized native-app feel on mobile devices.
- **Touch & Gesture Optimized**: Smooth scrolling, bottom-sheet controls, and mobile gesture interactions.
- **Stateless Serverless Architecture**: Fast Vercel serverless functions with zero cold-start delay for playback queries.

---

## 🖥️ Desktop App (Linux)

Sonora provides a native Qt Quick / QML Linux client powered by GStreamer for optimal performance and low memory consumption.

### System Requirements
* Linux (Ubuntu, Debian, Fedora, Arch, openSUSE, etc.)
* Python 3.10+
* GStreamer 1.0 + Plugins (Good, Bad, Ugly, Libav)
* FFmpeg

### Quick Install (Automated)

```bash
git clone https://github.com/Bot90gaming/Sonora.git
cd Sonora
chmod +x install.sh
./install.sh
```

The installer configures the application under `~/.local/share/sonora`, registers desktop menu entries, installs theme icons, and places the `sonora` command in `~/.local/bin`.

To uninstall:
```bash
./uninstall.sh
```

### Manual Distribution Dependencies

<details>
<summary><b>Click to expand distribution commands</b></summary>

**Ubuntu / Debian / Linux Mint / Pop!_OS**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv python3-gi \
  gstreamer1.0-plugins-base gstreamer1.0-plugins-good \
  gstreamer1.0-plugins-bad gstreamer1.0-plugins-ugly \
  gstreamer1.0-libav ffmpeg
```

**Fedora / RHEL / AlmaLinux**
```bash
sudo dnf install python3 python3-pip python3-gobject \
  gstreamer1-plugins-base gstreamer1-plugins-good \
  gstreamer1-plugins-bad-free gstreamer1-plugins-ugly \
  gstreamer1-libav ffmpeg
```

**Arch Linux / Manjaro**
```bash
sudo pacman -Syu python python-pip python-gobject \
  gst-plugins-base gst-plugins-good gst-plugins-bad gst-plugins-ugly \
  gst-libav ffmpeg
```

</details>

---

## 💻 Development & Self-Hosting

### 1. Run Web Client & API Locally

**Prerequisites**: Node.js 18+ and Python 3.10+

```bash
# Clone the repository
git clone https://github.com/Bot90gaming/Sonora.git
cd Sonora

# 1. Start Python Backend API (Port 8000)
python3 -m venv venv
source venv/bin/activate
pip install -r server/requirements.txt
python3 -m server.main

# 2. Start Frontend Dev Server (in a new terminal)
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to explore your local Sonora instance!

### 2. Run Desktop Client from Source

```bash
python3 -m venv --system-site-packages venv
source venv/bin/activate
pip install -r requirements.txt
python3 main.py --debug
```

---

## 🏗️ Project Architecture

```text
Sonora/
├── frontend/                  # React 18 + Vite + Tailwind CSS Web Client
│   ├── api/                   # Vercel serverless Python endpoint bundle
│   ├── src/
│   │   ├── components/        # PlayerBar, LyricsView, YouTubeAuthModal, Visualizers
│   │   ├── views/             # HomeView, SearchResultsView, LibraryView, PlaylistsView
│   │   ├── services/          # API client, audio pipeline, sync tokens
│   │   └── App.tsx            # Main responsive controller
│   └── vercel.json            # Vercel deployment & routing config
├── server/                    # FastAPI High-Throughput REST API
│   ├── api/                   # Modular route handlers (search, songs, streams, pairing)
│   ├── services/              # Music service, stream extractor, download manager
│   └── main.py                # Server entrypoint
├── core/                      # Shared Python playback & API core
├── ui/                        # PySide6 / Qt Quick QML components for Linux Desktop
└── main.py                    # Linux desktop client launcher
```

---

## 🔒 Privacy & Security

- **Local Storage Only**: Sonora stores authentication tokens, credentials, and cache solely in local client storage (`localStorage` on Web, `~/.config/ytmusic_player/` on Desktop).
- **Zero Third-Party Telemetry**: Your listening history, searches, and library remain private between your device and the stream provider.
- **Ephemeral Pairing**: 6-digit cross-device sync codes are single-use and automatically expire within 10 minutes.

---

## 📄 License

Sonora is distributed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

<div align="center">
  <sub>Built with passion for high quality music streaming.</sub>
</div>
