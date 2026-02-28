# Questionnaire Completion Fix

**Date**: February 28, 2026
**Issue**: Questionnaire incorrectly marked as completed when user only answers a few questions

---

## Problem

When a user starts a questionnaire, answers only a few questions, and returns to the conversation:
- ❌ System incorrectly assumes the entire questionnaire is completed
- ❌ AI recommends other modules as if questionnaire is done
- ❌ User cannot resume the questionnaire

## Root Cause

The `/conversations/{conversation_id}/questionnaires/submit` endpoint was marking the `quick_assessment` module as completed immediately when ANY questionnaire response was submitted, regardless of whether all questions were answered.

**Problematic code** (in `ai-chat-api/src/api/app.py` line ~1115):
```python
# Mark quick_assessment module as completed
module_status["quick_assessment"]["completed_at"] = datetime.utcnow().isoformat()
```

This was setting `completed_at` even when the user had only answered a few questions.

---

## Solution

**Two-part fix implemented**:

### Part 1: Remove Incorrect Completion Marking (DONE)
Removed the incorrect completion marking from the questionnaire submission endpoint.

The progress tracking system (`UserQuestionnaireProgress`) already handles completion correctly:
- Tracks `current_question_index` vs `total_questions`
- Only marks as `completed` when `current_question_index >= total_questions`
- Properly maintains `in_progress` status for partial completion

**Changes Made**:
- Commented out the code in `ai-chat-api/src/api/app.py` (line ~1115) that sets `module_status.quick_assessment.completed_at`
- Added explanatory comments about why this code is disabled

### Part 2: Fix Chat Endpoint to Check Progress Table (DONE)
Updated the chat service to check the actual progress status instead of using stale data.

**Changes Made** (in `ai-chat-api/src/api/chat_service.py` line ~482):
- Added query to `UserQuestionnaireProgress` table when loading module status
- If progress status is `'in_progress'`, clears `module_status.quick_assessment.completed_at`
- If progress status is `'completed'`, sets `completed_at` from progress table
- This ensures AI always sees the correct completion status

**Code Added**:
```python
# CRITICAL FIX: Check UserQuestionnaireProgress for actual completion status
from src.database.progress_models import UserQuestionnaireProgress

progress = db_session.query(UserQuestionnaireProgress).filter(
    UserQuestionnaireProgress.conversation_id == conversation_id,
    UserQuestionnaireProgress.questionnaire_id == 'admin_created'
).first()

if progress:
    if progress.status == 'in_progress':
        module_status["quick_assessment"]["completed_at"] = None
    elif progress.status == 'completed' and progress.completed_at:
        module_status["quick_assessment"]["completed_at"] = progress.completed_at.isoformat()
```

---

## How It Works Now

### Questionnaire Progress Flow

1. **User starts questionnaire**:
   - `UserQuestionnaireProgress` record created with `status='in_progress'`
   - `current_question_index=0`

2. **User answers questions**:
   - Each answer increments `current_question_index`
   - Status remains `'in_progress'`

3. **User returns to conversation mid-questionnaire**:
   - ✅ Progress status is still `'in_progress'`
   - ✅ AI does NOT recommend other modules
   - ✅ User can resume from where they left off

4. **User completes all questions**:
   - `current_question_index >= total_questions`
   - Status changes to `'completed'`
   - Report is generated
   - ✅ NOW the module is truly completed

### Frontend Behavior

The `InnerQuickTest.tsx` component correctly checks:
```typescript
if (result.progress.status === 'completed' && result.progress.report_id) {
  // Show report
} else {
  // Resume questionnaire
}
```

---

## Testing Checklist

- [ ] Start questionnaire and answer 5 questions
- [ ] Return to conversation (click back button)
- [ ] Verify AI does NOT say "questionnaire completed"
- [ ] Return to questionnaire
- [ ] Verify it resumes from question 6 (not reset to question 1)
- [ ] Complete all questions
- [ ] Verify report is generated
- [ ] Verify AI now recognizes questionnaire as completed

---

## Files Modified

1. `ai-chat-api/src/api/app.py` - Removed incorrect module completion marking (line ~1115)
2. `ai-chat-api/src/api/chat_service.py` - Added progress table check when loading module status (line ~482)

---

**Status**: ✅ Complete Fix Applied - Ready for testing


---

## Latest Fix: Return to Conversation Button (February 28, 2026)

### Problem
When user completed the questionnaire and viewed the full report (with radar chart), clicking "返回对话" did NOT trigger the completion message to the AI. The AI would say "已经开始了" (you've started) instead of "已经完成了" (you've completed).

### Root Cause
The component has multiple conditional renders in the 'result' view:
1. Generating report view (line ~730) - Has button WITHOUT completion message
2. Full report display (line ~620-780) - Had button WITHOUT completion message ❌
3. Fallback results view (line ~825-850) - Has button WITH completion message ✓

Users were seeing the full report display (option 2), which had a button that only called `setCurrentView('chat')` without sending the completion message.

### Fix Applied
Updated the "返回对话" button in the full report view (line ~768 in `InnerQuickTest.tsx`) to:
```typescript
<Button
  onClick={() => {
    console.log('[InnerQuickTest] Return to conversation clicked - questionnaire completed (full report view)');
    console.log('[InnerQuickTest] Setting pendingModuleCompletion to quick_assessment');
    // Send completion message to trigger AI response
    setPendingModuleCompletion('quick_assessment');
    setCurrentView('chat');
  }}
  className="bg-emerald-600 hover:bg-emerald-500 text-white"
>
  <MessageCircle className="mr-2 h-4 w-4" />
  返回对话
</Button>
```

### How It Works Now
1. User completes questionnaire → Report generated with `status='completed'`, `report_id=63`
2. User views full report with radar chart
3. User clicks "返回对话" button
4. Button calls `setPendingModuleCompletion('quick_assessment')`
5. `page.tsx` detects `pendingModuleCompletion` and calls `sendModuleCompletionMessage()`
6. Backend receives message "我做完内视快测了。" with `user_id` and `session_id`
7. Backend queries progress by `user_id`, finds `status='completed'`
8. AI correctly responds "已经完成了" (you've completed) ✓

### Testing Steps
1. Login as registered user
2. Complete entire questionnaire (79/79 questions)
3. View report (should show radar chart)
4. Click "返回对话"
5. Check console for: `[InnerQuickTest] Return to conversation clicked - questionnaire completed (full report view)`
6. Check network tab for `/chat/` request with message "我做完内视快测了。"
7. Verify AI response says "已经完成了" (completed), not "已经开始了" (started)

### Files Modified
- `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` (line ~768)
