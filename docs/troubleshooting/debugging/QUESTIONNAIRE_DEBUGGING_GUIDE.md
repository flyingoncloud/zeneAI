# Questionnaire Submission Debugging Guide

## Issue
UI shows "正在生成评估报告" but answers are not being sent to backend.

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check the Console tab for:

```javascript
// Should see when component loads:
[InnerQuickTest] conversationId: <number or undefined>

// Should see when submitting each questionnaire:
[Submitting Questionnaire 2.1] { questionnaire_id: "2.1", conversation_id: X, ... }
[Questionnaire 2.1 Submitted Successfully] { total_score: 85, ... }
```

### 2. Check Network Tab
In DevTools Network tab, filter by "questionnaires" and look for:
- **Request**: `POST /conversations/{id}/questionnaires/submit`
- **Status**: Should be 200 OK
- **Response**: Should contain `scoring` object with scores

### 3. Common Issues

#### Issue 1: conversationId is undefined
**Symptom**: Console shows `[InnerQuickTest] conversationId: undefined`

**Cause**: User hasn't started a chat conversation yet

**Solution**:
- User must send at least one message in chat first
- This creates a conversation and sets conversationId in store
- Then navigate to Inner Quick Test

**Fix in Code** (if needed):
```typescript
// Add warning if no conversationId
useEffect(() => {
  if (!conversationId) {
    toast.warning('请先开始对话，然后再进行评估');
  }
}, [conversationId]);
```

#### Issue 2: Network request fails
**Symptom**: Console shows error, Network tab shows 404/500

**Possible Causes**:
1. Backend not running
2. Wrong API URL
3. CORS issues
4. Database connection issues

**Check**:
```bash
# 1. Backend is running
cd ai-chat-api
python run.py
# Should see: "Uvicorn running on http://localhost:8000"

# 2. Database is accessible
psql -U chat_user -d chat_db -h localhost
# Should connect successfully

# 3. Test API directly
curl http://localhost:8000/questionnaires
# Should return list of questionnaires
```

#### Issue 3: Scoring returns empty
**Symptom**: Request succeeds but `result.scoring` is undefined

**Check Backend Logs**:
```bash
# Look for errors in backend console
# Should see:
INFO: Saved questionnaire response for conversation X: 2.1 (score: 85)
```

**Check Database**:
```sql
-- Check if responses were saved
SELECT * FROM assessment_responses
WHERE conversation_id = <your_conversation_id>
ORDER BY completed_at DESC;

-- Check if answers were saved
SELECT COUNT(*) FROM assessment_answers
WHERE response_id IN (
  SELECT id FROM assessment_responses
  WHERE conversation_id = <your_conversation_id>
);
```

### 4. Manual Testing

#### Test API Directly
```bash
# Get questionnaires
curl http://localhost:8000/questionnaires

# Submit a test response
curl -X POST http://localhost:8000/conversations/1/questionnaires/submit \
  -H "Content-Type: application/json" \
  -d '{
    "questionnaire_id": "2.1",
    "answers": {
      "1": 5,
      "2": 4,
      "3": 5
    }
  }'
```

Expected response:
```json
{
  "message": "Questionnaire response saved successfully",
  "conversation_id": 1,
  "questionnaire_id": "2.1",
  "response_id": 123,
  "scoring": {
    "total_score": 85,
    "category_scores": {
      "情绪觉察": 42,
      "情绪调节": 43
    },
    "interpretation": "您的情绪智力处于良好水平..."
  },
  "module_completed": "quick_assessment"
}
```

### 5. Frontend Debugging

Add more console logs to track the flow:

```typescript
const handleAnswer = async (value: number) => {
  console.log('[handleAnswer] Called with value:', value);
  console.log('[handleAnswer] currentQIndex:', currentQIndex);
  console.log('[handleAnswer] totalQuestions:', totalQuestions);
  console.log('[handleAnswer] conversationId:', conversationId);

  // ... rest of code

  // Before submission
  console.log('[handleAnswer] About to submit questionnaire:', qMeta.id);
  console.log('[handleAnswer] Answers:', questionnaireAnswers);

  // After submission
  console.log('[handleAnswer] Submission result:', result);
};
```

### 6. Check Store State

In browser console:
```javascript
// Check if conversationId is in store
// (Depends on your store implementation)
```

### 7. Verify Backend Scoring Logic

Check if scoring service is working:
```python
# In Python console or test file
from src.services.questionnaire_scoring import QuestionnaireScorer

# Test scoring
result = QuestionnaireScorer.calculate_score(
    questionnaire_id="2.1",
    marking_criteria={...},
    answers={1: 5, 2: 4, 3: 5},
    questions=[...]
)
print(result)
```

## Quick Fix Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend is running on port 3000
- [ ] Database is running and accessible
- [ ] User has started a chat conversation (conversationId exists)
- [ ] Browser console shows no errors
- [ ] Network tab shows POST requests being made
- [ ] Backend logs show requests being received
- [ ] Database has questionnaire data loaded

## Expected Flow

1. User opens Inner Quick Test
2. Console: `[InnerQuickTest] conversationId: 123`
3. User answers all 89 questions
4. User clicks last answer
5. Console: `[Submitting Questionnaire 2.1] ...`
6. Network: `POST /conversations/123/questionnaires/submit` → 200 OK
7. Console: `[Questionnaire 2.1 Submitted Successfully] { total_score: 85 }`
8. Repeat for questionnaires 2.2, 2.3, 2.5
9. UI shows result view with real scores

## If Still Not Working

1. Check all console logs
2. Check network requests
3. Check backend logs
4. Check database
5. Share error messages for further debugging
