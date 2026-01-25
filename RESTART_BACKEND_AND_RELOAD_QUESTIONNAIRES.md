# Backend Restart and Questionnaire Reload Guide

## Current Situation

Your backend is still running the **old code** that auto-seeds questionnaires on startup. The new code changes (disabled auto-seeding) haven't been loaded yet.

## What You Need to Do

### Step 1: Kill the Current Backend Process

```bash
# Kill the process using port 8000
lsof -ti:8000 | xargs kill -9
```

### Step 2: Restart the Backend

```bash
cd ai-chat-api
python run.py
```

### Step 3: Verify Startup (Important!)

Look for these log messages in the terminal:

```
INFO - Starting up AI Chat API...
INFO - ✓ Database initialized successfully
```

**You should NOT see these lines anymore:**
```
INFO:src.database.questionnaire_seeding:Seeding questionnaires from: ...
INFO:src.database.questionnaire_seeding:Found 4 questionnaire files.
INFO:src.database.questionnaire_seeding:Successfully seeded 4 new questionnaires.
```

If you still see the seeding messages, the old code is still running!

### Step 4: Load Questionnaires Manually

```bash
# In a new terminal (keep the backend running)
cd ai-chat-api
python src/scripts/load_questionnaires.py
```

Expected output:
```
INFO - Starting questionnaire data loading...
INFO - Found 4 questionnaire files
INFO - ✓ Loaded questionnaire_2_1: 10 questions
INFO - ✓ Loaded questionnaire_2_2: 46 questions
INFO - ✓ Loaded questionnaire_2_3: 27 questions
INFO - ✓ Loaded questionnaire_2_5: 6 questions
INFO - ✓ All questionnaires loaded successfully!
```

### Step 5: Verify in Database

```bash
cd ai-chat-api
python -c "
import sys
sys.path.insert(0, 'src')
from database.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM assessment_questions'))
    print(f'Total questions: {result.scalar()}')

    result = conn.execute(text('''
        SELECT questionnaire_id, COUNT(*) as count
        FROM assessment_questions
        GROUP BY questionnaire_id
        ORDER BY questionnaire_id
    '''))
    for row in result:
        print(f'  {row[0]}: {row[1]} questions')
"
```

Expected output:
```
Total questions: 89
  questionnaire_2_1: 10 questions
  questionnaire_2_2: 46 questions
  questionnaire_2_3: 27 questions
  questionnaire_2_5: 6 questions
```

### Step 6: Test Frontend

1. Refresh your browser (clear cache if needed: Cmd+Shift+R on Mac)
2. Navigate to the questionnaire page
3. You should now see the questionnaires load successfully
4. Complete a questionnaire to test submission

## What Changed

The backend code was modified to:
- ❌ **Removed** automatic seeding on startup (was causing duplicates)
- ✅ **Added** manual seeding via `load_questionnaires.py` script
- ✅ **Fixed** duplicate question numbers (now generates unique sequential IDs)

## Troubleshooting

### If you still see "Error loading questionnaires"

1. Check backend logs for errors
2. Verify database has 89 questions (see Step 5)
3. Check browser console for API errors
4. Try clearing browser cache and reloading

### If you see duplicate questions again

This means the old code is still running. Make sure:
1. You killed the process completely (`lsof -ti:8000` should return nothing)
2. You're running the latest code from git
3. The startup logs don't show questionnaire seeding

### If backend won't start (port already in use)

```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Wait a few seconds, then try again
python run.py
```

## Summary

1. ✅ Kill backend: `lsof -ti:8000 | xargs kill -9`
2. ✅ Start backend: `python run.py`
3. ✅ Verify no auto-seeding in logs
4. ✅ Load questionnaires: `python src/scripts/load_questionnaires.py`
5. ✅ Verify 89 questions in database
6. ✅ Test frontend

After these steps, your questionnaires should load correctly with no duplicates!
