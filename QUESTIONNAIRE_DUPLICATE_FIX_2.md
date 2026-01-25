# Questionnaire Duplication Fix - Round 2

## Date
January 25, 2026

## Problem
Questionnaires were duplicated again in the `assessment_questionnaires` table with two different ID formats:
- Old format: `2.1`, `2.2`, `2.3`, `2.5`
- Correct format: `questionnaire_2_1`, `questionnaire_2_2`, `questionnaire_2_3`, `questionnaire_2_5`

## Root Cause
The questionnaire seeding script likely ran multiple times with different ID generation logic, creating duplicates. This can happen when:
1. The backend is restarted and the seeding script runs automatically
2. The database is manually seeded without checking for existing data
3. Different versions of the seeding script are used

## Investigation Results

### Database State Before Fix
```
        id         |                         title                          | question_count | response_count
-------------------+--------------------------------------------------------+----------------+----------------
 2.1               | 情绪觉察 (Emotional Insight Analysis)                  |             10 |              1
 2.2               | 认知模式 (Cognitive Insight Analysis)                  |             36 |              1
 2.3               | 关系模式 (Relational Insight)                          |             27 |              1
 2.5               | 成长指数与变化潜能 (Growth & Transformation Potential) |              6 |              1
 questionnaire_2_1 | 情绪觉察 (Emotional Insight Analysis)                  |             10 |              6
 questionnaire_2_2 | 认知模式 (Cognitive Insight Analysis)                  |             46 |              6
 questionnaire_2_3 | 关系模式 (Relational Insight)                          |             27 |              6
 questionnaire_2_5 | 成长指数与变化潜能 (Growth & Transformation Potential) |              6 |              6
```

**Key Observations:**
- 8 questionnaires total (4 duplicates)
- Old format (2.1, etc.) had 1 response each
- New format (questionnaire_2_1, etc.) had 6 responses each
- The `questionnaire_*` format is the correct one with more data

## Solution Applied

Deleted the old format questionnaires and all their related data:

```sql
-- Delete answers for responses of old questionnaires
DELETE FROM assessment_answers
WHERE response_id IN (
    SELECT id FROM assessment_responses
    WHERE questionnaire_id IN ('2.1', '2.2', '2.3', '2.5')
);

-- Delete responses for old questionnaires
DELETE FROM assessment_responses WHERE questionnaire_id IN ('2.1', '2.2', '2.3', '2.5');

-- Delete questions for old questionnaires
DELETE FROM assessment_questions WHERE questionnaire_id IN ('2.1', '2.2', '2.3', '2.5');

-- Delete old questionnaires
DELETE FROM assessment_questionnaires WHERE id IN ('2.1', '2.2', '2.3', '2.5');
```

### Database State After Fix
```
        id         |                         title                          | question_count | response_count
-------------------+--------------------------------------------------------+----------------+----------------
 questionnaire_2_1 | 情绪觉察 (Emotional Insight Analysis)                  |             10 |              6
 questionnaire_2_2 | 认知模式 (Cognitive Insight Analysis)                  |             46 |              6
 questionnaire_2_3 | 关系模式 (Relational Insight)                          |             27 |              6
 questionnaire_2_5 | 成长指数与变化潜能 (Growth & Transformation Potential) |              6 |              6
```

✅ **Result:** 4 questionnaires with correct IDs and all responses preserved

## Prevention Measures

### 1. Check Seeding Script
The seeding script should check for existing data before inserting:

```python
def seed_questionnaires(db: Session):
    # Check if questionnaires already exist
    existing_count = db.query(AssessmentQuestionnaire).count()
    if existing_count > 0:
        logger.info(f"Questionnaires already seeded ({existing_count} found). Skipping.")
        return

    # Proceed with seeding...
```

### 2. Use Consistent ID Format
Always use the `questionnaire_` prefix format:
- ✅ `questionnaire_2_1`
- ❌ `2.1`

### 3. Database Constraints
Add unique constraints to prevent duplicates:

```sql
-- Already exists:
ALTER TABLE assessment_questionnaires ADD CONSTRAINT unique_section UNIQUE (section);
```

### 4. Startup Check
Add a startup check in the backend to verify questionnaire integrity:

```python
@app.on_event("startup")
async def verify_questionnaires():
    db = SessionLocal()
    try:
        questionnaires = db.query(AssessmentQuestionnaire).all()

        # Check for duplicates by section
        sections = [q.section for q in questionnaires]
        if len(sections) != len(set(sections)):
            logger.error("DUPLICATE QUESTIONNAIRES DETECTED!")
            # Alert or auto-fix
    finally:
        db.close()
```

## How to Check for Duplicates

Run this query to check for duplicates:

```sql
SELECT
    section,
    COUNT(*) as count,
    STRING_AGG(id, ', ') as ids
FROM assessment_questionnaires
GROUP BY section
HAVING COUNT(*) > 1;
```

If this returns any rows, duplicates exist.

## Related Files

- `ai-chat-api/src/database/questionnaire_seeding.py` - Seeding script
- `ai-chat-api/src/database/questionnaire_models.py` - Database models
- `ai-chat-api/src/api/app.py` - API endpoints

## Previous Fix

This is the second time questionnaires were duplicated. The first fix was documented in:
- `docs/troubleshooting/database/QUESTIONNAIRE_DUPLICATE_FIX.md`

## Recommendation

**Implement the prevention measures above** to ensure this doesn't happen a third time. The most important is adding the existence check in the seeding script.

## Verification

To verify the fix worked:

1. Check questionnaire count:
   ```sql
   SELECT COUNT(*) FROM assessment_questionnaires;
   -- Should return: 4
   ```

2. Check for duplicates:
   ```sql
   SELECT section, COUNT(*) FROM assessment_questionnaires GROUP BY section HAVING COUNT(*) > 1;
   -- Should return: 0 rows
   ```

3. Test the API:
   ```bash
   curl http://localhost:8000/questionnaires
   # Should return 4 questionnaires with questionnaire_* IDs
   ```

## Status
✅ **FIXED** - Duplicates removed, 4 questionnaires remain with correct IDs and all responses preserved.
