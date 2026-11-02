import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.parse

PBKDF2_ITERATIONS = 310000
SESSION_TTL_SECONDS = 12 * 60 * 60


def hash_password(password: str) -> str:
    """
    Hashes a password with PBKDF2-HMAC-SHA256 and a random salt.
    Format returned: pbkdf2$iterations$salt$hex_hash
    """
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS).hex()
    return f"pbkdf2${PBKDF2_ITERATIONS}${salt}${h}"


def verify_password(password: str, hashed: str) -> bool:
    """
    Verifies a plain text password against the stored hash.
    Accepts both the PBKDF2 format and the legacy salt:sha256 format.
    """
    if not hashed:
        return False
    if hashed.startswith("pbkdf2$"):
        try:
            _, iterations, salt, h = hashed.split("$", 3)
            calc = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), int(iterations)).hex()
        except Exception:
            return False
        return hmac.compare_digest(calc, h)
    if ":" not in hashed:
        return False
    salt, h = hashed.split(":", 1)
    return hmac.compare_digest(hashlib.sha256((password + salt).encode()).hexdigest(), h)


def needs_rehash(hashed: str) -> bool:
    return not (hashed or "").startswith("pbkdf2$")


def generate_otp() -> str:
    return f"{secrets.randbelow(1000000):06d}"


_fallback_secret = None


def _session_secret() -> bytes:
    """
    SESSION_SECRET should be set in the environment. If it is missing, derive a
    stable secret from other server-only secrets so all serverless instances agree.
    """
    global _fallback_secret
    s = os.getenv("SESSION_SECRET")
    if s:
        return s.encode()
    if _fallback_secret is None:
        seed = (os.getenv("SUPABASE_DB_URL") or "") + (os.getenv("DATABASE_URL") or "") + (os.getenv("TELEGRAM_BOT_TOKEN") or "")
        if seed:
            print("WARNING: SESSION_SECRET not set; deriving session key from other secrets. Set SESSION_SECRET.")
            _fallback_secret = hashlib.sha256(("nssf-session:" + seed).encode()).digest()
        else:
            print("WARNING: SESSION_SECRET not set; sessions will not survive a restart.")
            _fallback_secret = secrets.token_bytes(32)
    return _fallback_secret


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_session_token(user) -> str:
    payload = {
        "uid": user["id"],
        "u": user["username"],
        "n": user["full_name"] or user["username"],
        "r": user["role"],
        "exp": int(time.time()) + SESSION_TTL_SECONDS,
    }
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64(hmac.new(_session_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def verify_session_token(token: str):
    """Returns the session payload dict, or None when the token is invalid or expired."""
    if not token or "." not in token:
        return None
    body, sig = token.rsplit(".", 1)
    expected = _b64(hmac.new(_session_secret(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(_unb64(body))
    except Exception:
        return None
    if int(payload.get("exp", 0)) < time.time():
        return None
    return payload


def telegram_webhook_secret(bot_token: str) -> str:
    """Secret sent to Telegram's setWebhook and echoed back in X-Telegram-Bot-Api-Secret-Token."""
    explicit = os.getenv("TELEGRAM_WEBHOOK_SECRET")
    if explicit:
        return explicit
    return hashlib.sha256(("nssf-webhook:" + (bot_token or "")).encode()).hexdigest()


def verify_telegram_init_data(init_data: str, bot_token: str, max_age_seconds: int = 86400):
    """
    Validates Telegram WebApp initData as described in
    https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    Returns the Telegram user dict, or None when the data is not authentic.
    """
    if not init_data or not bot_token:
        return None
    try:
        pairs = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
    except Exception:
        return None
    received_hash = pairs.pop("hash", None)
    if not received_hash:
        return None
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(pairs.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calc = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(calc, received_hash):
        return None
    try:
        if time.time() - int(pairs.get("auth_date", "0")) > max_age_seconds:
            return None
        return json.loads(pairs.get("user", "{}"))
    except Exception:
        return None
