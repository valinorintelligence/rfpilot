.PHONY: up down build logs test clean restart status

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Build and start
build:
	docker compose up -d --build

# View logs (all services)
logs:
	docker compose logs -f

# View backend logs
logs-backend:
	docker compose logs -f backend

# Run backend tests
test:
	docker compose exec backend python -m pytest tests/ -v

# Health check
health:
	@curl -s http://localhost:8000/api/v1/health | python -m json.tool

# Restart backend
restart:
	docker compose restart backend worker

# Show container status
status:
	docker compose ps

# Clean everything (volumes included)
clean:
	docker compose down -v --rmi local

# Run database migrations
migrate:
	docker compose exec backend alembic upgrade head

# Production deployment
prod:
	docker compose -f docker-compose.prod.yml up -d --build
