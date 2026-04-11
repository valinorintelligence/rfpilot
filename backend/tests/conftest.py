import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# ---------------------------------------------------------------------------
# SQLite compatibility: compile PostgreSQL-specific types to SQLite equivalents
# ---------------------------------------------------------------------------
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.ext.compiler import compiles


@compiles(PG_UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "TEXT"


# ---------------------------------------------------------------------------
# App imports (after compiler hooks are registered)
# ---------------------------------------------------------------------------
from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.utils.security import hash_password, create_access_token

# Ensure all models are imported so Base.metadata is complete
import app.models  # noqa: F401

# ---------------------------------------------------------------------------
# In-memory SQLite engine for tests (no PostgreSQL required)
# ---------------------------------------------------------------------------
SQLALCHEMY_TEST_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(setup_database) -> Session:
    """Provide a transactional database session for tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session) -> TestClient:
    """FastAPI TestClient with the test database session injected."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session) -> User:
    """Create and return a test user in the database."""
    user = User(
        id=uuid.uuid4(),
        email="testuser@example.com",
        password_hash=hash_password("testpassword123"),
        full_name="Test User",
        role="engineer",
        department="Engineering",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session) -> User:
    """Create and return an admin user in the database."""
    user = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        password_hash=hash_password("adminpassword123"),
        full_name="Admin User",
        role="admin",
        department="Management",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user) -> dict:
    """Return Authorization headers for the test user."""
    token = create_access_token(str(test_user.id), test_user.role)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_auth_headers(admin_user) -> dict:
    """Return Authorization headers for the admin user."""
    token = create_access_token(str(admin_user.id), admin_user.role)
    return {"Authorization": f"Bearer {token}"}
