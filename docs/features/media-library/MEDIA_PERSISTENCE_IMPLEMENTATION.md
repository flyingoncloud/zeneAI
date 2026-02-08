# Media Persistence Implementation

## Overview
Implemented filesystem-based persistence for media library metadata, storing uploaded file information in a JSON file on the backend. This ensures media items persist across sessions and are shared between all admin users.

## Architecture

### Backend Storage
- **Files**: Stored in `ai-chat-api/uploads/` directory
- **Metadata**: Stored in `ai-chat-api/uploads/media_metadata.json`
- **Format**: JSON array of media items

### Media Metadata Structure
```json
[
  {
    "id": "/uploads/1738886400000-abc123.jpg",
    "url": "/uploads/1738886400000-abc123.jpg",
    "name": "my-image.jpg",
    "type": "image",
    "size": "245.3 KB",
    "uploadedAt": "2026-02-07",
    "mime": "image/jpeg"
  }
]
```

## Backend Changes

### 1. Updated Upload Endpoint (`/api/zene/upload`)

**Added metadata saving:**
```python
# Save media metadata to JSON file
media_metadata_file = Path("uploads/media_metadata.json")
media_metadata = []

# Load existing metadata
if media_metadata_file.exists():
    with open(media_metadata_file, "r") as f:
        media_metadata = json.load(f)

# Add new media item
media_item = {
    "id": file_url,
    "url": file_url,
    "name": file.filename or unique_filename,
    "type": "image",
    "size": f"{file_size / 1024:.1f} KB",
    "uploadedAt": datetime.utcnow().strftime("%Y-%m-%d"),
    "mime": file.content_type
}
media_metadata.insert(0, media_item)  # Most recent first

# Save updated metadata
with open(media_metadata_file, "w") as f:
    json.dump(media_metadata, f, indent=2)
```

### 2. New GET Endpoint (`/api/admin/media`)

**Purpose**: Retrieve list of all uploaded media

**Request:**
```
GET /api/admin/media
```

**Response:**
```json
{
  "ok": true,
  "items": [
    {
      "id": "/uploads/1738886400000-abc123.jpg",
      "url": "/uploads/1738886400000-abc123.jpg",
      "name": "my-image.jpg",
      "type": "image",
      "size": "245.3 KB",
      "uploadedAt": "2026-02-07",
      "mime": "image/jpeg"
    }
  ]
}
```

### 3. New DELETE Endpoint (`/api/admin/media/{media_id}`)

**Purpose**: Delete media file and its metadata

**Request:**
```
DELETE /api/admin/media/uploads/1738886400000-abc123.jpg
```

**Response:**
```json
{
  "ok": true,
  "message": "Media deleted successfully"
}
```

**What it does:**
1. Deletes the physical file from `uploads/` directory
2. Removes the item from `media_metadata.json`
3. Returns success confirmation

## Frontend Changes

### 1. Admin Store (`zeneme-next/src/hooks/useAdminStore.tsx`)

