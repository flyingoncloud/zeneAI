# Session Management Fix - February 28, 2026

## Problem

When a registered user completed the questionnaire and returned to conversation, the AI incorrectly said "已经开始了" (you've started) instead of "已经完成了" (you've completed).

### Root Cause

1. **Each module created its own session_id independently**
   - Conversation created `session_1772244018272_xs6exntmt`
   - Questionnaire was completed in a different session
   - When returning to conversation, a NEW session was created
   - Backend couldn't find the questionnaire progress because it was tied to the old session

2. **Conversation.user_id was None for registered users**
   - The `ChatRequest` model didn't include `user_id` field
   - Backend wasn't reading `user_id` from the request body
   - Conversations were created with `user_id = None` even for authenticated users

## Solution

### Part 1: Add user_id to ChatRequest (DONE)

**Backend Changes:**

1. **ai-chat-api/src/api/models.py** - Added `user_id` field to ChatRequest:
```python
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None  # NEW: User ID for tracking
    images: Optional[List[str]] = None
```

2. **ai-chat-api/src/api/app.py** - Updated chat endpoint to use user_id from request:
```python
def chat(chat_request: api_models.ChatRequest, db: Session = Depends(get_db)):
    # Extract user_id from request
    user_id = chat_request.user_id
    logger.info(f"Chat request user_id: {user_id}")

    # Create conversation with user_id
    conversation = db_models.Conversation(
        session_id=chat_request.session_id,
        user_id=user_id,  # Now properly set
        extra_data={"module_status": {}}
    )

    # Update existing conversation's user_id if it was None
    if not conversation.user_id and user_id:
        conversation.user_id = user_id
        db.commit()
```

**Frontend Changes:**

The frontend already sends `user_id` in the request (in `zeneme-next/src/lib/api.ts`):
```typescript
const requestWithUserId = {
  ...request,
  user_id: request.user_id ?? userId ?? null,
};
```

### Part 2: Global Session Management (DONE)

**Problem:** Each module (conversation, questionnaire, etc.) was creating its own session_id.

**Solution:** Create ONE session_id when user logs in, store it globally, reuse everywhere.

**Frontend Changes:**

1. **zeneme-next/src/components/auth/AuthPage.tsx** - Create session_id after successful login:
```typescript
if (result.success && result.user) {
  login(result.user);
  // Create a global session_id for this user's entire journey
  const globalSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  setSessionId(globalSessionId);
  console.log('[AuthPage] Created global session_id for user:', globalSessionId);
  toast.success('登录成功！');
}
```

Applied to all login/register methods:
- Email login
- Email registration
- Phone login (password)
- Phone registration

2. **zeneme-next/src/components/features/tools/InnerQuickTest.tsx** - Use existing session_id:
```typescript
// OLD: Created its own session_id
if (!sessionId) {
  const newSessionId = `session_${Date.now()}_...`;
  setSessionId(newSessionId);
  return;
}

// NEW: Requires session_id from login
if (!sessionId) {
  console.error('[InnerQuickTest] No session_id available - user should login first');
  setError('请先登录以使用此功能');
  return;
}
```

### Part 3: Improved Progress Query for Guest Users (DONE)

**ai-chat-api/src/api/chat_service.py** - Added fallback logic for guest users:

When a guest user's session_id doesn't match exactly, the backend now:
1. Searches for recent progress records (within 24 hours)
2. Matches by timestamp proximity (session_id and user_id both contain timestamps)
3. Falls back to most recent guest progress if needed

This handles edge cases where guest users might have multiple sessions.

## How It Works Now

### For Registered Users

1. **User logs in** → `session_1234567890_abc123` created and stored in Zustand
2. **User starts questionnaire** → Uses same `session_1234567890_abc123`
3. **Progress saved** with:
   - `user_id = email_ad6268c680f1ab5224724afb2dd6469f` (from auth)
   - `session_id = session_1234567890_abc123`
4. **User returns to conversation** → Uses same `session_1234567890_abc123`
5. **Backend finds progress** by `user_id` (primary) or `session_id` (fallback)
6. **AI correctly says** "已经完成了" (you've completed)

### For Guest Users

1. **User enters guest mode** → `session_1234567890_xyz789` created
2. **User starts questionnaire** → Uses same session
3. **Progress saved** with:
   - `user_id = guest_1234567890_abc123` (persistent guest ID)
   - `session_id = session_1234567890_xyz789`
4. **User returns to conversation** → Uses same session
5. **Backend finds progress** by matching timestamps or recent guest records
6. **AI correctly recognizes completion status**

## Testing Checklist

- [ ] Register new user with email
- [ ] Verify session_id is created and logged in console
- [ ] Start questionnaire
- [ ] Verify questionnaire uses same session_id
- [ ] Complete all questions
- [ ] Click "返回对话" (return to conversation)
- [ ] Verify AI says "已经完成了" (completed), not "已经开始了" (started)
- [ ] Check backend logs show `user_id` is set in conversation
- [ ] Check backend logs show progress is found by `user_id`

## Files Modified

### Backend
1. `ai-chat-api/src/api/models.py` - Added user_id to ChatRequest
2. `ai-chat-api/src/api/app.py` - Updated chat endpoint to use user_id from request
3. `ai-chat-api/src/api/chat_service.py` - Improved progress query with guest user fallback

### Frontend
1. `zeneme-next/src/components/auth/AuthPage.tsx` - Create session_id on login/register
2. `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` - Use existing session_id instead of creating new one

## Next Steps

1. Restart backend: `cd ai-chat-api && python -m uvicorn src.api.app:app --reload --port 8000`
2. Test the complete flow with a registered user
3. Verify backend logs show correct user_id and session_id
4. Verify AI recognizes questionnaire completion correctly
