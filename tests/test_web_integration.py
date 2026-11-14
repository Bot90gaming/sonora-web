"""
End-to-End Integration Verification for Sonora Web Application.
Spawns the backend and frontend, tests proxying, streaming, lyrics, and clean shutdown.
"""
import json
import os
import signal
import subprocess
import sys
import time
import urllib.request

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_integration():
    print("[Integration Test] Launching backend server on port 8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "server.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid,
    )

    print("[Integration Test] Launching frontend vite dev server on port 5173...")
    frontend_proc = subprocess.Popen(
        ["npx", "vite", "--port", "5173", "--host", "127.0.0.1"],
        cwd=os.path.join(REPO_ROOT, "frontend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        preexec_fn=os.setsid,
    )

    try:
        # Wait up to 15 seconds for servers to become available
        backend_up = False
        frontend_up = False
        for _ in range(30):
            time.sleep(0.5)
            if backend_proc.poll() is not None:
                _, err = backend_proc.communicate()
                print("Backend exited early with:", err.decode())
                break
            if frontend_proc.poll() is not None:
                _, err = frontend_proc.communicate()
                print("Frontend exited early with:", err.decode())
                break
            if not backend_up:
                try:
                    with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=1) as res:
                        if res.status == 200:
                            backend_up = True
                            print(" -> Backend server is up and responding!")
                except Exception:
                    pass
            if not frontend_up:
                try:
                    with urllib.request.urlopen("http://127.0.0.1:5173/", timeout=1) as res:
                        if res.status == 200:
                            frontend_up = True
                            print(" -> Frontend Vite server is up and serving HTML!")
                except Exception:
                    pass
            if backend_up and frontend_up:
                break

        assert backend_up, "Backend failed to start within timeout"
        assert frontend_up, "Frontend failed to start within timeout"

        # Test 1: Vite proxy for /api/health
        print("[Integration Test] Verifying Vite proxy for /api/health...")
        req = urllib.request.Request("http://127.0.0.1:5173/api/health")
        with urllib.request.urlopen(req, timeout=3) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data.get("status") == "ok"
            print(" -> PASS: Vite proxy successfully routed /api/health to FastAPI!")

        # Test 2: Vite proxy for /api/search?q=Adele
        print("[Integration Test] Verifying Vite proxy for /api/search...")
        req = urllib.request.Request("http://127.0.0.1:5173/api/search?q=Adele&filter=songs&limit=2")
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert len(data.get("results", [])) > 0
            print(f" -> PASS: Search returned {len(data['results'])} tracks via proxy!")

        # Test 3: Vite proxy for /api/suggestions?q=Coldplay
        print("[Integration Test] Verifying search suggestions via Vite proxy...")
        req = urllib.request.Request("http://127.0.0.1:5173/api/suggestions?q=Coldplay")
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert "suggestions" in data
            print(f" -> PASS: Suggestions returned {len(data['suggestions'])} items via proxy!")

        # Test 4: Vite proxy for /api/lyrics
        print("[Integration Test] Verifying lyrics API via Vite proxy...")
        req = urllib.request.Request("http://127.0.0.1:5173/api/lyrics?title=Despacito&artist=Luis+Fonsi")
        with urllib.request.urlopen(req, timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert len(data.get("lines", [])) > 0
            print(f" -> PASS: Lyrics returned {len(data['lines'])} synchronized lines via proxy!")

        # Test 5: Vite proxy for audio range streaming
        print("[Integration Test] Verifying audio range streaming via Vite proxy...")
        req = urllib.request.Request("http://127.0.0.1:5173/api/stream/FXovf5dsRTw")
        req.add_header("Range", "bytes=0-2047")
        with urllib.request.urlopen(req, timeout=10) as res:
            assert res.status in (200, 206)
            content = res.read()
            assert len(content) > 0
            print(f" -> PASS: Stream chunk ({len(content)} bytes) received through Vite proxy!")

        print("\n=======================================================")
        print(" ALL END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("=======================================================")

    finally:
        print("[Integration Test] Tearing down background servers...")
        try:
            os.killpg(os.getpgid(backend_proc.pid), signal.SIGTERM)
        except Exception:
            pass
        try:
            os.killpg(os.getpgid(frontend_proc.pid), signal.SIGTERM)
        except Exception:
            pass
        backend_proc.wait(timeout=3)
        frontend_proc.wait(timeout=3)
        print("[Integration Test] Teardown complete.")

if __name__ == "__main__":
    test_integration()
