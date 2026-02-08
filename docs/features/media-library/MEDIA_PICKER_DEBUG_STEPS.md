# Media Picker Modal Debug Steps

## Issue
When clicking the "媒体库" button in QuestionEditor (for F3 template), the media picker modal does not appear.

## Changes Made

### 1. Added Debug Console Logs

Added console.log statements to track:
- `openMediaPicker()` function call
- `showMediaPicker` state changes
- Modal rendering
- useEffect triggers

### 2. Locations of Debug Logs

**QuestionEditor.tsx:**
- Line ~65: useEffect for loading media items
- Line ~105: openMediaPicker function
- Line ~540: Modal render check
- After `if (!question) return null`: Component render state

## Testing Steps

1. **Start the frontend:**
   ```bash
   cd ~/zeneAI/zeneme-next
   npm run dev
   ```

2. **Open browser console** (F12 or Cmd+Option+I)

3. **Login to admin panel:**
   - Go to http://localhost:3000/admin
   - Login with: admin@zeneme.com / admin123

4. **Create or edit a question:**
   - Click "新建题目" or edit existing question
   - Select template "F3 — Single Choice + Stem Image"

5. **Click the "媒体库" button** in the "媒体 (图片)" section

6. **Check console output:**
   - Should see: `[QuestionEditor] openMediaPicker called with target: stem`
   - Should see: `[QuestionEditor] showMediaPicker set to true`
   - Should see: `[QuestionEditor] Render - showMediaPicker: true`
   - Should see: `[QuestionEditor] Rendering media picker modal`

## Expected Behavior

When clicking "媒体库" button:
1. Modal should appear with dark backdrop
2. Modal should show either:
   - Empty state with "媒体库为空" message (if no media uploaded)
   - Grid of 2 images (if media exists in database)
3. API call to `/api/admin/media` should be made
4. Response should show 2 images: "非黑即白.png" and "灾难化.png"

## Possible Issues to Check

### 1. State Not Updating
- Check if `showMediaPicker` is actually changing to `true`
- Check if React is re-rendering after state change

### 2. Modal Being Rendered But Hidden
- Check z-index conflicts (currently z-[90])
- Check if backdrop is transparent
- Check if modal is off-screen

### 3. AnimatePresence Issue
- Check if framer-motion is working correctly
- Try removing AnimatePresence temporarily

### 4. Event Handler Not Firing
- Check if button click is being captured
- Check if there's an overlay blocking clicks

## Next Steps

Based on console output:
- If no logs appear → Button click handler not firing
- If logs appear but modal doesn't show → CSS/rendering issue
- If modal shows but empty → API/data loading issue

## Files Modified
- `zeneme-next/src/components/admin/QuestionEditor.tsx`
