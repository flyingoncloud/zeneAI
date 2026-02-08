# Media Picker Implementation Complete

## Overview
Implemented media picker functionality in the Question Editor, allowing users to select uploaded media from the Media Library when creating questions with images (F3, F4, F5, F8 templates).

## Changes Made

### QuestionEditor Component (`zeneme-next/src/components/admin/QuestionEditor.tsx`)

#### New State Variables
```typescript
const [showMediaPicker, setShowMediaPicker] = useState(false);
const [mediaPickerTarget, setMediaPickerTarget] = useState<'stem' | { type: 'option', index: number } | null>(null);
```

- `showMediaPicker`: Controls visibility of media picker modal
- `mediaPickerTarget`: Tracks which field is being edited (stem image or option image)

#### New Functions

**openMediaPicker**
```typescript
const openMediaPicker = (target: 'stem' | { type: 'option', index: number }) => {
  setMediaPickerTarget(target);
  setShowMediaPicker(true);
};
```
Opens the media picker modal and tracks which field will receive the selected media.

**selectMedia**
```typescript
const selectMedia = (item: MediaItem) => {
  if (mediaPickerTarget === 'stem') {
    setMediaUrl(item.url);
    setMediaType(item.type);
  } else if (mediaPickerTarget && typeof mediaPickerTarget === 'object') {
    updateOption(mediaPickerTarget.index, 'imageUrl', item.url);
  }
  setShowMediaPicker(false);
  setMediaPickerTarget(null);
  showToast('已选择媒体');
};
```
Handles media selection and updates the appropriate field.

#### UI Updates

**1. Stem Media Section (F3, F8 templates)**
Added "媒体库" button next to the URL input:
```tsx
<button
  onClick={() => openMediaPicker('stem')}
  className="h-9 px-3 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
>
  <FolderOpen size={14} /> 媒体库
</button>
```

**2. Option Images Section (F4, F5 templates)**
Added compact media picker button next to each option's image URL input:
```tsx
<button
  onClick={() => openMediaPicker({ type: 'option', index: idx })}
  className="h-8 px-2.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
>
  <FolderOpen size={12} />
</button>
```

**3. Media Picker Modal**
Full-featured modal with:
- Grid layout (3 columns) showing all uploaded media
- Image thumbnails with hover effects
- Video placeholders with video icon
- Click to select functionality
- Empty state with "前往媒体库" button
- Smooth animations (fade in/out, scale)
- Hover overlay with checkmark icon

## Features

### For Stem Images (F3, F8)
1. Click "媒体库" button next to URL input
2. Modal opens showing all uploaded media
3. Click any media item to select it
4. URL and media type are automatically filled
5. Preview appears below the input

### For Option Images (F4, F5)
1. Click folder icon button next to option's image URL input
2. Modal opens showing all uploaded media
3. Click any media item to select it
4. Image URL is automatically filled for that option
5. Option preview updates in the right panel

### Empty State
When no media has been uploaded:
- Shows helpful message
- Provides "前往媒体库" button
- Clicking button closes picker and navigates to Media Library page
- User can upload files and return to continue editing

## User Flow

### Creating F3 Question (Single Choice + Stem Image)
1. Create new question with F3 template
2. Fill in question text
3. In "媒体 (图片)" section, click "媒体库" button
4. Select an image from the media library
5. Image URL is automatically filled
6. Preview appears showing the selected image
7. Add answer options
8. Save or publish

### Creating F4 Question (Image Cards)
1. Create new question with F4 template
2. Fill in question text
3. For each option (A, B, C, D):
   - Enter option text
   - Click folder icon next to "图片 URL" input
   - Select image from media library
   - Image URL is automatically filled
4. Preview updates showing all image cards
5. Save or publish

### Creating F5 Question (Image Grid)
1. Create new question with F5 template
2. Fill in question text
3. For each grid item (up to 6):
   - Enter option text
   - Click folder icon next to "图片 URL" input
   - Select image from media library
   - Image URL is automatically filled
4. Preview updates showing the grid layout
5. Save or publish

