"""
Authentication via Google OAuth or browser request headers.
"""
from __future__ import annotations
from collections.abc import Callable
import json
import os
from pathlib import Path
import time
import webbrowser
from threading import Event

from ytmusicapi import OAuthCredentials, YTMusic
import ytmusicapi as _ytm

if os.environ.get("VERCEL") or not os.access(Path.home(), os.W_OK):
    _TOKEN_DIR = Path("/tmp") / ".config" / "ytmusic_player"
else:
    _TOKEN_DIR = Path.home() / ".config" / "ytmusic_player"
_TOKEN_FILE = _TOKEN_DIR / "oauth.json"
_GOOGLE_TOKEN_FILE = _TOKEN_DIR / "google_oauth.json"
_GOOGLE_CREDENTIALS_FILE = _TOKEN_DIR / "google_oauth_credentials.json"
_PACKAGED_GOOGLE_CREDENTIALS_FILE = Path(__file__).with_name(
    "google_oauth_client.json")
_GOOGLE_CLIENT_ID_ENV = "SONORA_GOOGLE_CLIENT_ID"
_GOOGLE_CLIENT_SECRET_ENV = "SONORA_GOOGLE_CLIENT_SECRET"


def _google_oauth_credentials() -> dict[str, str]:
    if _GOOGLE_CREDENTIALS_FILE.exists():
        credentials = json.loads(_GOOGLE_CREDENTIALS_FILE.read_text())
    else:
        packaged_file = os.environ.get(
            "SONORA_GOOGLE_OAUTH_CONFIG",
            str(_PACKAGED_GOOGLE_CREDENTIALS_FILE),
        )
        if Path(packaged_file).is_file():
            credentials = json.loads(Path(packaged_file).read_text())
        else:
            credentials = {
                "client_id": os.environ.get(_GOOGLE_CLIENT_ID_ENV, ""),
                "client_secret": os.environ.get(_GOOGLE_CLIENT_SECRET_ENV, ""),
            }

    client_id = credentials.get("client_id", "")
    client_secret = credentials.get("client_secret", "")

    if not client_id or not client_secret:
        raise RuntimeError(
            "Google sign-in is not configured by this Sonora installation. "
            "Use Request headers or contact the app distributor."
        )
    return {"client_id": client_id, "client_secret": client_secret}


def is_google_oauth_configured() -> bool:
    try:
        _google_oauth_credentials()
    except (OSError, ValueError, RuntimeError):
        return False
    return True


def sanitize_headers_dict(headers: dict[str, str]) -> dict[str, str]:
    """Sanitize parsed headers to ensure no corrupted or hop-by-hop headers are passed to YouTube."""
    disallowed_headers = {
        "host", "content-length", "accept-encoding", "content-encoding",
        "connection", "te", "keep-alive", "proxy-connection",
        "upgrade", "alt-used", "priority"
    }
    sanitized = {}
    for k, v in headers.items():
        k_clean = str(k).strip()
        k_lower = k_clean.lower()
        # Header names must be valid RFC tokens: no spaces, slashes, colons, question marks
        if not k_clean or any(c in k_clean for c in " \t/:?&=#;"):
            continue
        if k_lower.startswith(":") or k_lower in disallowed_headers:
            continue
        if k_lower.startswith("sec-"):
            continue
        sanitized[k_clean] = str(v).strip() if isinstance(v, str) else v
    return sanitized


def sanitize_oauth_file(path: Path) -> bool:
    """Read a stored headers json, remove corrupt/invalid keys, and rewrite if modified."""
    try:
        if not path.is_file():
            return False
        raw_text = path.read_text(encoding="utf-8")
        data = json.loads(raw_text)
        if not isinstance(data, dict):
            return False
        cleaned = sanitize_headers_dict(data)
        if cleaned != data:
            path.write_text(json.dumps(cleaned, indent=4, ensure_ascii=True), encoding="utf-8")
            return True
    except Exception:
        pass
    return False


def is_authenticated() -> bool:
    return any(
        path.exists() and path.stat().st_size > 10
        for path in (_TOKEN_FILE, _GOOGLE_TOKEN_FILE)
    )


