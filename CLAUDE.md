# ZeneAI - Psychology-Informed AI Chat

AI chat API with intelligent module recommendations powered by LLM-based psychological analysis.

## Core Features

1. **AI Chat API** - Session-based conversational AI (OpenAI GPT-4/GPT-3.5)
2. **LLM-Based Psychological Analysis** - GPT-3.5-turbo analyzes user psychological state
3. **Module Recommendation System** - Context-aware guidance to 4 psychology support modules
4. **Pattern Recognition** - Detects defense mechanisms, attachment patterns, recurring themes
5. **Emotional Progression Tracking** - Monitors emotional trajectory across conversation
6. **Report Generation** - PDF reports with psychological analysis
7. **Image Analysis** - OpenAI Vision API for analyzing user-uploaded images
8. **Bilingual Support** - Chinese and English throughout

## Technology Stack

- **Backend**: FastAPI (Python 3.10+), PostgreSQL, SQLAlchemy
- **AI**: OpenAI GPT-4, GPT-3.5-turbo (for psychological analysis), Vision API
- **Analysis**: LLM-based psychological state detection (simplified from multi-framework system)

## Project Structure

```
ai-chat-api/
├── src/
│   ├── api/
│   │   ├── app.py              # FastAPI endpoints (chat, conversations, image analysis)
│   │   ├── chat_service.py     # OpenAI integration + module recommendations
│   │   └── models.py           # Pydantic request/response models
│   ├── modules/                # Module recommendation system (CORE)
│   │   ├── recommender.py              # Main orchestrator
│   │   ├── llm_analyzer.py             # LLM-based psychological state analysis
│   │   ├── trigger_detector.py         # Module trigger detection logic
│   │   ├── module_config.py            # 4 module configs + guidance templates
│   │   ├── pattern_recognition.py      # Defense mechanisms, attachment patterns
│   │   ├── emotional_progression.py    # Emotional trajectory tracking
│   │   └── psychological_analyzer.py   # Fallback/stub analyzer
│   ├── database/
│   │   ├── models.py           # SQLAlchemy models (Conversation, Message)
│   │   └── database.py         # Database connection
│   ├── config/
│   │   └── settings.py         # Environment configuration (extensive)
│   ├── reports/
│   │   ├── report_generator.py         # PDF report generation
│   │   └── chinese_template_generator.py # Chinese report templates
│   └── resources/              # Static resources
└── requirements.txt
```

## Four Psychology Support Modules

### 1. 呼吸训练 (Breathing Exercise) - Priority 1
**When**: High emotional intensity or somatic signals (body sensations)
**Purpose**: Immediate emotional regulation, help body slow down
**Guidance Style**: Non-command, minimal, "if you're willing..."
**Parent Module**: emotional_first_aid

### 2. 情绪命名 (Emotion Labeling) - Priority 2
**When**: Vague/unclear emotional expression
**Purpose**: Find closest label for fuzzy feelings
**Guidance Style**: "No need to be precise, just pick closest match"
**Parent Module**: emotional_first_aid

### 3. 内视涂鸦 (Inner Insight Doodling) - Priority 3
**When**: Complex feelings, symbolic language, repeated themes
**Purpose**: Express through imagery what words can't capture
**Guidance Style**: "Let image represent it" (avoid "analyze")
**Category**: creative_expression (standalone)

### 4. 内视快测 (Quick Assessment) - Priority 4
**When**: New users, exploration willingness, or conversation end signal
**Purpose**: Organize scattered feelings into whole profile
**Guidance Style**: "Turn scattered feelings into a pattern"
**Category**: self_assessment (standalone)

## Module Recommendation Flow

