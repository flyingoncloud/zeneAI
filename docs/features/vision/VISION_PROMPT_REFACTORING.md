# Vision Prompt System Refactoring

## Overview
Refactored the `analyze-sketch` endpoint to use a modular prompt system that supports multiple psychological analysis frameworks.

## Changes Made

### 1. Created Modular Prompt System
**File**: `ai-chat-api/src/services/vision_prompts.py`

Created `VisionPrompts` class with 4 analysis types:
- **IFS (Internal Family Systems)** - Default, identifies managers, firefighters, exiles, and self
- **General** - Original empathetic psychology approach
- **Emotion** - Emotion-focused analysis
- **Art Therapy** - Art therapy perspective

### 2. Updated Vision Analysis Function
**File**: `ai-chat-api/src/api/chat_service.py`

Updated `get_ai_response_with_image()` function:
- Added `prompt_type` parameter (default: "ifs")
- Removed hardcoded system prompt
- Now uses `VisionPrompts.get_prompt()` to get appropriate prompt
- Supports all 4 prompt types dynamically

### 3. Updated Analyze Sketch Endpoint
**File**: `ai-chat-api/src/api/app.py`

The `/analyze-sketch` endpoint already accepts `prompt_type` parameter:
- Default: "ifs" (IFS-focused analysis)
- Accepts: "ifs", "general", "emotion", "art_therapy"
- Returns `prompt_type` in response for tracking

## API Usage

### Default (IFS Analysis)
```bash
POST /analyze-sketch
Content-Type: multipart/form-data

image_data: <base64_image>
prompt: "请分析这张内视涂鸦"
# prompt_type defaults to "ifs"
```

### Specify Analysis Type
```bash
POST /analyze-sketch
Content-Type: multipart/form-data

image_data: <base64_image>
prompt: "请分析这张内视涂鸦"
prompt_type: "emotion"  # or "general", "art_therapy"
```

## Response Format
```json
{
  "ok": true,
  "analysis": "AI分析结果...",
  "prompt_type": "ifs"
}
```

## IFS Analysis Framework

The IFS prompt analyzes images through Internal Family Systems theory:

1. **Managers** (管理者) - Protective, controlling parts
   - Visual cues: Neat lines, symmetry, controlled elements

2. **Firefighters** (消防员) - Reactive, distracting parts
   - Visual cues: Chaotic strokes, intense colors, fragmented images

3. **Exiles** (流放者) - Vulnerable, wounded parts
   - Visual cues: Hidden elements, dim colors, isolated figures

4. **Self** (真我) - Compassionate core consciousness
   - Visual cues: Harmonious composition, balance, warm tones

## Frontend Integration

Currently, the frontend doesn't pass `prompt_type`, so it uses the default "ifs" analysis.

To add prompt type selection in the UI:
1. Add a dropdown/selector for analysis type
2. Pass selected `prompt_type` in the form data
3. Display the returned `prompt_type` to confirm which analysis was used

## Testing

Test with different prompt types:
```python
# Test IFS analysis (default)
response = requests.post('/analyze-sketch', data={
    'image_data': base64_image,
    'prompt': '请分析这张内视涂鸦'
})

# Test emotion-focused analysis
response = requests.post('/analyze-sketch', data={
    'image_data': base64_image,
    'prompt': '请分析这张内视涂鸦',
    'prompt_type': 'emotion'
})
```

## Benefits

1. **Modularity** - Easy to add new analysis frameworks
2. **Flexibility** - Users can choose analysis type
3. **Maintainability** - Prompts centralized in one module
4. **Extensibility** - Simple to add language support for new prompts

## Next Steps (Optional)

1. Add UI selector for analysis type in frontend
2. Create user preferences to save default analysis type
3. Add more specialized prompts (e.g., trauma-focused, CBT-based)
4. Implement prompt A/B testing to optimize effectiveness
