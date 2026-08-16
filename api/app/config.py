import os
from pathlib import Path


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except ValueError:
        return default


DATABASE_URL = os.environ.get("SQLALCHEMY_DATABASE_URL", "")

SMTP_SERVER = os.environ.get("SMTP_SERVER", "")
SMTP_PORT = _int("SMTP_PORT", 587)
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "")
SENDER_MAIL_PASSWORD = os.environ.get("SENDER_MAIL_PASSWORD", "")
RECIPIENT_EMAIL = os.environ.get("RECIPIENT_EMAIL", "")

SITE_URL = os.environ.get("SITE_URL", "https://dafalabs.com").rstrip("/")
MEDIA_DIR = Path(os.environ.get("MEDIA_DIR", "/media"))

SESSION_SECRET = os.environ.get("SESSION_SECRET", "")
SESSION_HOURS = _int("SESSION_HOURS", 72)
COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "1") != "0"
COOKIE_NAME = "dafalabs_session"

RATE_LIMIT_MAX = _int("RATE_LIMIT_MAX", 5)
RATE_LIMIT_WINDOW = _int("RATE_LIMIT_WINDOW", 3600)
AUTO_REPLY_MAX = _int("AUTO_REPLY_MAX", 2)
AUTO_REPLY_WINDOW = _int("AUTO_REPLY_WINDOW", 86400)
LOGIN_MAX = _int("LOGIN_MAX", 8)
LOGIN_WINDOW = _int("LOGIN_WINDOW", 900)
TRACKING_MAX = _int("TRACKING_MAX", 30)
TRACKING_WINDOW = _int("TRACKING_WINDOW", 3600)

PAGE_SIZE = 20
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
