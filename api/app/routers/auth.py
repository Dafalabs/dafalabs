import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from ..config import COOKIE_NAME, COOKIE_SECURE, LOGIN_MAX, LOGIN_WINDOW, SESSION_HOURS
from ..database import get_session
from ..deps import client_ip, current_user
from ..models import User
from ..rate_limit import login_limiter
from ..schemas import LoginForm, LoginResponse
from ..security import SessionNotConfigured, create_session_token
from ..services import users as user_service

logger = logging.getLogger("dafalabs-api")
router = APIRouter(prefix="/auth")


@router.post("/login", response_model=LoginResponse)
def login(
    form: LoginForm,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
) -> LoginResponse:
    ip = client_ip(request)

    if login_limiter.hit(ip, LOGIN_MAX, LOGIN_WINDOW):
        logger.warning("Login rate limit exceeded: %s", ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please try again shortly.",
        )

    user = user_service.authenticate(session, str(form.email), form.password)

    if user is None:
        logger.info("Failed login: %s (%s)", form.email, ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )

    try:
        token = create_session_token(user.id, user.email)
    except SessionNotConfigured:
        logger.exception("SESSION_SECRET is missing")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The session service is not configured.",
        )

    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=SESSION_HOURS * 3600,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        path="/",
    )

    return LoginResponse(
        name=user.name, redirect_url=user.redirect_url, is_admin=user.is_admin
    )


@router.post("/logout")
def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(current_user)) -> dict[str, str]:
    return {
        "name": user.name,
        "email": user.email,
        "redirect_url": user.redirect_url,
        "is_admin": str(user.is_admin).lower(),
    }
