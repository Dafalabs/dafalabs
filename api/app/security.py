import secrets
import string
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from .config import COOKIE_NAME, SESSION_HOURS, SESSION_SECRET

__all__ = ["COOKIE_NAME", "SESSION_HOURS"]

TRACKING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def make_tracking_code() -> str:
    body = "".join(secrets.choice(TRACKING_ALPHABET) for _ in range(8))
    return f"DL-{body[:4]}-{body[4:]}"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


class SessionNotConfigured(RuntimeError):
    pass


def _secret() -> str:
    if not SESSION_SECRET or len(SESSION_SECRET) < 32:
        raise SessionNotConfigured(
            "SESSION_SECRET is missing or shorter than 32 characters"
        )
    return SESSION_SECRET


def create_session_token(user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": now,
        "exp": now + timedelta(hours=SESSION_HOURS),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def read_session_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, _secret(), algorithms=["HS256"])
    except (jwt.InvalidTokenError, SessionNotConfigured):
        return None


def random_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))
