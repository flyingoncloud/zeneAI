# Emotional First Aid Module Repeat Bug Fix

## Issue Description

After completing the "情绪急救" (Emotional First Aid) module, the AI was repeating the same recommendation text instead of moving on to other modules. The user would see the same message:

> "听起来你现在的状态可能比较疲惫。我们可以试一下呼吸调节，让你的身体和心灵都能得到一些休息。这个练习分为两部分：首先，我们会通过一些呼吸练习帮助你的身心进入一个更舒适的状态；然后，我们会尝试一下情绪命名，帮助你更好地理解自己的感受。你愿意试试吗？"

## Root Cause

The bug was in the frontend component `zeneAI-backend/zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`.

When the user completed the Emotional First Aid module (both breathing exercise and emotion naming), the component was calling the backend API with the **wrong module ID**:

```typescript
// ❌ WRONG CODE
const result = await completeModuleWithRetry(
    conversationId,
    'breathing_exercise',  // ❌ Wrong module ID!
    ...
);
```

The correct module ID should be `'emotional_first_aid'`, not `'breathing_exercise'`.

### Why This Caused the Issue

1. The backend tracks module completion status in `conversation.extra_data.module_status`
2. The AI system prompt includes the current module status to prevent recommending completed modules
3. When the wrong module ID was used, the backend never marked `emotional_first_aid` as completed
4. The AI continued to see `emotional_first_aid` as "not completed" and kept recommending it
5. This resulted in the same recommendation text appearing repeatedly

## The Fix

### Changes Made

**File**: `zeneAI-backend/zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`

1. **Fixed module ID** (Line 58):
   ```typescript
   // ✅ CORRECT CODE
   const result = await completeModuleWithRetry(
       conversationId,
       'emotional_first_aid',  // ✅ Correct module ID
       ...
   );
   ```

2. **Fixed console log** (Line 68):
   ```typescript
   console.log('[Module Completed]', {
       module_id: 'emotional_first_aid',  // ✅ Correct module ID
       ...
   });
   ```

3. **Added system message** (Lines 76-77):
   ```typescript
   // Add system message to inform AI that module was completed
   addMessage("the user has completed the recommended module, you can continue the conversation and continue to recommend the remaining modules. Remember not to directly recommend the remaining module, but to patiently continue the conversation and recommend the remaining modules whenever appropriate.", "system");
   setPendingModuleCompletion('emotional_first_aid');
   ```

4. **Added required imports** (Line 48):
   ```typescript
   const { t, setCurrentView, conversationId, addMessage, setPendingModuleCompletion } = useZenemeStore();
   ```

## Testing

After this fix:

1. ✅ When user completes Emotional First Aid module, it's properly marked as completed in the backend
2. ✅ The AI receives updated module status showing `emotional_first_aid` is completed
3. ✅ The AI no longer recommends Emotional First Aid again
4. ✅ The AI can naturally continue the conversation and recommend other modules (Inner Doodling, Quick Assessment)
5. ✅ System message informs the AI to continue conversation naturally

## Module IDs Reference

For future reference, the 3 valid module IDs are:

1. `emotional_first_aid` - Emotional First Aid (呼吸训练 + 情绪命名)
2. `inner_doodling` - Inner Doodling (内视涂鸦)
3. `quick_assessment` - Quick Assessment (内视快测)

**Note**: `breathing_exercise` and `emotion_labeling` are NOT valid module IDs. They are internal steps within the `emotional_first_aid` module.

## Related Files

- Frontend: `zeneAI-backend/zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`
- Backend API: `ai-chat-api/src/api/app.py` (module completion endpoint)
- Chat Service: `ai-chat-api/src/api/chat_service.py` (AI system prompt with module status)
- Module Config: `ai-chat-api/src/modules/module_config.py` (module definitions)

## Date

January 25, 2026

## Status

✅ Fixed and ready for testing
