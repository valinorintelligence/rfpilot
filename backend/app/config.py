from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    CLAUDE_API_KEY: str = ""
    DATABASE_URL: str = "postgresql://rfpilot:rfpilot_secret@db:5432/rfpilot"
    REDIS_URL: str = "redis://redis:6379/0"
    ENVIRONMENT: str = "development"
    MAX_UPLOAD_MB: int = 50
    STORAGE_PATH: str = "/storage"

    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # SMTP
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None
    SMTP_FROM: str = "noreply@rfpilot.com"

    # Default admin
    ADMIN_EMAIL: str = "admin@rfpilot.com"
    ADMIN_PASSWORD: str = "changeme"
    ADMIN_NAME: str = "Admin User"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
