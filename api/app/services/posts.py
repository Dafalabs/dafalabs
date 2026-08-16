from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Post
from ..schemas import AdminPost, PostDetail, PostInput, PostSummary
from .errors import Conflict, NotFound

WORDS_PER_MINUTE = 200


def available_locales(row: Post) -> list[str]:
    locales = []
    if row.title_tr.strip() and row.body_tr.strip():
        locales.append("tr")
    if row.title_en.strip() and row.body_en.strip():
        locales.append("en")
    return locales


def reading_minutes(body: str) -> int:
    words = len(body.split())
    return max(1, round(words / WORDS_PER_MINUTE))


def _fields(row: Post, locale: str) -> tuple[str, str, str]:
    if locale == "en":
        return row.title_en, row.excerpt_en, row.body_en
    return row.title_tr, row.excerpt_tr, row.body_tr


def _summary(row: Post, locale: str) -> PostSummary:
    title, excerpt, body = _fields(row, locale)
    return PostSummary(
        slug=row.slug,
        title=title,
        excerpt=excerpt,
        cover_image=row.cover_image,
        tags=list(row.tags or []),
        published_at=row.published_at,
        reading_minutes=reading_minutes(body),
        locales=available_locales(row),
    )


def published(session: Session, locale: str) -> list[PostSummary]:
    rows = session.scalars(
        select(Post)
        .where(Post.is_published.is_(True))
        .order_by(Post.published_at.desc().nullslast(), Post.id.desc())
    ).all()

    return [_summary(row, locale) for row in rows if locale in available_locales(row)]


def detail(session: Session, locale: str, slug: str) -> PostDetail:
    row = session.scalar(
        select(Post).where(Post.slug == slug, Post.is_published.is_(True))
    )

    if row is None:
        raise NotFound("Post not found.")

    if locale not in available_locales(row):
        raise NotFound("Post is not available in this language.")

    title, excerpt, body = _fields(row, locale)
    return PostDetail(
        **_summary(row, locale).model_dump(),
        body=body,
    )


def _admin_out(row: Post) -> AdminPost:
    return AdminPost(
        id=row.id,
        slug=row.slug,
        title_tr=row.title_tr,
        excerpt_tr=row.excerpt_tr,
        body_tr=row.body_tr,
        title_en=row.title_en,
        excerpt_en=row.excerpt_en,
        body_en=row.body_en,
        cover_image=row.cover_image,
        tags=list(row.tags or []),
        is_published=row.is_published,
        published_at=row.published_at,
        locales=available_locales(row),
    )


def listing(session: Session) -> list[AdminPost]:
    rows = session.scalars(
        select(Post).order_by(Post.published_at.desc().nullslast(), Post.id.desc())
    ).all()
    return [_admin_out(row) for row in rows]


def create(session: Session, payload: PostInput) -> AdminPost:
    if session.scalar(select(Post).where(Post.slug == payload.slug)):
        raise Conflict("That slug is already in use.")

    row = Post(**payload.model_dump())
    if payload.is_published:
        row.published_at = datetime.now(timezone.utc)

    session.add(row)
    session.commit()
    session.refresh(row)
    return _admin_out(row)


def update(session: Session, post_id: int, payload: PostInput) -> AdminPost:
    row = session.get(Post, post_id)
    if row is None:
        raise NotFound("Post not found.")

    clash = session.scalar(
        select(Post).where(Post.slug == payload.slug, Post.id != post_id)
    )
    if clash:
        raise Conflict("That slug is already in use.")

    was_published = row.is_published

    for key, value in payload.model_dump().items():
        setattr(row, key, value)

    if payload.is_published and not was_published and row.published_at is None:
        row.published_at = datetime.now(timezone.utc)

    session.commit()
    session.refresh(row)
    return _admin_out(row)


def delete(session: Session, post_id: int) -> None:
    row = session.get(Post, post_id)
    if row is None:
        raise NotFound("Post not found.")

    session.delete(row)
    session.commit()
