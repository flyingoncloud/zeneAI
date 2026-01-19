# Questionnaire Database Implementation Guide

## Overview
This document describes the complete database-backed questionnaire system with automatic scoring calculation.

## Architecture

### Database Schema

#### Tables Created
1. **questionnaires** - Stores questionnaire metadata
   - `id` (PK): questionnaire_2_1, questionnaire_2_2, etc.
   - `section`: 2.1, 2.2, 2.3, 2.5
   - `title`: Questionnaire title in Chinese
   - `marking_criteria`: JSON with scoring rules
   - `created_at`: Timestamp

2. **questions** - Stores individual questions
   - `id` (PK): Auto-increment
   - `questionnaire_id` (FK): Links to questionnaires
   - `question_number`: Question number within questionnaire
   - `text`: Question text
   - `category`: Category name (e.g., "Managers", "Secure")
   - `sub_section`: Sub-section ID (e.g., "2.2.1")
   - `dimension`: Dimension name (e.g., "Insight Depth")
   - `options`: JSON for multiple choice options
   - `created_at`: Timestamp

3. **questionnaire_responses** - Stores user responses
   - `id` (PK): Auto-increment
   - `conversation_id` (FK): Links to conversations
   - `questionnaire_id` (FK): Links to questionnaires
   - `total_score`: Calculated total score
   - `category_scores`: JSON with scores per category
   - `interpretation`: JSON with interpretation results
   - `completed_at`: Timestamp
   - `metadata`: JSON for additional data

4. **answers** - Stores individual answers
   - `id` (PK): Auto-increment
   - `response_id` (FK): Links to questionnaire_responses
   - `question_id` (FK): Links to questions
   - `answer_value`: Numeric answer (1-5)
   - `answered_at`: Timestamp

### Scoring Service

**File**: `ai-chat-api/src/services/questionnaire_scoring.py`

Implements scoring logic for each questionnaire type:

#### Questionnaire 2.1 - Emotional Insight
- Simple sum of all answers (1-5 scale)
- Interpretation based on score ranges:
  - 40-50: High emotional awareness
  - 25-39: Medium emotional awareness
  - 10-24: Low emotional awareness

#### Questionnaire 2.2 - Cognitive Insight
- Complex scoring with multiple sub-sections
- Scores calculated per category (Managers, Firefighters, Exiles, Self Energy)
- Automatic thought patterns scored separately

#### Questionnaire 2.3 - Relational Insight
- Scores by attachment patterns (Secure, Anxious, Avoidant, Disorganized)
- Identifies dominant attachment pattern
- Scores for empathy, conflict triggers, inner conflict

#### Questionnaire 2.5 - Growth & Transformation
- Option-based scoring (A=1, B=3, C=5)
- Standardization formula: (Q1 + Q2) / 10 * 100

## Setup Instructions

### 1. Initialize Database Tables

The tables are automatically created when the app starts (via `init_db()` in `app.py`).

### 2. Load Questionnaire Data

Run the data loader script to import JSON questionnaires into the database:

```bash
cd ai-chat-api
python -m src.scripts.load_questionnaires
```

This script:
- Reads all `questionnaire_*.json` files from `src/resources/questionnaire_jsons/`
- Creates questionnaire records
- Extracts and saves all questions with proper categorization
- Handles different JSON structures (flat, nested, dimensions)

**Expected Output**:
```
✓ Loaded questionnaire_2_1: 10 questions
✓ Loaded questionnaire_2_2: 46 questions
✓ Loaded questionnaire_2_3: 27 questions
✓ Loaded questionnaire_2_5: 6 questions
✓ All questionnaires loaded successfully!
```

### 3. Verify Database

Check that tables were created and data loaded:

```bash
# For SQLite
sqlite3 ai-chat-api/chat.db
.tables
SELECT COUNT(*) FROM questionnaires;
SELECT COUNT(*) FROM questions;
```

Expected results:
- 4 questionnaires
- 89 questions total

## API Endpoints

### GET /questionnaires
Returns all available questionnaires with metadata.

**Response**:
```json
{
  "questionnaires": [
    {
      "id": "questionnaire_2_1",
      "section": "2.1",
      "title": "情绪觉察 (Emotional Insight Analysis)",
      "total_questions": 10,
      "marking_criteria": {...}
    }
  ]
}
```

### GET /questionnaires/{questionnaire_id}
Returns a specific questionnaire with all questions.

**Response**:
```json
{
  "id": "questionnaire_2_1",
  "section": "2.1",
  "title": "情绪觉察",
  "questions": [
    {
      "id": 1,
      "text": "我能清楚地知道自己在不同情况下的情绪。",
      "category": null,
      "sub_section": null,
      "dimension": null,
      "options": null
    }
  ],
  "total_questions": 10,
  "marking_criteria": {...}
}
```

### POST /conversations/{conversation_id}/questionnaires/submit
Submits answers, calculates scores, and saves to database.

