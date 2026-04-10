# Contributing to RFPilot

Thank you for your interest in contributing to RFPilot!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/rfpilot.git`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Test locally with `docker-compose up -d`
6. Commit and push
7. Open a Pull Request

## Development Setup

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## Code Style

- Python: Follow PEP 8
- TypeScript: Use TypeScript strict mode
- CSS: Use Tailwind utility classes, follow the editorial design system

## Reporting Issues

Please use GitHub Issues for bug reports and feature requests.
