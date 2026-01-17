# ZeneAI Chat API

A psychology-informed chat API built with FastAPI and OpenAI. Features intelligent module recommendations for psychological support.

## Features

- Session-based conversation management
- OpenAI GPT-4 integration with function calling
- Four psychology support modules with smart recommendations
- Automatic language detection (Chinese/English)
- Image analysis via OpenAI Vision API
- PostgreSQL database with automatic table creation
- Module completion tracking

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL 14+
- OpenAI API key

### Installation

1. **Create virtual environment and install dependencies**

   ```bash
   cd ai-chat-api
   conda create -n ai-chat-api python=3.10
   conda activate ai-chat-api
   pip install -r requirements.txt
   ```

2. **Set up database**

   Using Docker (recommended):
   ```bash
   docker-compose up -d
   ```

   Or manually:
   ```bash
   psql -U postgres
   CREATE DATABASE chat_db;
   CREATE USER chat_user WITH PASSWORD 'chat_pass';
   GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Run the API**
   ```bash
   python run.py
   ```

   The API will be available at `http://localhost:8000`

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Usage Examples

### Start a new conversation

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "我最近感觉有点焦虑"}'
```

### Continue a conversation

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "是的，主要是工作压力", "session_id": "YOUR_SESSION_ID"}'
```

### Get conversation history

```bash
curl "http://localhost:8000/conversations/session/YOUR_SESSION_ID"
```

### Associate with user ID

```bash
curl -X POST "http://localhost:8000/chat/?user_id=user123" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Mark module as completed

```bash
curl -X POST "http://localhost:8000/conversations/1/modules/breathing_exercise/complete" \
  -H "Content-Type: application/json" \
  -d '{"completion_data": {"duration": 180}}'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| POST | `/chat/` | Send message and get AI response |
| POST | `/analyze-image-uri/` | Analyze image via Vision API |
| GET | `/conversations/{id}` | Get conversation by ID |
| GET | `/conversations/session/{session_id}` | Get conversation by session ID |
| GET | `/conversations/user/{user_id}` | Get all user conversations |
| POST | `/conversations/{id}/modules/{module_id}/complete` | Mark module completed |
| GET | `/conversations/{id}/modules` | Get module status |
| DELETE | `/conversations/{id}` | Delete conversation |

## Psychology Support Modules

The system recommends four psychology support modules based on conversation context:

| Module | Chinese Name | When Recommended |
|--------|--------------|------------------|
| `breathing_exercise` | 呼吸训练 | High emotional intensity, physical symptoms |
| `emotion_labeling` | 情绪命名 | Vague emotional expression |
| `inner_doodling` | 内视涂鸦 | Complex feelings, symbolic language |
| `quick_assessment` | 内视快测 | New users, exploration willingness |

## Project Structure

```
ai-chat-api/
├── src/
│   ├── api/
│   │   ├── app.py              # FastAPI endpoints
│   │   ├── chat_service.py     # OpenAI integration
│   │   └── models.py           # Pydantic models
│   ├── modules/
│   │   └── module_config.py    # Module definitions
│   ├── database/
│   │   ├── models.py           # SQLAlchemy models
│   │   └── database.py         # Database connection
│   ├── config/
│   │   └── settings.py         # Configuration
│   └── reports/
│       ├── report_generator.py
│       └── chinese_template_generator.py
├── tests/
├── requirements.txt
├── docker-compose.yml
└── run.py
```

## Configuration

Edit `.env` file:

```env
OPENAI_API_KEY=your-api-key-here
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db

API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=*

AI_RESPONSE_LANGUAGE=chinese
AI_FORCE_LANGUAGE=false
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1500
```

### Language Configuration

- `AI_RESPONSE_LANGUAGE`: Target language (`chinese` or `english`)
- `AI_FORCE_LANGUAGE`: When `false`, auto-detects from user input

## Development

```bash
# With auto-reload
uvicorn src.api.app:app --reload

# Run tests
python -m pytest tests/ -v
```

## License

Proprietary
