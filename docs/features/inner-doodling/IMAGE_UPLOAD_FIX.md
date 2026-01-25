# Image Upload Fix - "上传图片" Button

## Issue

The "上传图片" (Upload Image) button in the chat input was not functional. When users clicked it and selected an image, nothing happened - the file was selected but not uploaded to the backend.

## Root Cause

The `handleFileUpload` function in `ChatInput.tsx` was only logging the file selection but not actually uploading the file to the backend or sending it to the AI for analysis.

## Solution

### 1. Backend - Added General Upload Endpoint

Created a new endpoint `/api/zene/upload` in the Python FastAPI backend to handle general image uploads (separate from the sketch-specific endpoint).

**File**: `ai-chat-api/src/api/app.py`

**Features**:
- Accepts PNG, JPEG, JPG, and WebP images
- Validates file type and size (5MB limit)
- Saves files to `/uploads/` directory with unique filenames
- Returns file URL for use in chat
- Proper error handling with HTTP status codes

**Endpoint Details**:
```python
@app.post("/api/zene/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validates content type (PNG, JPEG, WebP)
    # Validates file size (5MB max)
    # Saves to uploads/ directory
    # Returns: { ok: true, url: "/uploads/filename.jpg", mime: "image/jpeg", size: 12345 }
```

### 2. Backend - Static File Serving

Added static file serving for the `/uploads` directory so uploaded images can be accessed via HTTP.

**Changes**:
- Imported `StaticFiles` from `fastapi.staticfiles`
- Mounted `/uploads` directory as static files
- Created uploads directory on startup if it doesn't exist

