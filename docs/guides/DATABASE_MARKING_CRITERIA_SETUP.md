# Database Marking Criteria Setup Guide

## Overview

This guide shows you how to define and update `marking_criteria` directly in the PostgreSQL database for questionnaires.

## Database Schema

### Table: `assessment_questionnaires`

```sql
CREATE TABLE assessment_questionnaires (
    id VARCHAR(50) PRIMARY KEY,
    section VARCHAR(10),
    title VARCHAR(255),
    marking_criteria JSONB,  -- This is where scoring rules are stored
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Connecting to Database

```bash
# Connect to PostgreSQL
psql -h localhost -U chat_user -d chat_db

# Or using environment variable
psql $DATABASE_URL
```

## Viewing Current Marking Criteria

### View all questionnaires with their marking criteria:

```sql
SELECT
    id,
    section,
    title,
    marking_criteria
FROM assessment_questionnaires
ORDER BY section;
```

### View specific questionnaire:

```sql
SELECT
    id,
    title,
    marking_criteria::text  -- Convert JSONB to readable text
FROM assessment_questionnaires
WHERE id = 'questionnaire_2_1';
```

### Pretty print JSON:

```sql
SELECT
    id,
    title,
    jsonb_pretty(marking_criteria) as criteria
FROM assessment_questionnaires
WHERE id = 'questionnaire_2_1';
```

## Setting Marking Criteria

### Method 1: Simple Likert Scale (Type 1)

**Use case**: All questions use same 1-5 scale, simple sum

```sql
UPDATE assessment_questionnaires
SET marking_criteria = '{
  "scale": "5-point Likert (1=非常不符合, 5=非常符合)",
  "total_score_range": [10, 50],
  "interpretation": [
    {
      "range": [40, 50],
      "level": "高情绪觉察",
      "description": "能识别、理解并表达情绪。"
    },
    {
      "range": [25, 39],
      "level": "中等情绪觉察",
      "description": "有一定的能力但需提升。"
    },
    {
      "range": [10, 24],
      "level": "低情绪觉察",
      "description": "可能难以识别或表达情绪。"
    }
  ]
}'::jsonb
WHERE id = 'questionnaire_2_1';
```

### Method 2: Category-Based Scoring (Type 2)

**Use case**: Questions grouped by categories, need sub-scores

```sql
UPDATE assessment_questionnaires
SET marking_criteria = '{
  "scale": "5-point Likert (1-5)",
  "dimension_score_range": [5, 25],
  "categories": [
    "情绪识别能力",
    "情绪调节能力",
    "认知重构能力",
    "内在对话能力",
    "关系互动能力"
  ]
}'::jsonb
WHERE id = 'admin_created_questionnaire_1';
```

### Method 3: Option-Based Scoring (Type 3)

**Use case**: Multiple choice with different point values (A=1, B=3, C=5)

```sql
UPDATE assessment_questionnaires
SET marking_criteria = '{
  "option_scores": {
    "A": 1,
    "B": 3,
    "C": 5
  },
  "standardization_formula": "(Q1 + Q2) / max_total * 100",
  "total_score_range": [0, 100]
}'::jsonb
WHERE id = 'questionnaire_2_5';
```

### Method 4: Mixed Scale Scoring (Type 4)

**Use case**: Different sub-sections use different scales

```sql
UPDATE assessment_questionnaires
SET marking_criteria = '{
  "scale": "Mixed scales by sub-section",
  "sub_sections": [
    {
      "id": "2.2.1",
      "title": "IFS Model",
      "scale": "1=完全不符合 to 5=非常符合",
      "dimension_score_range": [5, 25]
    },
    {
      "id": "2.2.2",
      "title": "Cognitive Flexibility",
      "scale": "0=从不 to 4=总是",
      "total_score_range": [0, 40]
    },
    {
      "id": "2.2.3",
      "title": "Perspective Shifting",
      "scale": "0=非常不同意 to 4=非常同意",
      "spatial_scoring": "±30°以内正确"
    }
  ]
}'::jsonb
WHERE id = 'questionnaire_2_2';
```

## Inserting New Questionnaire with Marking Criteria

```sql
INSERT INTO assessment_questionnaires (
    id,
    section,
    title,
    marking_criteria
) VALUES (
    'admin_created_20260220_001',
    'custom',
    '自定义心理测评',
    '{
      "scale": "5-point Likert (1-5)",
      "total_score_range": [20, 100],
      "categories": ["情绪识别", "认知重构", "关系互动"],
      "interpretation": [
        {
          "range": [80, 100],
          "level": "优秀",
          "description": "心理健康状况良好"
        },
        {
          "range": [60, 79],
          "level": "良好",
          "description": "心理状态稳定"
        },
        {
          "range": [40, 59],
          "level": "一般",
          "description": "需要关注和改善"
        },
        {
          "range": [20, 39],
          "level": "需要帮助",
          "description": "建议寻求专业支持"
        }
      ]
    }'::jsonb
);
```

## Updating Specific Fields in Marking Criteria

### Add new interpretation level:

```sql
UPDATE assessment_questionnaires
SET marking_criteria = jsonb_set(
    marking_criteria,
    '{interpretation}',
    marking_criteria->'interpretation' || '[
      {
        "range": [50, 59],
        "level": "中上",
        "description": "表现良好，继续保持"
      }
    ]'::jsonb
)
WHERE id = 'questionnaire_2_1';
```

### Update scale description:

```sql
UPDATE assessment_questionnaires
SET marking_criteria = jsonb_set(
    marking_criteria,
    '{scale}',
    '"5-point Likert (1=完全不同意, 5=完全同意)"'::jsonb
)
WHERE id = 'questionnaire_2_1';
```

### Update score range:

```sql
UPDATE assessment_questionnaires
SET marking_criteria = jsonb_set(
    marking_criteria,
    '{total_score_range}',
    '[15, 75]'::jsonb
)
WHERE id = 'questionnaire_2_1';
```

### Add new field to marking criteria:

```sql
UPDATE assessment_questionnaires
SET marking_criteria = marking_criteria || '{
  "weighted_scoring": true,
  "weights": {
    "情绪识别": 1.5,
    "情绪调节": 1.2,
    "认知重构": 1.0
  }
}'::jsonb
WHERE id = 'admin_created_questionnaire_1';
```

## Querying Marking Criteria

### Find questionnaires with specific scale:

```sql
SELECT id, title
FROM assessment_questionnaires
WHERE marking_criteria->>'scale' LIKE '%5-point Likert%';
```

### Find questionnaires with interpretation levels:

```sql
SELECT
    id,
    title,
    jsonb_array_length(marking_criteria->'interpretation') as num_levels
