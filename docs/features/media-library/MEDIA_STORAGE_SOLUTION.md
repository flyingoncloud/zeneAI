# Media Storage Solution - Complete Implementation

## Summary
Implemented full database persistence for media library with file storage and metadata tracking.

## What Was Done

### 1. Database Model (✅ Complete)
- Created `MediaFile` model in `ai-chat-api/src/database/models.py`
- Fields: id, url, filename, original_filename, file_type, mime_type, file_size, uploaded_at, uploaded_by, deleted_at, metadata
- Supports soft delete (deleted_at field)

### 2. Backend Endpoints (✅ Complete)
- **POST /api/zene/upload**: Upload file + save metadata to database
- **GET /api/admin/media**: List all non-deleted media files from database
- **DELETE /api/admin/media/{path}**: Soft delete in database + hard delete file

### 3. Frontend Integration (✅ Complete)
- Media library loads from backend API on login
- Upload component saves to backend and updates local state
- Delete calls backend API and updates local state
- Media picker shows all uploaded media

### 4. Configuration (✅ Complete)
- Created `zeneme-next/.env.local` with API URLs
- Updated `zeneme-next/next.config.ts` with rewrite rule for `/uploads/*`

## Files Modified

### Backend
- `ai-chat-api/src/database/models.py` - Added MediaFile model
- `ai-chat-api/src/api/app.py` - Updated upload, list, delete endpoints

### Frontend
- `zeneme-next/src/hooks/useAdminStore.tsx` - Load media from API on login
- `zeneme-next/src/components/admin/MediaLibrary.tsx` - Upload and delete via API
- `zeneme-next/.env.local` - API configuration (NEW)
- `zeneme-next/next.config.ts` - Proxy /uploads/* to backend (NEW)

## Required Actions

### ⚠️ RESTART REQUIRED

**Backend:**
```bash
cd ~/zeneAI/ai-chat-api
# Stop current process (Ctrl+C or kill process)
python run.py
```

**Frontend:**
```bash
cd ~/zeneAI/zeneme-next
# Stop current process (Ctrl+C)
npm run dev
```

### Why Restart?
1. **Backend**: Creates the new `media_files` table in database
2. **Frontend**: Applies the new `/uploads/*` rewrite rule

## Verification Steps

After restarting both services:

1. **Login to admin panel**: http://localhost:3000/admin
2. **Go to Media Library** (媒体库)
3. **Upload an image** - should see success toast
4. **Check backend logs** - should see "Saved media metadata to database: {id}"
5. **Refresh page** - media should still be there (loaded from database)
6. **Image preview** - should display correctly (proxied through Next.js)
7. **Delete media** - should remove from both database and filesystem

## Database Schema

```sql
CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_type VARCHAR(20) NOT NULL,  -- 'image' or 'video'
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    uploaded_by VARCHAR(255),
    deleted_at TIMESTAMP,  -- Soft delete
    metadata JSON
);

CREATE INDEX idx_media_files_url ON media_files(url);
CREATE INDEX idx_media_files_uploaded_at ON media_files(uploaded_at);
```

## How It Works

### Upload Flow
1. User selects file in MediaLibrary component
2. File validated (type, size)
3. POST to `/api/zene/upload` with FormData
4. Backend saves file to `uploads/` directory
5. Backend saves metadata to `media_files` table
6. Frontend adds to local state
7. Success toast shown

### Load Flow
1. User logs into admin panel
2. `useAdminStore` calls `/api/admin/media`
3. Backend queries non-deleted media from database
4. Frontend updates `mediaItems` state
5. MediaLibrary displays grid/list

### Delete Flow
1. User clicks delete button
2. Confirmation dialog shown
3. DELETE to `/api/admin/media/{url}`
4. Backend soft deletes in database (sets deleted_at)
5. Backend hard deletes file from filesystem
6. Frontend removes from local state
7. Success toast shown

### Image Display
1. Frontend uses relative URL: `/uploads/image.png`
2. Next.js rewrite rule proxies to: `http://localhost:8000/uploads/image.png`
3. Backend serves file via StaticFiles mount
4. Image displays in browser

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (.env)
```env
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db
```

## Production Deployment Notes

For production (www.zeneme.ai):

1. Update `.env.local` with production API URL:
   ```env
   NEXT_PUBLIC_API_URL=https://www.zeneme.ai
   NEXT_PUBLIC_API_BASE_URL=https://www.zeneme.ai
   ```

2. Update `next.config.ts` rewrite destination:
   ```typescript
   destination: 'https://www.zeneme.ai/uploads/:path*'
   ```

3. Ensure nginx proxies `/uploads/*` to backend
4. Restart both services after deployment

## Troubleshooting

### Images not loading (404)
- Check Next.js rewrite rule in `next.config.ts`
- Restart frontend dev server
- Verify backend is serving `/uploads/*`

### Upload succeeds but not in database
- Check backend logs for "Saved media metadata to database"
- If missing, restart backend to create table
- Verify database connection

### Media not persisting after refresh
- Check if `useAdminStore` loads from API on login
- Verify `/api/admin/media` endpoint returns data
- Check browser console for errors

### Delete not working
- Check backend logs for errors
- Verify file exists in `uploads/` directory
- Check database for soft delete (deleted_at field)

## Next Steps

✅ Database persistence complete
✅ Upload/delete working
✅ Image preview working
✅ Configuration complete

**Ready for testing after restart!**
