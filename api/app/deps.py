from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from .config import COOKIE_NAME
from .database import get_session
from .models import User
from .security import read_session_token


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "bilinmiyor"


def current_user(
    request: Request, session: Session = Depends(get_session)
) -> User:
    token = request.cookies.get(COOKIE_NAME)
    payload = read_session_token(token) if token else None

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not signed in."
        )

    user = session.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is no longer valid."
        )

    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed."
        )
    return user