```python
from fastapi.staticfiles import StaticFiles

# Mount static files for uploads
uploads_dir = Path("uploads")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

### 3. Frontend - Implemented Upload Logic

Updated the `handleFileUpload` function in `ChatInput.tsx` to actually upload files and send them to the AI.

**File**: `zeneme-next/src/components/ChatInput.tsx`

**Implementation**:
```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // Show uploading toast
    setToast({ visible: true, message: '正在上传图片...', type: 'info' });

    // Upload file to backend
    const { uploadFile } = await import('../lib/api');
    const result = await uploadFile(file);

    if (result.ok && result.url) {
      // Convert relative URL to full URL
      const fullImageUrl = result.url.startsWith('http')
        ? result.url
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${result.url}`;

      // Send to AI for analysis
      onSendMessage(`请分析这张图片中表达的情感和感受 [图片: ${fullImageUrl}]`);

      setToast({ visible: true, message: '图片上传成功！', type: 'success' });
    } else {
      setToast({ visible: true, message: '图片上传失败，请重试', type: 'error' });
    }
  } catch (error) {
    setToast({ visible: true, message: '图片上传失败，请重试', type: 'error' });
  } finally {
    // Clear file input and hide toast
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setToast({ ...toast, visible: false }), 3000);
  }
};
```

**Features**:
- Shows loading toast while uploading
- Uploads file using the `uploadFile` API function
- Converts relative URL to full URL for display
- Sends uploaded image URL to AI for emotional analysis
- Shows success/error toasts
- Clears file input after upload
- Proper error handling

### 4. API Function Already Existed

The `uploadFile` function already existed in `zeneme-next/src/lib/api.ts` but wasn't being used:

```typescript
export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/zene/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data;
}
```

## How It Works Now

1. **User clicks "上传图片" button** in the chat input
2. **File picker opens** and user selects an image
3. **Frontend uploads file** to `/api/zene/upload` endpoint
4. **Backend validates** file type and size
5. **Backend saves file** to `/uploads/` directory with unique filename
6. **Backend returns** file URL (e.g., `/uploads/1738012345678-a1b2c3d4.jpg`)
7. **Frontend converts** to full URL (e.g., `http://localhost:8000/uploads/...`)
8. **Frontend sends message** to AI with image URL for analysis
9. **AI analyzes** the image and responds with emotional insights

## File Structure

```
ai-chat-api/
├── uploads/                          # Uploaded images directory
│   ├── 1738012345678-a1b2c3d4.jpg   # General uploads
│   └── sketches/                     # Sketch-specific uploads
│       └── uuid.png
└── src/
    └── api/
        └── app.py                    # Added /api/zene/upload endpoint

zeneme-next/
└── src/
    ├── components/
    │   └── ChatInput.tsx             # Updated handleFileUpload
    └── lib/
        └── api.ts                    # uploadFile function (already existed)
```

## API Endpoints

### Upload Image
```
POST /api/zene/upload
Content-Type: multipart/form-data

Body:
- file: File (PNG, JPEG, WebP, max 5MB)

Response:
{
  "ok": true,
  "url": "/uploads/1738012345678-a1b2c3d4.jpg",
  "mime": "image/jpeg",
  "size": 123456
}
```

### Access Uploaded Image
```
GET /uploads/1738012345678-a1b2c3d4.jpg

Returns: Image file
```

## Testing

### Manual Testing Steps

1. **Start backend**:
   ```bash
   cd ai-chat-api
   python run.py
   ```

2. **Start frontend**:
   ```bash
   cd zeneme-next
   npm run dev
   ```

3. **Test upload**:
   - Open chat interface
   - Click the "+" button
   - Click "上传图片"
   - Select an image file
   - Verify:
     - "正在上传图片..." toast appears
     - Image uploads successfully
     - "图片上传成功！" toast appears
     - Message sent to AI with image URL
     - AI responds with emotional analysis

### Expected Behavior

✅ **Success Case**:
- File uploads successfully
- Success toast shows
- Message sent to AI
- AI analyzes image and responds

❌ **Error Cases**:
- **Unsupported file type**: Shows error toast "图片上传失败，请重试"
- **File too large (>5MB)**: Shows error toast
- **Network error**: Shows error toast
- **Backend error**: Shows error toast

## Comparison with zeneAI-frontend

The implementation now matches the working version in `zeneAI-frontend`:

| Feature | zeneAI-frontend | zeneme-next (Fixed) |
|---------|----------------|---------------------|
| Upload endpoint | `/api/zene/upload` | `/api/zene/upload` ✅ |
| File validation | Yes | Yes ✅ |
| Size limit | 5MB | 5MB ✅ |
| Static serving | Yes | Yes ✅ |
| Error handling | Yes | Yes ✅ |
| Toast feedback | Yes | Yes ✅ |
| AI analysis | Yes | Yes ✅ |

## Benefits

1. **Functional Upload**: Users can now upload images for emotional analysis
2. **User Feedback**: Toast notifications keep users informed
3. **Error Handling**: Proper error messages for all failure cases
4. **File Validation**: Prevents invalid files and oversized uploads
5. **Consistent API**: Matches the working implementation in zeneAI-frontend
6. **Static Serving**: Uploaded images are accessible via HTTP

## Future Enhancements

1. **Image Preview**: Show thumbnail before sending
2. **Multiple Images**: Support uploading multiple images at once
3. **Image Compression**: Compress large images before upload
4. **Progress Bar**: Show upload progress for large files
5. **Image Gallery**: View previously uploaded images
6. **Delete Images**: Allow users to delete uploaded images

## Related Files

- `ai-chat-api/src/api/app.py` - Backend upload endpoint
- `zeneme-next/src/components/ChatInput.tsx` - Frontend upload logic
- `zeneme-next/src/lib/api.ts` - API client functions
- `zeneAI-frontend/components/ChatBox.tsx` - Reference implementation
- `zeneAI-frontend/lib/api.ts` - Reference API client

## Troubleshooting

### Image not uploading
- Check backend is running on port 8000
- Check CORS is configured correctly
- Check uploads directory exists and is writable

### Image not displaying
- Check static files are mounted correctly
- Check file URL is correct
- Check browser console for errors

### AI not analyzing image
- Check message format includes image URL
- Check AI service is configured
- Check backend logs for errors

---

**Fix Date**: January 26, 2026
**Status**: ✅ Complete and tested
**Backend**: Python FastAPI (ai-chat-api)
**Frontend**: Next.js 16 (zeneme-next)
