# Questionnaire Scoring System - Complete Flow Explanation

## Overview
The questionnaire system successfully sends user responses to the backend, calculates scores, and returns results with interpretations. Here's the complete flow:

---

## 1. Frontend Submission Flow

### Location: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`

**When user completes all 89 questions:**

1. **Data Collection** (lines 230-235):
   ```typescript
   const questionnaireAnswers: Record<string, number> = {};
   for (let i = qMeta.start; i <= qMeta.end; i++) {
     if (allAnswers[i] !== undefined) {
       const questionId = selectedQuestionnaire.questions[i].id;
       questionnaireAnswers[questionId.toString()] = allAnswers[i];
     }
   }
   ```

2. **API Call** (line 244):
   ```typescript
   const result = await submitQuestionnaireResponse(conversationId, {
     questionnaire_id: qMeta.id,
     answers: questionnaireAnswers,
     metadata: {
       total_questions: qMeta.end - qMeta.start + 1,
       completed_at: new Date().toISOString(),
       part_of_combined: true,
       section: qMeta.section,
       title: qMeta.title
     }
   });
   ```

3. **Response Handling** (lines 256-268):
   - Stores scoring results including:
     - `total_score`: Overall score
     - `category_scores`: Breakdown by categories
     - `interpretation`: Text interpretation of results

---

## 2. API Layer

### Location: `zeneme-next/src/lib/api.ts`

**Function: `submitQuestionnaireResponse()`** (lines 680-710)

```typescript
export async function submitQuestionnaireResponse(
  conversationId: number,
  response: QuestionnaireResponse
): Promise<QuestionnaireSubmissionResult>
```

**Sends POST request to:**
```
POST /conversations/{conversation_id}/questionnaires/submit
```

**Request Body:**
```json
{
  "questionnaire_id": "questionnaire_2_1",
  "answers": {
    "1": 3,
    "2": 4,
    "3": 2,
    ...
  },
  "metadata": {
    "total_questions": 20,
    "completed_at": "2025-01-20T10:30:00Z",
    "section": "2.1 情绪洞察力分析"
  }
}
```

---

## 3. Backend Endpoint

### Location: `ai-chat-api/src/api/app.py`

**Endpoint: `/conversations/{conversation_id}/questionnaires/submit`** (lines 780-840)

### Processing Steps:

#### Step 1: Validate Conversation
```python
conversation = db.query(db_models.Conversation).filter(
    db_models.Conversation.id == conversation_id
).first()
```

#### Step 2: Get Questionnaire Definition
```python
questionnaire = db.query(DBQuestionnaire).filter(
    DBQuestionnaire.id == response.questionnaire_id
).first()
```

#### Step 3: Get Questions
```python
questions = db.query(DBQuestion).filter(
    DBQuestion.questionnaire_id == response.questionnaire_id
).all()
```

#### Step 4: Convert Answer Keys
```python
# Convert string keys to integers for scoring
answers_int = {int(k): v for k, v in response.answers.items()}
```

#### Step 5: **CALCULATE SCORES** (This is the key step!)
```python
scoring_result = QuestionnaireScorer.calculate_score(
    questionnaire_id=response.questionnaire_id,
    marking_criteria=questionnaire.marking_criteria,
    answers=answers_int,
    questions=questions
)
```

#### Step 6: Save to Database
```python
db_response = DBQuestionnaireResponse(
    conversation_id=conversation_id,
    questionnaire_id=response.questionnaire_id,
    total_score=scoring_result.get("total_score"),
    category_scores=scoring_result.get("category_scores"),
    interpretation=scoring_result.get("interpretation"),
    extra_data=response.metadata or {}
)
db.add(db_response)
```

#### Step 7: Mark Module as Complete
```python
module_status["quick_assessment"]["completed_at"] = datetime.utcnow().isoformat()
module_status["quick_assessment"]["completion_data"] = {
    "questionnaire_id": response.questionnaire_id,
    "total_questions": len(response.answers),
    "total_score": scoring_result.get("total_score")
}
```

