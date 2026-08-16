from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import User
from ..schemas import AdminUser, UserCreated, UserInput, UserUpdate
from ..security import hash_password, random_password, verify_password
from .errors import Conflict, NotFound


def _out(row: User) -> AdminUser:
    return AdminUser(
        id=row.id,
        email=row.email,
        name=row.name,
        redirect_url=row.redirect_url or "",
        is_admin=row.is_admin,
        is_active=row.is_active,
        created_at=row.created_at,
        last_login_at=row.last_login_at,
    )


def listing(session: Session) -> list[AdminUser]:
    return [_out(row) for row in session.scalars(select(User).order_by(User.id)).all()]


def find_by_email(session: Session, email: str) -> User | None:
    return session.scalar(select(User).where(User.email == email.strip().lower()))


def create(session: Session, payload: UserInput) -> UserCreated:
    email = str(payload.email).strip().lower()

    if find_by_email(session, email):
        raise Conflict("That email is already registered.")

    password = payload.password or random_password()
    row = User(
        email=email,
        name=payload.name.strip(),
        redirect_url=payload.redirect_url.strip(),
        is_admin=payload.is_admin,
        is_active=payload.is_active,
        password_hash=hash_password(password),
    )
    session.add(row)
    session.commit()
    session.refresh(row)

    return UserCreated(**_out(row).model_dump(), password=password)


def update(
    session: Session, user_id: int, payload: UserUpdate, acting_user_id: int
) -> AdminUser:
    row = session.get(User, user_id)
    if row is None:
        raise NotFound("Account not found.")

    if row.id == acting_user_id and (not payload.is_admin or not payload.is_active):
        raise Conflict("You cannot remove your own admin access.")

    row.name = payload.name.strip()
    row.redirect_url = payload.redirect_url.strip()
    row.is_admin = payload.is_admin
    row.is_active = payload.is_active
    session.commit()
    session.refresh(row)

    return _out(row)


def reset_password(session: Session, user_id: int) -> str:
    row = session.get(User, user_id)
    if row is None:
        raise NotFound("Account not found.")

    password = random_password()
    row.password_hash = hash_password(password)
    session.commit()
    return password


def delete(session: Session, user_id: int, acting_user_id: int) -> None:
    row = session.get(User, user_id)
    if row is None:
        raise NotFound("Account not found.")

    if row.id == acting_user_id:
        raise Conflict("You cannot delete your own account.")

    session.delete(row)
    session.commit()


def authenticate(session: Session, email: str, password: str) -> User | None:
    user = find_by_email(session, email)

    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        return None

    user.last_login_at = datetime.now(timezone.utc)
    session.commit()
    return user
