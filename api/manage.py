import argparse
import sys

from app.database import Base, SessionLocal, engine
from app.schemas import UserInput
from app.services import users as user_service
from app.services.errors import ServiceError


def list_users(session) -> None:
    rows = user_service.listing(session)

    if not rows:
        print("No accounts yet")
        return

    for row in rows:
        role = "admin" if row.is_admin else "client"
        state = "" if row.is_active else "  [inactive]"
        seen = row.last_login_at.strftime("%Y-%m-%d %H:%M") if row.last_login_at else "never"
        print(f"{row.id:>3}  {row.email:<32} {role:<7} last login: {seen}{state}")


def create_admin(session, args) -> None:
    payload = UserInput(
        email=args.email,
        name=args.name,
        redirect_url="",
        is_admin=True,
        is_active=True,
        password=args.password,
    )

    created = user_service.create(session, payload)

    print(f"Admin account created: {created.email}")
    print(f"Password: {created.password}")
    print("Sign in at /tr/giris — you will be taken to the panel.")


def reset_password(session, args) -> None:
    user = user_service.find_by_email(session, args.email)
    if user is None:
        print(f"Not found: {args.email}", file=sys.stderr)
        raise SystemExit(1)

    password = user_service.reset_password(session, user.id)
    print(f"Password reset: {user.email}")
    print(f"New password: {password}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="dafalabs maintenance commands. Everything else is in the admin panel."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("users", help="list accounts")

    admin = sub.add_parser("create-admin", help="create the first admin account")
    admin.add_argument("email")
    admin.add_argument("name")
    admin.add_argument("--password", default=None)

    reset = sub.add_parser("reset-password", help="reset a password when locked out")
    reset.add_argument("email")

    args = parser.parse_args()

    if engine is None:
        print("SQLALCHEMY_DATABASE_URL is not set", file=sys.stderr)
        return 1

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()

    try:
        if args.command == "users":
            list_users(session)
        elif args.command == "create-admin":
            create_admin(session, args)
        else:
            reset_password(session, args)
    except ServiceError as error:
        print(error.message, file=sys.stderr)
        return 1
    finally:
        session.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
