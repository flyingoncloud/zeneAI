import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./chat.db")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY or not OPENAI_API_KEY.startswith("sk-"):
    raise ValueError("OpenAI API key is not configured properly")

# API Settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
