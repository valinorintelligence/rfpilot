from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, rfps, analytics, settings_router

app = FastAPI(
    title="RFPilot API",
    description="AI-Powered RFP Response Platform",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(rfps.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(settings_router.router, prefix="/api/v1")


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "rfpilot"}
