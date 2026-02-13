# Questionnaire Scoring Fix

**Date**: February 11, 2026
**Status**: ✅ Fixed

## Problem

The questionnaire scoring had a critical bug where answers were being stored by `question_id` (database ID) instead of `question_number` (sequential number 1, 2, 3...).

### Impact

- Answers were stored with incorrect keys in the progress record
- Scoring logic expected answers keyed by question_number
- Report generation couldn't properly access the answers
- Category scores were calculated correctly in real-time, but the raw answers were inaccessible

## Root Cause

In `ai-chat-api/src/services/questionnaire_progress.py`, line 149:

```python
# BEFORE (INCORRECT)
answers[str(question_id)] = answer_value  # Using database ID
```

The scoring and report generation systems expect:

```python
# AFTER (CORRECT)
answers[str(question.question_number)] = answer_value  # Using sequential number
```

## Solution

Changed the answer storage key from `question_id` to `question.question_number` in the `save_answer` method.

### File Changed

- `ai-chat-api/src/services/questionnaire_progress.py` (line 149)

### Code Change

```python
# Update answers - Store by question_number for consistency with scoring
answers = progress.answers or {}
answers[str(question.question_number)] = answer_value  # Use question_number, not question_id
progress.answers = answers
```

## How Scoring Works Now

### Real-Time Category Accumulation

For each answer submitted:

1. **Answer Storage**: Stored by `question_number` (e.g., "1", "2", "3"...)
2. **Category Detection**: Uses `sub_category` from option if provided, otherwise uses `question.category`
3. **Score Accumulation**: Adds answer value to the category's running total
4. **Progress Update**: Increments question index and updates timestamp

### Categories (Dimensions)

The system tracks 5 main categories that map directly to report dimensions:

- 情绪调节能力 (Emotional Regulation)
- 认知重构能力 (Cognitive Restructuring)
- 关系互动能力 (Relational Interaction)
- 内在对话能力 (Internal Dialogue)
- 成长潜力 (Growth Potential)

### On Completion

When the questionnaire is completed:

1. Status set to 'completed'
2. Report generated with category scores mapped 1:1 to dimensions
3. Background task triggered for detailed report generation

## Testing

To test the fix:

1. Start a new questionnaire
2. Answer all questions
3. Check the `user_questionnaire_progress` table:
   - `answers` field should have keys like "1", "2", "3"... (not database IDs)
   - `category_scores` should show accumulated scores by category
4. Verify report generation works correctly

## Related Files

- `ai-chat-api/src/services/questionnaire_progress.py` - Progress tracking and scoring
- `ai-chat-api/src/services/questionnaire_scoring.py` - Detailed scoring logic (not currently used for admin questionnaire)
- `ai-chat-api/src/api/app.py` - API endpoint that calls save_answer
- `ai-chat-api/src/database/progress_models.py` - Database model

## Notes

- The `QuestionnaireScorer` class in `questionnaire_scoring.py` has sophisticated scoring methods for different questionnaire types, but is not currently used for the admin-created questionnaire
- The admin questionnaire uses simple real-time accumulation which works well for the current use case
- Future enhancement: Could integrate `QuestionnaireScorer` for more complex scoring rules