#### Step 8: Return Results
```python
return {
    "message": "Questionnaire response saved successfully",
    "conversation_id": conversation_id,
    "questionnaire_id": response.questionnaire_id,
    "response_id": db_response.id,
    "scoring": scoring_result,
    "module_completed": "quick_assessment"
}
```

---

## 4. Scoring Logic

### Location: `ai-chat-api/src/services/questionnaire_scoring.py`

The `QuestionnaireScorer` class handles different scoring methods for each questionnaire type:

### 4.1 Questionnaire 2.1 - Emotional Insight Analysis

**Method: `_score_2_1()`**

**Scoring Logic:**
```python
# Simple sum of all answers (1-5 scale)
total_score = sum(answers.values())

# Example: If user answered:
# Q1: 3, Q2: 4, Q3: 2, Q4: 5, Q5: 3
# Total = 3 + 4 + 2 + 5 + 3 = 17
```

**Interpretation:**
```python
# Find interpretation level based on score range
for level in criteria["interpretation"]:
    min_score, max_score = level["range"]
    if min_score <= total_score <= max_score:
        interpretation = {
            "level": level["level"],
            "description": level["description"],
            "score_range": level["range"]
        }
```

**Example Output:**
```json
{
  "total_score": 17,
  "interpretation": {
    "level": "中等",
    "description": "情绪洞察力处于中等水平...",
    "score_range": [15, 25]
  },
  "category_scores": null
}
```

---

### 4.2 Questionnaire 2.2 - Cognitive Insight Analysis

**Method: `_score_2_2()`**

**Scoring Logic:**
```python
# Complex scoring with multiple sub-sections and categories
category_scores = {}

for question in questions:
    answer_value = answers[question.question_number]
    sub_section = question.sub_section  # e.g., "2.2.1"
    category = question.category        # e.g., "认知灵活性"

    key = f"{sub_section}_{category}"
    category_scores[key]["score"] += answer_value
    category_scores[key]["count"] += 1

total_score = sum(answers.values())
```

**Example:**
```
Questions 1-5: sub_section="2.2.1", category="认知灵活性"
  Answers: 3, 4, 3, 5, 4
  Category Score: 3+4+3+5+4 = 19

Questions 6-10: sub_section="2.2.2", category="元认知能力"
  Answers: 2, 3, 4, 3, 3
  Category Score: 2+3+4+3+3 = 15
```

**Example Output:**
```json
{
  "total_score": 34,
  "interpretation": null,
  "category_scores": {
    "2.2.1_认知灵活性": {
      "sub_section": "2.2.1",
      "category": "认知灵活性",
      "score": 19,
      "count": 5
    },
    "2.2.2_元认知能力": {
      "sub_section": "2.2.2",
      "category": "元认知能力",
      "score": 15,
      "count": 5
    }
  }
}
```

---

### 4.3 Questionnaire 2.3 - Relational Insight

**Method: `_score_2_3()`**

**Scoring Logic:**
```python
# Scores by attachment patterns and dimensions
category_scores = {}

for question in questions:
    answer_value = answers[question.question_number]
    category = question.category      # e.g., "安全型", "焦虑型"
    sub_section = question.sub_section # e.g., "2.3.1"

    key = f"{sub_section}_{category}"
    category_scores[key]["score"] += answer_value

# Determine dominant attachment pattern (highest score in 2.3.1)
attachment_scores = {k: v for k, v in category_scores.items() if "2.3.1" in k}
dominant_key = max(attachment_scores, key=lambda k: attachment_scores[k]["score"])
dominant_pattern = attachment_scores[dominant_key]["category"]
```

**Example:**
```
Section 2.3.1 - Attachment Patterns:
  安全型 (Secure): 22 points
  焦虑型 (Anxious): 18 points
  回避型 (Avoidant): 15 points

Dominant Pattern: 安全型 (highest score)
```

**Example Output:**
```json
{
  "total_score": 55,
  "interpretation": {
    "dominant_attachment_pattern": "安全型"
  },
  "category_scores": {
    "2.3.1_安全型": {"score": 22, "count": 5},
    "2.3.1_焦虑型": {"score": 18, "count": 5},
    "2.3.1_回避型": {"score": 15, "count": 5}
  }
}
```

---

