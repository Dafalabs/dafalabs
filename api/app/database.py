from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL

SQLALCHEMY_DATABASE_URL = DATABASE_URL

engine = (
    create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
    if SQLALCHEMY_DATABASE_URL
    else None
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_session():
    if engine is None:
        raise RuntimeError("SQLALCHEMY_DATABASE_URL is not set")

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
