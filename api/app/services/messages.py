from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..config import PAGE_SIZE
from ..models import ContactMessage
from ..schemas import (
    MESSAGE_STATUSES,
    AdminMessage,
    AdminMessageList,
    ContactForm,
    TrackingStatus,
)
from ..security import make_tracking_code
from .errors import Invalid, NotFound


def record(session: Session, form: ContactForm, ip: str) -> ContactMessage:
    row = ContactMessage(
        tracking_code=make_tracking_code(),
        name=form.name,
        email=str(form.email),
        subject=form.subject,
        message=form.message,
        ip=ip,
        locale=form.locale,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def tracking(session: Session, code: str) -> TrackingStatus:
    row = session.scalar(
        select(ContactMessage).where(
            ContactMessage.tracking_code == code.strip().upper()
        )
    )

    if row is None:
        raise NotFound("No record found for this code.")

    return TrackingStatus(
        tracking_code=row.tracking_code,
        status=row.status,
        created_at=row.created_at,
        answered_at=row.answered_at,
    )


def listing(
    session: Session,
    status_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
) -> AdminMessageList:
    query = select(ContactMessage)

    if status_filter in MESSAGE_STATUSES:
        query = query.where(ContactMessage.status == status_filter)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                ContactMessage.name.ilike(pattern),
                ContactMessage.email.ilike(pattern),
                ContactMessage.subject.ilike(pattern),
                ContactMessage.message.ilike(pattern),
                ContactMessage.tracking_code.ilike(pattern),
            )
        )

    total = session.scalar(select(func.count()).select_from(query.subquery())) or 0
    page = max(1, page)

    rows = session.scalars(
        query.order_by(ContactMessage.id.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
    ).all()

    counts = dict(
        session.execute(
            select(ContactMessage.status, func.count()).group_by(ContactMessage.status)
        ).all()
    )

    return AdminMessageList(
        items=[AdminMessage.model_validate(row, from_attributes=True) for row in rows],
        total=total,
        page=page,
        pages=max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE),
        counts={key: counts.get(key, 0) for key in MESSAGE_STATUSES},
    )


def set_status(session: Session, message_id: int, status_value: str) -> AdminMessage:
    if status_value not in MESSAGE_STATUSES:
        raise Invalid(
            f"Invalid status. Allowed values: {', '.join(MESSAGE_STATUSES)}"
        )

    row = session.get(ContactMessage, message_id)
    if row is None:
        raise NotFound("Message not found.")

    row.status = status_value
    if status_value == "answered" and row.answered_at is None:
        row.answered_at = datetime.now(timezone.utc)

    session.commit()
    session.refresh(row)
    return AdminMessage.model_validate(row, from_attributes=True)


def mark_notified(session: Session, message_id: int) -> None:
    row = session.get(ContactMessage, message_id)
    if row:
        row.notified_at = datetime.now(timezone.utc)
        session.commit()


def mark_replied(session: Session, message_id: int) -> None:
    row = session.get(ContactMessage, message_id)
    if row:
        row.replied_at = datetime.now(timezone.utc)
        session.commit()


def mark_failed(session: Session, message_id: int, error: str) -> None:
    row = session.get(ContactMessage, message_id)
    if row:
        row.mail_error = error[:500]
        session.commit()
