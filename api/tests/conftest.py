import os
import tempfile

TEST_DIR = tempfile.mkdtemp(prefix="dafalabs-test-")
DB_PATH = os.path.join(TEST_DIR, "test.db")
os.environ.setdefault("MEDIA_DIR", os.path.join(TEST_DIR, "media"))
os.environ.setdefault("SQLALCHEMY_DATABASE_URL", f"sqlite:///{DB_PATH}")
os.environ.setdefault("SMTP_SERVER", "mail.example.com")
os.environ.setdefault("SMTP_PORT", "587")
os.environ.setdefault("SENDER_EMAIL", "noreply@dafalabs.com")
os.environ.setdefault("SENDER_MAIL_PASSWORD", "test")
os.environ.setdefault("RECIPIENT_EMAIL", "kutu@dafalabs.com")
os.environ.setdefault("SESSION_SECRET", "test-secret-key-that-is-long-enough-000000")
os.environ.setdefault("COOKIE_SECURE", "0")
os.environ.setdefault("RATE_LIMIT_MAX", "50")
os.environ.setdefault("LOGIN_MAX", "50")

import pytest
from fastapi.testclient import TestClient

from app import rate_limit
from app import main as main_module
from app.database import Base, SessionLocal, engine
from app.models import Project, User
from app.security import hash_password

@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    rate_limit.reset_all()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sent(monkeypatch):
    notifications: list[tuple] = []
    replies: list[tuple] = []

    from app.routers import public as public_router

    monkeypatch.setattr(
        public_router,
        "send_contact_mail",
        lambda form, code=None: notifications.append((form, code)),
    )
    monkeypatch.setattr(
        public_router,
        "send_auto_reply",
        lambda form, code: replies.append((form, code)),
    )

    return {"notifications": notifications, "replies": replies}


@pytest.fixture
def client(sent):
    with TestClient(main_module.app) as test_client:
        test_client.sent = sent
        yield test_client


@pytest.fixture
def user():
    session = SessionLocal()
    record = User(
        email="musteri@example.com",
        name="Örnek Müşteri",
        redirect_url="https://panel.dafalabs.com/musteri",
        password_hash=hash_password("cokGizliParola1"),
    )
    session.add(record)
    session.commit()
    session.close()
    return record


@pytest.fixture
def projeler():
    session = SessionLocal()
    session.add_all(
        [
            Project(
                slug="ornek-bir",
                image_url="/media/ornek-bir.jpg",
                tags=["Flutter"],
                url="https://ornek.com/bir",
                title_tr="Örnek Bir",
                tagline_tr="Birinci örnek proje.",
                title_en="Example One",
                tagline_en="First example project.",
                sort_order=1,
            ),
            Project(
                slug="ornek-iki",
                tags=["Web"],
                url=None,
                title_tr="Örnek İki",
                tagline_tr="İkinci örnek proje.",
                title_en="Example Two",
                tagline_en="Second example project.",
                sort_order=2,
            ),
            Project(
                slug="gizli",
                tags=[],
                title_tr="Gizli",
                tagline_tr="Yayında olmayan proje.",
                title_en="Hidden",
                tagline_en="Unpublished project.",
                sort_order=3,
                is_published=False,
            ),
        ]
    )
    session.commit()
    session.close()


@pytest.fixture
def admin():
    session = SessionLocal()
    record = User(
        email="admin@dafalabs.com",
        name="Yönetici",
        redirect_url="",
        password_hash=hash_password("yoneticiParola1"),
        is_admin=True,
    )
    session.add(record)
    session.commit()
    session.close()
    return record
