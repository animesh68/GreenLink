import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import router as api_router
from app.geospatial.loaders import get_green_spaces_geojson, get_study_boundary_geojson

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("greenlink_delhi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation: verify geospatial datasets can be loaded
    logger.info("Verifying geospatial datasets on startup...")
    try:
        greens = get_green_spaces_geojson()
        boundary = get_study_boundary_geojson()
        feature_count = len(greens.get("features", []))
        logger.info(f"Loaded {feature_count} green patches and study boundary successfully.")
    except Exception as e:
        logger.error(f"Geospatial data pre-load warning: {e}")
    yield
    logger.info("Shutting down GreenLink Delhi API.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Decision-support platform for urban green infrastructure and corridor planning in Delhi. "
        "Provides verified geospatial data, study extent, and spatial graph foundations."
    ),
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "application": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "description": "GreenLink Delhi Geospatial API",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_PREFIX}/health",
        "study_area": f"{settings.API_V1_PREFIX}/study-area",
        "green_spaces": f"{settings.API_V1_PREFIX}/green-spaces"
    }