### 4.4 Questionnaire 2.5 - Growth & Transformation Potential

**Method: `_score_2_5()`**

**Scoring Logic:**
```python
# Uses option scores (A=1, B=3, C=5)
# Answers are already numeric based on option selection
total_score = sum(answers.values())

# Apply standardization formula if specified
if criteria and "standardization_formula" in criteria:
    # Formula: (Q1 + Q2) / 10 * 100
    q_values = list(answers.values())
    standardized_score = (q_values[0] + q_values[1]) / 10 * 100
```

**Example:**
```
User selects:
  Q1: Option B (score = 3)
  Q2: Option C (score = 5)
  Q3: Option A (score = 1)
  Q4: Option B (score = 3)

Total Score: 3 + 5 + 1 + 3 = 12
Standardized Score: (3 + 5) / 10 * 100 = 80
```

**Example Output:**
```json
{
  "total_score": 12,
  "standardized_score": 80,
  "interpretation": null,
  "category_scores": null
}
```

---

## 5. Response Flow Back to Frontend

### Backend Response Format:
```json
{
  "message": "Questionnaire response saved successfully",
  "conversation_id": 123,
  "questionnaire_id": "questionnaire_2_1",
  "response_id": 456,
  "scoring": {
    "total_score": 17,
    "interpretation": {
      "level": "中等",
      "description": "情绪洞察力处于中等水平..."
    },
    "category_scores": null
  },
  "module_completed": "quick_assessment"
}
```

### Frontend Receives and Displays:
```typescript
if (result.ok && result.scoring) {
  results.push({
    questionnaire_id: qMeta.id,
    title: qMeta.title,
    section: qMeta.section,
    total_score: result.scoring.total_score,
    category_scores: result.scoring.category_scores,
    interpretation: result.scoring.interpretation
  });
}

setScoringResults(results);
```

---

## 6. Database Storage

### Tables Used:

1. **assessment_questionnaires** - Questionnaire definitions
2. **assessment_questions** - Individual questions
3. **assessment_responses** - User responses with scores
4. **assessment_answers** - Individual answer values
5. **conversations** - Links responses to conversations

### Stored Data:
```sql
-- assessment_responses table
INSERT INTO assessment_responses (
  conversation_id,
  questionnaire_id,
  total_score,
  category_scores,
  interpretation,
  extra_data,
  completed_at
) VALUES (
  123,
  'questionnaire_2_1',
  17,
  '{}',
  '{"level": "中等", "description": "..."}',
  '{"total_questions": 20, "section": "2.1"}',
  '2025-01-20 10:30:00'
);
```

---

## 7. Verification Checklist

✅ **Frontend sends questionnaire data** - Yes, via `submitQuestionnaireResponse()`
✅ **Backend receives data** - Yes, at `/conversations/{id}/questionnaires/submit`
✅ **Backend calculates scores** - Yes, via `QuestionnaireScorer.calculate_score()`
✅ **Backend saves to database** - Yes, in `assessment_responses` table
✅ **Backend returns results** - Yes, with scoring and interpretation
✅ **Frontend displays results** - Yes, in `InnerQuickTest` component
✅ **Module marked complete** - Yes, `quick_assessment` module completed

---

## 8. Score Calculation Summary

| Questionnaire | Scoring Method | Output |
|--------------|----------------|--------|
| 2.1 Emotional | Simple sum | Total score + interpretation level |
| 2.2 Cognitive | Category grouping | Total + category breakdowns |
| 2.3 Relational | Attachment patterns | Total + dominant pattern |
| 2.5 Growth | Weighted + standardized | Total + standardized score |

---

## Conclusion

**YES, the questionnaire system is fully functional:**

1. ✅ User answers are sent to backend
2. ✅ Backend calculates scores using sophisticated logic
3. ✅ Scores are saved to database
4. ✅ Results are returned with interpretations
5. ✅ Frontend displays results to user
6. ✅ Module completion is tracked

The scoring logic varies by questionnaire type, supporting:
- Simple summation (2.1)
- Category-based scoring (2.2)
- Pattern detection (2.3)
- Standardized scoring (2.5)

All data is persisted in PostgreSQL for future psychology report generation.
