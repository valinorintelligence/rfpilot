import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password

logger = logging.getLogger(__name__)


def init_db():
    """Create default admin user if no users exist."""
    db: Session = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                full_name=settings.ADMIN_NAME,
                role="admin",
                department="Administration",
            )
            db.add(admin)
            db.commit()
            logger.info(f"Created default admin user: {settings.ADMIN_EMAIL}")
        else:
            logger.info(f"Database already has {user_count} users, skipping init")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
