# Installation Guide

## Prerequisites

- Docker Engine 20.10+ and Docker Compose v2+
- At least 4GB RAM available
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

## Quick Start (Development)

```bash
git clone https://github.com/yourusername/rfpilot.git
cd rfpilot
cp .env.example .env
```

Edit `.env` and set:
- `SECRET_KEY` - Generate with: `openssl rand -hex 32`
- `CLAUDE_API_KEY` - Your Anthropic API key

```bash
docker-compose up -d
```

Access at http://localhost:3000

Default login: `admin@rfpilot.local` / `changeme`

## Production Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## Windows Notes

Docker Desktop for Windows works out of the box. Ensure WSL2 is enabled.

## Linux Notes

Install Docker and Docker Compose:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## Stopping

```bash
docker-compose down
```

To also remove data volumes:
```bash
docker-compose down -v
```
