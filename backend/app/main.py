import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import SessionLocal
from app.middleware import RequestLoggingMiddleware
from app.routers import auth, rfps, analytics, settings_router, audit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

app = FastAPI(
    title="RFPilot API",
    description="AI-Powered RFP Response Platform",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(rfps.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(settings_router.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "rfpilot"}


@app.get("/api/v1/health")
def health_check_v1():
    """Detailed health check that verifies database and Redis connectivity."""
    import redis as redis_lib

    services = {"database": "ok", "redis": "ok"}
    overall = "healthy"

    # Check database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        services["database"] = "unavailable"
        overall = "degraded"

    # Check Redis
    try:
        r = redis_lib.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        r.ping()
        r.close()
    except Exception:
        services["redis"] = "unavailable"
        overall = "degraded"

    return {
        "status": overall,
        "version": "1.0.0",
        "services": services,
    }
