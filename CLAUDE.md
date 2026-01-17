# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ZeneAI is a psychology-informed AI chat API with intelligent module recommendations. The system uses OpenAI GPT-4 for conversations and function calling to track when the AI recommends psychological support modules.

## Development Commands

```bash
# Start the API server
cd ai-chat-api
python run.py
# Or with auto-reload:
uvicorn src.api.app:app --reload

# Database setup (PostgreSQL via Docker)
docker-compose up -d

# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/ -v
python -m pytest tests/api/ -v          # API tests only
python -m pytest tests/framework/ -v    # Framework tests only

# Manual test scripts (from root directory)
./test_natural_conversation.sh
./test_module_recommendations.sh
./test_context_aware_gating.sh
```

## Architecture

### Core Flow: `/chat/` Endpoint

```
POST /chat/ with {message, session_id?}
    ↓
app.py: Save user message to DB
    ↓
chat_service.get_ai_response()
    ├── detect_language() → auto-detect Chinese/English
    ├── Load module_status from conversation.extra_data
    ├── Build system prompt + module status section
    ├── Call OpenAI GPT-4 with function calling (recommend_module tool)
    ├── Extract function calls → recommended_modules
    └── Fallback: _detect_module_mentions() keyword backup
    ↓
Update module_status, save assistant message
    ↓
Return ChatResponse
```

### Key Mechanism: OpenAI Function Calling

The AI is instructed via system prompt to call `recommend_module(module_id, reasoning)` whenever it suggests a module. This is more reliable than post-hoc text analysis. Fallback keyword detection exists as backup.

### Module Status Tracking

Frontend-driven via `/conversations/{id}/modules/{module_id}/complete` endpoint:
1. AI recommends → `recommended_at` set in `conversation.extra_data.module_status`
2. User completes in frontend → calls complete endpoint → `completed_at` set
3. System prompt includes status so AI won't re-recommend completed modules

## Project Structure

```
ai-chat-api/
├── src/
│   ├── api/
│   │   ├── app.py              # FastAPI endpoints
│   │   ├── chat_service.py     # OpenAI integration, language detection, function calling
│   │   └── models.py           # Pydantic models (ChatRequest, ChatResponse, etc.)
│   ├── modules/
│   │   └── module_config.py    # 4 module definitions + guidance templates
│   ├── database/
│   │   ├── models.py           # SQLAlchemy: Conversation, Message
│   │   └── database.py         # DB connection, init
│   ├── config/settings.py      # All env var configuration
│   └── reports/                # Report generation (not exposed via API)
│       ├── report_generator.py
│       └── chinese_template_generator.py
├── tests/                      # pytest tests
└── requirements.txt
```

### The Four Psychology Modules

| ID | Name | Trigger Context |
|----|------|-----------------|
| `breathing_exercise` | 呼吸训练 | High emotional intensity, somatic signals |
| `emotion_labeling` | 情绪命名 | Vague/unclear emotional expression |
| `inner_doodling` | 内视涂鸦 | Complex feelings, symbolic language |
| `quick_assessment` | 内视快测 | New users, exploration willingness |

Module configs in `src/modules/module_config.py` include bilingual names, icons, descriptions, and guidance templates.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/` | Send message, get AI response (accepts `?user_id=` query param) |
| POST | `/analyze-image-uri/` | Analyze image via OpenAI Vision (GPT-4o) |
| GET | `/conversations/session/{session_id}` | Get conversation by session |
| GET | `/conversations/user/{user_id}` | Get all conversations for user |
| POST | `/conversations/{id}/modules/{module_id}/complete` | Mark module completed |
| GET | `/conversations/{id}/modules` | Get module status for conversation |

Interactive docs at `http://localhost:8000/docs`

## Response Models

**ChatResponse** (actual fields returned):
```python
session_id: str
conversation_id: int
user_message: MessageResponse
assistant_message: MessageResponse  # includes extra_data.recommended_modules
recommended_modules: List[ModuleRecommendation]  # top-level convenience
module_status: Dict  # cumulative status across conversation
```

## Configuration (.env)

Key settings in `ai-chat-api/.env`:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db

# Language (auto-detected from user input by default)
AI_RESPONSE_LANGUAGE=chinese
AI_FORCE_LANGUAGE=true

# AI response tuning
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1500
```

## Database

PostgreSQL with SQLAlchemy. Tables auto-created on startup.

- **conversations**: id, session_id (unique), user_id, extra_data (JSON for module_status)
- **messages**: id, conversation_id (FK), role, content, extra_data (JSON)
