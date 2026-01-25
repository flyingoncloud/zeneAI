# Error 500 Troubleshooting Guide

## Error Message
```
XHR POST http://localhost:8000/conversations/88/questionnaires/submit
[HTTP/1.1 500 Internal Server Error 35ms]
Error submitting questionnaire response: Error: HTTP error! status: 500
```

## Root Cause

The backend is running **old code** that doesn't have the new changes. The code was modified but the backend process wasn't restarted.

## Solution

### Step 1: Stop the Backend

**Option A: If running in terminal**
- Go to the terminal where `python run.py` is running
- Press `Ctrl+C` to stop it

**Option B: If running in background**
```bash
# Find the process
ps aux | grep "python.*run.py" | grep -v grep

# Kill it (replace 73488 with your actual PID)
kill 73488
```

### Step 2: Restart the Backend

```bash
cd ai-chat-api
python run.py
```

### Step 3: Verify Startup

Look for these messages in the output:
```
INFO - Starting up AI Chat API...
INFO - ✓ Database initialized successfully
INFO - Application startup complete.
INFO - Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Test Again

1. Refresh your browser (clear cache if needed)
2. Complete a questionnaire
3. Submit it
4. Should work now!

## What Changed in the Code

The questionnaire submission endpoint was modified to:

1. **Accept BackgroundTasks parameter**
   ```python
   def submit_questionnaire_response(
       conversation_id: int,
       response: QuestionnaireResponse,
       background_tasks: BackgroundTasks,  # NEW
       db: Session = Depends(get_db)
   ):
   ```

2. **Count completed questionnaires**
   ```python
   completed_count = db.query(DBQuestionnaireResponse).filter(
       DBQuestionnaireResponse.conversation_id == conversation_id
   ).count()
   ```

3. **Trigger report generation when all 4 done**
   ```python
   if completed_count >= 4:
       # Create PsychologyReport
       # Trigger background task
       background_tasks.add_task(generate_report_background, ...)
   ```

4. **Return report_id and report_status**
   ```python
   return {
       "ok": True,
       "message": "...",
       "report_id": report_id,      # NEW
       "report_status": report_status  # NEW
       ...
   }
   ```

## How to Avoid This in the Future

### Option 1: Use Auto-Reload (Recommended for Development)

```bash
cd ai-chat-api
uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

This automatically reloads when code changes are detected.

### Option 2: Always Restart After Code Changes

Make it a habit:
1. Make code changes
2. Stop backend (Ctrl+C)
3. Start backend (`python run.py`)
4. Test

## Verification Checklist

After restarting, verify:

- [ ] Backend started without errors
- [ ] Can submit questionnaire successfully
- [ ] After 4th questionnaire, see message: "所有问卷已完成！正在生成您的心理报告..."
- [ ] Report generation UI appears (blue card with progress bar)
- [ ] After 30-60 seconds, download button appears
- [ ] Can download DOCX file

## Still Getting Errors?

If you still get 500 errors after restarting:

1. **Check backend logs** for the actual error:
   ```bash
   # Look at the terminal where backend is running
   # Or check log files
   ```

2. **Check for import errors**:
   ```python
   # Make sure these imports work:
   from src.database.psychology_models import PsychologyAssessment, PsychologyReport
   from src.api.psychology_report_routes import generate_report_background
   ```

3. **Check database tables exist**:
   ```sql
   SELECT * FROM psychology_assessments LIMIT 1;
   SELECT * FROM psychology_reports LIMIT 1;
   ```

4. **Check Python environment**:
   ```bash
   # Make sure you're in the right conda environment
   conda activate zeneme

   # Check dependencies
   pip list | grep -E "fastapi|sqlalchemy|python-docx"
   ```

## Need More Help?

Share the backend terminal output (the error traceback) to diagnose the specific issue.
