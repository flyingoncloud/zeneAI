# Unified Questions Table Migration - COMPLETE ✓

## What Was Done

Successfully migrated from separate `admin_questions` and `assessment_questions` tables to a unified `assessment_questions` table that supports both legacy psychology questionnaires and admin-created questions.

## Migration Results

### ✅ Database Schema Updated
Added 12 new columns to `assessment_questions`:
- `template` - F1-F8 template type (NULL for legacy questions)
- `status` - 'draft' or 'published' (default: 'published')
- `internal_title` - For admin reference
- `subtitle` - Optional subtitle/instruction
- `media_url` - Image/video URL
- `media_type` - 'image' or 'video'
- `template_settings` - JSON for template-specific configuration
- `validation` - JSON for validation rules
- `tags` - JSON array of tag strings
- `display_order` - For custom ordering
- `updated_at` - Last update timestamp
- `source_type` - 'legacy' or 'admin' (default: 'legacy')

### ✅ Existing Data Preserved
- All existing psychology questionnaire questions remain intact
- Marked as `source_type='legacy'`
- Set to `status='published'`
- `internal_title` populated from first 100 chars of question text

### ✅ Models Updated
- `questionnaire_models.py` - Extended `AssessmentQuestion` model with new fields
- `database.py` - Removed `admin_questionnaire_models` import
- `app.py` - Updated admin endpoints to use unified table (needs backend restart)

## Current State

### Database Tables
```
assessment_questions (UNIFIED)
├── Legacy questions (source_type='legacy')
│   └── 4 psychology questionnaires with ~80 questions
└── Admin questions (source_type='admin')
    └── 0 questions (ready for admin panel to create)

admin_questions (DEPRECATED - can be dropped)
admin_questionnaires (DEPRECATED - can be dropped)
admin_questionnaire_responses (DEPRECATED - can be dropped)
admin_question_answers (DEPRECATED - can be dropped)
```

## Next Steps

### 1. Restart Backend (REQUIRED)
The backend must be restarted to load the updated models:
```bash
# Stop current backend process
# Then restart:
cd ai-chat-api
python run.py
```

### 2. Test API Endpoints
```bash
# Should return empty array (no admin questions yet)
curl http://localhost:8000/api/admin/questions

# Should return 4 legacy questionnaires
curl http://localhost:8000/questionnaires

# Test creating an admin question
curl -X POST http://localhost:8000/api/admin/questions \
  -H "Content-Type: application/json" \
  -d '{
    "questionNumber": 1,
    "internalTitle": "测试题目",
    "template": "F1",
    "stem": "这是一个测试问题",
    "options": [],
    "templateSettings": {"leftLabel": "不同意", "rightLabel": "同意"},
    "validation": {"required": true},
    "order": 1
  }'
```

### 3. Update Frontend (TODO)
The frontend `useAdminStore` already loads questions from `/api/admin/questions`, but needs to:
- Implement `addQuestion` to POST to backend
- Implement `updateQuestion` to PUT to backend
- Implement `deleteQuestion` to DELETE from backend
- Add error handling and loading states

### 4. Clean Up (Optional)
After confirming everything works, you can:
1. Delete `admin_questionnaire_models.py` file
2. Drop unused `admin_*` tables from database:
```sql
DROP TABLE IF EXISTS admin_question_answers CASCADE;
DROP TABLE IF EXISTS admin_questionnaire_responses CASCADE;
DROP TABLE IF EXISTS admin_questions CASCADE;
DROP TABLE IF EXISTS admin_questionnaires CASCADE;
```

## Benefits of Unified Table

### ✅ Advantages
1. **Single source of truth** - One table for all questions
2. **No duplication** - Avoid maintaining two similar structures
3. **Easier maintenance** - Update one model instead of two
4. **Better queries** - Can query all questions together if needed
5. **Flexible** - Legacy questions can be upgraded to use new features
6. **Backward compatible** - Existing psychology reports still work

### ⚠️ Considerations
1. **More NULL values** - Legacy questions have NULL in new columns
2. **Larger table** - More columns means more storage
3. **Migration complexity** - Had to carefully preserve existing data

## API Behavior

### Admin Questions API
- **Filters by**: `source_type='admin'`
- **Returns**: Only admin-created questions
- **Uses**: `question_number` as ID (1-80)
- **Creates**: Questions in `admin_created` questionnaire

### Legacy Questions API
- **Filters by**: `source_type='legacy'` (implicit)
- **Returns**: Only psychology questionnaire questions
- **Uses**: Existing questionnaire IDs (questionnaire_2_1, etc.)
- **Readonly**: Cannot be modified through admin panel

## Database Verification

```sql
-- Count questions by source type
SELECT source_type, COUNT(*)
FROM assessment_questions
GROUP BY source_type;

-- Expected result:
-- source_type | count
-- ------------+-------
-- legacy      | ~80   (existing psychology questions)
-- admin       | 0     (none created yet)

-- View schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'assessment_questions'
ORDER BY ordinal_position;
```

## Files Created/Modified

### Created:
1. `migrate_to_unified_questions.py` - Migration script
2. `UNIFIED_QUESTIONS_MIGRATION_GUIDE.md` - Detailed migration guide
3. `MIGRATION_COMPLETE_SUMMARY.md` - This file

### Modified:
1. `src/database/questionnaire_models.py` - Extended AssessmentQuestion model
2. `src/database/database.py` - Removed admin models import
3. `src/api/app.py` - Updated admin endpoints (needs restart to take effect)

## Rollback Instructions

If you need to rollback (NOT RECOMMENDED after data is created):

1. Restore `admin_questionnaire_models.py` import in `database.py`
2. Revert `questionnaire_models.py` to original version
3. Drop new columns from `assessment_questions` table
4. Restart backend

See `UNIFIED_QUESTIONS_MIGRATION_GUIDE.md` for detailed rollback SQL.

## Success Criteria

- [x] Migration script runs without errors
- [x] New columns added to assessment_questions
- [x] Existing questions preserved with source_type='legacy'
- [x] Models updated to support new fields
- [ ] Backend restarted (PENDING - user needs to do this)
- [ ] API endpoints tested (PENDING - after restart)
- [ ] Frontend integration completed (PENDING)
- [ ] Admin panel can create questions (PENDING)
- [ ] Psychology reports still work (PENDING - needs testing)

## Status: ✅ MIGRATION COMPLETE - RESTART REQUIRED

The database migration is complete. **Please restart the backend** to load the updated models and test the new unified table structure.
