# Questionnaire Extension Guide

## Overview
This guide explains how to add new questionnaires or modify existing ones in the ZeneAI system.

## Current Questionnaires
- **2.1** - 情绪觉察 (Emotional Insight Analysis) - 10 questions
- **2.2** - 认知模式 (Cognitive Insight Analysis) - 46 questions
- **2.3** - 关系模式 (Relational Insight) - 27 questions
- **2.5** - 成长指数与变化潜能 (Growth & Transformation Potential) - 6 questions

## Adding a New Questionnaire

### Step 1: Create JSON File

Create a new JSON file in `ai-chat-api/src/resources/questionnaire_jsons/`

**File naming convention:** `questionnaire_{section}.json`

Example: `questionnaire_2_4.json`

**JSON Structure:**

```json
{
  "section": "2.4",
  "title": "Your Questionnaire Title (English/Chinese)",
  "marking_criteria": {
    "scale": "1-5 Likert Scale",
    "total_score_range": [0, 100],
    "interpretation": [
      {
        "range": [0, 30],
        "level": "Low",
        "description": "Description for low scores"
      },
      {
        "range": [31, 70],
        "level": "Medium",
        "description": "Description for medium scores"
      },
      {
        "range": [71, 100],
        "level": "High",
        "description": "Description for high scores"
      }
    ]
  },
  "questions": [
    {
      "text": "Question text here",
      "options": [
        {"label": "完全不符合", "score": 1},
        {"label": "不太符合", "score": 2},
        {"label": "一般", "score": 3},
        {"label": "比较符合", "score": 4},
        {"label": "完全符合", "score": 5}
      ]
    }
  ]
}
```

### Step 2: Understand JSON Structures

The system supports multiple question structures:

#### Simple Questions List
```json
{
  "questions": [
    {
      "text": "Question 1",
      "options": [...]
    },
    {
      "text": "Question 2",
      "options": [...]
    }
  ]
}
```

#### Categorized Questions
```json
{
  "categories": {
    "Category Name": [
      {
        "text": "Question in this category",
        "options": [...]
      }
    ]
  }
}
```

#### Sub-sections
```json
{
  "sub_sections": {
    "2.4.1": {
      "title": "Sub-section Title",
      "questions": [...]
    }
  }
}
```

#### Dimensions
```json
{
  "dimensions": {
    "Dimension Name": [
      {
        "text": "Question for this dimension",
        "options": [...]
      }
    ]
  }
}
```

### Step 3: Seed the Database

**Option A: Automatic (on backend restart)**
The seeding script runs automatically when the backend starts. Just restart:

```bash
cd ai-chat-api
python run.py
```

**Option B: Manual seeding**
Run the seeding script directly:

```bash
cd ai-chat-api
python -c "
from src.database.database import SessionLocal
from src.database.questionnaire_seeding import seed_questionnaires

db = SessionLocal()
seed_questionnaires(db)
db.close()
"
```

**Option C: Using the load script**
```bash
cd ai-chat-api
python src/scripts/load_questionnaires.py
```

### Step 4: Verify the Questionnaire

Check that it was added correctly:

```bash
# Check database
PGPASSWORD=chat_pass psql -h localhost -U chat_user -d chat_db -c "
SELECT id, section, title,
       (SELECT COUNT(*) FROM assessment_questions WHERE questionnaire_id = q.id) as question_count
FROM assessment_questionnaires q
ORDER BY id;
"

# Test API
curl http://localhost:8000/questionnaires
```

### Step 5: Update Frontend (if needed)

If you want to display the new questionnaire in the UI, update the questionnaire selection component:

**File:** `zeneme-next/src/components/features/tools/QuickAssessment.tsx`

The questionnaires are loaded dynamically from the API, so no frontend changes are needed unless you want custom UI for specific questionnaires.

## Modifying Existing Questionnaires

### Adding Questions to Existing Questionnaire

