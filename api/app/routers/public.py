import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..config import (
    AUTO_REPLY_MAX,
    AUTO_REPLY_WINDOW,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW,
    TRACKING_MAX,
    TRACKING_WINDOW,
)
from ..database import SessionLocal, get_session
from ..deps import client_ip
from ..mail_service import (
    MailNotConfigured,
    check_config,
    send_auto_reply,
    send_contact_mail,
)
from ..rate_limit import auto_reply_limiter, contact_limiter, tracking_limiter
from ..schemas import (
    ContactForm,
    ContactResponse,
    PostDetail,
    PostSummary,
    SiteContent,
    TrackingStatus,
)
from ..services import messages as message_service
from ..services import posts as post_service
from ..services import projects as project_service
from ..services import settings as settings_service
from ..services.errors import ServiceError

logger = logging.getLogger("dafalabs-api")
router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/site", response_model=SiteContent)
def site(session: Session = Depends(get_session)) -> SiteContent:
    return SiteContent(
        contact=settings_service.contact(session),
        projects=project_service.published(session),
    )


@router.get("/yazilar", response_model=list[PostSummary])
def posts(
    locale: str = "tr", session: Session = Depends(get_session)
) -> list[PostSummary]:
    return post_service.published(session, locale if locale in ("tr", "en") else "tr")


@router.get("/yazilar/{slug}", response_model=PostDetail)
def post(
    slug: str, locale: str = "tr", session: Session = Depends(get_session)
) -> PostDetail:
    try:
        return post_service.detail(session, locale if locale in ("tr", "en") else "tr", slug)
    except ServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)


@router.post(
    "/iletisim", response_model=ContactResponse, status_code=status.HTTP_202_ACCEPTED
)
def contact(
    form: ContactForm,
    request: Request,
    tasks: BackgroundTasks,
    session: Session = Depends(get_session),
) -> ContactResponse:
    ip = client_ip(request)

    if form.is_bot:
        logger.warning("Honeypot triggered: %s", ip)
        return ContactResponse(tracking_code=None)

    if contact_limiter.hit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW):
        logger.warning("Rate limit exceeded: %s", ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
        )

    try:
        check_config()
    except MailNotConfigured:
        logger.exception("Mail configuration is incomplete")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The mail service is unavailable.",
        )

    record = message_service.record(session, form, ip)

    auto_reply_allowed = not auto_reply_limiter.hit(
        str(form.email).lower(), AUTO_REPLY_MAX, AUTO_REPLY_WINDOW
    )

    tasks.add_task(
        deliver_mails, record.id, form, record.tracking_code, auto_reply_allowed
    )

    return ContactResponse(tracking_code=record.tracking_code)


def deliver_mails(
    message_id: int, form: ContactForm, tracking_code: str, auto_reply_allowed: bool
) -> None:
    session = SessionLocal()

    try:
        send_contact_mail(form, tracking_code)
        message_service.mark_notified(session, message_id)
    except Exception as error:
        logger.exception("Notification mail failed: %s", form.email)
        message_service.mark_failed(session, message_id, str(error))

    if auto_reply_allowed:
        try:
            send_auto_reply(form, tracking_code)
            message_service.mark_replied(session, message_id)
        except Exception:
            logger.exception("Auto-reply failed: %s", form.email)
    else:
        logger.info("Auto-reply skipped (per-address limit): %s", form.email)

    session.close()


@router.get("/takip/{code}", response_model=TrackingStatus)
def tracking(
    code: str, request: Request, session: Session = Depends(get_session)
) -> TrackingStatus:
    if tracking_limiter.hit(client_ip(request), TRACKING_MAX, TRACKING_WINDOW):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many lookups."
        )

    try:
        return message_service.tracking(session, code)
    except ServiceError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message)