**Request**:
```json
{
  "questionnaire_id": "questionnaire_2_1",
  "answers": {
    "1": 5,
    "2": 4,
    "3": 5,
    ...
  },
  "metadata": {
    "part_of_combined": true,
    "section": "2.1"
  }
}
```

**Response**:
```json
{
  "message": "Questionnaire response saved successfully",
  "conversation_id": 123,
  "questionnaire_id": "questionnaire_2_1",
  "response_id": 456,
  "scoring": {
    "total_score": 45,
    "interpretation": {
      "level": "高情绪觉察",
      "description": "能识别、理解并表达情绪。",
      "score_range": [40, 50]
    },
    "category_scores": null
  },
  "module_completed": "quick_assessment"
}
```

### GET /conversations/{conversation_id}/questionnaires
Returns all questionnaire responses with scores for a conversation.

**Response**:
```json
{
  "conversation_id": 123,
  "responses": {
    "questionnaire_2_1": {
      "response_id": 456,
      "questionnaire_title": "情绪觉察",
      "total_score": 45,
      "category_scores": null,
      "interpretation": {...},
      "completed_at": "2026-01-18T10:30:00",
      "answer_count": 10,
      "metadata": {...}
    }
  }
}
```

## Frontend Implementation

### Combined Questionnaire Flow

1. **Load All Questionnaires**: On mount, fetch all 4 questionnaires
2. **Combine Questions**: Merge all questions into single array (89 total)
3. **Track Metadata**: Store start/end indices for each questionnaire
4. **Present as One Test**: User answers all 89 questions sequentially
5. **Split Answers**: When complete, split answers by questionnaire
6. **Submit Separately**: Submit each questionnaire's answers individually
7. **Calculate Scores**: Backend calculates scores per questionnaire
8. **Display Results**: Show calculated scores and interpretations

### Key Files

- **Frontend**: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`
- **API Client**: `zeneme-next/src/lib/api.ts`
- **Backend**: `ai-chat-api/src/api/app.py`
- **Scoring**: `ai-chat-api/src/services/questionnaire_scoring.py`
- **Models**: `ai-chat-api/src/database/questionnaire_models.py`
- **Loader**: `ai-chat-api/src/scripts/load_questionnaires.py`

## Data Flow

```
User completes 89 questions
    ↓
Frontend splits answers by questionnaire (4 groups)
    ↓
Submit each questionnaire separately to backend
    ↓
Backend receives answers for questionnaire_2_1
    ↓
Fetch questionnaire and questions from database
    ↓
Calculate score using QuestionnaireScorer
    ↓
Save QuestionnaireResponse with calculated scores
    ↓
Save individual Answers linked to response
    ↓
Return scoring results to frontend
    ↓
Repeat for questionnaires 2.2, 2.3, 2.5
    ↓
Display all scores in results view
```

## Testing

### 1. Test Data Loading
```bash
python -m src.scripts.load_questionnaires
```

### 2. Test API Endpoints
```bash
# Get all questionnaires
curl http://localhost:8000/questionnaires

# Get specific questionnaire
curl http://localhost:8000/questionnaires/questionnaire_2_1

# Submit responses (requires conversation_id)
curl -X POST http://localhost:8000/conversations/1/questionnaires/submit \
  -H "Content-Type: application/json" \
  -d '{"questionnaire_id":"questionnaire_2_1","answers":{"1":5,"2":4,...}}'
```

### 3. Test Frontend
1. Start backend: `cd ai-chat-api && python run.py`
2. Start frontend: `cd zeneme-next && npm run dev`
3. Navigate to Inner Quick Test module
4. Complete all 89 questions
5. Verify scores are calculated and displayed

## Troubleshooting

### Tables Not Created
- Check `ai-chat-api/src/database/database.py` imports questionnaire_models
- Run `init_db()` manually or restart the app

### Data Not Loading
- Verify JSON files exist in `src/resources/questionnaire_jsons/`
- Check file permissions
- Review script output for errors

### Scoring Errors
- Verify marking_criteria exists in questionnaire
- Check answer format (must be integers)
- Review QuestionnaireScorer logic for specific questionnaire

### Frontend Not Displaying Scores
- Check browser console for API errors
- Verify submission response includes `scoring` field
- Check that all 4 questionnaires were submitted successfully

## Next Steps

1. **Display Scores in Results View**: Update frontend to show calculated scores
2. **Add Score Visualization**: Create charts for category scores
3. **Implement Interpretation Display**: Show interpretation text based on scores
4. **Add Score History**: Allow users to view past questionnaire results
5. **Export Results**: Add PDF/CSV export functionality

## Notes

- All questionnaire data is stored in database, not JSON files
- Scores are calculated server-side for consistency
- Each questionnaire submission is independent
- Module completion is tracked in conversation metadata
- Backward compatibility maintained with extra_data storage
