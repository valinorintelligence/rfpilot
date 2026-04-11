from unittest.mock import patch, MagicMock


def test_basic_health_check(client):
    """GET /api/health returns basic ok status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "rfpilot"


def test_v1_health_check_all_services_up(client):
    """GET /api/v1/health returns healthy when DB and Redis are reachable."""
    with patch("app.main.SessionLocal") as mock_session_cls, \
         patch("redis.from_url") as mock_redis:
        # Mock DB
        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        # Mock Redis
        mock_r = MagicMock()
        mock_redis.return_value = mock_r

        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert data["services"]["database"] == "ok"
        assert data["services"]["redis"] == "ok"


def test_v1_health_check_db_down(client):
    """GET /api/v1/health returns degraded when DB is unreachable."""
    with patch("app.main.SessionLocal") as mock_session_cls, \
         patch("redis.from_url") as mock_redis:
        # DB fails
        mock_session_cls.side_effect = Exception("Connection refused")

        # Redis ok
        mock_r = MagicMock()
        mock_redis.return_value = mock_r

        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["services"]["database"] == "unavailable"
        assert data["services"]["redis"] == "ok"


def test_v1_health_check_redis_down(client):
    """GET /api/v1/health returns degraded when Redis is unreachable."""
    with patch("app.main.SessionLocal") as mock_session_cls, \
         patch("redis.from_url") as mock_redis:
        # DB ok
        mock_db = MagicMock()
        mock_session_cls.return_value = mock_db

        # Redis fails
        mock_redis.side_effect = Exception("Connection refused")

        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["services"]["database"] == "ok"
        assert data["services"]["redis"] == "unavailable"
