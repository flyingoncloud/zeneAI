# Media Library Debug Guide

## Issue: No API Request When Opening 媒体库

You reported that when clicking the 媒体库 button, no API request is sent to the backend.

## Changes Made

I've added comprehensive debug logging to `zeneme-next/src/hooks/useAdminStore.tsx` to help identify the issue.

### Debug Logs Added

1. **useEffect trigger logging**:
   - Logs when the effect runs
   - Shows `isLoggedIn` and `currentView` values
   - Shows whether conditions are met

2. **API call logging**:
   - Logs the API URL being called
   - Logs response status
   - Logs response data
   - Logs number of items received

3. **reloadMediaItems logging**:
   - Same detailed logging for manual reload

## How to Debug

### Step 1: Restart Frontend

The logging changes require a restart:

```bash
cd zeneme-next
# Stop the dev server (Ctrl+C if running)
npm run dev
```

### Step 2: Open Browser DevTools

1. Open your browser
2. Press F12 to open DevTools
3. Go to the **Console** tab
4. Clear the console (trash icon)

### Step 3: Navigate to Admin Panel

1. Go to admin login page
2. Login with credentials
3. Click on 媒体库 button

### Step 4: Check Console Output

You should see logs like this:

**Expected Output (Working)**:
```
[MediaLibrary] useEffect triggered - isLoggedIn: true currentView: media
[MediaLibrary] Conditions met, loading media...
[MediaLibrary] Loading media from: http://localhost:8000/api/admin/media
[MediaLibrary] Response status: 200
[MediaLibrary] Response data: {ok: true, items: Array(2)}
[MediaLibrary] Setting 2 media items
```

**If Not Working, You Might See**:
```
[MediaLibrary] useEffect triggered - isLoggedIn: false currentView: login
[MediaLibrary] Conditions not met, skipping load
```

OR

```
[MediaLibrary] useEffect triggered - isLoggedIn: true currentView: questions
[MediaLibrary] Conditions not met, skipping load
```

### Step 5: Check Network Tab

1. Go to **Network** tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for request to `/api/admin/media`

**If you see the request**:
- Check the status code (should be 200)
- Check the response (should have 2 items)
- Check if there are any CORS errors

**If you don't see the request**:
- The useEffect condition is not being met
- Check the console logs to see why

## Common Issues and Solutions

### Issue 1: `isLoggedIn` is false

**Symptom**: Console shows `isLoggedIn: false`

**Solution**:
- Check if login is working correctly
- Verify the login function sets `isLoggedIn` to true
- Check if there's a redirect happening that resets state

### Issue 2: `currentView` is not 'media'

**Symptom**: Console shows `currentView: questions` or `currentView: login`

**Solution**:
- Check if clicking 媒体库 button actually calls `setCurrentView('media')`
- Look for the button click handler
- Verify the view state is being updated

### Issue 3: Environment variables not set

**Symptom**: API URL shows `http://localhost:8000` but backend is on different port

**Solution**:
1. Create/verify `zeneme-next/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```
2. Restart frontend after creating/modifying `.env.local`

### Issue 4: CORS error

**Symptom**: Network tab shows request but with CORS error

**Solution**:
- Check backend CORS configuration
- Verify backend is running on port 8000
- Check if frontend is on port 3000

### Issue 5: API returns error

**Symptom**: Request succeeds but response has error

**Solution**:
- Check backend logs
- Verify database connection
- Check if media_files table exists

## Manual Test

You can also test the API directly from the browser console:

```javascript
// Test API call manually
fetch('http://localhost:8000/api/admin/media')
  .then(r => r.json())
  .then(data => console.log('Manual test result:', data))
  .catch(err => console.error('Manual test error:', err));
```

Expected result:
```javascript
{
  ok: true,
  items: [
    {
      id: "/uploads/1770420463210-4ae9ca99.png",
      url: "/uploads/1770420463210-4ae9ca99.png",
      name: "非黑即白.png",
      type: "image",
      size: "90.4 KB",
      uploadedAt: "2026-02-07",
      mime: "image/png"
    },
    {
      id: "/uploads/1770420457929-db4b6028.png",
      url: "/uploads/1770420457929-db4b6028.png",
      name: "灾难化.png",
      type: "image",
      size: "146.3 KB",
      uploadedAt: "2026-02-07",
      mime: "image/png"
    }
  ]
}
```

## What to Report Back

After following these steps, please share:

1. **Console logs** - Copy the `[MediaLibrary]` logs
2. **Network tab** - Screenshot or describe what you see
3. **Manual test result** - What the manual fetch returns
4. **Environment** - Confirm `.env.local` exists and has correct values

This will help identify exactly where the issue is occurring.

## Quick Checklist

- [ ] Frontend restarted after code changes
- [ ] Browser DevTools open (Console + Network tabs)
- [ ] Logged into admin panel
- [ ] Clicked 媒体库 button
- [ ] Checked console for `[MediaLibrary]` logs
- [ ] Checked Network tab for `/api/admin/media` request
- [ ] Ran manual fetch test in console
- [ ] Verified `.env.local` file exists

## Expected Behavior

When everything is working:

1. Click 媒体库 button
2. Console shows: "Conditions met, loading media..."
3. Network tab shows: GET request to `/api/admin/media`
4. Response: 200 OK with 2 items
5. UI displays: 2 images in grid view

## Files Modified

- `zeneme-next/src/hooks/useAdminStore.tsx` - Added debug logging

## Next Steps

1. Restart frontend
2. Follow debug steps above
3. Share console logs and Network tab results
4. We'll identify the exact issue and fix it

The debug logging will tell us exactly what's happening (or not happening) when you click the 媒体库 button.
