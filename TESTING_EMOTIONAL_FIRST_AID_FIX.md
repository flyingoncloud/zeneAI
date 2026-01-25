# Testing Guide: Emotional First Aid Module Fix

## Current Status

✅ **Code Fix Applied**: The frontend code has been updated to use the correct module ID (`emotional_first_aid` instead of `breathing_exercise`)

⚠️ **Testing Required**: You need to rebuild the frontend and test the complete flow

## Why You're Still Seeing the Issue

The AI is correctly recommending the module because:

1. **You're using a NEW conversation session** (`5a9330cd-b589-4148-9ace-8f978c4b8de1`)
2. **The module has never been completed** in this session
3. **The AI sees module status as "not started"** - which is correct!
4. **The fix only applies AFTER completing the module** with the updated code

## Testing Steps

### Step 1: Rebuild Frontend

The frontend code changes need to be compiled:

```bash
# Navigate to frontend directory
cd zeneAI-backend/zeneme-next

# Install dependencies (if needed)
npm install

# Build the frontend
npm run build

# OR run in development mode
npm run dev
```

### Step 2: Test the Complete Flow

1. **Start a new conversation** or continue with current session
2. **Wait for AI to recommend** "情绪急救" (Emotional First Aid)
3. **Click on the module** to start it
4. **Complete both steps**:
   - Breathing Exercise (呼吸训练)
   - Emotion Naming (情绪命名)
5. **Return to chat**
6. **Send another message** to the AI

### Step 3: Verify the Fix

After completing the module, check the following:

#### Backend Logs Should Show:
```
INFO:src.api.app:Successfully marked module emotional_first_aid as complete
```

#### Frontend Console Should Show:
```javascript
[Module Completed] {
  module_id: 'emotional_first_aid',
  conversation_id: '<your-conversation-id>',
  emotion: '<selected-emotion>',
  intensity: <intensity-value>,
  timestamp: '<timestamp>'
}
```

#### AI Behavior Should Be:
- ✅ AI acknowledges module completion
- ✅ AI continues conversation naturally
- ✅ AI does NOT recommend "情绪急救" again
- ✅ AI may recommend other modules (内视涂鸦, 内视快测)

### Step 4: Verify Database

Check that the module status was saved:

```bash
sqlite3 ai-chat-api/chat.db "
SELECT
  id,
  session_id,
  json_extract(metadata, '$.module_status.emotional_first_aid.completed_at') as completed_at,
  json_extract(metadata, '$.module_status.emotional_first_aid.completion_data.emotion') as emotion
FROM conversations
WHERE session_id = '<your-session-id>';
"
```

Expected output:
```
<id>|<session-id>|<timestamp>|<emotion-name>
```

## Troubleshooting

### Issue: Module still being recommended after completion

**Check:**
1. Did you rebuild the frontend after making code changes?
2. Did you refresh the browser to load the new code?
3. Check browser console for any errors during module completion
4. Check backend logs for the completion API call

**Debug:**
```bash
# Check backend logs
tail -f ai-chat-api/backend.log | grep "emotional_first_aid"

# Check if completion API was called
tail -f ai-chat-api/backend.log | grep "complete_module"
```

### Issue: Frontend not calling completion API

**Check:**
1. Browser console for JavaScript errors
2. Network tab in browser DevTools for API calls
3. Verify `conversationId` is set in the frontend state

**Debug in Browser Console:**
```javascript
// Check if conversationId exists
console.log('Conversation ID:', localStorage.getItem('conversationId'));

// Check module status
fetch(`http://localhost:8000/conversations/${conversationId}/modules`)
  .then(r => r.json())
  .then(console.log);
```

### Issue: Database not updating

**Check:**
1. Backend logs for database errors
2. Verify database file permissions
3. Check if `flag_modified` is being called

**Debug:**
```python
# In Python shell
import sys
sys.path.insert(0, 'ai-chat-api/src')
from database.database import SessionLocal
from database.models import Conversation

db = SessionLocal()
conv = db.query(Conversation).filter(Conversation.session_id == '<your-session-id>').first()
print(conv.extra_data)
db.close()
```

## Expected Behavior After Fix

### First Message (Module Not Completed)
```
User: "我感觉很累"
AI: "听起来你现在的状态可能比较疲惫。我们可以试一下呼吸调节..."
[Recommends 情绪急救]
```

### After Completing Module
```
User: [Completes Emotional First Aid]
System: "the user has completed the recommended module..."
```

### Second Message (Module Completed)
```
User: "现在感觉好多了"
AI: "很高兴听到你感觉好一些了。刚才的练习对你有帮助吗？"
[Does NOT recommend 情绪急救 again]
[May naturally recommend other modules if appropriate]
```

## Files Changed

1. `zeneAI-backend/zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`
   - Line 48: Added `addMessage` and `setPendingModuleCompletion` to imports
   - Line 58: Changed module ID from `'breathing_exercise'` to `'emotional_first_aid'`
   - Line 68: Updated console log to use correct module ID
   - Lines 76-77: Added system message and pending module completion

## Related Documentation

- [EMOTIONAL_FIRST_AID_REPEAT_FIX.md](./EMOTIONAL_FIRST_AID_REPEAT_FIX.md) - Detailed explanation of the bug and fix
- [Module Config](ai-chat-api/src/modules/module_config.py) - Valid module IDs
- [Chat Service](ai-chat-api/src/api/chat_service.py) - AI system prompt with module status

## Date

January 25, 2026

## Status

✅ Code fixed, awaiting testing
