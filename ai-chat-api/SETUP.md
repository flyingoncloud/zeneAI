# AI Chat API - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the AI Chat API from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Setup](#application-setup)
5. [Testing](#testing)

## Prerequisites

### Required Software

1. **Python 3.10 or higher**
   ```bash
   python --version  # Should be 3.10+
   ```

2. **PostgreSQL 14+**
   - Option A: Use Docker (recommended)
   - Option B: Install locally

3. **OpenAI API Key**
   - Sign up at https://platform.openai.com/
   - Create an API key in your account settings

### Optional Tools

- **Miniconda** (recommended for Python environment management)
  - Download from https://docs.conda.io/en/latest/miniconda.html
- Docker and Docker Compose (for easy PostgreSQL setup)
- Git for version control
- `curl` or Postman for API testing
- Your favorite code editor (VS Code, PyCharm, etc.)

## Environment Setup

### Step 1: Navigate to Project Directory

```bash
cd ai-chat-api
```

### Step 2: Create Virtual Environment

**Option A: Using Miniconda (Recommended)**

```bash
# Create conda environment
conda create -n ai-chat-api python=3.10

# Activate the environment
conda activate ai-chat-api
```

**Option B: Using Python venv**

```bash
# Create virtual environment
python -m venv ai-chat-env

# Activate the environment
# On macOS/Linux:
source ai-chat-env/bin/activate

# On Windows:
ai-chat-env\Scripts\activate
```

You should see `(ai-chat-api)` or `(ai-chat-env)` in your terminal prompt.

### Step 3: Upgrade pip

```bash
pip install --upgrade pip
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI and Uvicorn (web framework)
- SQLAlchemy and psycopg2-binary (database)
- OpenAI client (AI integration)
- Pydantic (data validation)

**Expected installation time**: 1-3 minutes

### Step 5: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=sk-your-actual-key-here

# Database URL
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# CORS (adjust for production)
CORS_ORIGINS=*
```

**Important**:
- Replace `OPENAI_API_KEY` with your actual OpenAI API key
- Update `DATABASE_URL` if using different credentials

## Database Setup

### Option A: Using Docker (Recommended)

The project includes a `docker-compose.yml` file for easy PostgreSQL setup.

#### Step 1: Start PostgreSQL

```bash
docker-compose up -d
```

This will:
- Pull the PostgreSQL 16 image
- Start PostgreSQL on port 5432
- Create the database `chat_db` with user `chat_user`

#### Step 2: Verify Database is Running

```bash
docker-compose ps
```

Expected output:
```
NAME                 COMMAND                  SERVICE    STATUS
ai-chat-postgres     "docker-entrypoint.s…"   postgres   Up
```

#### Step 3: Test Connection (Optional)

```bash
docker-compose exec postgres psql -U chat_user -d chat_db -c "SELECT version();"
```

You should see PostgreSQL version information.

### Option B: Local PostgreSQL Installation

If you prefer not to use Docker:

#### Step 1: Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-16
sudo systemctl start postgresql
```

**Windows:**
Download installer from https://www.postgresql.org/download/windows/

#### Step 2: Create Database and User

```bash
# Connect as postgres superuser
sudo -u postgres psql  # Linux
psql postgres  # macOS
```

In psql, run:
```sql
CREATE USER chat_user WITH PASSWORD 'chat_pass';
CREATE DATABASE chat_db OWNER chat_user;
\q
```

#### Step 3: Update Connection String

In `.env`, update if using different credentials:
```env
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db
```

### Database Tables

**Important**: The application automatically creates the required tables on first run! You don't need to manually create any tables.

The following tables will be created automatically:
- `conversations` - Stores conversation sessions
- `messages` - Stores chat messages

## Application Setup

### Step 1: Verify Configuration

Test your configuration:

```bash
python -c "from src.config.settings import *; print('✓ Configuration loaded successfully')"
```

### Step 2: Start the API Server

```bash
python run.py
```

Or use uvicorn directly:
```bash
uvicorn src.api.app:app --reload
```

Expected output:
```
INFO - Starting up AI Chat API...
INFO - Initializing database...
INFO - ✓ Database tables created/verified successfully
INFO - ✓ Available tables: ['conversations', 'messages']
INFO - ✓ Database initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**The tables are automatically created on startup!** You should see the initialization messages in the logs.

Keep this terminal window open.

## Testing

### Step 1: Test Health Endpoint

In a new terminal:

```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "message": "AI Chat API - Basic Version",
  "version": "1.0.0",
  "note": "Database tables are automatically created on startup"
}
```

### Step 2: Test API Documentation

Open in your browser:
```
http://localhost:8000/docs
```

You should see the interactive Swagger UI with all endpoints.

### Step 3: Test Chat Endpoint (New Conversation)

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello! What can you help me with?"}'
```

Expected response (session_id will be different):
```json
{
  "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "conversation_id": 1,
  "user_message": {
    "id": 1,
    "role": "user",
    "content": "Hello! What can you help me with?",
    "created_at": "2025-11-01T12:00:00",
    "extra_data": {}
  },
  "assistant_message": {
    "id": 2,
    "role": "assistant",
    "content": "Hello! I'm here to help you...",
    "created_at": "2025-11-01T12:00:01",
    "extra_data": {}
  }
}
```

**Save the `session_id` from the response for the next step!**

### Step 4: Test Continuing a Conversation

Replace `YOUR_SESSION_ID` with the session_id from the previous response:

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a joke", "session_id": "YOUR_SESSION_ID"}'
```

### Step 5: Get Conversation History

Replace `YOUR_SESSION_ID`:

```bash
curl "http://localhost:8000/conversations/session/YOUR_SESSION_ID"
```

This will return the full conversation with all messages.

### Step 6: Test with User ID

```bash
curl -X POST "http://localhost:8000/chat/?user_id=user123" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Step 7: Get All Conversations for a User

```bash
curl "http://localhost:8000/conversations/user/user123"
```

## Verification Checklist

Use this to confirm everything is working:

- [ ] Virtual environment created and activated
- [ ] Dependencies installed (`pip list` shows fastapi, uvicorn, etc.)
- [ ] `.env` file created with valid OpenAI key
- [ ] PostgreSQL running and accessible
- [ ] Database `chat_db` created
- [ ] API server starts without errors
- [ ] See "Database tables created/verified" in startup logs
- [ ] Root endpoint returns JSON with version info
- [ ] `/docs` page loads in browser
- [ ] Chat endpoint accepts messages and returns responses
- [ ] Conversation history can be retrieved

If all items are checked, your setup is complete!

## Next Steps

After successful setup:

1. **Explore the API**: Visit `http://localhost:8000/docs` and try different endpoints
2. **Integrate**: Use the API in your application
3. **Customize**: Modify prompts in `src/api/chat_service.py`
4. **Deploy**: Prepare for production deployment
5. **Monitor**: Check logs and conversation history


## Common Workflows

### Starting Development

```bash
cd ai-chat-api

# Activate virtual environment
conda activate ai-chat-api        # If using conda
# OR
source ai-chat-env/bin/activate   # If using venv (macOS/Linux)
# OR
ai-chat-env\Scripts\activate      # If using venv (Windows)

# Start database (if using Docker)
docker-compose up -d

# Start API server
python run.py
```

### Stopping Everything

```bash
# Stop API: Press CTRL+C in the terminal running the server

# Stop database (Docker):
docker-compose down

# Deactivate virtual environment:
conda deactivate                  # If using conda
# OR
deactivate                        # If using venv
```

### Resetting Database

```bash
# Docker:
docker-compose down -v  # Deletes all data!
docker-compose up -d
python run.py  # Tables recreated automatically

# Local PostgreSQL:
psql -U chat_user -d chat_db
DROP TABLE messages CASCADE;
DROP TABLE conversations CASCADE;
\q
python run.py  # Tables recreated automatically
```

That's it! You're ready to use the AI Chat API.
