# Backend Restart Required

## Issue

You're getting a 500 error because the backend is still running the old code. The new code changes haven't been loaded yet.

## Solution

**You need to restart the backend to load the new code:**

### Step 1: Stop the current backend
```bash
# Find the process
ps aux | grep "python.*run.py" | grep -v grep

# Kill it (replace PID with the actual process ID)
kill 73488

# Or use Ctrl+C in the terminal where it's running
```

### Step 2: Start the backend again
```bash
cd ai-chat-api
python run.py
```

### Step 3: Verify it started correctly
Look for these log messages:
```
INFO - Starting up AI Chat API...
INFO - ✓ Database initialized successfully
INFO - Application startup complete.
INFO - Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Test again
- Complete a questionnaire in the UI
- Check that it submits successfully
- After completing all 4, check for report generation

## What Changed

The backend code was modified to:
1. Add `BackgroundTasks` parameter to questionnaire submission
2. Check if all 4 questionnaires are completed
3. Trigger report generation when complete
4. Return `report_id` and `report_status`

These changes require a backend restart to take effect.

## Alternative: Hot Reload

If you want to avoid manual restarts in the future, you can run the backend with auto-reload:

```bash
cd ai-chat-api
uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

This will automatically reload when code changes are detected.
