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
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:8080,null").split(",")

# Multi-Psychology Detection Settings
PSYCHOLOGY_DETECTION_ENABLED = os.getenv("PSYCHOLOGY_DETECTION_ENABLED", "true").lower() == "true"

# Pattern Recognition Settings (NEW)
PATTERN_RECOGNITION_ENABLED = os.getenv("PATTERN_RECOGNITION_ENABLED", "true").lower() == "true"
PATTERN_LLM_THRESHOLD = float(os.getenv("PATTERN_LLM_THRESHOLD", "0.5"))  # Depth threshold for LLM analysis
PATTERN_MIN_MESSAGES = int(os.getenv("PATTERN_MIN_MESSAGES", "5"))  # Minimum messages for pattern detection
PATTERN_MIN_CONFIDENCE = float(os.getenv("PATTERN_MIN_CONFIDENCE", "0.6"))  # Minimum confidence for pattern detection

# Emotional Progression Tracking Settings (NEW)
PROGRESSION_TRACKING_ENABLED = os.getenv("PROGRESSION_TRACKING_ENABLED", "true").lower() == "true"
PROGRESSION_STATE_LIMIT = int(os.getenv("PROGRESSION_STATE_LIMIT", "20"))  # Max emotional states to store
PROGRESSION_MIN_STATES = int(os.getenv("PROGRESSION_MIN_STATES", "2"))  # Min states for progression analysis

# Individual Indicator Settings (New 5-Indicator System)
EMOTIONAL_AWARENESS_ENABLED = os.getenv("EMOTIONAL_AWARENESS_ENABLED", "true").lower() == "true"
COGNITIVE_PATTERNS_ENABLED = os.getenv("COGNITIVE_PATTERNS_ENABLED", "true").lower() == "true"
RELATIONAL_PATTERNS_ENABLED = os.getenv("RELATIONAL_PATTERNS_ENABLED", "true").lower() == "true"
PERSONALITY_TYPES_ENABLED = os.getenv("PERSONALITY_TYPES_ENABLED", "true").lower() == "true"
IFS_ENABLED = os.getenv("IFS_ENABLED", "true").lower() == "true"

# Indicator Analysis Intervals (analyze every N messages)
EMOTIONAL_AWARENESS_INTERVAL = int(os.getenv("EMOTIONAL_AWARENESS_INTERVAL", "2"))
COGNITIVE_PATTERNS_INTERVAL = int(os.getenv("COGNITIVE_PATTERNS_INTERVAL", "2"))
RELATIONAL_PATTERNS_INTERVAL = int(os.getenv("RELATIONAL_PATTERNS_INTERVAL", "3"))
PERSONALITY_TYPES_INTERVAL = int(os.getenv("PERSONALITY_TYPES_INTERVAL", "3"))
IFS_INTERVAL = int(os.getenv("IFS_INTERVAL", "3"))

# Indicator Window Sizes (number of recent messages to analyze)
EMOTIONAL_AWARENESS_WINDOW = int(os.getenv("EMOTIONAL_AWARENESS_WINDOW", "10"))
COGNITIVE_PATTERNS_WINDOW = int(os.getenv("COGNITIVE_PATTERNS_WINDOW", "10"))
RELATIONAL_PATTERNS_WINDOW = int(os.getenv("RELATIONAL_PATTERNS_WINDOW", "10"))
PERSONALITY_TYPES_WINDOW = int(os.getenv("PERSONALITY_TYPES_WINDOW", "10"))
IFS_WINDOW = int(os.getenv("IFS_WINDOW", "10"))

# Indicator Confidence Thresholds
EMOTIONAL_AWARENESS_MIN_CONFIDENCE = float(os.getenv("EMOTIONAL_AWARENESS_MIN_CONFIDENCE", "0.5"))
COGNITIVE_PATTERNS_MIN_CONFIDENCE = float(os.getenv("COGNITIVE_PATTERNS_MIN_CONFIDENCE", "0.5"))
RELATIONAL_PATTERNS_MIN_CONFIDENCE = float(os.getenv("RELATIONAL_PATTERNS_MIN_CONFIDENCE", "0.5"))
PERSONALITY_TYPES_MIN_CONFIDENCE = float(os.getenv("PERSONALITY_TYPES_MIN_CONFIDENCE", "0.5"))
IFS_MIN_CONFIDENCE = float(os.getenv("IFS_MIN_CONFIDENCE", "0.5"))

# LLM Models for Analysis
PSYCHOLOGY_LLM_MODEL = os.getenv("PSYCHOLOGY_LLM_MODEL", "gpt-3.5-turbo")

# Indicator Configuration Helper
def get_indicator_config():
    """Get complete indicator configuration from environment variables."""
    return {
        'emotional_awareness': {
            'enabled': EMOTIONAL_AWARENESS_ENABLED,
            'analysis_interval': EMOTIONAL_AWARENESS_INTERVAL,
            'window_size': EMOTIONAL_AWARENESS_WINDOW,
            'confidence_threshold': EMOTIONAL_AWARENESS_MIN_CONFIDENCE,
            'llm_model': PSYCHOLOGY_LLM_MODEL
        },
        'cognitive_patterns': {
            'enabled': COGNITIVE_PATTERNS_ENABLED,
            'analysis_interval': COGNITIVE_PATTERNS_INTERVAL,
            'window_size': COGNITIVE_PATTERNS_WINDOW,
            'confidence_threshold': COGNITIVE_PATTERNS_MIN_CONFIDENCE,
            'llm_model': PSYCHOLOGY_LLM_MODEL
        },
        'relational_patterns': {
            'enabled': RELATIONAL_PATTERNS_ENABLED,
            'analysis_interval': RELATIONAL_PATTERNS_INTERVAL,
            'window_size': RELATIONAL_PATTERNS_WINDOW,
            'confidence_threshold': RELATIONAL_PATTERNS_MIN_CONFIDENCE,
            'llm_model': PSYCHOLOGY_LLM_MODEL
        },
        'personality_types': {
            'enabled': PERSONALITY_TYPES_ENABLED,
            'analysis_interval': PERSONALITY_TYPES_INTERVAL,
            'window_size': PERSONALITY_TYPES_WINDOW,
            'confidence_threshold': PERSONALITY_TYPES_MIN_CONFIDENCE,
            'llm_model': PSYCHOLOGY_LLM_MODEL
        },
        'ifs': {
            'enabled': IFS_ENABLED,
            'analysis_interval': IFS_INTERVAL,
            'window_size': IFS_WINDOW,
            'confidence_threshold': IFS_MIN_CONFIDENCE,
            'llm_model': PSYCHOLOGY_LLM_MODEL
        }
    }

# Backward compatibility alias
get_framework_config = get_indicator_config

# AI Response Language Settings
AI_RESPONSE_LANGUAGE = os.getenv("AI_RESPONSE_LANGUAGE", "chinese")  # Default to Chinese
AI_FORCE_LANGUAGE = os.getenv("AI_FORCE_LANGUAGE", "true").lower() == "true"  # Force language regardless of input

# AI Response Control Settings
AI_TEMPERATURE = float(os.getenv("AI_TEMPERATURE", "0.7"))  # Creativity vs consistency (0.0-2.0)
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "1500"))  # Max response length (increased for better responses)
AI_PRESENCE_PENALTY = float(os.getenv("AI_PRESENCE_PENALTY", "0.3"))  # Reduce repetition (0.0-2.0)
AI_FREQUENCY_PENALTY = float(os.getenv("AI_FREQUENCY_PENALTY", "0.3"))  # Encourage word diversity (0.0-2.0)
