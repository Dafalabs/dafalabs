import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr, formatdate
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .config import (
    RECIPIENT_EMAIL,
    SENDER_EMAIL,
    SENDER_MAIL_PASSWORD,
    SITE_URL,
    SMTP_PORT,
    SMTP_SERVER,
)
from .schemas import ContactForm

logger = logging.getLogger(__name__)

templates = Environment(
    loader=FileSystemLoader(Path(__file__).parent / "templates"),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)

COPY = {
    "tr": {
        "subject": "Mesajınızı aldık — dafalabs",
        "heading": "Mesajınızı aldık.",
        "greeting": "Merhaba {name},",
        "body": "Mesajınız bize ulaştı ve sıraya alındı. Genelde 24 saat içinde dönüş yapıyoruz.",
        "code_label": "Takip kodunuz",
        "cta": "Durumu sorgula",
        "footer": "Bu otomatik bir bilgilendirme mesajıdır. Yanıtlarsanız bize ulaşır.",
        "tracking_path": "/tr/takip",
    },
    "en": {
        "subject": "We received your message — dafalabs",
        "heading": "We received your message.",
        "greeting": "Hi {name},",
        "body": "Your message reached us and is in the queue. We usually reply within 24 hours.",
        "code_label": "Your tracking code",
        "cta": "Check status",
        "footer": "This is an automated confirmation. Replies still reach us.",
        "tracking_path": "/en/tracking",
    },
}


class MailNotConfigured(RuntimeError):
    pass


def check_config() -> None:
    missing = [
        name
        for name, value in (
            ("SMTP_SERVER", SMTP_SERVER),
            ("SENDER_EMAIL", SENDER_EMAIL),
            ("SENDER_MAIL_PASSWORD", SENDER_MAIL_PASSWORD),
            ("RECIPIENT_EMAIL", RECIPIENT_EMAIL),
        )
        if not value
    ]
    if missing:
        raise MailNotConfigured(f"Missing environment variables: {', '.join(missing)}")


def _copy_for(locale: str) -> dict[str, str]:
    return COPY.get(locale, COPY["tr"])


def _build_notification(form: ContactForm, tracking_code: str | None) -> EmailMessage:
    subject = form.subject or "Konu belirtilmedi"

    message = EmailMessage()
    message["Subject"] = f"[dafalabs.com] {subject}"
    message["From"] = formataddr(("dafalabs.com iletişim formu", SENDER_EMAIL))
    message["To"] = RECIPIENT_EMAIL
    message["Date"] = formatdate(localtime=True)
    message["Reply-To"] = formataddr((form.name, str(form.email)))

    rows = [
        ("Gönderen", form.name),
        ("E-posta", str(form.email)),
        ("Konu", subject),
        ("Dil", "Türkçe" if form.locale == "tr" else "İngilizce"),
        ("Takip", tracking_code or "-"),
    ]

    message.set_content(
        "dafalabs.com iletişim formundan yeni mesaj\n"
        + "-" * 44
        + "\n\n"
        + "\n".join(f"{label}: {value}" for label, value in rows)
        + f"\n\nMesaj:\n{form.message}\n"
    )

    message.add_alternative(
        templates.get_template("notification.html").render(
            locale="tr",
            subject=f"[dafalabs.com] {subject}",
            subject_line=subject,
            rows=rows,
            message=form.message,
            reply_url=f"mailto:{form.email}?subject=Re: {subject}",
            panel_url=f"{SITE_URL}/tr/panel",
        ),
        subtype="html",
    )

    return message


def _build_auto_reply(form: ContactForm, tracking_code: str) -> EmailMessage:
    copy = _copy_for(form.locale)
    tracking_url = f"{SITE_URL}{copy['tracking_path']}"
    greeting = copy["greeting"].format(name=form.name)

    message = EmailMessage()
    message["Subject"] = copy["subject"]
    message["From"] = formataddr(("dafalabs", SENDER_EMAIL))
    message["To"] = formataddr((form.name, str(form.email)))
    message["Date"] = formatdate(localtime=True)
    message["Reply-To"] = RECIPIENT_EMAIL
    message["Auto-Submitted"] = "auto-replied"
    message["X-Auto-Response-Suppress"] = "All"

    message.set_content(
        f"{greeting}\n\n"
        f"{copy['body']}\n\n"
        f"{copy['code_label']}: {tracking_code}\n"
        f"{tracking_url}\n\n"
        f"{copy['footer']}\n\n"
        f"dafalabs\n{SITE_URL}\n"
    )

    message.add_alternative(
        templates.get_template("auto_reply.html").render(
            locale=form.locale,
            subject=copy["subject"],
            t={**copy, "greeting": greeting},
            code=tracking_code,
            tracking_url=tracking_url,
            site_url=SITE_URL,
        ),
        subtype="html",
    )

    return message


def send_contact_mail(form: ContactForm, tracking_code: str | None = None) -> None:
    check_config()
    _deliver(_build_notification(form, tracking_code))
    logger.info("Contact mail sent: %s", form.email)


def send_auto_reply(form: ContactForm, tracking_code: str) -> None:
    check_config()
    _deliver(_build_auto_reply(form, tracking_code))
    logger.info("Auto-reply sent: %s", form.email)


def _deliver(message: EmailMessage) -> None:
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=20) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_MAIL_PASSWORD)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(SENDER_EMAIL, SENDER_MAIL_PASSWORD)
            smtp.send_message(message)
