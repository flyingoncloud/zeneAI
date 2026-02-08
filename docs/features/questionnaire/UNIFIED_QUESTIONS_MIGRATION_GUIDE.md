# Unified Questions Table Migration Guide

## Overview
This guide explains how to migrate from separate `admin_questions` and `assessment_questions` tables to a unified `assessment_questions` table that supports both legacy psychology questionnaires and admin-created questions.

## Why Unify?
- **Single source of truth**: One table for all questions
- **No duplication**: Avoid maintaining two similar structures
- **Easier maintenance**: Update one model instead of two
- **Better queries**: Can query all questions together if needed

## Migration Steps

### Step 1: Run the Migration Script
```bash
cd ai-chat-api
python migrate_to_unified_questions.py
```

This script will:
1. Add new columns to `assessment_questions` table
2. Set defaults for existing questions
3. Mark existing questions as `source_type='legacy'`
4. Verify the migration

### Step 2: Restart the Backend
The backend needs to be restarted to load the updated models:
```bash
# Stop the backend (Ctrl+C or kill process)
# Then restart:
python run.py
```

### Step 3: Verify the Migration
```bash
# Check the API returns empty admin questions
curl http://localhost:8000/api/admin/questions

# Check legacy questions still work
curl http://localhost:8000/questionnaires
```

## New Table Schema

### assessment_questions (Unified)
```sql
-- Existing columns (unchanged)
id                  INTEGER PRIMARY KEY
questionnaire_id    VARCHAR (FK to assessment_questionnaires)
question_number     INTEGER
text                TEXT (main question text/stem)
category            VARCHAR (for legacy questions)
sub_section         VARCHAR (for legacy questions)
dimension           VARCHAR (for legacy questions)
options             JSON
created_at          TIMESTAMP

-- New columns (added by migration)
template            VARCHAR(10)      -- F1-F8 template type (NULL for legacy)
status              VARCHAR(20)      -- 'draft' or 'published'
internal_title      VARCHAR(255)     -- For admin reference
subtitle            VARCHAR(500)     -- Optional subtitle/instruction
media_url           VARCHAR(500)     -- Image/video URL
media_type          VARCHAR(20)      -- 'image' or 'video'
template_settings   JSON             -- Template-specific configuration
validation          JSON             -- Validation rules
tags                JSON             -- Array of tag strings
display_order       INTEGER          -- For custom ordering
updated_at          TIMESTAMP        -- Last update timestamp
source_type         VARCHAR(20)      -- 'legacy' or 'admin'
```

## How It Works

### Legacy Questions (Psychology Questionnaires)
- `source_type = 'legacy'`
- `template = NULL`
- `status = 'published'`
- Uses existing fields: `category`, `sub_section`, `dimension`
- Loaded from JSON files (questionnaire_2_1, etc.)

### Admin-Created Questions
- `source_type = 'admin'`
- `template = 'F1'` through `'F8'`
- `status = 'draft'` or `'published'`
- Uses new fields: `internal_title`, `subtitle`, `media_url`, `template_settings`
- Created through admin panel UI

## API Endpoints

### Admin Questions (New/Updated)
```bash
# Get all admin questions (filters by source_type='admin')
GET /api/admin/questions

# Get specific admin question
GET /api/admin/questions/{question_number}

# Create admin question
POST /api/admin/questions
{
  "questionNumber": 1,
  "internalTitle": "测试题目",
  "template": "F1",
  "stem": "这是一个测试问题",
  "options": [],
  "templateSettings": {"leftLabel": "不同意", "rightLabel": "同意"},
  "validation": {"required": true},
  "order": 1
}

# Update admin question
PUT /api/admin/questions/{question_number}
{
  "stem": "更新后的问题"
}

# Delete admin question
DELETE /api/admin/questions/{question_number}

# Publish admin question
POST /api/admin/questions/{question_number}/publish
```

### Legacy Questions (Unchanged)
```bash
# Get all questionnaires (filters by source_type='legacy')
GET /questionnaires

# Get specific questionnaire
GET /questionnaires/{questionnaire_id}

# Submit questionnaire response
POST /conversations/{conversation_id}/questionnaires/submit
```

## Database Queries

### Count questions by type
```sql
SELECT source_type, COUNT(*)
FROM assessment_questions
GROUP BY source_type;
```

### Get all admin questions
```sql
SELECT id, question_number, internal_title, template, status, text
FROM assessment_questions
WHERE source_type = 'admin'
ORDER BY display_order;
```

### Get all legacy questions
```sql
SELECT id, questionnaire_id, question_number, text, category
FROM assessment_questions
WHERE source_type = 'legacy'
ORDER BY questionnaire_id, question_number;
```

## Rollback Plan

If you need to rollback the migration:

1. **Drop new columns** (data loss!):
```sql
ALTER TABLE assessment_questions
DROP COLUMN IF EXISTS template,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS internal_title,
DROP COLUMN IF EXISTS subtitle,
DROP COLUMN IF EXISTS media_url,
DROP COLUMN IF EXISTS media_type,
DROP COLUMN IF EXISTS template_settings,
DROP COLUMN IF EXISTS validation,
DROP COLUMN IF EXISTS tags,
DROP COLUMN IF EXISTS display_order,
DROP COLUMN IF EXISTS updated_at,
DROP COLUMN IF EXISTS source_type;
```

2. **Restore admin_questionnaire_models.py import** in `database.py`

3. **Revert API endpoints** in `app.py` to use `AdminQuestion` model

## Testing Checklist

- [ ] Migration script runs without errors
- [ ] Existing psychology questionnaires still load
- [ ] Can create new admin question via API
- [ ] Can update admin question via API
- [ ] Can delete admin question via API
- [ ] Can publish admin question via API
- [ ] Frontend loads questions from unified table
- [ ] Psychology reports still generate correctly
- [ ] No duplicate questions in database

## Files Modified

1. `ai-chat-api/migrate_to_unified_questions.py` - Migration script (NEW)
2. `ai-chat-api/src/database/questionnaire_models.py` - Updated AssessmentQuestion model
3. `ai-chat-api/src/database/database.py` - Removed admin models import
4. `ai-chat-api/src/api/app.py` - Updated admin endpoints to use unified table

## Next Steps

After migration:
1. Update frontend to call the new API endpoints
2. Test creating questions through admin panel
3. Verify psychology questionnaires still work
4. Consider removing `admin_questionnaire_models.py` file (optional)
5. Drop unused `admin_*` tables (optional, after confirming everything works)

## Drop Unused Tables (Optional)

After confirming the migration works:
```sql
DROP TABLE IF EXISTS admin_question_answers CASCADE;
DROP TABLE IF EXISTS admin_questionnaire_responses CASCADE;
DROP TABLE IF EXISTS admin_questions CASCADE;
DROP TABLE IF EXISTS admin_questionnaires CASCADE;
```

**Warning**: Only do this after thoroughly testing the unified table!
