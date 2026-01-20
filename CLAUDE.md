# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZeneAI is a psychology-informed AI platform for IFS (Internal Family Systems) therapy support. It's a monorepo with:
- **ai-chat-api/**: Python FastAPI backend with OpenAI integration
- **zeneme-next/**: Next.js 16 frontend with React 19

## Common Commands

### Backend (ai-chat-api/)

```bash
# Setup (first time)
cd ai-chat-api
conda create -n ai-chat-api python=3.10 && conda activate ai-chat-api
pip install -r requirements.txt
cp .env.example .env  # Add OPENAI_API_KEY

# Database (PostgreSQL via Docker)
docker-compose up -d

# Run server
python run.py
# Or with auto-reload:
uvicorn src.api.app:app --reload

# Tests
python -m pytest tests/ -v
python -m pytest tests/test_psychology_models.py -v  # Single file
```

### Frontend (zeneme-next/)

```bash
cd zeneme-next
npm install
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

### Backend Structure

```
ai-chat-api/src/
├── api/
│   ├── app.py           # FastAPI endpoints, CORS, startup
│   ├── chat_service.py  # OpenAI integration, function calling
│   └── models.py        # Pydantic request/response models
├── database/
│   ├── database.py      # SQLAlchemy connection, auto-create tables
│   └── models.py        # ORM models (conversations, messages)
├── modules/
│   └── module_config.py # Psychology module definitions
├── services/psychology/ # Psychology analysis pipeline
├── config/settings.py   # Environment configuration
└── reports/             # Report generation (DOCX)
```

**Key patterns:**
- Session-based conversations stored in PostgreSQL
- OpenAI function calling for module recommendations
- Four psychology modules: breathing_exercise, emotion_labeling, inner_doodling, quick_assessment
- Tables auto-created on startup via SQLAlchemy

### Frontend Structure

```
zeneme-next/src/
├── app/                 # Next.js App Router pages
├── components/
│   ├── ui/              # Shadcn/Radix UI primitives
│   ├── layout/          # Sidebar, TopBar
│   └── features/        # Chat, reports, tools
├── hooks/               # Zustand store (useZenemeStore)
└── lib/api.ts           # API client with type safety
```

**Key patterns:**
- React 19 with experimental React Compiler
- Tailwind CSS v4 (PostCSS-based, different from v3)
- State management via Zustand hooks
- Radix UI + Shadcn component library

## API Endpoints

Backend runs on `http://localhost:8000`. Swagger docs at `/docs`.

| Endpoint | Description |
|----------|-------------|
| POST /chat/ | Send message, get AI response with module recommendations |
| POST /analyze-image-uri/ | Image analysis via Vision API |
| GET /conversations/{id} | Get conversation by ID |
| POST /conversations/{id}/modules/{module_id}/complete | Mark module completed |

## Configuration

### Backend (.env)

Required:
- `OPENAI_API_KEY` - OpenAI API credentials
- `DATABASE_URL` - PostgreSQL connection (default: postgresql://chat_user:chat_pass@localhost:5432/chat_db)

Optional:
- `AI_RESPONSE_LANGUAGE` - chinese/english (auto-detects by default)
- `AI_TEMPERATURE` - Model creativity (default: 0.7)
- Feature flags: `PSYCHOLOGY_DETECTION_ENABLED`, `IFS_ENABLED`, etc.

### Frontend

- `NEXT_PUBLIC_API_URL` - Backend URL (default: http://localhost:8000)

## Psychology Modules

The AI recommends modules based on conversation context:
- **breathing_exercise** (呼吸训练): High emotional intensity, physical symptoms
- **emotion_labeling** (情绪命名): Vague emotional expression
- **inner_doodling** (内视涂鸦): Complex feelings, symbolic language
- **quick_assessment** (内视快测): New users, exploration phase
