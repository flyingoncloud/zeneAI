# Questionnaire Duplicate Questions Fix

## Issue
Database had 168 questions instead of the expected 89 questions due to:
1. **Duplicate questionnaire IDs**: Both "2.1" and "questionnaire_2_1" formats existed
2. **Duplicate question numbers**: Questions with the same `question_number` within a questionnaire

## Root Cause
The `load_questionnaires.py` script was using `q["id"]` from the JSON files directly as `question_number`. However, in the JSON files, question IDs restart at 1 for each category/sub-section, causing duplicates when loaded into the database.

Example from questionnaire_2_2:
- Category "Managers": questions 1-5
- Category "Firefighters": questions 1-5 (duplicate IDs!)
- Category "Exiles": questions 1-5 (duplicate IDs!)

## Solution
Modified `ai-chat-api/src/scripts/load_questionnaires.py` to generate sequential unique question numbers instead of using the JSON `id` field directly.

### Changes Made
```python
# Before (using JSON id directly)
question_number=q["id"]

# After (generating unique sequential numbers)
global_question_number = 1  # Initialize counter
question_number=global_question_number
global_question_number += 1  # Increment for each question
```

## Verification
After fix:
```
Total questions: 89 ✓
Questions per questionnaire:
  questionnaire_2_1: 10 questions
  questionnaire_2_2: 46 questions
  questionnaire_2_3: 27 questions
  questionnaire_2_5: 6 questions

✓ No duplicate questions found!
```

## Steps Taken
1. Identified duplicate questions in database (168 total, should be 89)
2. Found root cause in JSON structure and loading script
3. Modified loading script to generate unique sequential question numbers
4. Cleared database tables:
   - `assessment_answers`
   - `assessment_responses`
   - `assessment_questions`
   - `assessment_questionnaires`
5. Reloaded questionnaires with fixed script
6. Verified no duplicates remain

## Files Modified
- `ai-chat-api/src/scripts/load_questionnaires.py`

## Impact
- ✅ Questionnaires now load correctly without duplicates
- ✅ Each question has a unique `question_number` within its questionnaire
- ✅ Total question count is correct (89 questions)
- ✅ Scoring and report generation will work correctly

## Testing
To reload questionnaires after any changes:
```bash
cd ai-chat-api
python src/scripts/load_questionnaires.py
```

To verify question counts:
```bash
python -c "
import sys
sys.path.insert(0, 'src')
from database.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM assessment_questions'))
    print(f'Total questions: {result.scalar()}')
"
```
