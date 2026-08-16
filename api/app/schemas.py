from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactForm(BaseModel):

    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    message: str = Field(min_length=10, max_length=4000)
    subject: str | None = Field(default=None, max_length=120)

    website: str | None = Field(default=None, max_length=200)
    locale: str = Field(default="tr", pattern="^(tr|en)$")

    @field_validator("name", "message", "subject")
    @classmethod
    def strip_whitespace(cls, value: str | None) -> str | None:
        return value.strip() if value else value

    @field_validator("name", "message")
    @classmethod
    def reject_blank(cls, value: str) -> str:
        if not value:
            raise ValueError("This field cannot be empty")
        return value

    @property
    def is_bot(self) -> bool:
        return bool(self.website and self.website.strip())

class ContactResponse(BaseModel):
    ok: bool = True
    tracking_code: str | None = None

MESSAGE_STATUSES = ("received", "reviewing", "answered", "closed")


class TrackingStatus(BaseModel):
    tracking_code: str
    status: str
    created_at: datetime
    answered_at: datetime | None = None

class LoginForm(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)

class LoginResponse(BaseModel):
    ok: bool = True
    name: str
    redirect_url: str
    is_admin: bool = False


class AdminMessage(BaseModel):
    id: int
    tracking_code: str
    name: str
    email: str
    subject: str | None
    message: str
    status: str
    created_at: datetime
    answered_at: datetime | None
    notified_at: datetime | None
    replied_at: datetime | None
    mail_error: str | None


class AdminMessageList(BaseModel):
    items: list[AdminMessage]
    total: int
    page: int
    pages: int
    counts: dict[str, int]


class StatusUpdate(BaseModel):
    status: str

class Social(BaseModel):
    name: str
    href: str

class SiteContact(BaseModel):
    email: str
    phone: str | None = None
    location: str | None = None
    socials: list[Social] = []

class ProjectText(BaseModel):
    title: str
    tagline: str

class Project(BaseModel):
    id: str
    image_url: str | None = None
    tags: list[str] = []
    url: str | None = None
    tr: ProjectText
    en: ProjectText

class SiteContent(BaseModel):
    contact: SiteContact
    projects: list[Project]


class ProjectInput(BaseModel):
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")
    title_tr: str = Field(min_length=1, max_length=160)
    tagline_tr: str = Field(min_length=1, max_length=600)
    title_en: str = Field(min_length=1, max_length=160)
    tagline_en: str = Field(min_length=1, max_length=600)
    url: str | None = Field(default=None, max_length=500)
    image_url: str | None = Field(default=None, max_length=500)
    tags: list[str] = []
    sort_order: int = 0
    is_published: bool = True


class AdminProject(ProjectInput):
    id: int


class UploadResult(BaseModel):
    image_url: str


class UserInput(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2, max_length=120)
    redirect_url: str = Field(default="", max_length=500)
    is_admin: bool = False
    is_active: bool = True
    password: str | None = Field(default=None, min_length=8, max_length=200)


class UserUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    redirect_url: str = Field(default="", max_length=500)
    is_admin: bool = False
    is_active: bool = True


class AdminUser(BaseModel):
    id: int
    email: str
    name: str
    redirect_url: str
    is_admin: bool
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None


class UserCreated(AdminUser):
    password: str


class PasswordResult(BaseModel):
    password: str


class SettingItem(BaseModel):
    key: str
    value: str
    source: str


class SettingsUpdate(BaseModel):
    values: dict[str, str]


class PostSummary(BaseModel):
    slug: str
    title: str
    excerpt: str
    cover_image: str | None = None
    tags: list[str] = []
    published_at: datetime | None = None
    reading_minutes: int
    locales: list[str] = []


class PostDetail(PostSummary):
    body: str


class PostInput(BaseModel):
    slug: str = Field(min_length=2, max_length=120, pattern=r"^[a-z0-9-]+$")
    title_tr: str = Field(default="", max_length=200)
    excerpt_tr: str = Field(default="", max_length=600)
    body_tr: str = Field(default="")
    title_en: str = Field(default="", max_length=200)
    excerpt_en: str = Field(default="", max_length=600)
    body_en: str = Field(default="")
    cover_image: str | None = Field(default=None, max_length=500)
    tags: list[str] = []
    is_published: bool = False


class AdminPost(PostInput):
    id: int
    published_at: datetime | None = None
    locales: list[str] = []