1. **Edit the JSON file** in `ai-chat-api/src/resources/questionnaire_jsons/`
2. **Add new questions** to the appropriate section
3. **Delete the old questionnaire** from database:
   ```sql
   DELETE FROM assessment_questionnaires WHERE id = 'questionnaire_2_1';
   ```
4. **Re-seed** the questionnaire (see Step 3 above)

⚠️ **Warning:** This will delete all responses for that questionnaire!

### Safe Modification (Preserving Responses)

If you need to preserve existing responses:

1. **Create a new version** with a different section number (e.g., 2.1 → 2.1v2)
2. **Keep the old questionnaire** in the database
3. **Mark the old one as inactive** (if you add an `is_active` field)

## Question Options Format

### Standard 5-Point Likert Scale
```json
"options": [
  {"label": "完全不符合", "score": 1},
  {"label": "不太符合", "score": 2},
  {"label": "一般", "score": 3},
  {"label": "比较符合", "score": 4},
  {"label": "完全符合", "score": 5}
]
```

### Custom Options
```json
"options": [
  {"label": "Never", "score": 0},
  {"label": "Rarely", "score": 1},
  {"label": "Sometimes", "score": 2},
  {"label": "Often", "score": 3},
  {"label": "Always", "score": 4}
]
```

### Yes/No Questions
```json
"options": [
  {"label": "No", "score": 0},
  {"label": "Yes", "score": 1}
]
```

## Scoring System

### Total Score Calculation
The system automatically calculates:
- **Total Score**: Sum of all answer scores
- **Category Scores**: Sum of scores per category (if categorized)
- **Dimension Scores**: Sum of scores per dimension (if using dimensions)

### Interpretation
Define interpretation ranges in `marking_criteria`:

```json
"marking_criteria": {
  "scale": "1-5 Likert Scale",
  "total_score_range": [10, 50],  // Min and max possible scores
  "interpretation": [
    {
      "range": [10, 20],
      "level": "Low",
      "description": "Low emotional insight. Consider developing awareness practices."
    },
    {
      "range": [21, 35],
      "level": "Medium",
      "description": "Moderate emotional insight. Continue building on your strengths."
    },
    {
      "range": [36, 50],
      "level": "High",
      "description": "High emotional insight. You have strong self-awareness."
    }
  ]
}
```

## Database Schema

### Tables
- **assessment_questionnaires**: Questionnaire metadata
- **assessment_questions**: Individual questions
- **assessment_responses**: User's completed questionnaires
- **assessment_answers**: Individual answers to questions

### Relationships
```
assessment_questionnaires (1) ─── (many) assessment_questions
assessment_questionnaires (1) ─── (many) assessment_responses
assessment_responses (1) ─── (many) assessment_answers
assessment_questions (1) ─── (many) assessment_answers
```

## API Endpoints

### Get All Questionnaires
```
GET /questionnaires
```

Returns list of all questionnaires with metadata.

### Get Specific Questionnaire
```
GET /questionnaires/{questionnaire_id}
```

Returns full questionnaire with all questions.

### Submit Response
```
POST /conversations/{conversation_id}/questionnaires/submit
```

Body:
```json
{
  "questionnaire_id": "questionnaire_2_1",
  "answers": {
    "1": 4,
    "2": 3,
    "3": 5
  }
}
```

## Best Practices

### 1. Consistent ID Format
Always use the format: `questionnaire_{section}`
- ✅ `questionnaire_2_4`
- ❌ `2.4`

### 2. Question Numbering
Questions are automatically numbered sequentially. Don't include numbers in question text.

### 3. Score Ranges
Ensure `total_score_range` matches the actual possible scores:
- Min: number of questions × minimum score per question
- Max: number of questions × maximum score per question

Example: 10 questions with 1-5 scale = [10, 50]

### 4. Testing
Always test new questionnaires:
1. Load questionnaire in UI
2. Complete all questions
3. Submit and verify scoring
4. Check interpretation is correct

