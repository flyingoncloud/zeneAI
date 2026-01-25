# Module Completion Data - Database Storage Guide

## Overview
This guide explains how module completion data is stored in the database and how to access it.

---

## Database Model

### Primary Table: `conversations`

**File**: `ai-chat-api/src/database/models.py`

```python
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    extra_data = Column("metadata", JSON, default={})  # ← Module data stored here!

    messages = relationship("Message", back_populates="conversation")
```

### Key Field: `extra_data` (stored as `metadata` in DB)

The `extra_data` field is a **JSON column** that stores all module-related data. It has this structure:

```json
{
  "module_status": {
    "breathing_exercise": {
      "recommended_at": "2026-01-18T10:00:00Z",
      "completed_at": "2026-01-18T10:15:00Z",
      "completion_data": {
        "completed_steps": ["breathing", "emotion_naming"],
        "emotion": "Anxious",
        "intensity": 65,
        "timestamp": "2026-01-18T10:15:00Z"
      }
    },
    "emotion_labeling": {
      "recommended_at": "2026-01-18T11:00:00Z",
      "completed_at": "2026-01-18T11:05:00Z",
      "completion_data": {
        "mood": "Happy",
        "date": "2026-01-18",
        "note": "Feeling great today!"
      }
    },
    "inner_doodling": {
      "recommended_at": "2026-01-18T12:00:00Z",
      "completed_at": "2026-01-18T12:10:00Z",
      "completion_data": {
        "sketch_data": {
          "has_drawing": true
        }
      }
    },
    "quick_assessment": {
      "recommended_at": "2026-01-18T13:00:00Z",
      "completed_at": "2026-01-18T13:10:00Z",
      "completion_data": {
        "answers": {
          "0": 3,
          "1": 4,
          "2": 2,
          "3": 5,
          "4": 3
        },
        "total_questions": 10
      }
    }
  }
}
```

---

## API Endpoint

### Complete Module Endpoint

**File**: `ai-chat-api/src/api/app.py`

**Endpoint**: `POST /conversations/{conversation_id}/modules/{module_id}/complete`

**Implementation**:
```python
@app.post("/conversations/{conversation_id}/modules/{module_id}/complete")
def complete_module(
    conversation_id: int,
    module_id: str,
    completion_request: api_models.ModuleCompletionRequest,
    db: Session = Depends(get_db)
):
    """
    Mark a module as completed

    This endpoint:
    1. Validates the module_id
    2. Retrieves the conversation
    3. Updates the module_status in extra_data
    4. Stores completion_data
    5. Commits to database
    """

    # Validate module_id
    valid_modules = ["breathing_exercise", "emotion_labeling",
                     "inner_doodling", "quick_assessment"]
    if module_id not in valid_modules:
        raise HTTPException(status_code=400, detail="Invalid module_id")

    # Get conversation
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Ensure metadata structure exists
    if not conversation.extra_data:
        conversation.extra_data = {}
    if "module_status" not in conversation.extra_data:
        conversation.extra_data["module_status"] = {}

    # Update module status
    module_status = conversation.extra_data["module_status"]

    if module_id not in module_status:
        module_status[module_id] = {}

    # Store completion timestamp
    module_status[module_id]["completed_at"] = datetime.utcnow().isoformat()

    # Store completion data (emotion, intensity, answers, etc.)
    if completion_request.completion_data:
        module_status[module_id]["completion_data"] = completion_request.completion_data

    # Save to database
    conversation.extra_data["module_status"] = module_status
    flag_modified(conversation, "extra_data")  # Important for JSON columns!
    db.commit()
    db.refresh(conversation)

    return {
        "status": "completed",
        "module_id": module_id,
        "completed_at": module_status[module_id]["completed_at"],
        "module_status": module_status
    }
```

---

## Request/Response Models

**File**: `ai-chat-api/src/api/api_models.py` (or similar)

```python
from pydantic import BaseModel
from typing import Optional, Dict, Any

class ModuleCompletionRequest(BaseModel):
    completion_data: Optional[Dict[str, Any]] = None
```

---

## Data Flow

### 1. Frontend Sends Completion Request

```typescript
// zeneme-next/src/lib/api.ts
export async function completeModule(
  conversationId: number,
  moduleId: string,
  completionData?: Record<string, any>
): Promise<{ ok: boolean; module_status?: Record<string, any> }> {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/modules/${moduleId}/complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        completion_data: completionData || {}
      }),
    }
  );

  const data = await response.json();
  return { ok: true, module_status: data.module_status };
}
```

### 2. Backend Stores in Database

```python
# The data is stored in the conversations table
# In the extra_data (metadata) JSON column
# Under the path: extra_data["module_status"][module_id]["completion_data"]
```

### 3. Database Storage

```sql
-- PostgreSQL example
SELECT
    id,
    session_id,
    extra_data->'module_status'->'breathing_exercise'->'completion_data' as breathing_data
FROM conversations
WHERE id = 123;

-- Result:
{
  "completed_steps": ["breathing", "emotion_naming"],
  "emotion": "Anxious",
  "intensity": 65,
  "timestamp": "2026-01-18T10:15:00Z"
}
```

---

## Querying Module Completion Data

### Get All Module Completions for a Conversation

```python
from sqlalchemy.orm import Session
from src.database import models as db_models

def get_module_completions(conversation_id: int, db: Session):
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation or not conversation.extra_data:
        return {}

    return conversation.extra_data.get("module_status", {})
```