def get_ytmusic_client() -> YTMusic:
    if _GOOGLE_TOKEN_FILE.exists():
        credentials_data = _google_oauth_credentials()
        credentials = OAuthCredentials(
            client_id=credentials_data["client_id"],
            client_secret=credentials_data["client_secret"],
        )
        return YTMusic(str(_GOOGLE_TOKEN_FILE), oauth_credentials=credentials)

    if is_authenticated():
        try:
            sanitize_oauth_file(_TOKEN_FILE)
            return YTMusic(str(_TOKEN_FILE))
        except Exception:
            pass
    return YTMusic()


def setup_from_json(headers_dict: dict[str, str]) -> str:
    """Store sanitized YouTube Music headers directly from dictionary."""
    _TOKEN_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(_TOKEN_DIR, 0o700)
    cleaned = sanitize_headers_dict(headers_dict)
    _TOKEN_FILE.write_text(json.dumps(cleaned, indent=4, ensure_ascii=True), encoding="utf-8")
    os.chmod(_TOKEN_FILE, 0o600)
    _GOOGLE_TOKEN_FILE.unlink(missing_ok=True)
    _GOOGLE_CREDENTIALS_FILE.unlink(missing_ok=True)
    return str(_TOKEN_FILE)


def restore_google_oauth(token: dict, client_data: dict) -> None:
    """Restore Google OAuth token and credentials files from client payload."""
    _TOKEN_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(_TOKEN_DIR, 0o700)
    _write_private_json(_GOOGLE_TOKEN_FILE, token)
    _write_private_json(_GOOGLE_CREDENTIALS_FILE, client_data)
    _TOKEN_FILE.unlink(missing_ok=True)


def get_stored_auth_payload() -> dict | None:
    """Return stored session payload for client localStorage persistence."""
    try:
        if _GOOGLE_TOKEN_FILE.exists() and _GOOGLE_CREDENTIALS_FILE.exists():
            token = json.loads(_GOOGLE_TOKEN_FILE.read_text(encoding="utf-8"))
            client_data = json.loads(_GOOGLE_CREDENTIALS_FILE.read_text(encoding="utf-8"))
            return {
                "authType": "google_oauth",
                "token": token,
                "client_data": client_data,
            }
        if _TOKEN_FILE.exists() and _TOKEN_FILE.stat().st_size > 10:
            sanitize_oauth_file(_TOKEN_FILE)
            content = _TOKEN_FILE.read_text(encoding="utf-8")
            return {
                "authType": "headers",
                "headers": content,
            }
    except Exception:
        pass
    return None


def restore_from_payload(payload: dict) -> bool:
    """Restore auth session files from a client storage dictionary."""
    if not isinstance(payload, dict):
        return False
    try:
        auth_type = payload.get("authType")
        if auth_type == "headers":
            headers_val = payload.get("headers")
            if isinstance(headers_val, dict):
                setup_from_json(headers_val)
                return is_authenticated()
            elif isinstance(headers_val, str) and headers_val.strip():
                setup_from_headers(headers_val)
                return is_authenticated()
        elif auth_type == "google_oauth":
            token = payload.get("token")
            client_data = payload.get("client_data")
            if token and client_data:
                restore_google_oauth(token, client_data)
                return is_authenticated()
    except Exception:
        pass
    return False


def rehydrate(auth_header: str | None) -> bool:
    """Rehydrate auth session from an HTTP header string (base64, URL-encoded, or JSON)."""
    if not auth_header:
        return False
    import base64
    import urllib.parse
    raw = auth_header.strip()
    data = None
    # 1. Try base64 decoding
    try:
        decoded = base64.b64decode(raw).decode("utf-8")
        data = json.loads(decoded)
    except Exception:
        pass

    # 2. Try URL-decoding
    if not data:
        try:
            decoded = urllib.parse.unquote(raw)
            data = json.loads(decoded)
        except Exception:
            pass

    # 3. Try direct JSON
    if not data and raw.startswith("{"):
        try:
            data = json.loads(raw)
        except Exception:
            pass

    if isinstance(data, dict):
        return restore_from_payload(data)
    return False


