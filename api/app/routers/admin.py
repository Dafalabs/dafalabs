import logging

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from ..config import MAX_UPLOAD_BYTES
from ..database import get_session
from ..deps import require_admin
from ..models import User
from ..schemas import (
    AdminMessage,
    AdminMessageList,
    AdminPost,
    AdminProject,
    AdminUser,
    PasswordResult,
    PostInput,
    ProjectInput,
    SettingItem,
    SettingsUpdate,
    StatusUpdate,
    UploadResult,
    UserCreated,
    UserInput,
    UserUpdate,
)
from ..services import media as media_service
from ..services import messages as message_service
from ..services import posts as post_service
from ..services import projects as project_service
from ..services import settings as settings_service
from ..services import users as user_service
from ..services.errors import ServiceError

logger = logging.getLogger("dafalabs-api")
router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


def _handle(error: ServiceError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.get("/messages", response_model=AdminMessageList)
def messages(
    session: Session = Depends(get_session),
    durum: str | None = None,
    ara: str | None = None,
    sayfa: int = 1,
) -> AdminMessageList:
    return message_service.listing(session, durum, ara, sayfa)


@router.patch("/messages/{message_id}", response_model=AdminMessage)
def update_message(
    message_id: int,
    update: StatusUpdate,
    session: Session = Depends(get_session),
) -> AdminMessage:
    try:
        return message_service.set_status(session, message_id, update.status)
    except ServiceError as error:
        raise _handle(error)


@router.get("/projects", response_model=list[AdminProject])
def projects(session: Session = Depends(get_session)) -> list[AdminProject]:
    return project_service.listing(session)


@router.post(
    "/projects", response_model=AdminProject, status_code=status.HTTP_201_CREATED
)
def create_project(
    payload: ProjectInput, session: Session = Depends(get_session)
) -> AdminProject:
    try:
        return project_service.create(session, payload)
    except ServiceError as error:
        raise _handle(error)


@router.patch("/projects/{project_id}", response_model=AdminProject)
def update_project(
    project_id: int, payload: ProjectInput, session: Session = Depends(get_session)
) -> AdminProject:
    try:
        return project_service.update(session, project_id, payload)
    except ServiceError as error:
        raise _handle(error)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int, session: Session = Depends(get_session)
) -> Response:
    try:
        project_service.delete(session, project_id)
    except ServiceError as error:
        raise _handle(error)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/posts", response_model=list[AdminPost])
def posts(session: Session = Depends(get_session)) -> list[AdminPost]:
    return post_service.listing(session)


@router.post("/posts", response_model=AdminPost, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostInput, session: Session = Depends(get_session)
) -> AdminPost:
    try:
        return post_service.create(session, payload)
    except ServiceError as error:
        raise _handle(error)


@router.patch("/posts/{post_id}", response_model=AdminPost)
def update_post(
    post_id: int, payload: PostInput, session: Session = Depends(get_session)
) -> AdminPost:
    try:
        return post_service.update(session, post_id, payload)
    except ServiceError as error:
        raise _handle(error)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, session: Session = Depends(get_session)) -> Response:
    try:
        post_service.delete(session, post_id)
    except ServiceError as error:
        raise _handle(error)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users", response_model=list[AdminUser])
def users(session: Session = Depends(get_session)) -> list[AdminUser]:
    return user_service.listing(session)


@router.post("/users", response_model=UserCreated, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserInput, session: Session = Depends(get_session)
) -> UserCreated:
    try:
        created = user_service.create(session, payload)
    except ServiceError as error:
        raise _handle(error)

    logger.info("Account created: %s (admin: %s)", created.email, created.is_admin)
    return created


@router.patch("/users/{user_id}", response_model=AdminUser)
def update_user(
    user_id: int,
    payload: UserUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> AdminUser:
    try:
        return user_service.update(session, user_id, payload, admin.id)
    except ServiceError as error:
        raise _handle(error)


@router.post("/users/{user_id}/password", response_model=PasswordResult)
def reset_password(
    user_id: int, session: Session = Depends(get_session)
) -> PasswordResult:
    try:
        password = user_service.reset_password(session, user_id)
    except ServiceError as error:
        raise _handle(error)

    logger.info("Password reset for user %s", user_id)
    return PasswordResult(password=password)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> Response:
    try:
        user_service.delete(session, user_id, admin.id)
    except ServiceError as error:
        raise _handle(error)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/settings", response_model=list[SettingItem])
def settings(session: Session = Depends(get_session)) -> list[SettingItem]:
    return settings_service.listing(session)


@router.put("/settings", response_model=list[SettingItem])
def save_settings(
    payload: SettingsUpdate, session: Session = Depends(get_session)
) -> list[SettingItem]:
    try:
        saved = settings_service.save(session, payload.values)
    except ServiceError as error:
        raise _handle(error)

    logger.info("Settings updated: %s", ", ".join(sorted(payload.values)))
    return saved


@router.post("/upload", response_model=UploadResult)
async def upload(file: UploadFile = File(...)) -> UploadResult:
    data = await file.read(MAX_UPLOAD_BYTES + 1)

    try:
        path = media_service.store(file.filename or "gorsel", data)
    except ServiceError as error:
        raise _handle(error)

    logger.info("Image uploaded: %s (%s bytes)", path, len(data))
    return UploadResult(image_url=path)
