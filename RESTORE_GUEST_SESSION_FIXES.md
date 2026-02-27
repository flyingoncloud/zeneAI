# Guest Session Isolation - Changes to Restore

## Summary
These changes fix the guest session isolation issue where all guests shared the same session state.

## Files Changed

### 1. zeneme-next/src/hooks/useAuthStore.ts
**Changes:**
- Import `createJSONStorage` from zustand/middleware
- Add `generateGuestId()` function
- Use `sessionStorage` instead of `localStorage`
- Generate unique guest ID in `enterGuestMode()`
- Clear guest data in `logout()`

### 2. zeneme-next/src/lib/api.ts
**Changes:**
- Replace `getOrCreateUserId()` with `getUserIdFromAuth()`
- Read user_id from sessionStorage (auth store)
- Update `sendChatMessage()` to use new function
- Update `startQuestionnaire()` to use new function

### 3. zeneme-next/src/components/features/tools/InnerQuickTest.tsx
**Changes:**
- Import `useAuthStore`
- Replace `getOrCreateUserId()` with `getUserIdFromAuth()`
- Read from sessionStorage instead of localStorage
- Check `status='completed'` BEFORE checking index
- Only reset if `status='in_progress'` AND index >= length

### 4. ai-chat-api/src/services/questionnaire_progress.py
**Changes:**
- Query for both 'completed' and 'in_progress' status
- Return completed progress (don't create new)
- Validate in_progress isn't stale
- Create new progress only if truly stale

## Apply Changes

Run these commands to restore:

```bash
# 1. Update useAuthStore.ts
# 2. Update api.ts
# 3. Update InnerQuickTest.tsx
# 4. Update questionnaire_progress.py
# 5. Commit all changes
```

## Testing

1. Guest login → Complete questionnaire
2. Return to conversation
3. Revisit questionnaire → Should show report
4. Close browser, reopen
5. New guest session → Should start fresh

