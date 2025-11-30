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

# IFS Detection Settings
IFS_DETECTION_ENABLED = os.getenv("IFS_DETECTION_ENABLED", "true").lower() == "true"
IFS_ANALYSIS_INTERVAL = int(os.getenv("IFS_ANALYSIS_INTERVAL", "3"))  # Analyze every N messages
IFS_WINDOW_SIZE = int(os.getenv("IFS_WINDOW_SIZE", "10"))  # Number of recent messages to analyze
IFS_MIN_CONFIDENCE = float(os.getenv("IFS_MIN_CONFIDENCE", "0.6"))  # Minimum confidence threshold
IFS_LLM_MODEL = os.getenv("IFS_LLM_MODEL", "gpt-3.5-turbo")  # Model for IFS analysis
