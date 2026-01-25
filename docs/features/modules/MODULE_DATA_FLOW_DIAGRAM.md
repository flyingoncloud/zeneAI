# Module Completion Data Flow - Visual Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ EmotionalFirstAid Component                                  │ │
│  │                                                              │ │
│  │  User completes breathing + emotion naming                  │ │
│  │  ↓                                                           │ │
│  │  Captures: emotion="Anxious", intensity=65                  │ │
│  │  ↓                                                           │ │
│  │  Calls: completeModuleWithRetry(                            │ │
│  │    conversationId,                                          │ │
│  │    "breathing_exercise",                                    │ │
│  │    { emotion, intensity, completed_steps, timestamp }       │ │
│  │  )                                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ api.ts - completeModule()                                    │ │
│  │                                                              │ │
│  │  POST /conversations/123/modules/breathing_exercise/complete│ │
│  │  Body: { completion_data: { emotion, intensity, ... } }     │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ HTTP Request
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI + Python)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ app.py - complete_module() endpoint                          │ │
│  │                                                              │ │
│  │  1. Validate module_id                                       │ │
│  │  2. Get conversation from database                           │ │
│  │  3. Update extra_data["module_status"]                       │ │
│  │  4. Store completion_data                                    │ │
│  │  5. flag_modified(conversation, "extra_data")                │ │
│  │  6. db.commit()                                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                              ↓                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ SQLAlchemy ORM                                               │ │
│  │                                                              │ │
│  │  conversation.extra_data = {                                 │ │
│  │    "module_status": {                                        │ │
│  │      "breathing_exercise": {                                 │ │
│  │        "completed_at": "2026-01-18T10:15:00Z",              │ │
│  │        "completion_data": {                                  │ │
│  │          "emotion": "Anxious",                               │ │
│  │          "intensity": 65,                                    │ │
│  │          "completed_steps": [...],                           │ │
│  │          "timestamp": "..."                                  │ │
│  │        }                                                      │ │
│  │      }                                                        │ │
│  │    }                                                          │ │
│  │  }                                                            │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              ↓ SQL UPDATE
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL/SQLite)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ conversations table                                          │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ id  │ session_id │ extra_data (JSON/metadata)              │ │
│  ├─────┼────────────┼─────────────────────────────────────────┤ │
│  │ 123 │ abc-def... │ {                                       │ │
│  │     │            │   "module_status": {                    │ │
│  │     │            │     "breathing_exercise": {             │ │
│  │     │            │       "recommended_at": "...",          │ │
│  │     │            │       "completed_at": "...",            │ │
│  │     │            │       "completion_data": {              │ │
│  │     │            │         "emotion": "Anxious",           │ │
│  │     │            │         "intensity": 65,                │ │
│  │     │            │         "completed_steps": [...],       │ │
│  │     │            │         "timestamp": "..."              │ │
│  │     │            │       }                                  │ │
│  │     │            │     },                                   │ │
│  │     │            │     "emotion_labeling": {...},          │ │
│  │     │            │     "inner_doodling": {...},            │ │
│  │     │            │     "quick_assessment": {...}           │ │
│  │     │            │   }                                      │ │
│  │     │            │ }                                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Detail

```
conversations table
┌─────────────────────────────────────────────────────────────────┐
│ Column Name  │ Type         │ Description                      │
├──────────────┼──────────────┼──────────────────────────────────┤
│ id           │ INTEGER      │ Primary key                      │
│ session_id   │ VARCHAR(255) │ Unique session identifier        │
│ user_id      │ VARCHAR(255) │ User identifier (nullable)       │
│ created_at   │ DATETIME     │ Conversation creation time       │
│ updated_at   │ DATETIME     │ Last update time                 │
│ extra_data   │ JSON         │ ← MODULE DATA STORED HERE        │
│ (metadata)   │              │   (column name in DB: metadata)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## JSON Structure in extra_data

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
        "note": "Feeling great!"
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
          "2": 2
        },
        "total_questions": 10
      }
    }
  }
}
```

---

## Data Access Patterns

### 1. Get Module Status for a Conversation

```python
# Python (Backend)
conversation = db.query(Conversation).filter(Conversation.id == 123).first()
module_status = conversation.extra_data.get("module_status", {})
```

```sql
-- SQL (Direct Query)
SELECT extra_data->'module_status'
FROM conversations
WHERE id = 123;
```

### 2. Get Specific Module Completion Data

```python
# Python
breathing_data = conversation.extra_data\
    .get("module_status", {})\
    .get("breathing_exercise", {})\
    .get("completion_data", {})

emotion = breathing_data.get("emotion")
intensity = breathing_data.get("intensity")
```

```sql
-- SQL
SELECT
    extra_data->'module_status'->'breathing_exercise'->'completion_data'->>'emotion' as emotion,
    extra_data->'module_status'->'breathing_exercise'->'completion_data'->>'intensity' as intensity
FROM conversations
WHERE id = 123;
```

### 3. Find All Completed Breathing Exercises