```
User Message
    ↓
FastAPI saves user message to database
    ↓
Build message history from conversation
    ↓
chat_service.get_ai_response()
    ↓
ModuleRecommender.get_recommendations()
  ├─→ LLMAnalyzer: Use GPT-3.5-turbo to analyze psychological state
  │    • emotional_intensity: "high" | "medium" | "low"
  │    • somatic_signals: "present" | "absent"
  │    • expression_clarity: "clear" | "vague"
  │    • exploration_willingness: "present" | "absent"
  │    • conversation_end_signal: "present" | "absent"
  │    (Returns JSON, converts to numerical scores)
  │
  ├─→ TriggerDetector: Map state → triggered modules
  │    • breathing_exercise: intensity≥0.7 OR somatic≥0.7
  │    • emotion_labeling: clarity<0.4
  │    • inner_doodling: clarity<0.4 (alternative)
  │    • quick_assessment: exploration≥0.7 OR end_signal≥0.7
  │
  └─→ Select top 2 recommendations + choose guidance templates
    ↓
Embed recommendations into AI system prompt
    ↓
OpenAI generates response (naturally weaves in module suggestions)
    ↓
Returns: {
  content: AI reply,
  module_recommendations: [...],
  psychological_state: {...},
  patterns: {...},
  progression: {...}
}
    ↓
Save assistant message with metadata
    ↓
API Response
```

## LLM-Based Psychological Analysis

**Key Innovation**: Instead of keyword matching, the system uses **GPT-3.5-turbo** to analyze user psychological state through a structured prompt.

**Analysis Prompt Structure**:
```
Analyze this conversation and user message:
- Conversation history: [...]
- Current message: "..."

Return JSON with these categorical indicators:
{
  "emotional_intensity": "high" | "medium" | "low",
  "somatic_signals": "present" | "absent",
  "expression_clarity": "clear" | "vague",
  "exploration_willingness": "present" | "absent",
  "conversation_end_signal": "present" | "absent"
}
```

**Conversion to Numerical Scores** (for frontend):
- high → 0.8, medium → 0.5, low → 0.2
- present → 0.8, absent → 0.2
- clear → 0.8, vague → 0.2

**Benefits**:
- More accurate than keyword matching
- Context-aware (considers entire conversation)
- Bilingual by nature (no separate Chinese/English rules)
- Handles nuance and implicit meaning

## Pattern Recognition

**Hybrid Approach**: Keyword detection + LLM analysis for deeper insights

**Detected Patterns**:
1. **Defense Mechanisms**: denial, projection, rationalization, intellectualization, displacement
2. **Attachment Patterns**: anxious, avoidant, secure, disorganized
3. **Recurring Themes**: Common topics/concerns across messages

**Storage**: Patterns stored in `message.metadata` for analysis and reporting

## Emotional Progression Tracking

**Tracks emotional trajectory across conversation**:
- **escalating**: Emotional intensity increasing
- **de-escalating**: Intensity decreasing (therapeutic progress)
- **stabilizing**: Consistent emotional state

**How it works**:
1. Store emotional states in `conversation.metadata.emotional_states` array
2. Compare current intensity with recent history (window size: 5 messages)
3. Calculate trend: positive slope = escalating, negative = de-escalating

**Usage**:
- Helps AI adapt responses (supportive vs. exploratory)
- Report generation insights
- Frontend visualization of emotional journey

## API Response Example

```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_message": {
    "content": "我最近一直觉得很焦虑，心跳很快...",
    "role": "user"
  },
  "assistant_message": {
    "content": "我能感觉到你现在真的很紧绷，心跳加快也让你更不安。如果你愿意，我们可以一起试试呼吸训练。它不是要你解决什么问题，只是帮身体慢一点...",
    "role": "assistant",
    "extra_data": {
      "module_recommendations": [
        {
          "module_id": "breathing_exercise",
          "name": "呼吸训练",
          "icon": "🫁",
          "description": "专注画面中的节奏起伏，让呼吸慢慢放缓",
          "guidance": "如果你愿意，我们可以一起试试呼吸训练。它不是要你解决什么问题，只是帮身体慢一点...",
          "score": 0.85,
          "priority": 1,
          "reasons": ["high_emotional_intensity", "somatic_signals_present"]
        }
      ],
      "psychological_state": {
        "emotional_intensity": 0.8,
        "somatic_signals": 0.8,
        "expression_clarity": 0.6,
        "exploration_willingness": 0.2,
        "conversation_end_signal": 0.2
      },
      "patterns": {
        "defense_mechanisms": ["denial"],
        "attachment_patterns": ["anxious"],
        "recurring_themes": ["anxiety", "physical_symptoms"]
      },
      "progression": {
        "type": "escalating",
        "confidence": 0.7,
        "emotional_trajectory": [0.5, 0.6, 0.8]
      }
    }
  },
  "module_recommendations": [...],  // Also at top level for frontend convenience
  "psychological_state": {...},
  "patterns": {...},
  "progression": {...}
}
```

