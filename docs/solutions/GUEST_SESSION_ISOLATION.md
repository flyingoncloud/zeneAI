# Guest Session Isolation Fix

## Problem

**Before Fix:**
- All guest users shared the same session state
- Guest data persisted in localStorage across browser sessions
- If Guest A completed the questionnaire, Guest B would see the same completion state
- No unique identifier for each guest session

## Solution: Session-Based Guest IDs

**After Fix:**
- Each guest session gets a unique ID (e.g., `guest_1709123456789_abc123xyz`)
- Guest data stored in sessionStorage (clears when browser closes)
- Each browser session is completely independent
- True "guest" experience with automatic cleanup

## Implementation Details

### 1. Frontend Changes

#### `zeneme-next/src/hooks/useAuthStore.ts`

**Key Changes:**
- Uses `sessionStorage` instead of `localStorage` for guest data
- Generates unique guest ID when entering guest mode
- Clears guest data on logout
- Each browser session gets a fresh start

```typescript
// Generate unique guest ID
function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Store in sessionStorage (clears when browser closes)
storage: createJSONStorage(() => sessionStorage)

// Create guest user with unique ID
enterGuestMode: () => {
  const guestUser: User = {
    id: generateGuestId(),
    name: 'Guest User'
  };
  set({ status: 'guest', user: guestUser });
}
```

#### `zeneme-next/src/lib/api.ts`

**Key Changes:**
- Reads user ID from auth store (sessionStorage)
- Sends guest ID to backend with each request
- Backend creates separate sessions for each guest ID

```typescript
function getUserIdFromAuth(): string | undefined {
  // Read from sessionStorage where guest data is stored
  const authData = window.sessionStorage.getItem('zeneme-next-auth-storage');
  if (authData) {
    const parsed = JSON.parse(authData);
    return parsed.state?.user?.id;
  }
  return undefined;
}
```

### 2. Backend Compatibility

**No backend changes required!** The backend already:
- Accepts `user_id` in requests
- Creates separate conversations per `user_id`
- Tracks questionnaire progress per `user_id`

## User Experience

### Before Fix
```
Browser Tab 1: Guest A completes questionnaire
Browser Tab 2: Guest B opens app → sees Guest A's completion ❌
```

### After Fix
```
Browser Tab 1: Guest A completes questionnaire
Browser Tab 2: Guest B opens app → fresh start, independent session ✅
Browser closes → All guest data cleared ✅
Browser reopens → New guest session with new ID ✅
```

## Testing

### Test Case 1: Multiple Browser Tabs
1. Open Tab 1, click "Continue as Guest"
2. Complete questionnaire in Tab 1
3. Open Tab 2, click "Continue as Guest"
4. **Expected**: Tab 2 shows fresh questionnaire, not completed

### Test Case 2: Browser Session Persistence
1. Open browser, click "Continue as Guest"
2. Complete questionnaire
3. Close browser completely
4. Reopen browser, click "Continue as Guest"
5. **Expected**: Fresh start, new guest ID, questionnaire not completed

### Test Case 3: Authenticated Users
1. Login with phone/email
2. Complete questionnaire
3. Close browser
4. Reopen browser
5. **Expected**: Still logged in (authenticated users use localStorage)

## Technical Details

### Storage Strategy

| User Type | Storage | Persistence | Behavior |
|-----------|---------|-------------|----------|
| Guest | sessionStorage | Browser session only | Clears when browser closes |
| Authenticated | localStorage | Permanent | Persists across sessions |

### Guest ID Format

```
guest_<timestamp>_<random>
Example: guest_1709123456789_abc123xyz
```

- `timestamp`: Milliseconds since epoch (ensures uniqueness)
- `random`: Random alphanumeric string (additional uniqueness)

### Data Flow

```
1. User clicks "Continue as Guest"
   ↓
2. Frontend generates unique guest_id
   ↓
3. Frontend stores in sessionStorage
   ↓
4. All API calls include guest_id
   ↓
5. Backend creates separate session for guest_id
   ↓
6. Browser closes → sessionStorage cleared
   ↓
7. Next session → New guest_id generated
```

## Migration Notes

### For Existing Users

**Authenticated Users:**
- No impact - still use localStorage
- Data persists as before

**Guest Users:**
- Old localStorage data will remain but won't be used
- New sessions use sessionStorage
- Old data can be manually cleared if needed

### Cleanup (Optional)

To remove old guest data from localStorage:

```javascript
// Run in browser console
localStorage.removeItem('zeneme_user_id');
```

## Benefits

1. **True Guest Experience**: Each session is independent
2. **Privacy**: Guest data automatically cleared
3. **No Confusion**: Different guests don't see each other's data
4. **Simple**: No manual cleanup needed
5. **Backward Compatible**: Authenticated users unaffected

## Future Enhancements

### Optional: "Resume Session" Feature
- Store guest_id in localStorage with expiry
- Allow guests to resume within 24 hours
- Requires UI: "Resume Previous Session" button

### Optional: Guest Data Cleanup
- Backend cron job to delete old guest data
- Delete guest sessions older than 7 days
- Reduces database size

## Related Files

- `zeneme-next/src/hooks/useAuthStore.ts` - Auth state management
- `zeneme-next/src/lib/api.ts` - API client with user ID handling
- `ai-chat-api/src/api/chat_service.py` - Backend chat service
- `ai-chat-api/src/database/models.py` - Database models

## Deployment

### Frontend
```bash
cd zeneme-next
npm run build
pm2 restart zeneme-next
```

### Backend
No changes required - already compatible

## Verification

After deployment, verify:
1. Open browser console
2. Click "Continue as Guest"
3. Check sessionStorage: `sessionStorage.getItem('zeneme-next-auth-storage')`
4. Should see guest user with unique ID
5. Close browser and reopen
6. Should see different guest ID

## Support

For issues or questions:
- Check browser console for user_id being sent
- Verify sessionStorage contains auth data
- Ensure backend receives unique user_id per session
