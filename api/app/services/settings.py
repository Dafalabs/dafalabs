from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Setting
from ..schemas import SettingItem, SiteContact
from .errors import Invalid

KEYS = (
    "email",
    "phone",
    "location",
    "social_github",
    "social_linkedin",
    "social_instagram",
    "social_x",
)

SOCIAL_LABELS = {
    "social_github": "GitHub",
    "social_linkedin": "LinkedIn",
    "social_instagram": "Instagram",
    "social_x": "X",
}

DEFAULT_EMAIL = "hello@dafalabs.com"


def _clean(value: str | None) -> str | None:
    trimmed = (value or "").strip()
    return trimmed or None


def resolve(session: Session) -> dict[str, str | None]:
    stored = {row.key: row.value for row in session.scalars(select(Setting)).all()}

    return {key: _clean(stored.get(key)) for key in KEYS}


def contact(session: Session) -> SiteContact:
    values = resolve(session)

    return SiteContact(
        email=values["email"] or DEFAULT_EMAIL,
        phone=values["phone"],
        location=values["location"],
        socials=[
            {"name": label, "href": values[key]}
            for key, label in SOCIAL_LABELS.items()
            if values[key]
        ],
    )


def listing(session: Session) -> list[SettingItem]:
    stored = {row.key for row in session.scalars(select(Setting)).all()}
    values = resolve(session)

    return [
        SettingItem(
            key=key,
            value=values[key] or "",
            source="db" if key in stored else "env",
        )
        for key in KEYS
    ]


def save(session: Session, values: dict[str, str]) -> list[SettingItem]:
    unknown = set(values) - set(KEYS)
    if unknown:
        raise Invalid(f"Unknown setting: {', '.join(sorted(unknown))}")

    for key, value in values.items():
        cleaned = value.strip()
        row = session.get(Setting, key)

        if not cleaned:
            if row is not None:
                session.delete(row)
            continue

        if row is None:
            session.add(Setting(key=key, value=cleaned))
        else:
            row.value = cleaned

    session.commit()
    return listing(session)