## Key Implementation Files

### 1. **`src/modules/llm_analyzer.py`** - LLM-Based State Analysis
- **analyze_state_with_llm()**: Sends conversation to GPT-3.5-turbo for structured analysis
- Returns categorical indicators (high/medium/low, present/absent, clear/vague)
- Converts to numerical scores for downstream use
- Handles API errors gracefully with fallback to baseline state

### 2. **`src/modules/trigger_detector.py`** - Module Trigger Detection
- **detect_triggers()**: Maps psychological state → module triggers
- Configurable thresholds via THRESHOLDS constant
- Returns triggered modules with scores, reasons, priorities
- Logic:
  - `intensity ≥ 0.7 OR somatic ≥ 0.7` → breathing_exercise
  - `clarity < 0.4` → emotion_labeling OR inner_doodling
  - `exploration ≥ 0.7 OR end_signal ≥ 0.7` → quick_assessment

### 3. **`src/modules/recommender.py`** - Main Orchestrator
- **get_recommendations()**: Entry point for module recommendation flow
- Calls LLMAnalyzer → TriggerDetector → Select top N recommendations
- **_select_guidance_template()**: Chooses appropriate guidance based on:
  - Message count (early vs. mid vs. late conversation)
  - Emotional intensity (high vs. medium/low)
  - Recent recommendations (avoid repetition)
- **format_for_ai_prompt()**: Embeds recommendations into AI system message

### 4. **`src/modules/module_config.py`** - Module Definitions
- **MODULES** dict: 4 module configurations with metadata
- **4 guidance templates per module** (early/mid/late conversation, high intensity)
- **Followup templates**: Post-module conversation anchors
- Example: After emotion labeling → "你选了'疲惫'，这个词很轻但很准。它更像是一直都有，还是最近才变重的？"

### 5. **`src/modules/pattern_recognition.py`** - Pattern Detection
- **detect_patterns()**: Hybrid keyword + LLM approach
- Defense mechanisms, attachment patterns, recurring themes
- Bilingual keyword detection (Chinese/English)

### 6. **`src/modules/emotional_progression.py`** - Progression Tracking
- **analyze_progression()**: Tracks emotional trajectory
- Compares current state with conversation history
- Returns: escalating, de-escalating, or stabilizing

### 7. **`src/api/chat_service.py`** - OpenAI Integration
- **get_ai_response()**: Main chat logic
  1. Get module recommendations via ModuleRecommender
  2. Embed recommendations in system prompt
  3. Call OpenAI API with conversation history
  4. Return dict with content + all analysis metadata
- **analyze_image()**: OpenAI Vision API for image analysis

### 8. **`src/api/app.py`** - FastAPI Endpoints
- **POST `/chat/`**: Main chat endpoint
  - Saves user message
  - Gets AI response with recommendations
  - Saves assistant message with metadata
  - Returns full response with module_recommendations at top level
- **POST `/chat/analyze-image`**: Image analysis endpoint
- **GET `/conversations/session/{session_id}`**: Get conversation history
- **POST `/conversations/`**: Create new conversation
- **DELETE `/conversations/{id}`**: Delete conversation

### 9. **`src/config/settings.py`** - Extensive Configuration
- OpenAI API settings (keys, models, temperature, max_tokens)
- Database connection settings
- **Psychology detection toggles** (pattern recognition, progression tracking)
- **Individual indicator settings**: intervals, windows, confidence thresholds
- **AI response language**: Chinese/English forcing
- **Module recommendation settings**: max recommendations, top-N selection

