# AI Chat API

A simple AI-powered chat API built with FastAPI and OpenAI. This is a lightweight, standalone API for conversational AI applications.

## Features

- Session-based conversation management
- PostgreSQL database with automatic table creation
- OpenAI GPT integration
- Conversation history tracking
- Auto-generated session IDs
- RESTful API with automatic documentation

## Quick Start

### Prerequisites

- Python 3.10+
- PostgreSQL 14+
- OpenAI API key

### Installation

1. **Create virtual environment and install dependencies**

   Using Miniconda (recommended):
   ```bash
   cd ai-chat-api
   conda create -n ai-chat-api python=3.10
   conda activate ai-chat-api
   pip install -r requirements.txt
   ```

   Or using Python venv:
   ```bash
   cd ai-chat-api
   python -m venv ai-chat-env
   source ai-chat-env/bin/activate  # On Windows: ai-chat-env\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up database**

   Using Docker (recommended - `docker-compose.yml` included):
   ```bash
   docker-compose up -d
   ```

   Or create PostgreSQL database manually:
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

   **Note**: Database tables are created automatically on first run!

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Usage Examples

### Start a new conversation

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello! What can you help me with?"}'
```

Response:
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "conversation_id": 1,
  "user_message": {...},
  "assistant_message": {...}
}
```

### Continue a conversation

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me more",
    "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

### Get conversation history

```bash
curl "http://localhost:8000/conversations/session/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Associate with user ID

```bash
curl -X POST "http://localhost:8000/chat/?user_id=user123" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Get all user conversations

```bash
curl "http://localhost:8000/conversations/user/user123"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information |
| POST | `/chat/` | Send message and get AI response |
| POST | `/conversations/` | Create new conversation |
| GET | `/conversations/{id}` | Get conversation by ID |
| GET | `/conversations/session/{session_id}` | Get conversation by session ID |
| GET | `/conversations/user/{user_id}` | Get all user conversations |
| DELETE | `/conversations/{id}` | Delete conversation |

## Project Structure

```
ai-chat-api/
├── src/
│   ├── api/
│   │   ├── app.py              # FastAPI application
│   │   ├── models.py           # Pydantic models
│   │   └── chat_service.py     # OpenAI integration
│   ├── database/
│   │   ├── models.py           # SQLAlchemy models
│   │   └── database.py         # Database connection
│   └── config/
│       └── settings.py         # Configuration
├── requirements.txt
├── .env.example
├── docker-compose.yml          # PostgreSQL setup
├── run.py
├── README.md
└── SETUP.md                    # Detailed setup guide
```

## Database Schema

### Conversations
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    metadata JSON
);
```

### Messages
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id),
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP,
    metadata JSON
);
```

**Note**: Tables are created automatically when the application starts.

## Configuration

Edit `.env` file:

```env
# OpenAI
OPENAI_API_KEY=your-api-key-here

# Database
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db

# API
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=*
```

## Development

### Running in development mode

```bash
# With auto-reload
uvicorn src.api.app:app --reload

# Or
python run.py
```

### Running tests

```bash
# Test API is running
curl http://localhost:8000/

# Test chat endpoint
curl -X POST http://localhost:8000/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

## Deployment

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn", "src.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t ai-chat-api .
docker run -p 8000:8000 --env-file .env ai-chat-api
```

### Environment Variables for Production

- Set `CORS_ORIGINS` to specific domains
- Use strong database credentials
- Store `OPENAI_API_KEY` securely (not in code)
- Consider rate limiting and authentication

## Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[API Docs](http://localhost:8000/docs)** - Interactive API documentation (when running)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