FROM assessment_questionnaires
WHERE marking_criteria ? 'interpretation';
```

### Find questionnaires by score range:

```sql
SELECT id, title, marking_criteria->'total_score_range' as score_range
FROM assessment_questionnaires
WHERE (marking_criteria->'total_score_range'->>1)::int >= 50;
```

### Find questionnaires with category-based scoring:

```sql
SELECT id, title
FROM assessment_questionnaires
WHERE marking_criteria ? 'categories';
```

## Validation Queries

### Check if marking_criteria is valid JSON:

```sql
SELECT
    id,
    title,
    CASE
        WHEN marking_criteria IS NULL THEN 'NULL'
        WHEN jsonb_typeof(marking_criteria) = 'object' THEN 'Valid'
        ELSE 'Invalid'
    END as validity
FROM assessment_questionnaires;
```

### Check required fields exist:

```sql
SELECT
    id,
    title,
    marking_criteria ? 'scale' as has_scale,
    marking_criteria ? 'total_score_range' as has_range,
    marking_criteria ? 'interpretation' as has_interpretation
FROM assessment_questionnaires;
```

### Validate score ranges match question count:

```sql
SELECT
    q.id,
    q.title,
    COUNT(qs.id) as question_count,
    (q.marking_criteria->'total_score_range'->>0)::int as min_score,
    (q.marking_criteria->'total_score_range'->>1)::int as max_score,
    CASE
        WHEN COUNT(qs.id) * 5 = (q.marking_criteria->'total_score_range'->>1)::int
        THEN 'Valid'
        ELSE 'Mismatch'
    END as validation
FROM assessment_questionnaires q
LEFT JOIN assessment_questions qs ON q.id = qs.questionnaire_id
GROUP BY q.id, q.title, q.marking_criteria;
```

## Backup and Restore

### Backup marking criteria:

```sql
-- Export to file
\copy (SELECT id, marking_criteria FROM assessment_questionnaires) TO '/tmp/marking_criteria_backup.csv' WITH CSV HEADER;

-- Or create backup table
CREATE TABLE assessment_questionnaires_backup AS
SELECT * FROM assessment_questionnaires;
```

### Restore from backup:

```sql
-- Restore specific questionnaire
UPDATE assessment_questionnaires
SET marking_criteria = backup.marking_criteria
FROM assessment_questionnaires_backup backup
WHERE assessment_questionnaires.id = backup.id
  AND assessment_questionnaires.id = 'questionnaire_2_1';