### 10. **`src/reports/report_generator.py`** - Report Generation
- **generate_report()**: Creates PDF reports with psychological analysis
- Includes conversation summary, patterns, progression, recommendations
- Uses chinese_template_generator for Chinese reports

## Configuration (.env)

```env
# OpenAI API
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo
OPENAI_ANALYSIS_MODEL=gpt-3.5-turbo  # for psychological analysis
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1500
OPENAI_PRESENCE_PENALTY=0.3
OPENAI_FREQUENCY_PENALTY=0.3

# Database
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db

# AI Response Language
AI_RESPONSE_LANGUAGE=chinese  # or english
AI_FORCE_LANGUAGE=true  # Force language in system prompt

# Psychology Detection (Legacy - mostly disabled)
ENABLE_PSYCHOLOGY_DETECTION=false
ENABLE_IFS_DETECTION=false
ENABLE_MULTI_FRAMEWORK=false

# Module Recommendation Settings
ENABLE_PATTERN_RECOGNITION=true
ENABLE_EMOTIONAL_PROGRESSION=true
MAX_MODULE_RECOMMENDATIONS=2

# Individual Indicator Settings
EMOTIONAL_INTENSITY_INTERVAL=5
EMOTIONAL_CLARITY_INTERVAL=5
SOMATIC_AWARENESS_WINDOW_SIZE=3
PARTS_LANGUAGE_CONFIDENCE_THRESHOLD=0.3
```

## Database Schema

### **conversations** table
- `id` (Primary Key)
- `session_id` (Unique, UUID)
- `user_id` (Optional)
- `created_at`, `updated_at` (Timestamps)
- **`metadata`** (JSON) - Stores conversation-level data:
  - `emotional_states`: Array of emotional intensity scores for progression tracking
  - Custom conversation metadata

### **messages** table
- `id` (Primary Key)
- `conversation_id` (Foreign Key → conversations)
- `role` (Enum: user, assistant, system)
- `content` (Text)
- `created_at` (Timestamp)
- **`metadata`** (JSON) - Stores message-level analysis:
  - `module_recommendations`: Array of recommended modules
  - `psychological_state`: 5-indicator state analysis
  - `patterns`: Detected defense mechanisms, attachment patterns, themes
  - `progression`: Emotional trajectory analysis

## Design Principles

