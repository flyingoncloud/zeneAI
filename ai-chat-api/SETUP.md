# ZeneAI Chat API - Setup Guide

Step-by-step instructions for setting up the API from scratch.

## Prerequisites

### Required Software

1. **Python 3.10 or higher**
   ```bash
   python --version
   ```

2. **PostgreSQL 14+**
   - Option A: Use Docker (recommended)
   - Option B: Install locally

3. **OpenAI API Key**
   - Sign up at https://platform.openai.com/
   - Create an API key in your account settings

### Optional Tools

- Miniconda (recommended for Python environment management)
- Docker and Docker Compose
- curl or Postman for API testing

## Environment Setup

### Step 1: Navigate to Project Directory

```bash
cd ai-chat-api
```

### Step 2: Create Virtual Environment

**Using Miniconda (Recommended)**

```bash
conda create -n ai-chat-api python=3.10
conda activate ai-chat-api
```

**Using Python venv**

```bash
python -m venv ai-chat-env
source ai-chat-env/bin/activate  # On Windows: ai-chat-env\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=sk-your-actual-key-here
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=*
```

## Database Setup

### Option A: Using Docker (Recommended)

```bash
docker-compose up -d
```

Verify:
```bash
docker-compose ps
```

### Option B: Local PostgreSQL

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

Create database:
```sql
CREATE USER chat_user WITH PASSWORD 'chat_pass';
CREATE DATABASE chat_db OWNER chat_user;
```

## Running the API

### Start the Server

```bash
python run.py
```

Or with auto-reload:
```bash
uvicorn src.api.app:app --reload
```

Expected output:
```
INFO - Starting up AI Chat API...
INFO - ✓ Database initialized successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Database tables are created automatically on startup.

## Testing

### Test Health Endpoint

```bash
curl http://localhost:8000/
```

### Test Chat Endpoint

```bash
curl -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'
```

### View API Documentation

Open http://localhost:8000/docs in your browser.

### Run Test Suite

```bash
python -m pytest tests/ -v
```

## Troubleshooting

### Database Connection Failed

- Verify PostgreSQL is running: `docker-compose ps` or `pg_isready`
- Check DATABASE_URL in `.env`

### OpenAI API Error

- Verify OPENAI_API_KEY is set correctly
- Check API key has sufficient credits

### Import Errors

- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again
