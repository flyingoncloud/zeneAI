# Media Picker Modal - Portal Fix

## Root Cause Identified

The modal was rendering but invisible due to **CSS overflow clipping**.

### Evidence from Logs
```
[QuestionEditor] openMediaPicker called with target: stem ✅
[QuestionEditor] showMediaPicker set to true ✅
[QuestionEditor] Render - showMediaPicker: true ✅
[QuestionEditor] Rendering media picker modal ✅
[QuestionEditor] useEffect - showMediaPicker: true mediaItems.length: 2 ✅
```

All state and rendering worked correctly, but the modal was not visible.

### The Problem

Parent containers had `overflow-hidden`:
1. `QuestionEditor` root: `className="h-full flex flex-col overflow-hidden"`
2. `AdminLayout` page content: `className="flex-1 overflow-hidden"`

Even with `position: fixed` and `z-index: 999`, the modal was being clipped by these overflow containers due to CSS stacking context rules.

## Solution: React Portal

Used `createPortal` from React to render the modal directly to `document.body`, escaping the overflow-hidden containers.

### Changes Made

**File:** `zeneme-next/src/components/admin/QuestionEditor.tsx`

1. **Added import:**
```tsx
import { createPortal } from 'react-dom';
```

2. **Wrapped modal in portal:**
```tsx
{typeof window !== 'undefined' && createPortal(
  <AnimatePresence>
    {showMediaPicker && (
      <motion.div className="fixed inset-0 z-[999]...">
        {/* Modal content */}
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
)}
```

The `typeof window !== 'undefined'` check ensures SSR compatibility (Next.js).

## How It Works

### Before (Clipped)
```
<AdminLayout overflow-hidden>
  <PageContent overflow-hidden>
    <QuestionEditor overflow-hidden>
      <Modal fixed z-999> ❌ Still clipped
```

### After (Portal)
```
<body>
  <AdminLayout overflow-hidden>
    <PageContent overflow-hidden>
      <QuestionEditor overflow-hidden>
  </AdminLayout>
  <Modal fixed z-999> ✅ Rendered at body level
</body>
```

## Testing

### Start Frontend
```bash
cd ~/zeneAI/zeneme-next
npm run dev
```

### Test Steps
1. Go to http://localhost:3000/admin
2. Login: admin@zeneme.com / admin123
3. Click "新建题目" → Select "F3 — Single Choice + Stem Image"
4. Scroll to "媒体 (图片)" section
5. Click "媒体库" button

### Expected Result
✅ Modal appears with dark backdrop
✅ Shows 2 images in 3-column grid:
   - 非黑即白.png (90.4 KB)
   - 灾难化.png (146.3 KB)
✅ Clicking image selects it and closes modal
✅ Selected image URL appears in input field
✅ Image preview shows below

## Why Portal Works

1. **Escapes overflow containers** - Rendered outside the component tree
2. **Maintains React context** - Still has access to state and props
3. **Proper z-index stacking** - At document body level, z-999 works correctly
4. **No CSS conflicts** - Not affected by parent container styles

## Files Modified
- `zeneme-next/src/components/admin/QuestionEditor.tsx`
  - Added `createPortal` import
  - Wrapped media picker modal in portal to `document.body`

## Related Patterns

The same portal pattern is used for:
- Tooltips that need to escape containers
- Dropdown menus that extend beyond parent bounds
- Any modal/overlay that needs to be above everything

## Success Criteria
- ✅ Modal visible when clicking "媒体库"
- ✅ Dark backdrop covers entire screen
- ✅ Modal centered on screen
- ✅ Images load and display correctly
- ✅ Clicking image selects it
- ✅ Modal closes after selection
- ✅ No console errors
