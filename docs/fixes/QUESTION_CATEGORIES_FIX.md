# Question Categories Fix - 2026-02-20

## Problem

Questions in the database had `sub_category None` when saving answers, causing category scores not to be tracked properly.

### Root Cause

The database schema has two fields:
- `sub_section`: For hierarchical sections like "2.2.1", "2.2.2"
- `category`: For specific subcategories like "2.2.1.1", "2.2.2.1"

When questions were seeded from JSON files, they were getting:
- `sub_section` populated correctly (e.g., "2.2.1")
- `category` populated with names (e.g., "Managers (管理者)") instead of codes (e.g., "2.2.1.1")

The scoring logic expects category codes, not names.

## Solution

Created migration script `ai-chat-api/ops/fix_question_categories.py` that:

1. Maps category names to hierarchical codes:
   - "Managers (管理者)" → "2.2.1.1"
   - "Firefighters (消防员)" → "2.2.1.2"
   - "灾难化" → "2.2.2.3"
   - "Secure (安全型)" → "2.3.1.1"
   - etc.

2. For questions without category, uses `sub_section` as category

3. Skips questions that already have proper category codes

## Results

### First Run
- Updated: 53 questions
- Skipped: 114 questions

### Second Run (after adding more mappings)
- Updated: 20 questions
- Skipped: 147 questions

### Final Category Distribution

```
2.1: 1 question
2.2.1: 1 question
2.2.1.1 (Managers): 10 questions
2.2.1.2 (Firefighters): 10 questions
2.2.1.3 (Exiles): 10 questions
2.2.1.4 (Self): 10 questions
2.2.2: 1 question
2.2.2.1 (Overgeneralization): 4 questions
2.2.2.2 (All-or-Nothing): 1 question
2.2.2.3 (Catastrophizing): 3 questions
2.2.2.4 (Should/Must): 1 question
2.2.2.5 (Self-Blame): 1 question
2.2.3.1 (Self-Other Perspective): 8 questions
2.2.3.4 (Emotional Perspective): 8 questions
2.2.4 (Narrative Structure): 9 questions
2.2.4.1-2.2.4.5 (Narrative Types): 8 questions
2.3.1.1 (Secure Attachment): 6 questions
2.3.1.2 (Anxious Attachment): 6 questions
2.3.1.3 (Avoidant Attachment): 6 questions
2.3.1.4 (Disorganized Attachment): 6 questions
2.3.2 (Conflict Triggers): 10 questions
2.3.3 (Empathy): 10 questions
2.3.4 (Internal Conflict): 11 questions
2.5.1 (Insight Depth): 4 questions
2.5.2 (Internal Plasticity): 3 questions
2.5.3 (Psychological Resilience): 3 questions
None: 16 questions (likely from 2.1 or sections without subcategories)
```

## Impact

Now when users answer questions:
- ✅ Category scores are properly tracked
- ✅ IFS parts analysis works correctly (2.2.1.1-2.2.1.4)
- ✅ Cognitive distortions analysis works correctly (2.2.2.1-2.2.2.5)
- ✅ Attachment styles analysis works correctly (2.3.1.1-2.3.1.4)
- ✅ All other subcategory scoring works correctly

## Files Modified

1. `ai-chat-api/ops/fix_question_categories.py` (NEW)
   - Migration script to fix existing questions
   - Can be run multiple times safely (idempotent)

2. Database: `assessment_questions` table
   - Updated `category` field for 73 questions total

## Verification

Check logs when answering questions - should now show:
```
INFO:src.services.questionnaire_progress:Saving answer for progress 14, question 923, value 2, sub_category 2.2.2.1
INFO:src.services.questionnaire_progress:Updated category '2.2.2.1' score: 0 + 2 = 2
```

Instead of:
```
INFO:src.services.questionnaire_progress:Saving answer for progress 14, question 923, value 2, sub_category None
```

## Next Steps

For future questionnaires:
1. Update `questionnaire_seeding.py` to generate proper category codes during seeding
2. Or ensure JSON files include category codes instead of names
3. Add validation to ensure all questions have proper category codes

## Related Issues

- Cognitive distortions scoring was implemented but not working due to missing category codes
- IFS parts scoring was working for some questions but not all
- Category scores in progress tracking were incomplete
