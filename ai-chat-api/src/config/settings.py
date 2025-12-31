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

# Multi-Psychology Detection Settings
PSYCHOLOGY_DETECTION_ENABLED = os.getenv("PSYCHOLOGY_DETECTION_ENABLED", "true").lower() == "true"

# Individual Framework Settings
IFS_DETECTION_ENABLED = os.getenv("IFS_DETECTION_ENABLED", "true").lower() == "true"
CBT_DETECTION_ENABLED = os.getenv("CBT_DETECTION_ENABLED", "true").lower() == "true"
JUNGIAN_DETECTION_ENABLED = os.getenv("JUNGIAN_DETECTION_ENABLED", "true").lower() == "true"
NARRATIVE_DETECTION_ENABLED = os.getenv("NARRATIVE_DETECTION_ENABLED", "true").lower() == "true"
ATTACHMENT_DETECTION_ENABLED = os.getenv("ATTACHMENT_DETECTION_ENABLED", "true").lower() == "true"

# Framework Analysis Intervals (analyze every N messages)
IFS_ANALYSIS_INTERVAL = int(os.getenv("IFS_ANALYSIS_INTERVAL", "3"))
CBT_ANALYSIS_INTERVAL = int(os.getenv("CBT_ANALYSIS_INTERVAL", "2"))
JUNGIAN_ANALYSIS_INTERVAL = int(os.getenv("JUNGIAN_ANALYSIS_INTERVAL", "4"))
NARRATIVE_ANALYSIS_INTERVAL = int(os.getenv("NARRATIVE_ANALYSIS_INTERVAL", "3"))
ATTACHMENT_ANALYSIS_INTERVAL = int(os.getenv("ATTACHMENT_ANALYSIS_INTERVAL", "3"))

# Framework Window Sizes (number of recent messages to analyze)
IFS_WINDOW_SIZE = int(os.getenv("IFS_WINDOW_SIZE", "10"))
CBT_WINDOW_SIZE = int(os.getenv("CBT_WINDOW_SIZE", "8"))
JUNGIAN_WINDOW_SIZE = int(os.getenv("JUNGIAN_WINDOW_SIZE", "12"))
NARRATIVE_WINDOW_SIZE = int(os.getenv("NARRATIVE_WINDOW_SIZE", "10"))
ATTACHMENT_WINDOW_SIZE = int(os.getenv("ATTACHMENT_WINDOW_SIZE", "10"))

# Framework Confidence Thresholds
IFS_MIN_CONFIDENCE = float(os.getenv("IFS_MIN_CONFIDENCE", "0.6"))
CBT_MIN_CONFIDENCE = float(os.getenv("CBT_MIN_CONFIDENCE", "0.7"))
JUNGIAN_MIN_CONFIDENCE = float(os.getenv("JUNGIAN_MIN_CONFIDENCE", "0.6"))
NARRATIVE_MIN_CONFIDENCE = float(os.getenv("NARRATIVE_MIN_CONFIDENCE", "0.6"))
ATTACHMENT_MIN_CONFIDENCE = float(os.getenv("ATTACHMENT_MIN_CONFIDENCE", "0.6"))

# LLM Models for Analysis
PSYCHOLOGY_LLM_MODEL = os.getenv("PSYCHOLOGY_LLM_MODEL", "gpt-3.5-turbo")
IFS_LLM_MODEL = os.getenv("IFS_LLM_MODEL", PSYCHOLOGY_LLM_MODEL)
CBT_LLM_MODEL = os.getenv("CBT_LLM_MODEL", PSYCHOLOGY_LLM_MODEL)
JUNGIAN_LLM_MODEL = os.getenv("JUNGIAN_LLM_MODEL", PSYCHOLOGY_LLM_MODEL)
NARRATIVE_LLM_MODEL = os.getenv("NARRATIVE_LLM_MODEL", PSYCHOLOGY_LLM_MODEL)
ATTACHMENT_LLM_MODEL = os.getenv("ATTACHMENT_LLM_MODEL", PSYCHOLOGY_LLM_MODEL)

# Framework Configuration Helper
def get_framework_config():
    """Get complete framework configuration from environment variables."""
    return {
        'ifs': {
            'enabled': IFS_DETECTION_ENABLED,
            'analysis_interval': IFS_ANALYSIS_INTERVAL,
            'window_size': IFS_WINDOW_SIZE,
            'confidence_threshold': IFS_MIN_CONFIDENCE,
            'llm_model': IFS_LLM_MODEL
        },
        'cbt': {
            'enabled': CBT_DETECTION_ENABLED,
            'analysis_interval': CBT_ANALYSIS_INTERVAL,
            'window_size': CBT_WINDOW_SIZE,
            'confidence_threshold': CBT_MIN_CONFIDENCE,
            'llm_model': CBT_LLM_MODEL
        },
        'jungian': {
            'enabled': JUNGIAN_DETECTION_ENABLED,
            'analysis_interval': JUNGIAN_ANALYSIS_INTERVAL,
            'window_size': JUNGIAN_WINDOW_SIZE,
            'confidence_threshold': JUNGIAN_MIN_CONFIDENCE,
            'llm_model': JUNGIAN_LLM_MODEL
        },
        'narrative': {
            'enabled': NARRATIVE_DETECTION_ENABLED,
            'analysis_interval': NARRATIVE_ANALYSIS_INTERVAL,
            'window_size': NARRATIVE_WINDOW_SIZE,
            'confidence_threshold': NARRATIVE_MIN_CONFIDENCE,
            'llm_model': NARRATIVE_LLM_MODEL
        },
        'attachment': {
            'enabled': ATTACHMENT_DETECTION_ENABLED,
            'analysis_interval': ATTACHMENT_ANALYSIS_INTERVAL,
            'window_size': ATTACHMENT_WINDOW_SIZE,
            'confidence_threshold': ATTACHMENT_MIN_CONFIDENCE,
            'llm_model': ATTACHMENT_LLM_MODEL
        }
    }

# AI Response Language Settings
AI_RESPONSE_LANGUAGE = os.getenv("AI_RESPONSE_LANGUAGE", "chinese")  # Default to Chinese
AI_FORCE_LANGUAGE = os.getenv("AI_FORCE_LANGUAGE", "true").lower() == "true"  # Force language regardless of input