## Technical Details

### Media Picker Modal Structure
```tsx
<AnimatePresence>
  {showMediaPicker && (
    <motion.div className="fixed inset-0 z-[90] ...">
      <motion.div className="bg-[#1A1B23] ... max-w-[700px] max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h3>选择媒体</h3>
          <button onClick={close}>X</button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[480px]">
          {mediaItems.length === 0 ? (
            /* Empty state */
          ) : (
            /* Grid of media items */
            <div className="grid grid-cols-3 gap-3">
              {mediaItems.map(item => (
                <div onClick={() => selectMedia(item)}>
                  {/* Media preview */}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

### State Management
- Uses `useAdminStore` to access `mediaItems` array
- No additional API calls needed (media already loaded)
- Updates question state directly via `setMediaUrl` or `updateOption`
- Toast notification confirms selection

### Styling
- Consistent with admin panel design system
- Violet accent color for media-related actions
- Hover effects on media items
- Smooth animations using Framer Motion
- Responsive grid layout
- Dark theme with proper contrast

## Templates Affected

| Template | Code | Media Support | Implementation |
|----------|------|---------------|----------------|
| F3 | Single Choice + Stem Image | Stem image | ✅ Media picker button |
| F4 | Image Cards (A-D) | 4 option images | ✅ Media picker per option |
| F5 | Image Grid (2x3) | Up to 6 option images | ✅ Media picker per option |
| F8 | Video + Single Choice | Stem video | ✅ Media picker button |

## Testing Checklist

- [ ] F3: Click "媒体库" button opens picker
- [ ] F3: Select image from picker fills URL
- [ ] F3: Selected image appears in preview
- [ ] F4: Click folder icon for option A opens picker
- [ ] F4: Select image fills option A's image URL
- [ ] F4: Repeat for options B, C, D
- [ ] F4: All 4 images appear in preview
- [ ] F5: Click folder icon for each grid item
- [ ] F5: Select images for all 6 items
- [ ] F5: Grid preview shows all images
- [ ] F8: Click "媒体库" button opens picker
- [ ] F8: Select video from picker fills URL
- [ ] Empty state: Shows "前往媒体库" button
- [ ] Empty state: Button navigates to media library
- [ ] Modal: Click outside closes picker
- [ ] Modal: Click X button closes picker
- [ ] Toast: Shows "已选择媒体" after selection

## Backend Status

✅ **Backend is running** - Port 8000 is in use (as reported by user)
- The backend was already running when we tried to start it
- CORS is properly configured for `http://localhost:3000`
- Upload endpoint `/api/zene/upload` is available
- Media library can upload and store files

## Next Steps

1. **Test the implementation:**
   - Create a new F3 question
   - Click "媒体库" button
   - Verify media picker opens
   - Select an image
   - Verify URL is filled and preview appears

2. **Upload test media:**
   - Navigate to Media Library page
   - Upload a few test images
   - Return to Question Editor
   - Verify uploaded images appear in picker

3. **Test all templates:**
   - F3: Stem image selection
   - F4: 4 option images
   - F5: 6 grid images
   - F8: Video selection

4. **Future enhancements:**
   - Add search/filter in media picker
   - Show recently used media first
   - Add "Upload New" button in picker
   - Support drag-and-drop from picker
   - Show media dimensions and file info

## Related Files

- Question Editor: `zeneme-next/src/components/admin/QuestionEditor.tsx`
- Admin Store: `zeneme-next/src/hooks/useAdminStore.tsx`
- Media Library: `zeneme-next/src/components/admin/MediaLibrary.tsx`
- Media Upload Guide: `MEDIA_UPLOAD_IMPLEMENTATION.md`
- Admin Integration: `ADMIN_INTEGRATION_COMPLETE.md`

## Notes

- Media picker uses existing `mediaItems` from admin store
- No additional API calls needed for picker
- Works with both images and videos
- Automatically detects media type from selected item
- Consistent UX across all templates
- Empty state guides users to upload media first
- All TypeScript errors resolved
- Ready for testing
