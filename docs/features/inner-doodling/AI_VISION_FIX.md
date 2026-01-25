# AI Vision Analysis Fix

## Problem

When users uploaded images via the "上传图片" (Upload Image) button, the AI would respond with:
```
对不起，我无法直接查看或分析图片。但是，你可以试着描述这张图片的内容和你自己对它的感受给我听，这样我就可以更好地理解你的情绪和感受了。
```

Translation: "Sorry, I can't directly view or analyze images. But you can try describing the image content and your feelings about it to me, so I can better understand your emotions and feelings."

## Root Cause

The `get_ai_response_with_image` function in `ai-chat-api/src/api/chat_service.py` was using the general chat system prompt, which doesn't explicitly tell the AI it has vision capabilities. The AI was receiving the image but didn't understand it should analyze it.

## Solution

Modified the `get_ai_response_with_image` function to use a vision-specific system prompt that:

1. **Explicitly states the AI has image analysis capabilities**
2. **Provides clear instructions for image analysis**
3. **Maintains the warm, empathetic psychological counselor tone**
4. **Gives specific guidance on what to observe and how to respond**

### New Vision System Prompt (Chinese)

```python
vision_system_prompt = """你是一名专业、温和、富有同理心的心理咨询师。

你具有图像分析能力，可以看到和分析用户上传的图片。

当用户上传图片时：
1. 仔细观察图片中的内容、色彩、构图、情绪表达
2. 从心理学角度分析图片可能反映的情绪状态、内心感受
3. 用温和、共情的语言描述你的观察和理解
4. 避免过度解读或下诊断性结论
5. 鼓励用户分享他们自己对图片的感受和想法

请用中文回答，语气温和、专业、富有同理心。"""
```

Translation:
- "You are a professional, warm, and empathetic psychological counselor."
- "You have image analysis capabilities and can see and analyze images uploaded by users."
- Instructions for careful observation, psychological analysis, empathetic language, avoiding over-interpretation, and encouraging user sharing

### New Vision System Prompt (English)

```python
vision_system_prompt = """You are a professional, warm, and empathetic psychological counselor.

You have image analysis capabilities and can see and analyze images uploaded by users.

When a user uploads an image:
1. Carefully observe the content, colors, composition, and emotional expression in the image
2. Analyze from a psychological perspective what emotions and inner feelings the image might reflect
3. Describe your observations and understanding in warm, empathetic language
4. Avoid over-interpretation or diagnostic conclusions
5. Encourage users to share their own feelings and thoughts about the image

Please respond in English with a warm, professional, and empathetic tone."""
```

## Changes Made

### File: `ai-chat-api/src/api/chat_service.py`

**Before:**
```python
def get_ai_response_with_image(prompt, image_data, model="gpt-4o", language="chinese"):
    # Get system prompt based on configured language
    system_prompt = get_base_system_prompt(language)

    # ... rest of function
```

**After:**
```python
def get_ai_response_with_image(prompt, image_data, model="gpt-4o", language="chinese"):
    # Use a vision-specific system prompt that tells the AI it can see images
    if language == "chinese":
        vision_system_prompt = """你是一名专业、温和、富有同理心的心理咨询师。

        你具有图像分析能力，可以看到和分析用户上传的图片。

        当用户上传图片时：
        1. 仔细观察图片中的内容、色彩、构图、情绪表达
        2. 从心理学角度分析图片可能反映的情绪状态、内心感受
        3. 用温和、共情的语言描述你的观察和理解
        4. 避免过度解读或下诊断性结论
        5. 鼓励用户分享他们自己对图片的感受和想法

        请用中文回答，语气温和、专业、富有同理心。"""
    else:
        vision_system_prompt = """You are a professional, warm, and empathetic psychological counselor.

        You have image analysis capabilities and can see and analyze images uploaded by users.

        When a user uploads an image:
        1. Carefully observe the content, colors, composition, and emotional expression in the image
        2. Analyze from a psychological perspective what emotions and inner feelings the image might reflect
        3. Describe your observations and understanding in warm, empathetic language
        4. Avoid over-interpretation or diagnostic conclusions
        5. Encourage users to share their own feelings and thoughts about the image

        Please respond in English with a warm, professional, and empathetic tone."""

    # ... rest of function uses vision_system_prompt instead of get_base_system_prompt(language)
```

## Testing

To test the fix:

1. **Restart the backend:**
   ```bash
   cd ai-chat-api
   python run.py
   ```

2. **Upload an image:**
   - Go to the chat interface
   - Click "上传图片" (Upload Image) button
   - Select an image file
   - The image should upload and display in the chat

3. **Verify AI analyzes the image:**
   - The AI should now respond with actual analysis of the image content
   - Response should describe what it sees in the image
   - Response should provide psychological insights about the image
   - Response should be in Chinese (or English if that's the detected language)

## Expected Behavior

### Before Fix
- User uploads image
- AI responds: "对不起，我无法直接查看或分析图片..." (Sorry, I can't view images)
- User has to describe the image manually

### After Fix
- User uploads image
- AI responds with actual image analysis, for example:
  - "我看到这张图片中有..." (I see in this image...)
  - "从心理学角度来看，这张图片可能反映了..." (From a psychological perspective, this image might reflect...)
  - "图片中的色彩和构图传达出..." (The colors and composition in the image convey...)

## Related Files

- `ai-chat-api/src/api/chat_service.py` - Vision API function
- `ai-chat-api/src/api/app.py` - Chat endpoint that calls vision API
- `zeneme-next/src/components/ChatInput.tsx` - Upload button component
- `zeneme-next/src/app/page.tsx` - Message handling with image attachments

## Technical Details

### OpenAI Vision API Call

The function now makes a proper vision API call with:
- **Model:** `gpt-4o` (supports vision)
- **System prompt:** Vision-specific prompt that explicitly states image analysis capability
- **User message:** Contains both text prompt and base64-encoded image
- **Max tokens:** Configured via `AI_MAX_TOKENS` setting

### Image Format

Images are sent to the API as:
```python
{
    "type": "image_url",
    "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
}
```

The base64 encoding is handled in the chat endpoint before calling this function.

## Future Improvements

1. **Support multiple images:** Currently only the first image is analyzed
2. **Image caching:** Avoid re-downloading images that were already processed
3. **Better error messages:** Provide more specific feedback when image analysis fails
4. **Image quality validation:** Check image resolution and quality before analysis
5. **Analysis customization:** Allow users to specify what aspects of the image to focus on

## Commit Information

- **Branch:** `ai-chat-api-v2`
- **Files Modified:** `ai-chat-api/src/api/chat_service.py`
- **Documentation:** `docs/features/inner-doodling/AI_VISION_FIX.md`
