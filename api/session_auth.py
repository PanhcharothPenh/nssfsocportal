import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.parse
from typing import Optional

SESSION_COOKIE = "soc_session"
SESSION_TTL_SECONDS = 30 * 24 * 3600

# Used only when no AUTH_SECRET or database URL is configured (local SQLite dev).
# Sessions then last until the server restarts.
_LOCAL_SECRET = secrets.token_bytes(32)


def _secret() -> bytes:
    """
    Key used to sign session tokens. Set AUTH_SECRET in production; otherwise it is
    derived from the database URL, which is already a server-only secret.
    """
    configured = os.getenv("AUTH_SECRET")
    if configured:
        return configured.encode()
    db_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if db_url:
        return hmac.new(db_url.encode(), b"nssf-soc-session", hashlib.sha256).digest()
    return _LOCAL_SECRET


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def issue_token(user) -> str:
    payload = {
        "uid": user["id"],
        "u": user["username"],
        "r": (user["role"] or "").lower(),
        "exp": int(time.time()) + SESSION_TTL_SECONDS,
    }
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def read_token(token: Optional[str]) -> Optional[dict]:
    """Returns the session payload, or None if the token is missing, forged or expired."""
    if not token or "." not in token:
        return None
    body, sig = token.rsplit(".", 1)
    expected = _b64(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(_unb64(body))
    except Exception:
        return None
    if payload.get("exp", 0) < time.time():
        return None
    return payload


def token_from_request(request) -> Optional[str]:
    auth = request.headers.get("authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return request.cookies.get(SESSION_COOKIE)


def set_session_cookie(response, token: str, request) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/",
    )


def telegram_webhook_secret() -> str:
    """Secret Telegram echoes back in X-Telegram-Bot-Api-Secret-Token on every webhook call."""
    return hmac.new(_secret(), b"telegram-webhook", hashlib.sha256).hexdigest()


def verify_telegram_init_data(init_data: str, bot_token: str, max_age_seconds: int = 24 * 3600) -> Optional[dict]:
    """
    Checks Telegram Mini App initData was signed by our bot and returns its `user`.
    https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    if not init_data or not bot_token:
        return None
    fields = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
    received_hash = fields.pop("hash", None)
    if not received_hash:
        return None
    check_string = "\n".join(f"{k}={v}" for k, v in sorted(fields.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received_hash):
        return None
    try:
        if time.time() - int(fields.get("auth_date", "0")) > max_age_seconds:
            return None
        return json.loads(fields.get("user", "null"))
    except Exception:
        return None
