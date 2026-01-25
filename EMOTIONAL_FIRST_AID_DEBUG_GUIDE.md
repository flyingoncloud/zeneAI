# Emotional First Aid - Debugging Guide

## Changes Made

Added comprehensive console logging to track the completion flow:

### Files Modified:
1. `zeneAI-backend/zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`
2. `zeneAI-backend/zeneme-next/src/components/features/tools/firstaid/EmotionPage.tsx`

## How to Debug

### Step 1: Restart Frontend
```bash
cd zeneAI-backend/zeneme-next
npm run dev
```

### Step 2: Open Browser DevTools
1. Press `F12` or right-click → "Inspect"
2. Go to the **Console** tab
3. Go to the **Network** tab (keep both open)

### Step 3: Complete the Module
1. Start a conversation
2. When AI recommends Emotional First Aid, click the button
3. Complete breathing exercise
4. **Select an emotion** (click emoji or text)
5. **Adjust intensity slider**
6. Click "保存并退出" (Save and Exit)

### Step 4: Check Console Logs

You should see this sequence:

```
[EmotionPage] handleSave called
[EmotionPage] selectedEmotion: 0
[EmotionPage] selectedEmoji: 0
[EmotionPage] intensity: 50
[EmotionPage] moodToSave: Anxious
[EmotionPage] Calling onComplete with: {emotion: "Anxious", intensity: 50}

[EmotionalFirstAid] handleComplete called with: {emotion: "Anxious", intensity: 50}
[EmotionalFirstAid] conversationId: 184  ← CRITICAL: Must have a number here!
[EmotionalFirstAid] Calling completeModuleWithRetry...
[EmotionalFirstAid] API result: {ok: true, module_status: {...}}
[Module Completed] {module_id: "emotional_first_aid", ...}
```

### Step 5: Check Network Tab

Filter by "complete" and you should see:

```
POST http://localhost:8000/conversations/184/modules/emotional_first_aid/complete
Status: 200 OK
```

## Common Issues

### Issue 1: No conversationId
**Symptom:** Console shows `conversationId: null` or `conversationId: undefined`

**Cause:** The conversation wasn't created or the ID wasn't stored in Zustand

**Solution:**
1. Check if you sent at least one message before opening the module
2. Check Zustand store state in React DevTools
3. Verify the chat API response includes `conversation_id`

### Issue 2: API Call Fails (404)
**Symptom:** Network tab shows 404 error

**Cause:** Backend not running or wrong URL

**Solution:**
```bash
cd ai-chat-api
python run.py
```

Verify backend is running on `http://localhost:8000`

### Issue 3: API Call Fails (500)
**Symptom:** Network tab shows 500 error

**Cause:** Backend error (check backend logs)

**Solution:**
Check backend terminal for error messages

### Issue 4: No Network Request
**Symptom:** No POST request appears in Network tab

**Possible Causes:**
1. `conversationId` is null/undefined (check console)
2. JavaScript error preventing execution (check console for errors)
3. Button click not triggering `handleSave` (check console for `[EmotionPage] handleSave called`)

## Verification After Completion

### 1. Check Backend Logs
Should show:
```
INFO:src.api.app:Marking module emotional_first_aid as complete for conversation 184
INFO:src.api.app:Successfully marked module emotional_first_aid as complete
```

### 2. Check Database
```bash
psql -U chat_user -d chat_db -h localhost -p 5432
# Password: chat_pass

SELECT
  id,
  session_id,
  metadata->'module_status'->'emotional_first_aid' as emotional_first_aid_status
FROM conversations
WHERE id = 184;  -- Replace with your conversation_id
```

Should show:
```json
{
  "recommended_at": "2026-01-25T05:25:56.831453",
  "completed_at": "2026-01-25T07:30:00.000000",  ← Should be present!
  "completion_data": {
    "completed_steps": ["breathing", "emotion_naming"],
    "emotion": "Anxious",
    "intensity": 50
  }
}
```

### 3. Test AI Behavior
Send a new message expressing tiredness/stress. The AI should:
- ✅ NOT recommend Emotional First Aid (already completed)
- ✅ Recommend other modules (Inner Doodling or Quick Assessment)

## Next Steps

Based on the console logs, we can identify:

1. **If `conversationId` is null:** Need to fix conversation creation/storage
2. **If API call fails:** Need to fix backend or network configuration
3. **If API succeeds but AI still recommends:** Need to check if system prompt is being updated

Share the console logs and we can pinpoint the exact issue!
