# Testing Reset Functionality - Quick Guide

## What Was Fixed
The "重新测试" (retest) button now properly clears all state and shows the questionnaire page after reset.

## How to Test

### Step 1: Complete a Questionnaire
1. Open the app in your browser
2. Navigate to the questionnaire (内视快测)
3. Answer all 6 questions
4. Wait for report to generate
5. Verify you see the result page with scores

### Step 2: Open Browser Console
**Important**: Open the browser console BEFORE clicking retest
- Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac)
- Look for the "Console" tab

### Step 3: Click Retest Button
1. Click the "重新测试" button
2. **Watch the console logs** - you should see:
   ```
   [resetTest] Deleting progress for user: 3ac47b0c-2430-4271-a806-36dd7d3e0e2d
   [resetTest] Reset response: {ok: true, deleted: {progress: 1, responses: 6, ...}}
   [resetTest] Clearing all local state
   [resetTest] Reloading page in 100ms
   ```

### Step 4: After Page Reload
**Watch for these logs:**
```
[InnerQuickTest] Starting questionnaire with progress tracking
[InnerQuickTest] User ID: 3ac47b0c-2430-4271-a806-36dd7d3e0e2d
[InnerQuickTest] Session ID: session_...
[InnerQuickTest] Progress loaded: {id: 52, status: 'in_progress', ...}
[InnerQuickTest] Progress status: in_progress
[InnerQuickTest] Progress report_id: null
[InnerQuickTest] Progress is in_progress, showing test view
```

### Step 5: Verify Questionnaire Shows
✅ **Expected**: You should see the questionnaire page with Question 1
❌ **If you see result page**: Check console logs for errors

### Step 6: Complete New Questionnaire
1. Answer all 6 questions again
2. Verify new report generates
3. Verify new scores are calculated

## What to Look For

### ✅ Success Indicators
- Console shows "Clearing all local state"
- Console shows "Progress status: in_progress"
- Console shows "showing test view"
- Questionnaire page appears after reload
- Can answer questions
- New report generates

### ❌ Failure Indicators
- Console shows "Progress status: completed"
- Console shows "showing result view"
- Result page appears instead of questionnaire
- Errors in console

## Troubleshooting

### If Result Page Still Shows
1. **Check console logs** - what does it say?
2. **Check progress status** - is it 'in_progress' or 'completed'?
3. **Check report_id** - is it null or has a value?
4. **Check backend logs**:
   ```bash
   tail -50 ai-chat-api/backend.log
   ```
   Look for:
   - "Reset complete for user..."
   - "Created new progress record: id=..."

### If Backend Errors
1. Restart backend:
   ```bash
   cd ai-chat-api
   python run.py
   ```
2. Try reset again

### If Database Issues
Check database state:
```sql
-- Check progress records
SELECT id, user_id, status, report_id, current_question_index
FROM user_questionnaire_progress
WHERE user_id = '3ac47b0c-2430-4271-a806-36dd7d3e0e2d';

-- Check reports
SELECT id, user_id, generation_status
FROM psychology_reports
WHERE user_id = '3ac47b0c-2430-4271-a806-36dd7d3e0e2d';
```

## Expected Console Output (Full Flow)

### On Reset Click:
```
[resetTest] Deleting progress for user: 3ac47b0c-2430-4271-a806-36dd7d3e0e2d
[resetTest] Reset response: {
  ok: true,
  deleted: {
    progress: 1,
    responses: 6,
    reports: 1,
    assessments: 1
  },
  message: "Progress reset successfully"
}
[resetTest] Clearing all local state
[resetTest] Reloading page in 100ms
```

### After Reload:
```
[InnerQuickTest] Created session ID for questionnaire: session_1707408000000_abc123
[InnerQuickTest] Starting questionnaire with progress tracking
[InnerQuickTest] User ID: 3ac47b0c-2430-4271-a806-36dd7d3e0e2d
[InnerQuickTest] Session ID: session_1707408000000_abc123
[InnerQuickTest] Progress loaded: {
  id: 52,
  user_id: "3ac47b0c-2430-4271-a806-36dd7d3e0e2d",
  status: "in_progress",
  current_question_index: 0,
  total_questions: 6,
  report_id: null,
  ...
}
[InnerQuickTest] Progress status: in_progress
[InnerQuickTest] Progress report_id: null
[InnerQuickTest] Questions loaded: 6
[InnerQuickTest] First question: {id: 2, text: "...", ...}
[InnerQuickTest] Progress is in_progress, showing test view
```

## Quick Checklist
- [ ] Backend is running (`python run.py`)
- [ ] Browser console is open
- [ ] Complete questionnaire first
- [ ] Click retest button
- [ ] See "Clearing all local state" in console
- [ ] See "Progress status: in_progress" after reload
- [ ] See questionnaire page (not result page)
- [ ] Can answer questions
- [ ] New report generates

## Need Help?
If issues persist, share:
1. Console logs (screenshot or copy/paste)
2. Backend logs (last 50 lines)
3. What you see on screen
4. What you expected to see

---

**Last Updated**: February 8, 2026
**Commit**: a51b61b6