```sql
-- SQL
SELECT
    id,
    session_id,
    extra_data->'module_status'->'breathing_exercise'->'completion_data' as data,
    extra_data->'module_status'->'breathing_exercise'->>'completed_at' as completed_at
FROM conversations
WHERE extra_data->'module_status'->'breathing_exercise'->'completed_at' IS NOT NULL
ORDER BY created_at DESC;
```

---

## Module Completion Flow by Module Type

### Breathing Exercise Flow

```
User Journey:
1. AI recommends breathing exercise
   ↓
2. User clicks module card → navigates to EmotionalFirstAid
   ↓
3. User completes breathing animation
   ↓
4. User selects emotion (e.g., "Anxious") and intensity (65)
   ↓
5. User clicks "Save and Exit"
   ↓
6. Frontend calls: completeModule(conversationId, "breathing_exercise", {
      emotion: "Anxious",
      intensity: 65,
      completed_steps: ["breathing", "emotion_naming"],
      timestamp: "2026-01-18T10:15:00Z"
   })
   ↓
7. Backend stores in: conversations.extra_data["module_status"]["breathing_exercise"]
   ↓
8. User returns to chat → module card no longer shows (filtered out)
```

### Quick Assessment Flow

```
User Journey:
1. AI recommends quick assessment
   ↓
2. User clicks module card → navigates to InnerQuickTest
   ↓
3. User answers 10 questions (1-5 scale each)
   ↓
4. On last question, frontend calls: completeModule(conversationId, "quick_assessment", {
      answers: { "0": 3, "1": 4, "2": 2, ... },
      total_questions: 10
   })
   ↓
5. Backend stores in: conversations.extra_data["module_status"]["quick_assessment"]
   ↓
6. User sees results page
   ↓
7. User returns to chat → module card no longer shows
```

---

## Key Implementation Files

```
Frontend:
├── zeneme-next/src/lib/api.ts
│   └── completeModule() - API call function
│   └── completeModuleWithRetry() - With retry logic
│
├── zeneme-next/src/components/features/tools/
│   ├── EmotionalFirstAid.tsx - Breathing exercise
│   ├── InnerSketch.tsx - Doodling
│   ├── InnerQuickTest.tsx - Assessment
│   └── MoodTracker.tsx - Mood logging
│
└── zeneme-next/src/hooks/useZenemeStore.tsx
    └── conversationId state - Tracks current conversation

Backend:
├── ai-chat-api/src/database/models.py
│   └── Conversation model - Database schema
│
├── ai-chat-api/src/api/app.py
│   └── complete_module() endpoint - Stores completion data
│
└── ai-chat-api/src/api/api_models.py
    └── ModuleCompletionRequest - Request model
```

---

## Testing the Data Flow

### 1. Check if Data is Being Sent

```typescript
// In browser console after completing a module:
// Look for this log:
console.log('[Module Completed]', {
  module_id: 'breathing_exercise',
  conversation_id: 123,
  emotion: 'Anxious',
  intensity: 65,
  timestamp: '2026-01-18T10:15:00Z'
});
```

### 2. Check Backend Logs

```bash
# Backend should log:
INFO: Marking module breathing_exercise as complete for conversation 123
INFO: Successfully marked module breathing_exercise as complete
```

### 3. Query Database Directly

```sql
-- Check if data was stored
SELECT
    id,
    session_id,
    extra_data->'module_status'->'breathing_exercise' as breathing_module
FROM conversations
WHERE id = 123;
```

### 4. Use API to Retrieve

```bash
# Get module status via API
curl http://localhost:8000/conversations/123/modules
```

---

## Common Issues and Solutions

### Issue 1: Data Not Persisting

**Problem**: Completion data sent but not saved in database

**Solution**: Ensure `flag_modified` is called:
```python
conversation.extra_data["module_status"] = module_status
flag_modified(conversation, "extra_data")  # ← Must have this!
db.commit()
```

### Issue 2: Null/Missing Data

**Problem**: `extra_data` is null or missing `module_status`

**Solution**: Initialize structure before accessing:
```python
if not conversation.extra_data:
    conversation.extra_data = {}
if "module_status" not in conversation.extra_data:
    conversation.extra_data["module_status"] = {}
```

### Issue 3: Frontend Not Sending Data

**Problem**: `completion_data` is empty or undefined

**Solution**: Check that module components pass data correctly:
```typescript
// EmotionalFirstAid.tsx
const handleComplete = async (emotionData: { emotion: string; intensity: number }) => {
  await completeModuleWithRetry(conversationId, 'breathing_exercise', {
    emotion: emotionData.emotion,  // ← Must pass this
    intensity: emotionData.intensity,  // ← And this
    // ...
  });
};
```

---

## Summary

**Where**: `conversations` table → `extra_data` column → `module_status` object

**What**: Module completion timestamps and detailed completion data

**How**: Via `POST /conversations/{id}/modules/{module_id}/complete` endpoint

**Access**: Through SQLAlchemy ORM or direct SQL queries on JSON column

**Use**: For psychology reports, trend analysis, and personalized recommendations