### Get Specific Module Completion Data

```python
def get_module_completion_data(conversation_id: int, module_id: str, db: Session):
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation or not conversation.extra_data:
        return None

    module_status = conversation.extra_data.get("module_status", {})
    module_data = module_status.get(module_id, {})

    return module_data.get("completion_data")
```

### Get All Breathing Exercise Completions for a User

```python
def get_user_breathing_completions(session_id: str, db: Session):
    """Get all breathing exercise completions for a user across all conversations"""
    conversations = db.query(db_models.Conversation).filter(
        db_models.Conversation.session_id == session_id
    ).all()

    completions = []
    for conv in conversations:
        if not conv.extra_data:
            continue

        module_status = conv.extra_data.get("module_status", {})
        breathing_data = module_status.get("breathing_exercise", {})

        if breathing_data.get("completed_at"):
            completions.append({
                "conversation_id": conv.id,
                "completed_at": breathing_data["completed_at"],
                "data": breathing_data.get("completion_data", {})
            })

    return completions
```

---

## SQL Queries (PostgreSQL)

### Get All Completed Modules for a Conversation

```sql
SELECT
    id,
    session_id,
    jsonb_object_keys(extra_data->'module_status') as module_id,
    extra_data->'module_status'->jsonb_object_keys(extra_data->'module_status')->'completed_at' as completed_at,
    extra_data->'module_status'->jsonb_object_keys(extra_data->'module_status')->'completion_data' as completion_data
FROM conversations
WHERE id = 123;
```

### Get All Breathing Exercise Emotions

```sql
SELECT
    id,
    session_id,
    extra_data->'module_status'->'breathing_exercise'->'completion_data'->>'emotion' as emotion,
    extra_data->'module_status'->'breathing_exercise'->'completion_data'->>'intensity' as intensity,
    extra_data->'module_status'->'breathing_exercise'->>'completed_at' as completed_at
FROM conversations
WHERE extra_data->'module_status'->'breathing_exercise'->'completed_at' IS NOT NULL
ORDER BY created_at DESC;
```

### Get Quick Assessment Scores

```sql
SELECT
    id,
    session_id,
    extra_data->'module_status'->'quick_assessment'->'completion_data'->'answers' as answers,
    extra_data->'module_status'->'quick_assessment'->>'completed_at' as completed_at
FROM conversations
WHERE extra_data->'module_status'->'quick_assessment'->'completed_at' IS NOT NULL;
```

---

## Important Notes

### 1. JSON Column Modification

When updating JSON columns in SQLAlchemy, you **must** use `flag_modified`:

```python
from sqlalchemy.orm.attributes import flag_modified

conversation.extra_data["module_status"] = module_status
flag_modified(conversation, "extra_data")  # ← Critical!
db.commit()
```

Without `flag_modified`, SQLAlchemy won't detect the change and won't update the database.

### 2. Data Validation

The endpoint validates module_id against a whitelist:

```python
valid_modules = ["breathing_exercise", "emotion_labeling",
                 "inner_doodling", "quick_assessment"]
```

### 3. Timestamps

All timestamps are stored in ISO 8601 format:
```python
datetime.utcnow().isoformat()  # "2026-01-18T10:15:00.123456"
```

### 4. Null Safety

Always check for null/missing data:

```python
if not conversation.extra_data:
    conversation.extra_data = {}
if "module_status" not in conversation.extra_data:
    conversation.extra_data["module_status"] = {}
```

---

## Integration with Psychology Reports

The completion data is used in psychology report generation:

**File**: `ai-chat-api/src/services/psychology/report_assembler.py`

```python
def analyze_module_completions(conversation_id: int, db: Session):
    """Analyze module completion data for psychology report"""
    conversation = db.query(db_models.Conversation).filter(
        db_models.Conversation.id == conversation_id
    ).first()

    if not conversation or not conversation.extra_data:
        return {}

    module_status = conversation.extra_data.get("module_status", {})

    # Analyze breathing exercise emotions
    breathing = module_status.get("breathing_exercise", {})
    if breathing.get("completion_data"):
        emotion = breathing["completion_data"].get("emotion")
        intensity = breathing["completion_data"].get("intensity")
        # Use this data in report...

    # Analyze quick assessment scores
    assessment = module_status.get("quick_assessment", {})
    if assessment.get("completion_data"):
        answers = assessment["completion_data"].get("answers", {})
        # Calculate scores and trends...

    return analysis_results
```

---

## Summary

**Where is the data stored?**
- **Table**: `conversations`
- **Column**: `extra_data` (stored as `metadata` in database)
- **Path**: `extra_data["module_status"][module_id]["completion_data"]`

**What data is stored?**
- Breathing Exercise: emotion, intensity, completed_steps, timestamp
- Emotion Labeling: mood, date, note
- Inner Doodling: sketch_data (has_drawing)
- Quick Assessment: answers (question index → score), total_questions

**How to access it?**
- Via SQLAlchemy: `conversation.extra_data["module_status"][module_id]["completion_data"]`
- Via SQL: `extra_data->'module_status'->'breathing_exercise'->'completion_data'`
- Via API: `GET /conversations/{id}/modules` returns all module status

**Key files to reference**:
- Database model: `ai-chat-api/src/database/models.py`
- API endpoint: `ai-chat-api/src/api/app.py` (line 250+)
- Frontend API: `zeneme-next/src/lib/api.ts`
