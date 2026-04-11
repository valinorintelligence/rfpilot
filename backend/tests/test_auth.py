import uuid


def test_register_success(client):
    """POST /api/v1/auth/register creates a new user."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepassword",
            "full_name": "New User",
            "role": "engineer",
            "department": "QA",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "engineer"
    assert data["is_active"] is True
    assert "id" in data


def test_register_duplicate_email(client, test_user):
    """POST /api/v1/auth/register rejects duplicate email."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_user.email,
            "password": "anotherpassword",
            "full_name": "Duplicate User",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client, test_user):
    """POST /api/v1/auth/login returns tokens for valid credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, test_user):
    """POST /api/v1/auth/login rejects wrong password."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


def test_login_nonexistent_user(client):
    """POST /api/v1/auth/login rejects unknown email."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "noone@example.com", "password": "whatever"},
    )
    assert response.status_code == 401


def test_me_authenticated(client, test_user, auth_headers):
    """GET /api/v1/auth/me returns current user info."""
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name


def test_me_unauthenticated(client):
    """GET /api/v1/auth/me returns 403 without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403


def test_me_invalid_token(client):
    """GET /api/v1/auth/me rejects invalid bearer token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalidtoken"},
    )
    assert response.status_code == 401


def test_list_users_as_admin(client, admin_user, admin_auth_headers, test_user):
    """GET /api/v1/auth/users returns user list for admins."""
    response = client.get("/api/v1/auth/users", headers=admin_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2  # admin + test_user


def test_list_users_as_engineer(client, test_user, auth_headers):
    """GET /api/v1/auth/users rejects non-admin/manager users."""
    response = client.get("/api/v1/auth/users", headers=auth_headers)
    assert response.status_code == 403
