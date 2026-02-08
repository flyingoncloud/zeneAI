# Immediate Test Instructions

## Quick Test to Identify Issue

### Step 1: Start Frontend
```bash
cd ~/zeneAI/zeneme-next
npm run dev
```

### Step 2: Open Browser Console
- Open http://localhost:3000/admin
- Press F12 (or Cmd+Option+I on Mac)
- Go to Console tab

### Step 3: Login
- Email: admin@zeneme.com
- Password: admin123

### Step 4: Create/Edit Question
1. Click "新建题目" button
2. Select template "F3 — Single Choice + Stem Image"
3. Scroll down to "媒体 (图片)" section
4. Click the "媒体库" button

### Step 5: Check Console Output

You should see these logs in order:
```
[QuestionEditor] openMediaPicker called with target: stem
[QuestionEditor] showMediaPicker set to true
[QuestionEditor] Render - showMediaPicker: true
[QuestionEditor] useEffect - showMediaPicker: true mediaItems.length: 0
[QuestionEditor] Media picker opened, loading media items...
[reloadMediaItems] Reloading media from: http://localhost:8000/api/admin/media
[QuestionEditor] Rendering media picker modal
```

### Step 6: Visual Check

**If modal appears:**
- ✅ Modal shows with dark backdrop
- ✅ Can see either empty state or 2 images
- ✅ Can click outside to close

**If modal does NOT appear:**
- Check if you see the dark backdrop (even slightly)
- Check if publish modal works (click "发布" button in header)
- Check browser console for errors

### Step 7: Alternative Test - Publish Modal

To verify modals work in general:
1. Click the "发布" button in the top right
2. Publish modal should appear
3. If publish modal works but media picker doesn't → specific issue with media picker
4. If neither works → general modal/AnimatePresence issue

## Expected API Response

When media picker opens, backend should return:
```json
{
  "ok": true,
  "items": [
    {
      "id": "/uploads/1770420463210-4ae9ca99.png",
      "url": "/uploads/1770420463210-4ae9ca99.png",
      "name": "非黑即白.png",
      "type": "image",
      "size": "90.4 KB",
      "uploadedAt": "2026-02-07",
      "mime": "image/png"
    },
    {
      "id": "/uploads/1770420457929-db4b6028.png",
      "url": "/uploads/1770420457929-db4b6028.png",
      "name": "灾难化.png",
      "type": "image",
      "size": "146.3 KB",
      "uploadedAt": "2026-02-07",
      "mime": "image/png"
    }
  ]
}
```

## Common Issues & Solutions

### Issue 1: No Console Logs
**Problem:** Button click not firing
**Solution:** Check if button is disabled or covered by another element

### Issue 2: Logs Show But No Modal
**Problem:** CSS/rendering issue
**Solutions:**
- Check z-index conflicts
- Check if modal is off-screen
- Try removing AnimatePresence temporarily

### Issue 3: Modal Shows But Empty
**Problem:** API not loading or data not displaying
**Solution:** Check network tab for API call to `/api/admin/media`

### Issue 4: Modal Behind Other Elements
**Problem:** z-index too low
**Solution:** Increase z-[90] to z-[999]

## Next Steps Based on Results

Report back what you see in console and whether modal appears!
