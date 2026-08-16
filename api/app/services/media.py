import re
import secrets
from pathlib import Path

from ..config import MAX_UPLOAD_BYTES, MEDIA_DIR
from .errors import Invalid, ServiceError

ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

SIGNATURES = (
    (b"\xff\xd8\xff", {".jpg", ".jpeg"}),
    (b"\x89PNG\r\n\x1a\n", {".png"}),
    (b"GIF87a", {".gif"}),
    (b"GIF89a", {".gif"}),
)

TURKISH_MAP = str.maketrans(
    {
        "ç": "c", "Ç": "c", "ğ": "g", "Ğ": "g", "ı": "i", "İ": "i",
        "ö": "o", "Ö": "o", "ş": "s", "Ş": "s", "ü": "u", "Ü": "u",
    }
)


def slugify(value: str) -> str:
    lowered = value.translate(TURKISH_MAP).lower()
    return re.sub(r"[^a-z0-9-]+", "-", lowered).strip("-")


def looks_like_image(data: bytes, suffix: str) -> bool:
    for signature, suffixes in SIGNATURES:
        if data.startswith(signature):
            return suffix in suffixes

    if suffix == ".webp":
        return data[:4] == b"RIFF" and data[8:12] == b"WEBP"

    return False


def store(filename: str, data: bytes, directory: Path | None = None) -> str:
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_SUFFIXES:
        raise Invalid(
            f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_SUFFIXES))}"
        )

    if len(data) > MAX_UPLOAD_BYTES:
        raise ServiceError("File exceeds the 5 MB limit.", 413)

    if not looks_like_image(data, suffix):
        raise Invalid("File content does not look like an image.")

    target = directory or MEDIA_DIR
    base = slugify(Path(filename).stem) or "gorsel"
    name = f"{base}-{secrets.token_hex(4)}{suffix}"

    try:
        target.mkdir(parents=True, exist_ok=True)
        (target / name).write_bytes(data)
    except OSError as error:
        raise ServiceError("Could not save the image.", 503) from error

    return f"/media/{name}"
