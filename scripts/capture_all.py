#!/usr/bin/env python3
import os
import sys
import time
import shutil
import socket
import subprocess
import urllib.request

SONORA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCREENSHOTS_DIR = os.path.join(SONORA_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

TARGET_SPECS = [
    {
        "id": "01",
        "file": "01_opening_animation.png",
        "desc": "App launch opening animation",
        "path": "/?opening=freeze"
    },
    {
        "id": "02",
        "file": "02_home_view.png",
        "desc": "Home / Discover view",
        "path": "/?nointro=true&theme=dark"
    },
    {
        "id": "03",
        "file": "03_search_view.png",
        "desc": "Search view with filter chips",
        "path": "/?nointro=true&theme=dark&tab=search&q=Queen"
    },
    {
        "id": "04",
        "file": "04_lyrics_active.png",
        "desc": "Synced Lyrics drawer open with glowing active line",
        "path": "/?nointro=true&theme=dark&lyrics=true&time=8.5"
    },
    {
        "id": "05",
        "file": "05_queue_drawer.png",
        "desc": "Queue drawer open with tracks",
        "path": "/?nointro=true&theme=dark&queue=true"
    },
    {
        "id": "06",
        "file": "06_light_theme.png",
        "desc": "Light theme mode",
        "path": "/?nointro=true&theme=light"
    },
    {
        "id": "07",
        "file": "07_settings_modal.png",
        "desc": "Settings dialog open",
        "path": "/?nointro=true&theme=dark&settings=true"
    },
    {
        "id": "08",
        "file": "08_liked_songs_clean.png",
        "desc": "Liked Songs clean empty state (0 songs)",
        "path": "/?nointro=true&theme=dark&tab=liked"
    }
]

def find_free_port(start_port):
    for p in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', p))
                return p
            except OSError:
                continue
    return start_port

def make_profile(profile_path):
    os.makedirs(profile_path, exist_ok=True)
    with open(os.path.join(profile_path, "prefs.js"), "w") as f:
        f.write('user_pref("network.proxy.type", 0);\n')
        f.write('user_pref("browser.shell.checkDefaultBrowser", false);\n')
        f.write('user_pref("browser.sessionstore.resume_from_crash", false);\n')

def main():
    print("=" * 60)
    print(" Sonora UI Automated Screenshot Capture Suite")
    print("=" * 60)

    # Clean environment without proxy overrides for internal servers
    for k in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY']:
        os.environ.pop(k, None)
    env = os.environ.copy()

    back_port = find_free_port(8080)
    front_port = find_free_port(5190)
    env['VITE_BACKEND_URL'] = f"http://127.0.0.1:{back_port}"

    print(f"\n[1/3] Booting servers (Backend: {back_port}, Frontend: {front_port})...")
    proc_back = subprocess.Popen(
        ['python3', '-m', 'uvicorn', 'server.main:app', '--host', '127.0.0.1', '--port', str(back_port)],
        cwd=SONORA_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    vite_bin = os.path.join(SONORA_DIR, "frontend", "node_modules", ".bin", "vite")
    proc_front = subprocess.Popen(
        [vite_bin, '--host', '127.0.0.1', '--port', str(front_port), '--strictPort'],
        cwd=os.path.join(SONORA_DIR, "frontend"),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # Wait for Vite frontend to respond
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    ready = False
    for i in range(30):
        time.sleep(0.5)
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{front_port}/")
            with opener.open(req, timeout=1) as resp:
                if resp.status == 200:
                    ready = True
                    print(f" -> Frontend and Backend are ready on port {front_port} in {i * 0.5:.1f}s!")
                    break
        except Exception:
            pass

    if not ready:
        print("[Error] Vite frontend failed to respond within 15 seconds.")
        proc_front.terminate()
        proc_back.terminate()
        sys.exit(1)

    print(f"\n[2/3] Capturing {len(TARGET_SPECS)} high-resolution 1440x900 screenshots with Zen Browser...")
    results = []
    
    try:
        for idx, t in enumerate(TARGET_SPECS, 1):
            out_file = os.path.join(SCREENSHOTS_DIR, t["file"])
            profile_dir = f"/tmp/zenprofile_{t['id']}"
            if os.path.exists(profile_dir):
                shutil.rmtree(profile_dir, ignore_errors=True)
            make_profile(profile_dir)

            target_url = f"http://127.0.0.1:{front_port}{t['path']}"
            print(f" [{idx}/{len(TARGET_SPECS)}] Capturing: {t['file']} ({t['desc']})...")
            
            cmd = [
                'zen-browser',
                '--headless',
                '--profile', profile_dir,
                '--window-size', '1440,900',
                '--screenshot', out_file,
                target_url
            ]
            
            res = subprocess.run(cmd, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            if os.path.exists(out_file) and os.path.getsize(out_file) > 1000:
                size_kb = os.path.getsize(out_file) / 1024
                print(f"      ✓ Saved: {t['file']} ({size_kb:.1f} KB)")
                results.append((t["file"], t["desc"], True, f"{size_kb:.1f} KB", out_file))
            else:
                print(f"      ✗ Failed to capture {t['file']}")
                results.append((t["file"], t["desc"], False, "0 KB", out_file))

    finally:
        print("\n[3/3] Shutting down web processes...")
        proc_front.terminate()
        proc_back.terminate()
        proc_front.wait()
        proc_back.wait()

    print("\n" + "=" * 60)
    print(" Screenshot Capture Results Summary")
    print("=" * 60)
    all_ok = True
    for fname, desc, ok, size, path in results:
        status_str = "PASS" if ok else "FAIL"
        print(f" [{status_str}] {fname:<30} {size:<10} - {desc}")
        if not ok:
            all_ok = False

    if all_ok:
        print(f"\nSUCCESS: All {len(TARGET_SPECS)} screenshots captured with full fidelity in 1440x900!")
        sys.exit(0)
    else:
        print("\nFAILURE: One or more screenshots failed to capture.")
        sys.exit(1)

if __name__ == "__main__":
    main()
