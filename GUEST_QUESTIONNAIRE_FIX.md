# Guest User Questionnaire Fix

## Problem Analysis

Guest users were unable to complete the 内视快测 (Inner Quick Assessment) questionnaire due to an authentication check in the frontend code.

### Root Cause

In `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` (lines 331-345), there was logic that:

1. Checked if a `sessionId` existed
2. If not, checked if the user was authenticated (non-guest)
3. **Blocked guest users** with error: "请先登录以使用此功能" (Please login first to use this feature)

```typescript
// OLD CODE (BUGGY)
if (!sessionId) {
  const userId = getUserIdFromAuth();
  if (userId && !userId.startsWith('guest_')) {
    // Only authenticated users could proceed
    const newSessionId = `session_${Date.now()}_${...}`;
    setSessionId(newSessionId);
    return;
  } else {
    // Guest users were BLOCKED here
    setError('请先登录以使用此功能');
    setLoading(false);
    return;
  }
}
```

### Why This Was Wrong

1. **Backend supports guest users**: The `UserQuestionnaireProgress` table and API endpoints already handle guest users correctly
2. **Guest user IDs are valid**: Format `guest_{timestamp}_{random}` is properly tracked
3. **No technical reason to block**: Guest users can complete questionnaires and get reports
4. **Inconsistent with other features**: Other parts of the app allow guest access

## Solution

Removed the authentication check and allow both authenticated and guest users to create session IDs:

```typescript
// NEW CODE (FIXED)
if (!sessionId) {
  const userId = getUserIdFromAuth();
  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  setSessionId(newSessionId);
  console.log('[InnerQuickTest] Created session_id for user:', userId, 'session:', newSessionId);
  return; // Wait for next render with sessionId
}
```

## Technical Details

### Guest User Flow

1. **User enters guest mode**: `useAuthStore.enterGuestMode()` generates ID like `guest_1234567890_abc123def`
2. **Session created**: When starting questionnaire, session ID created like `session_1234567890_xyz789`
3. **Progress tracked**: Backend stores progress in `UserQuestionnaireProgress` table with:
   - `user_id`: guest_1234567890_abc123def
   - `session_id`: session_1234567890_xyz789
   - `questionnaire_id`: admin_created
   - `status`: in_progress → completed
4. **Report generated**: On completion, report created and linked to guest user

### Backend Support

The backend already handles guest users correctly:

- `QuestionnaireProgressService.start_or_resume()` accepts any user_id
- Progress lookup works for guest users
- Report generation works for guest users
- Guest progress persists across page refreshes (via sessionStorage)

### Session Isolation

Guest users are isolated by session:
- Each browser session gets unique guest_id
- Progress tied to session via sessionStorage
- Closing browser clears guest data
- New session = new guest user

## Testing

To verify the fix:

1. Open site in incognito/private browsing mode
2. Enter as guest user
3. Navigate to 内视快测 (Inner Quick Assessment)
4. Should now be able to start and complete questionnaire
5. Should receive report upon completion

## Files Changed

- `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` - Removed guest user blocking logic

## Deployment

Changes committed to `ai-chat-api-v2` branch. Deploy frontend to production:

```bash
cd zeneme-next
npm run build
# Deploy build to production server
```

## Related Issues

This fix also ensures:
- Guest users can see their questionnaire progress
- Guest users can resume incomplete questionnaires
- Guest users can view their reports
- No data loss when guest users complete questionnaires
