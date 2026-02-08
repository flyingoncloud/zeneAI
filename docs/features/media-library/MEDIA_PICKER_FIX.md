# Media Picker Fix - Load Images in Question Editor

## Issue

When creating an F3 question (Single Choice + Stem Image) and clicking the "媒体库" button to select an image, the media picker modal was not showing the available images from the API.

## Root Cause

The media picker modal in `QuestionEditor` was using `mediaItems` from the store, but these items were only loaded when navigating to the Media Library view (`currentView === 'media'`). When you're in the Question Editor, the media items haven't been loaded yet, so the picker showed an empty state.

## Solution

Added a `useEffect` hook in `QuestionEditor.tsx` that automatically loads media items from the backend API when the media picker modal opens.

### Changes Made

**File**: `zeneme-next/src/components/admin/QuestionEditor.tsx`

1. **Added `reloadMediaItems` to store imports**:
   ```typescript
   const { ..., mediaItems, reloadMediaItems } = useAdminStore();
   ```

2. **Added useEffect to load media when picker opens**:
   ```typescript
   // Load media items when media picker opens
   useEffect(() => {
     if (showMediaPicker && mediaItems.length === 0) {
       console.log('[QuestionEditor] Media picker opened, loading media items...');
       reloadMediaItems();
     }
   }, [showMediaPicker, mediaItems.length, reloadMediaItems]);
   ```

## How It Works Now

1. **User creates F3 question** in Question Editor
2. **User clicks "媒体库" button** next to the image URL field
3. **Media picker modal opens**
4. **useEffect detects modal is open** and `mediaItems` is empty
5. **Calls `reloadMediaItems()`** to fetch from backend API
6. **API returns 2 images**:
   - 非黑即白.png (90.4 KB)
   - 灾难化.png (146.3 KB)
7. **Modal displays images in 3-column grid**
8. **User clicks an image** to select it
9. **Image URL is filled** into the question field

## Expected Behavior After Fix

### When Opening Media Picker

**Console Logs**:
```
[QuestionEditor] Media picker opened, loading media items...
[reloadMediaItems] Reloading media from: http://localhost:8000/api/admin/media
[reloadMediaItems] Response status: 200
[reloadMediaItems] Response data: {ok: true, items: Array(2)}
[reloadMediaItems] Setting 2 media items
```

**Network Tab**:
- Request: `GET http://localhost:8000/api/admin/media`
- Status: 200 OK
- Response: 2 media items

**UI**:
- Modal shows 3-column grid
- 2 images displayed with thumbnails
- Click image to select
- Image URL auto-fills in question field

### Modal Layout

```
┌─────────────────────────────────────────┐
│  📁 选择媒体                        ✕   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ 非  │  │ 灾  │  │     │            │
│  │ 黑  │  │ 难  │  │     │            │
│  │ 即  │  │ 化  │  │     │            │
│  │ 白  │  │     │  │     │            │
│  └─────┘  └─────┘  └─────┘            │
│  90.4KB   146.3KB                      │
│                                         │
└─────────────────────────────────────────┘
```

## Testing Steps

1. **Restart frontend**:
   ```bash
   cd zeneme-next
   npm run dev
   ```

2. **Login to admin panel**

3. **Create new question**:
   - Click "新建题目"
   - Select "F3 — Single Choice + Stem Image"

4. **Open media picker**:
   - Find "媒体 (图片)" field
   - Click "📁 媒体库" button

5. **Verify**:
   - Modal opens
   - Console shows loading logs
   - Network tab shows API request
   - 2 images display in grid
   - Click image to select
   - URL fills in field
   - Image preview shows below field

## Additional Features

The media picker also works for:
- **F3**: Stem image selection
- **F4**: Image Cards (A-D) - each card's image
- **F5**: Image Grid (2x3) - each grid item's image
- **F8**: Video + Single Choice - video selection

All these templates can now select media from the picker, and it will automatically load the available media when opened.

## Files Modified

- ✅ `zeneme-next/src/components/admin/QuestionEditor.tsx`
  - Added `reloadMediaItems` to store imports
  - Added useEffect to load media when picker opens

## Benefits

1. ✅ **Automatic loading** - No need to visit Media Library first
2. ✅ **Better UX** - Images load on-demand when needed
3. ✅ **Consistent behavior** - Works same as Media Library page
4. ✅ **Efficient** - Only loads when picker opens and items are empty
5. ✅ **Works for all templates** - F3, F4, F5, F8 all benefit

## Troubleshooting

If images still don't show:

1. **Check console logs** - Should see `[QuestionEditor]` and `[reloadMediaItems]` messages
2. **Check Network tab** - Should see request to `/api/admin/media`
3. **Verify backend is running** - `curl http://localhost:8000/api/admin/media`
4. **Check login state** - Must be logged in to admin panel
5. **Clear browser cache** - Sometimes helps with stale state

## Next Steps

After this fix, you can:
1. Create F3 questions with images
2. Create F4 questions with image cards
3. Create F5 questions with image grids
4. Create F8 questions with videos
5. All media selection will work seamlessly

The media picker is now fully functional and will load images from the backend API automatically when opened!
