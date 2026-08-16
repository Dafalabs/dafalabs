from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Project
from ..schemas import AdminProject, ProjectInput, ProjectText
from ..schemas import Project as ProjectOut
from .errors import Conflict, NotFound


def _admin_out(row: Project) -> AdminProject:
    return AdminProject(
        id=row.id,
        slug=row.slug,
        title_tr=row.title_tr,
        tagline_tr=row.tagline_tr,
        title_en=row.title_en,
        tagline_en=row.tagline_en,
        url=row.url,
        image_url=row.image_url,
        tags=list(row.tags or []),
        sort_order=row.sort_order,
        is_published=row.is_published,
    )


def _public_out(row: Project) -> ProjectOut:
    return ProjectOut(
        id=row.slug,
        image_url=row.image_url,
        tags=list(row.tags or []),
        url=row.url,
        tr=ProjectText(title=row.title_tr, tagline=row.tagline_tr),
        en=ProjectText(title=row.title_en, tagline=row.tagline_en),
    )


def published(session: Session) -> list[ProjectOut]:
    rows = session.scalars(
        select(Project)
        .where(Project.is_published.is_(True))
        .order_by(Project.sort_order, Project.id)
    ).all()
    return [_public_out(row) for row in rows]


def listing(session: Session) -> list[AdminProject]:
    rows = session.scalars(
        select(Project).order_by(Project.sort_order, Project.id)
    ).all()
    return [_admin_out(row) for row in rows]


def create(session: Session, payload: ProjectInput) -> AdminProject:
    if session.scalar(select(Project).where(Project.slug == payload.slug)):
        raise Conflict("That slug is already in use.")

    row = Project(**payload.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return _admin_out(row)


def update(session: Session, project_id: int, payload: ProjectInput) -> AdminProject:
    row = session.get(Project, project_id)
    if row is None:
        raise NotFound("Project not found.")

    clash = session.scalar(
        select(Project).where(Project.slug == payload.slug, Project.id != project_id)
    )
    if clash:
        raise Conflict("That slug is already in use.")

    for key, value in payload.model_dump().items():
        setattr(row, key, value)

    session.commit()
    session.refresh(row)
    return _admin_out(row)


def delete(session: Session, project_id: int) -> None:
    row = session.get(Project, project_id)
    if row is None:
        raise NotFound("Project not found.")

    session.delete(row)
    session.commit()


def find_by_slug(session: Session, slug: str) -> Project | None:
    return session.scalar(select(Project).where(Project.slug == slug))
