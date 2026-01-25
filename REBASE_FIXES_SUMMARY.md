# Rebase Fixes Summary

## Date: 2026-01-21

### Issue 1: Duplicate Questionnaires Returned After Rebase

**Problem:**
- After rebasing zeneme-next, duplicate questionnaires appeared in the database
- Expected: 89 questions (10 + 46 + 27 + 6)
- Actual: 168 questions (duplicates)

**Root Cause:**
- The rebase brought back old database state or triggered automatic seeding

**Solution:**
1. Cleared all questionnaire data from database in correct order:
   ```bash
   # Deleted in order: answers → responses → questions → questionnaires
   - Deleted 247 answers
   - Deleted 12 responses
   - Deleted 168 questions
   - Deleted 8 questionnaires
   ```

2. Reloaded questionnaires using the fixed script:
   ```bash
   python ai-chat-api/src/scripts/load_questionnaires.py
   ```

3. Verified correct counts:
   ```
   Total questionnaires: 4
   - questionnaire_2_1: 10 questions
   - questionnaire_2_2: 46 questions
   - questionnaire_2_3: 27 questions
   - questionnaire_2_5: 6 questions
   Total questions: 89 ✓
   ```

**Files Modified:**
- None (database-only fix)

---

### Issue 2: "返回对话" Button Not Working in 情绪命名 (EmotionalFirstAid)

**Problem:**
- The "保存并退出" (Save and Exit) button in the emotion naming page wasn't returning to the chat
- Button appeared to do nothing when clicked

**Root Cause:**
- Type mismatch between parent and child components
- `EmotionPage.onComplete()` was defined as `() => void` but parent's `handleComplete` expected `(emotionData: { emotion: string; intensity: number }) => void`
- The `handleSave()` function was calling `onComplete()` without passing the required emotion data
- This caused the function to fail silently or not execute properly

**Solution:**
1. Updated `EmotionPage` interface to match parent's expectations:
   ```typescript
   interface EmotionPageProps {
     onComplete: (emotionData: { emotion: string; intensity: number }) => void;
     onBack?: () => void;
   }
   ```

2. Modified `handleSave()` to pass emotion data to `onComplete()`:
   ```typescript
   onComplete({
     emotion: moodToSave,
     intensity: intensity
   });
   ```

3. Removed the `as any` type cast in parent component since types now match properly

**Files Modified:**
- `zeneme-next/src/components/features/tools/firstaid/EmotionPage.tsx`
  - Updated interface definition
  - Modified handleSave() to pass emotion data
- `zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`
  - Removed `as any` cast from onComplete prop

**Testing:**
1. Navigate to 情绪急救 (Emotional First Aid) module
2. Complete breathing exercise
3. Select an emotion and intensity
4. Click "保存并退出" button
5. Verify it returns to chat view and marks module as completed

---

## Summary

Both issues have been fixed:
✅ Questionnaires: Database cleared and reloaded with correct 89 questions
✅ Return to Chat: Button now properly passes emotion data and returns to chat

The fixes ensure:
- Clean questionnaire data without duplicates
- Proper module completion flow in Emotional First Aid
- Type safety between parent and child components
