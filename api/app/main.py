import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import MEDIA_DIR
from .database import Base, engine
from .routers import admin, auth, public

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dafalabs-api")


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        logger.warning("Could not create media directory: %s", MEDIA_DIR)

    if engine is None:
        logger.warning("No database configured, tables were not created")
    else:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ready")

    yield


app = FastAPI(
    title="dafalabs API",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)

app.include_router(public.router)
app.include_router(auth.router)
app.include_router(admin.router)

app.add_api_route(
    "/contact",
    public.contact,
    methods=["POST"],
    response_model=public.ContactResponse,
    status_code=202,
)

app.mount("/media", StaticFiles(directory=MEDIA_DIR, check_dir=False), name="media")
