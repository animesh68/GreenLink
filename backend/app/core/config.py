import os
from typing import List


class Settings:
    PROJECT_NAME: str = "GreenLink Delhi"
    PROJECT_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Study Area Extent (South-Central Delhi)
    BBOX_WEST: float = 77.160
    BBOX_SOUTH: float = 28.530
    BBOX_EAST: float = 77.270
    BBOX_NORTH: float = 28.640
    
    # Coordinate Reference Systems
    CRS_STORAGE: str = "EPSG:4326"
    CRS_METRIC: str = "EPSG:32643"
    
    # Data directories
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    DATA_PROCESSED_DIR: str = os.path.join(BASE_DIR, "data", "processed")
    
    # CORS origins (Allow only specific local dev origins; no wildcard with credentials)
    cors_env = os.environ.get("CORS_ORIGINS", "").strip()
    ALLOWED_ORIGINS: List[str] = (
        [origin.strip() for origin in cors_env.split(",") if origin.strip()]
        if cors_env
        else [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )


settings = Settings()