### 5. Backup Before Changes
Before modifying existing questionnaires:
```bash
# Backup database
pg_dump -h localhost -U chat_user chat_db > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Questionnaire Not Appearing
1. Check if JSON file is in correct directory
2. Verify JSON syntax is valid
3. Check backend logs for seeding errors
4. Verify database entry exists

### Duplicate Questionnaires
If you see duplicates:
```sql
-- Check for duplicates
SELECT section, COUNT(*)
FROM assessment_questionnaires
GROUP BY section
HAVING COUNT(*) > 1;

-- Remove duplicates (keep questionnaire_* format)
DELETE FROM assessment_questionnaires
WHERE id NOT LIKE 'questionnaire_%';
```

### Scoring Issues
1. Verify all questions have options with scores
2. Check `marking_criteria.total_score_range` is correct
3. Ensure interpretation ranges don't overlap

## Example: Adding Questionnaire 2.4

Let's walk through adding a new questionnaire:

### 1. Create JSON File
**File:** `ai-chat-api/src/resources/questionnaire_jsons/questionnaire_2_4.json`

```json
{
  "section": "2.4",
  "title": "行为模式 (Behavioral Patterns)",
  "marking_criteria": {
    "scale": "1-5 Likert Scale",
    "total_score_range": [8, 40],
    "interpretation": [
      {
        "range": [8, 16],
        "level": "Rigid",
        "description": "Your behavioral patterns are quite rigid. Consider exploring new approaches."
      },
      {
        "range": [17, 28],
        "level": "Balanced",
        "description": "You have a balanced approach to behavior with some flexibility."
      },
      {
        "range": [29, 40],
        "level": "Flexible",
        "description": "You demonstrate high behavioral flexibility and adaptability."
      }
    ]
  },
  "questions": [
    {
      "text": "我能够轻松适应新的环境和情况",
      "options": [
        {"label": "完全不符合", "score": 1},
        {"label": "不太符合", "score": 2},
        {"label": "一般", "score": 3},
        {"label": "比较符合", "score": 4},
        {"label": "完全符合", "score": 5}
      ]
    },
    {
      "text": "当计划改变时，我能够保持冷静",
      "options": [
        {"label": "完全不符合", "score": 1},
        {"label": "不太符合", "score": 2},
        {"label": "一般", "score": 3},
        {"label": "比较符合", "score": 4},
        {"label": "完全符合", "score": 5}
      ]
    }
  ]
}
```

### 2. Restart Backend
```bash
cd ai-chat-api
python run.py
```

### 3. Verify
```bash
curl http://localhost:8000/questionnaires | jq '.questionnaires[] | select(.id == "questionnaire_2_4")'
```

### 4. Test in UI
1. Navigate to Quick Assessment
2. Select the new questionnaire
3. Complete and submit
4. Verify scoring and interpretation

## Files Reference

### Backend
- **JSON Files**: `ai-chat-api/src/resources/questionnaire_jsons/`
- **Seeding Script**: `ai-chat-api/src/database/questionnaire_seeding.py`
- **Models**: `ai-chat-api/src/database/questionnaire_models.py`
- **API Routes**: `ai-chat-api/src/api/app.py` (lines 639-1050)
- **Scoring Logic**: `ai-chat-api/src/services/questionnaire_scoring.py`

### Frontend
- **Quick Assessment**: `zeneme-next/src/components/features/tools/QuickAssessment.tsx`
- **API Client**: `zeneme-next/src/lib/api.ts`

## Support

For questions or issues:
1. Check backend logs: `ai-chat-api/backend.log`
2. Check database: `psql -h localhost -U chat_user -d chat_db`
3. Review this guide and related documentation

## Related Documentation
- `QUESTIONNAIRE_DUPLICATE_FIX_2.md` - Duplicate prevention
- `docs/features/questionnaire/` - Feature documentation
- `docs/troubleshooting/database/` - Database troubleshooting

---

**Last Updated:** January 25, 2026