```

## Common Patterns

### Pattern 1: Simple Assessment (10 questions, 1-5 scale)

```sql
UPDATE assessment_questionnaires
SET marking_criteria = '{
  "scale": "5-point Likert (1-5)",
  "total_score_range": [10, 50],
  "interpretation": [
    {"range": [40, 50], "level": "High"},
    {"range": [25, 39], "level": "Medium"},
    {"range": [10, 24], "level": "Low"}
  ]
}'::jsonb
WHERE id = 'your_questionnaire_id';
```

### Pattern 2: Category Assessment (5 categories, 4 questions each)

```sql
UPDATE assessment_questionnaires
SET marking_criteria = '{
  "scale": "5-point Likert (1-5)",
  "total_score_range": [20, 100],
  "categories": ["Cat1", "Cat2", "Cat3", "Cat4", "Cat5"],
  "dimension_score_range": [4, 20]
}'::jsonb
WHERE id = 'your_questionnaire_id';
```

### Pattern 3: Multiple Choice (A/B/C options)

```sql
UPDATE assessment_questionnaires
SET marking_criteria = '{
  "option_scores": {"A": 1, "B": 3, "C": 5},
  "total_score_range": [10, 50],
  "standardization_formula": "sum / max * 100"
}'::jsonb
WHERE id = 'your_questionnaire_id';
```

## Troubleshooting

### Issue: JSON syntax error

```sql
-- Test JSON validity before updating
SELECT '{
  "scale": "5-point Likert",
  "total_score_range": [10, 50]
}'::jsonb;

-- If valid, proceed with UPDATE
```

### Issue: Cannot update JSONB field

```sql
-- Check column type
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assessment_questionnaires'
  AND column_name = 'marking_criteria';

-- Should be 'jsonb', if not, alter table
ALTER TABLE assessment_questionnaires
ALTER COLUMN marking_criteria TYPE jsonb USING marking_criteria::jsonb;
```

### Issue: Marking criteria not showing in API

```sql
-- Verify data exists
SELECT id, marking_criteria IS NOT NULL as has_criteria
FROM assessment_questionnaires;

-- Check if it's empty object
SELECT id, marking_criteria = '{}'::jsonb as is_empty
FROM assessment_questionnaires;
```

## Best Practices

1. **Always backup before updating**:
   ```sql
   CREATE TABLE marking_criteria_backup_20260220 AS
   SELECT id, marking_criteria FROM assessment_questionnaires;
   ```

2. **Test JSON syntax first**:
   ```sql
   SELECT '{"scale": "test"}'::jsonb;  -- Test before UPDATE
   ```

3. **Use transactions for multiple updates**:
   ```sql
   BEGIN;
   UPDATE assessment_questionnaires SET marking_criteria = ...;
   UPDATE assessment_questionnaires SET marking_criteria = ...;
   -- Check results
   SELECT * FROM assessment_questionnaires;
   -- If good: COMMIT; If bad: ROLLBACK;
   COMMIT;
   ```

4. **Document changes**:
   ```sql
   -- Add comment to track changes
   COMMENT ON COLUMN assessment_questionnaires.marking_criteria IS
   'Last updated: 2026-02-20, Changed interpretation levels';
   ```

## Quick Reference

```sql
-- View all marking criteria
SELECT id, jsonb_pretty(marking_criteria) FROM assessment_questionnaires;

-- Update simple Likert scale
UPDATE assessment_questionnaires
SET marking_criteria = '{"scale": "1-5", "total_score_range": [10, 50]}'::jsonb
WHERE id = 'your_id';

-- Add interpretation
UPDATE assessment_questionnaires
SET marking_criteria = marking_criteria || '{"interpretation": [...]}'::jsonb
WHERE id = 'your_id';

-- Remove field
UPDATE assessment_questionnaires
SET marking_criteria = marking_criteria - 'old_field'
WHERE id = 'your_id';

-- Check validity
SELECT id, marking_criteria ? 'scale' as valid FROM assessment_questionnaires;
```

## Summary

To define marking criteria in the database:

1. Connect to PostgreSQL: `psql -U chat_user -d chat_db`
2. Choose appropriate scoring type (Simple/Category/Option/Mixed)
3. Use UPDATE with JSONB literal: `UPDATE ... SET marking_criteria = '{...}'::jsonb`
4. Verify with SELECT: `SELECT jsonb_pretty(marking_criteria) FROM ...`
5. Test scoring with sample data

The `marking_criteria` field is flexible JSONB, so you can add any custom fields needed for your scoring logic.
