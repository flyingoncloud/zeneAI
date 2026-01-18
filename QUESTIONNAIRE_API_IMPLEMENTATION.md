# Questionnaire API Implementation

## Overview

Converted the hard-coded 内视快测 (Inner Quick Test) questionnaire to use a dynamic backend API system. The questionnaires are now loaded from JSON files and responses are saved to the database.

## Changes Made

### Backend (ai-chat-api)

#### 1. New API Endpoints in `src/api/app.py`

**GET /questionnaires**
- Returns list of all available questionnaires
- Loads from `src/resources/questionnaire_jsons/` directory
- Returns metadata: id, section, title, total_questions, marking_criteria

**GET /questionnaires/{questionnaire_id}**
- Returns full questionnaire including all questions
- Example: `/questionnaires/questionnaire_2_1`

**POST /conversations/{conversation_id}/questionnaires/submit**
- Submits questionnaire responses
- Saves answers to conversation.extra_data
- Automatically marks `quick_assessment` module as completed
- Request body:
  ```json
  {
    "questionnaire_id": "questionnaire_2_1",
    "answers": {
      "1": 4,
      "2": 5,
      "3": 3
    },
    "metadata": {}
  }
  ```

**GET /conversations/{conversation_id}/questionnaires**
- Retrieves all questionnaire responses for a conversation

#### 2. Data Storage

Questionnaire responses are stored in `conversation.extra_data`:
```json
{
  "questionnaire_responses": {
    "questionnaire_2_1": {
      "answers": {"1": 4, "2": 5, ...},
      "submitted_at": "2026-01-18T10:00:00",
      "metadata": {}
    }
  },
  "module_status": {
    "quick_assessment": {
      "completed_at": "2026-01-18T10:00:00",
      "completion_data": {
        "questionnaire_id": "questionnaire_2_1",
        "total_questions": 10,
        "answers": {"1": 4, "2": 5, ...}
      }
    }
  }
}
```

### Frontend (zeneme-next)

#### 1. New API Methods in `src/lib/api.ts`

```typescript
// Get all questionnaires
getAllQuestionnaires(): Promise<{
  ok: boolean;
  questionnaires?: Questionnaire[];
  error?: string;
}>

// Get specific questionnaire
getQuestionnaire(questionnaireId: string): Promise<{
  ok: boolean;
  questionnaire?: QuestionnaireDetail;
  error?: string;
}>

// Submit responses
submitQuestionnaireResponse(
  conversationId: number,
  response: QuestionnaireResponse
): Promise<{
  ok: boolean;
  message?: string;
  module_completed?: string;
  error?: string;
}>

// Get saved responses
getQuestionnaireResponses(conversationId: number): Promise<{
  ok: boolean;
  responses?: Record<string, any>;
  error?: string;
}>
```

#### 2. Updated Component `src/components/features/tools/InnerQuickTest.tsx`

**Key Changes**:
- Fetches questionnaire from backend on mount
- Displays loading state while fetching
- Shows error state if fetch fails
- Uses real questions from backend instead of hard-coded translations
- Submits answers to backend when test completes
- Automatically marks `quick_assessment` module as completed

**Flow**:
1. Component mounts → Fetch questionnaires list
2. Load first questionnaire details
3. User starts test → Display questions from backend
4. User answers questions → Store locally
5. Last question answered → Submit all answers to backend
6. Backend saves responses and marks module complete
7. Show results page

## Available Questionnaires

Currently 4 questionnaires are available in `ai-chat-api/src/resources/questionnaire_jsons/`:

1. **questionnaire_2_1.json** - 情绪觉察 (Emotional Insight Analysis)
   - 10 questions
   - 5-point Likert scale
   - Score range: 10-50

2. **questionnaire_2_2.json** - (Another questionnaire)
   - Details in JSON file

3. **questionnaire_2_3.json** - (Another questionnaire)
   - Details in JSON file

4. **questionnaire_2_5.json** - (Another questionnaire)
   - Details in JSON file

## Questionnaire JSON Format

```json
{
  "section": "2.1",
  "title": "情绪觉察 (Emotional Insight Analysis)",
  "marking_criteria": {
    "scale": "5-point Likert (1=非常不符合, 2=不太符合, 3=一般, 4=比较符合, 5=非常符合)",
    "total_score_range": [10, 50],
    "interpretation": [
      {
        "range": [40, 50],
        "level": "高情绪觉察",
        "description": "能识别、理解并表达情绪。"
      }
    ]
  },
  "questions": [
    {
      "id": 1,
      "text": "我能清楚地知道自己在不同情况下的情绪。"
    },
    {
      "id": 2,
      "text": "当我心情不好时，我能分辨是生气、悲伤还是焦虑。"
    }
  ]
}
```

## Benefits

✅ **Dynamic Content**: Questions loaded from backend, easy to update
✅ **Data Persistence**: Responses saved to database
✅ **Module Tracking**: Automatically marks module as completed
✅ **Scalable**: Easy to add new questionnaires (just add JSON files)
✅ **Flexible**: Can support multiple questionnaires per user
✅ **Analyzable**: Responses stored in structured format for analysis

## Testing

### Backend Testing

```bash
# Get all questionnaires
curl http://localhost:8000/questionnaires

# Get specific questionnaire
curl http://localhost:8000/questionnaires/questionnaire_2_1

# Submit responses
curl -X POST http://localhost:8000/conversations/1/questionnaires/submit \
  -H "Content-Type: application/json" \
  -d '{
    "questionnaire_id": "questionnaire_2_1",
    "answers": {"1": 4, "2": 5, "3": 3},
    "metadata": {}
  }'

# Get responses
curl http://localhost:8000/conversations/1/questionnaires
```

### Frontend Testing

1. Start backend: `cd ai-chat-api && python run.py`
2. Start frontend: `cd zeneme-next && npm run dev`
3. Navigate to Inner Quick Test (内视快测)
4. Verify questionnaire loads from backend
5. Complete the test
6. Verify responses are saved

## Future Enhancements

1. **Multiple Questionnaires**: Allow users to choose which questionnaire to take
2. **Progress Saving**: Save partial progress if user exits mid-test
3. **Results Analysis**: Calculate scores based on marking_criteria
4. **Visualization**: Show detailed results based on interpretation levels
5. **History**: Show previous questionnaire attempts
6. **Comparison**: Compare results over time

## Migration Notes

- Old hard-coded questions are no longer used
- Translations in `utils/translations.ts` still used for UI labels (buttons, titles)
- Question text now comes from backend JSON files
- Module completion still works the same way (marks `quick_assessment` as complete)

## Files Modified

**Backend**:
- `ai-chat-api/src/api/app.py` - Added 4 new endpoints

**Frontend**:
- `zeneme-next/src/lib/api.ts` - Added 4 new API methods
- `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` - Complete rewrite to use backend API

**No files deleted** - All changes are additive and backward compatible.