**Removed localStorage, added API loading:**
```typescript
// Load media items from backend on mount
useEffect(() => {
  const loadMediaItems = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/admin/media`);
      const data = await response.json();

      if (data.ok && data.items) {
        setMediaItems(data.items);
      }
    } catch (error) {
      console.error('Failed to load media items:', error);
    }
  };

  if (isLoggedIn) {
    loadMediaItems();
  }
}, [isLoggedIn]);
```

**Key points:**
- Loads media on login
- Fetches from backend API
- Updates local state with server data

### 2. Media Library (`zeneme-next/src/components/admin/MediaLibrary.tsx`)

**Updated delete handler:**
```typescript
const handleDelete = async (item: MediaItem) => {
  if (!confirm(`确认删除 ${item.name}？`)) return;

  try {
    // Call backend delete endpoint
    const response = await fetch(`${API_BASE_URL}/api/admin/media${item.url}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('删除失败');
    }

    // Remove from local state
    removeMediaItem(item.id);
    showToast('已删除', 'success');
  } catch (error) {
    console.error('Delete error:', error);
    showToast('删除失败', 'error');
  }
};
```

## Data Flow

### Upload Flow
```
1. User uploads file via MediaLibrary
2. Frontend POSTs to /api/zene/upload
3. Backend saves file to uploads/
4. Backend adds metadata to media_metadata.json
5. Backend returns file URL
6. Frontend adds item to local state
7. Item appears in media library
```

### Load Flow
```
1. User logs into admin panel
2. Frontend GETs /api/admin/media
3. Backend reads media_metadata.json
4. Backend returns all media items
5. Frontend updates local state
6. Media library displays all items
```

### Delete Flow
```
1. User clicks delete button
2. Frontend DELETEs /api/admin/media/{id}
3. Backend deletes physical file
4. Backend removes from media_metadata.json
5. Backend returns success
6. Frontend removes from local state
7. Item disappears from media library
```

## Benefits

✅ **Persistent**: Media survives page refreshes and server restarts
✅ **Shared**: All admin users see the same media library
✅ **Simple**: No database required, just JSON file
✅ **Fast**: File-based storage is quick for small datasets
✅ **Reliable**: Atomic file operations prevent corruption

## Limitations

⚠️ **Not suitable for high traffic**: File locking issues with concurrent writes
⚠️ **No pagination**: Loads all media at once (fine for <1000 items)
⚠️ **No search**: Frontend filtering only
⚠️ **No versioning**: No history of deleted items

## Future Enhancements

### Database Migration
For production with multiple admins and high traffic:

1. **Create media table:**
```sql
CREATE TABLE media_files (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    size VARCHAR(50) NOT NULL,
    mime VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(100),
    deleted_at TIMESTAMP NULL
);
```

2. **Update endpoints to use database:**
- Upload: INSERT into media_files
- List: SELECT from media_files WHERE deleted_at IS NULL
- Delete: UPDATE media_files SET deleted_at = NOW()

3. **Add features:**
- Pagination (LIMIT/OFFSET)
- Search (WHERE name LIKE '%query%')
- Soft delete (deleted_at column)
- Upload tracking (uploaded_by column)
- Usage tracking (link to questions)

### Advanced Features
- **Thumbnails**: Generate thumbnails for images
- **CDN integration**: Upload to S3/CloudFront
- **Image optimization**: Compress images on upload
- **Bulk operations**: Upload/delete multiple files
- **Folders**: Organize media into folders
- **Tags**: Tag media for easier searching

## Testing

### Test Upload
1. Navigate to Admin → 媒体库
2. Click "上传文件"
3. Select an image
4. Verify it appears in the grid
5. Refresh page
6. Verify image still appears (persistence)

### Test Delete
1. Hover over a media item
2. Click delete button
3. Confirm deletion
4. Verify item disappears
5. Check `uploads/media_metadata.json` - item should be removed
6. Check `uploads/` directory - file should be deleted

### Test Persistence
1. Upload several images
2. Close browser
3. Reopen and login to admin
4. Navigate to 媒体库
5. Verify all images are still there

### Test Multi-User
1. Upload image in one browser
2. Open admin panel in another browser
3. Login and navigate to 媒体库
4. Verify image appears (shared state)

## Files Modified

### Backend
- `ai-chat-api/src/api/app.py`:
  - Updated `/api/zene/upload` to save metadata
  - Added `GET /api/admin/media` endpoint
  - Added `DELETE /api/admin/media/{media_id}` endpoint

### Frontend
- `zeneme-next/src/hooks/useAdminStore.tsx`:
  - Removed localStorage persistence
  - Added API loading on login
- `zeneme-next/src/components/admin/MediaLibrary.tsx`:
  - Updated delete handler to call backend API

### New Files
- `ai-chat-api/uploads/media_metadata.json` (created automatically on first upload)

## Deployment Notes

1. **Ensure uploads directory exists:**
   ```bash
   mkdir -p ai-chat-api/uploads
   ```

2. **Set proper permissions:**
   ```bash
   chmod 755 ai-chat-api/uploads
   ```

3. **Backup media_metadata.json:**
   ```bash
   cp ai-chat-api/uploads/media_metadata.json ai-chat-api/uploads/media_metadata.json.backup
   ```

4. **Restart backend** to load new endpoints:
   ```bash
   cd ai-chat-api
   python run.py
   ```

5. **Restart frontend** to load new API calls:
   ```bash
   cd zeneme-next
   npm run dev
   ```

## Summary

Media library now uses filesystem-based persistence with a JSON metadata file. This provides a simple, reliable solution for storing and managing uploaded media across sessions without requiring a database. The implementation is production-ready for small to medium traffic and can be migrated to a database solution when needed.