def setup_from_headers(headers_raw: str) -> str:
    import re
    _TOKEN_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(_TOKEN_DIR, 0o700)
    
    raw = headers_raw.strip()
    # Support direct JSON payload string
    if raw.startswith("{"):
        try:
            parsed_json = json.loads(raw)
            if isinstance(parsed_json, dict):
                return setup_from_json(parsed_json)
        except Exception:
            pass

    # Support "Copy as cURL" directly from browser devtools
    if raw.startswith("curl ") or "\ncurl " in raw:
        extracted = re.findall(r"-(?:H|b)\s+['\"]([^'\"]+)['\"]", raw)
        if extracted:
            raw = "\n".join(extracted)

    # Support raw Cookie string without "cookie: " prefix
    if "cookie:" not in raw.lower() and ("sapisid=" in raw.lower() or "sid=" in raw.lower()):
        raw = f"cookie: {raw}"

    # Auto-add x-goog-authuser default if absent
    if "x-goog-authuser" not in raw.lower():
        raw += "\nx-goog-authuser: 0"

    cleaned_lines = []
    for line in raw.splitlines():
        trimmed = line.strip()
        if (trimmed.startswith(("GET ", "POST ", "PUT ", "DELETE ", "OPTIONS ", "HEAD ", "HTTP/"))
                or trimmed.startswith(":")
                or not trimmed):
            continue
        cleaned_lines.append(line)
    cleaned_raw = "\n".join(cleaned_lines)
    _ytm.setup(filepath=str(_TOKEN_FILE), headers_raw=cleaned_raw)
    sanitize_oauth_file(_TOKEN_FILE)
    os.chmod(_TOKEN_FILE, 0o600)
    _GOOGLE_TOKEN_FILE.unlink(missing_ok=True)
    _GOOGLE_CREDENTIALS_FILE.unlink(missing_ok=True)
    return str(_TOKEN_FILE)


def setup_google_oauth(
    on_device_code: Callable[[str], None],
    cancelled: Event,
) -> None:
    client_data = _google_oauth_credentials()
    credentials = OAuthCredentials(
        client_data["client_id"], client_data["client_secret"])
    code = credentials.get_code()
    verification_url = f"{code['verification_url']}?user_code={code['user_code']}"
    on_device_code(verification_url)
    webbrowser.open(verification_url)

    deadline = time.monotonic() + code["expires_in"]
    interval = code["interval"]
    while time.monotonic() < deadline:
        if cancelled.wait(interval):
            return

        response = credentials.token_from_code(code["device_code"])
        error = response.get("error")
        if not error:
            token = {
                "scope": response["scope"],
                "token_type": response["token_type"],
                "access_token": response["access_token"],
                "refresh_token": response["refresh_token"],
                "expires_at": int(time.time()) + response["expires_in"],
                "expires_in": response.get(
                    "refresh_token_expires_in", response["expires_in"]),
            }
            _TOKEN_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
            os.chmod(_TOKEN_DIR, 0o700)
            _write_private_json(_GOOGLE_TOKEN_FILE, token)
            _write_private_json(_GOOGLE_CREDENTIALS_FILE, client_data)
            _TOKEN_FILE.unlink(missing_ok=True)
            return

        if error == "authorization_pending":
            continue
        if error == "slow_down":
            interval += 5
            continue
        if error == "access_denied":
            raise RuntimeError("Google sign-in was denied.")
        if error == "expired_token":
            raise RuntimeError("The Google sign-in code expired. Please try again.")
        raise RuntimeError(response.get("error_description", error))

    raise RuntimeError("The Google sign-in code expired. Please try again.")


def _write_private_json(path: Path, data: dict) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as token_file:
        os.fchmod(token_file.fileno(), 0o600)
        json.dump(data, token_file, indent=2)


def logout():
    _TOKEN_FILE.unlink(missing_ok=True)
    _GOOGLE_TOKEN_FILE.unlink(missing_ok=True)
    _GOOGLE_CREDENTIALS_FILE.unlink(missing_ok=True)
