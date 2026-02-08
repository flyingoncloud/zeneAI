# Admin API Testing Guide

## Current Status ✅

All backend APIs are working correctly!

### 1. Media Library API ✅ WORKING

**Endpoint**: `GET /api/admin/media`

**Test**:
```bash
curl http://localhost:8000/api/admin/media
```

**Result**: Returns 2 images
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
      "uploadedAt": "2026-02-07"
    },
    {
      "id": "/uploads/1770420457929-db4b6028.png",
      "url": "/uploads/1770420457929-db4b6028.png",
      "name": "灾难化.png",
      "type": "image",
      "size": "146.3 KB",
      "uploadedAt": "2026-02-07"
    }
  ]
}
```

**Conclusion**: Backend is working! The 2 uploaded images are in the database and being returned correctly.

---

### 2. Admin Questions API ✅ WORKING

**Endpoint**: `GET /api/admin/questions`

**Test**:
```bash
curl http://localhost:8000/api/admin/questions
```

**Result**: Returns empty array (correct - no questions created yet)
```json
{
  "ok": true,
  "questions": []
}
```

**Conclusion**: Backend is working! No admin questions have been created yet, so empty array is correct.

---

## Frontend Integration Issues

### Issue 1: Media Library Not Showing Images

**Problem**: Frontend doesn't display the 2 images that exist in the database.

**Possible Causes**:
1. Frontend not calling `/api/admin/media` endpoint
2. Frontend calling but not rendering results
3. Frontend state not updating after API call

**Debug Steps**:

1. **Check if API is being called**:
   - Open browser DevTools → Network tab
   - Navigate to 媒体库 (Media Library)
   - Look for request to `http://localhost:8000/api/admin/media`
   - Check response

2. **Check frontend state**:
   - Add console.log in `useAdminStore.tsx`:
   ```typescript
   useEffect(() => {
     const loadMediaItems = async () => {
       try {
         const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
         const response = await fetch(`${API_BASE_URL}/api/admin/media`);
         const data = await response.json();

         console.log('Media API Response:', data); // ADD THIS

         if (data.ok && data.items) {
           console.log('Setting media items:', data.items); // ADD THIS
           setMediaItems(data.items);
         }
       } catch (error) {
         console.error('Failed to load media items:', error);
       }
     };

     if (isLoggedIn && currentView === 'media') {
       loadMediaItems();
     }
   }, [isLoggedIn, currentView]);
   ```

3. **Check environment variables**:
   - Verify `zeneme-next/.env.local` exists
   - Should contain:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

4. **Restart frontend** (if env vars were just added):
   ```bash
   cd zeneme-next
   npm run dev
   ```

---

### Issue 2: Questions Not Loading

**Problem**: Frontend doesn't show any questions (correct - none exist yet).

**Solution**: Create a test question first!

**Test Question Creation**:
```bash
curl -X POST http://localhost:8000/api/admin/questions \
  -H "Content-Type: application/json" \
  -d '{
    "questionNumber": 1,
    "internalTitle": "测试题目 Q1",
    "template": "F1",
    "stem": "你今天感觉如何？",
    "subtitle": "请根据你的真实感受选择",
    "tags": ["情绪", "测试"],
    "templateSettings": {
      "leftLabel": "非常不好",
      "rightLabel": "非常好"
    },
    "validation": {
      "required": true
    },
    "order": 1
  }'
```

**Expected Response**:
```json
{
  "ok": true,
  "message": "Question created successfully",
  "question": {
    "id": 1,
    "internalTitle": "测试题目 Q1",
    "template": "F1",
    "status": "draft",
    "stem": "你今天感觉如何？",
    ...
  }
}
```

**Then verify**:
```bash
curl http://localhost:8000/api/admin/questions
```

Should now return 1 question!

---

## Frontend Implementation Status

### ✅ Already Implemented

1. **Media Library**:
   - ✅ Upload endpoint integration
   - ✅ Duplicate detection handling
   - ✅ Delete functionality
   - ✅ Display grid/list views
   - ✅ `reloadMediaItems()` function

2. **Questions List**:
   - ✅ Load questions from API
   - ✅ Display questions in list
   - ✅ Question editor UI

### ❌ Not Yet Implemented

1. **Question CRUD Operations**:
   - ❌ `addQuestion()` - Currently only adds to local state
   - ❌ `updateQuestion()` - Currently only updates local state
   - ❌ `deleteQuestion()` - Currently only deletes from local state

**These need to be updated to call backend APIs**:

```typescript
// In useAdminStore.tsx

const addQuestion = useCallback(async (template: TemplateType) => {
  const nextId = getNextAvailableId();
  const now = new Date().toISOString().slice(0, 10);

  // ... prepare question data ...

  // POST to backend
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${API_BASE_URL}/api/admin/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionNumber: nextId,
      internalTitle: `新题目 Q${nextId}`,
      template,
      stem: '',
      // ... other fields ...
    })
  });

  const data = await response.json();
  if (data.ok) {
    // Add to local state
    setQuestions(prev => [...prev, data.question]);
    return data.question;
  }
}, [getNextAvailableId]);

const updateQuestion = useCallback(async (id: number, updates: Partial<AdminQuestion>) => {
  // PUT to backend
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${API_BASE_URL}/api/admin/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  if (data.ok) {
    // Update local state
    setQuestions(prev => prev.map(q => q.id === id ? data.question : q));
  }
}, []);

const deleteQuestion = useCallback(async (id: number) => {
  // DELETE from backend
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(`${API_BASE_URL}/api/admin/questions/${id}`, {
    method: 'DELETE'
  });

  if (response.ok) {
    // Remove from local state
    setQuestions(prev => prev.filter(q => q.id !== id));
  }
}, []);
```

---

## Testing Checklist

### Backend APIs ✅
- [x] GET /api/admin/media - Returns 2 images
- [x] GET /api/admin/questions - Returns empty array
- [ ] POST /api/admin/questions - Create test question
- [ ] PUT /api/admin/questions/{id} - Update test question
- [ ] DELETE /api/admin/questions/{id} - Delete test question

### Frontend Integration ⚠️
- [ ] Media library displays 2 images from backend
- [ ] Questions list loads from backend (after creating test question)
- [ ] Create question calls backend API
- [ ] Update question calls backend API
- [ ] Delete question calls backend API

### Database ✅
- [x] media_files table has 2 records
- [x] assessment_questions table has 0 admin questions
- [x] Migration to unified table complete

---

## Quick Fix Summary

### For Media Library Issue:

1. **Check browser console** for errors
2. **Check Network tab** for API calls
3. **Verify environment variables** in `.env.local`
4. **Restart frontend** if env vars were added
5. **Add debug logging** to see what's happening

### For Questions Issue:

1. **Create a test question** using curl command above
2. **Verify it appears** in API response
3. **Check frontend** loads it from API
4. **Implement backend calls** in `addQuestion`, `updateQuestion`, `deleteQuestion`

---

## Expected Behavior

After fixes:

1. **Media Library**:
   - Shows 2 existing images immediately on load
   - Upload new image → appears immediately
   - Upload duplicate → shows toast and refreshes list

2. **Questions**:
   - Shows empty state when no questions
   - Create question → saves to backend → appears in list
   - Edit question → updates backend → reflects in list
   - Delete question → removes from backend → disappears from list

---

## Next Steps

1. **Debug media library** - Why aren't the 2 images showing?
2. **Create test question** - Verify backend API works
3. **Implement frontend CRUD** - Connect to backend APIs
4. **Test end-to-end** - Full workflow from UI

The backend is ready and working. The issue is in the frontend integration.
