# Inner Doodling Image Display Fix

## Problem
When users uploaded images using the "上传图片" (Upload Image) button, the images were not displayed in the chat interface. Instead, only the text URL was shown like:
```
请分析这张图片中表达的情感和感受 [图片: http://localhost:8000/uploads/1769304894788-bde43c30.png]
```

## Root Cause
The image URL was being embedded directly in the message text instead of being stored as an attachment in the message object. The chat interface only displays images when they are stored in the `attachment` field of the message.

## Solution
Modified the image upload flow to use the attachment field instead of embedding URLs in text:

### 1. Updated `ChatInput.tsx`
**File**: `zeneme-next/src/components/ChatInput.tsx`

Changed `handleFileUpload` to dispatch a custom event with the image attachment:
```typescript
// Send message with image attachment via custom event
const messageEvent = new CustomEvent('sendMessageWithAttachment', {
  detail: {
    text: '请分析这张图片中表达的情感和感受',
    attachment: {
      type: 'image' as const,
      url: fullImageUrl,
      preview: fullImageUrl
    }
  }
});
window.dispatchEvent(messageEvent);
```

### 2. Updated `page.tsx`
**File**: `zeneme-next/src/app/page.tsx`

- Modified `handleSendMessage` to accept an optional `attachment` parameter
- Added event listener for `sendMessageWithAttachment` custom event
- Passes attachment to `addMessage` when present

```typescript
const handleSendMessage = async (text: string, attachment?: {
  type: 'image' | 'voice' | 'sketch' | 'gallery';
  url?: string;
  preview?: string;
}) => {
  addMessage(text, "user", attachment);
  // ... rest of the logic
};

// Handle custom event for sending messages with attachments
React.useEffect(() => {
  const handleMessageWithAttachment = (event: Event) => {
    const customEvent = event as CustomEvent<{
      text: string;
      attachment: { ... };
    }>;

    if (customEvent.detail) {
      handleSendMessage(customEvent.detail.text, customEvent.detail.attachment);
    }
  };

  window.addEventListener('sendMessageWithAttachment', handleMessageWithAttachment);
  return () => {
    window.removeEventListener('sendMessageWithAttachment', handleMessageWithAttachment);
  };
}, [sessionId, userId]);
```

### 3. Updated `ChatInterface.tsx`
**File**: `zeneme-next/src/components/features/chat/ChatInterface.tsx`

Enhanced `UserMessageBubble` to handle both sketch and image attachments:
```typescript
// Component for User Message with optional attachment (Sketch or Image)
const UserMessageBubble = ({ message }: { message: Message }) => {
  // ... existing code

  {message.attachment && (message.attachment.type === 'sketch' || message.attachment.type === 'image') && (
    <motion.div>
      <img
        src={message.attachment.preview || message.attachment.url}
        alt={message.attachment.type === 'sketch' ? 'Sketch' : 'Uploaded Image'}
        className="w-48 h-32 object-cover bg-slate-900"
      />
      <div className="absolute bottom-2 left-2 ...">
        {message.attachment.type === 'sketch' ? '内视涂鸦' : '上传图片'}
      </div>
    </motion.div>
  )}
};
```

## Technical Details

### Message Structure
Messages now properly support image attachments:
```typescript
type Message = {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'voice' | 'sketch' | 'gallery';
    url?: string;
    preview?: string;
  };
};
```

### Event-Based Communication
Used custom events to communicate between `ChatInput` and `page.tsx` because:
- `ChatInput` doesn't have direct access to the `addMessage` function
- Keeps the component interface clean
- Allows for future extensibility

### Image Display Features
- Thumbnail display (48x32 pixels) in chat
- Click to zoom/preview in modal
- Hover effects for better UX
- Label showing "上传图片" vs "内视涂鸦"

## Testing
1. Click "上传图片" button
2. Select an image file
3. Verify image appears as thumbnail in chat
4. Click thumbnail to see full-size preview
5. Verify AI receives and analyzes the image

## Files Modified
- `zeneme-next/src/components/ChatInput.tsx`
- `zeneme-next/src/app/page.tsx`
- `zeneme-next/src/components/features/chat/ChatInterface.tsx`

## Related Documentation
- [Image Upload Fix](./IMAGE_UPLOAD_FIX.md) - Initial upload functionality
- [Inner Doodling Implementation](./INNER_DOODLING_COMPLETION_SUMMARY.md) - Sketch feature

## Status
✅ **Completed** - Images now display correctly in chat interface