### **Guidance ≠ Recommendation**
- Use "如果你愿意" (if you're willing) - always leave space for "no"
- Module suggestions are part of conversation flow, not interruptions
- Never command or prescribe - offer and invite

### **Module is Not the End**
- After module completion → followup conversation
- Module result becomes new conversation anchor
- Example: After emotion labeling → "你选了'疲惫'，这个词很轻但很准。它更像是一直都有，还是最近才变重的？"
- Continue exploring, don't close the loop

### **Language Characteristics**
- **Non-command**: Warm, supportive, collaborative
- **Brief**: 2-3 sentences max for guidance
- **Avoid**: "analyze", "psychology", "you should", "let's fix"
- **Use**: "represent", "if you'd like", "we can try together", "notice"

### **LLM-First Analysis**
- Trust LLM judgment over rigid keyword rules
- Use conversation context, not just current message
- Graceful fallback if LLM analysis fails

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/` | Send message, get AI response with module recommendations |
| POST | `/chat/analyze-image` | Analyze user-uploaded image with OpenAI Vision API |
| GET | `/conversations/session/{session_id}` | Get conversation history by session_id |
| POST | `/conversations/` | Create new conversation |
| DELETE | `/conversations/{id}` | Delete conversation by id |

Interactive API docs: `http://localhost:8000/docs`

## Testing

```bash
# Manual test scripts
./test_natural_conversation.sh      # Test natural conversation flow
./test_context_aware_gating.sh      # Test module recommendation logic
./test_module_recommendations.sh    # Test module system

# Python test
python3 test_module_recommendations.py

# Test scenarios:
# 1. High anxiety + somatic signals → Breathing Exercise
# 2. Vague expression → Emotion Labeling
# 3. Symbolic/complex language → Inner Doodling
# 4. New user + exploration desire → Quick Assessment
```

## Common Tasks

### **Add new module:**
1. Add to `module_config.py` MODULES dict with metadata
2. Add trigger logic in `trigger_detector.py` TRIGGER_FUNCTIONS
3. Create 4 guidance templates (early/mid/late conversation, high intensity)
4. Add followup templates for post-module conversation

### **Adjust trigger thresholds:**
Edit `trigger_detector.py` THRESHOLDS constant:
```python
THRESHOLDS = {
    "breathing_exercise": {"intensity": 0.7, "somatic": 0.7},
    "emotion_labeling": {"clarity": 0.4},
    # ...
}
```

### **Change guidance templates:**
Edit `module_config.py` guidance_template_zh/en arrays for each module

### **Modify LLM analysis prompt:**
Edit `llm_analyzer.py` analyze_state_with_llm() prompt structure

### **Add new pattern types:**
Edit `pattern_recognition.py` DEFENSE_MECHANISMS, ATTACHMENT_PATTERNS dicts

## Architecture Notes

### **Why LLM-Based Analysis?**
The system **evolved** from a complex multi-framework psychology detection system (IFS, CBT, Attachment Theory, Jungian, Narrative Therapy) to a **focused LLM-based module recommendation system**.

**Previous approach** (removed):
- `src/ifs/` - IFS detection with keyword matching
- `src/psychology/` - Multi-framework detectors, adapters, framework manager
- Complex keyword-based pattern matching
- Separate logic for Chinese and English

**Current approach** (simplified):
- Single LLM call analyzes psychological state
- Context-aware (entire conversation, not just keywords)
- Naturally bilingual (no separate rules)
- Focused on **actionable recommendations** not diagnostic labels

**Tradeoff**: Less theoretical depth, more practical utility

### **Why 4 Modules?**
These 4 modules represent the **most universally useful interventions** across therapeutic modalities:
1. **Somatic regulation** (breathing) - Body-first approach
2. **Emotional literacy** (labeling) - Cognitive clarity
3. **Creative expression** (doodling) - Non-verbal processing
4. **Self-assessment** (quick test) - Holistic integration

### **Extensibility**
The system is designed to be extensible:
- Add new modules easily in `module_config.py`
- Plug in different analyzers (keyword-based, rule-based, hybrid)
- Pattern recognition is modular and toggleable
- Frontend-agnostic API design (returns structured JSON)

## Documentation

- **`CLAUDE.md`** (this file) - Complete project overview and instructions
- **`MODULE_RECOMMENDATION_SYSTEM.md`** - Deep dive into recommendation system
- **`FRONTEND_INTEGRATION_GUIDE.md`** - Frontend integration guide
- **`NATURAL_CONVERSATION_UPDATE.md`** - Natural conversation design notes
- **`CONTEXT_AWARE_RECOMMENDATIONS.md`** - Context-aware recommendation logic
- **`SHARING_QUICK_START.md`** - Quick start for sharing feature
- **`TUNNELING_GUIDE.md`** - Development tunneling setup
- **`ai-chat-api/README.md`** - API-specific documentation

## Recent Changes

### **Simplified Architecture** (January 2026)
- **Removed**: `src/ifs/` and `src/psychology/` multi-framework detection system
- **Added**: LLM-based psychological analysis with GPT-3.5-turbo
- **Focus**: Module recommendations as primary value proposition
- **Result**: Cleaner codebase, more accurate analysis, easier maintenance

### **Key Additions**
- Image analysis endpoint (OpenAI Vision API)
- Pattern recognition (defense mechanisms, attachment patterns)
- Emotional progression tracking
- Report generation system
- Extensive configuration via environment variables

---

**Version**: 3.0.0 (LLM-Based Analysis)
**Updated**: 2026-01-13
**Python**: 3.10+
**License**: Proprietary
