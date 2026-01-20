# Questionnaire to Assessment Integration Fix

## Problem

When submitting the 4th questionnaire, the backend was throwing an error:
```
ERROR - Error submitting questionnaire response: type object 'PsychologyAssessment' has no attribute 'conversation_id'
```

## Root Causes

1. **Database Model Mismatch**: The `PsychologyAssessment` model doesn't have a `conversation_id` field - it only has `user_id`
2. **Empty Assessment**: The code was creating an empty assessment without dimension scores
3. **Missing Data Bridge**: No logic to transfer questionnaire scores to psychology assessment dimensions

## Solution

Updated `ai-chat-api/src/api/app.py` to:

### 1. Query by user_id instead of conversation_id
```python
assessment = db.query(PsychologyAssessment).filter(
    PsychologyAssessment.user_id == conversation.user_id,
    PsychologyAssessment.assessment_type == 'questionnaire'
).order_by(PsychologyAssessment.created_at.desc()).first()
```

### 2. Calculate dimension scores from questionnaire responses
```python
# Get all 4 questionnaire responses
all_responses = db.query(DBQuestionnaireResponse).filter(
    DBQuestionnaireResponse.conversation_id == conversation_id
).all()

# Map questionnaire scores to psychology dimensions
dimension_scores = {
    'emotional_regulation_score': 0,      # From questionnaire_2_1
    'cognitive_flexibility_score': 0,     # From questionnaire_2_2
    'relationship_sensitivity_score': 0,  # From questionnaire_2_3
    'internal_conflict_score': 0,         # Calculated average
    'growth_potential_score': 0           # From questionnaire_2_5
}

# Extract scores from each questionnaire
for resp in all_responses:
    if resp.questionnaire_id == 'questionnaire_2_1':
        dimension_scores['emotional_regulation_score'] = int(resp.total_score or 0)
    elif resp.questionnaire_id == 'questionnaire_2_2':
        dimension_scores['cognitive_flexibility_score'] = int(resp.total_score or 0)
    elif resp.questionnaire_id == 'questionnaire_2_3':
        dimension_scores['relationship_sensitivity_score'] = int(resp.total_score or 0)
    elif resp.questionnaire_id == 'questionnaire_2_5':
        dimension_scores['growth_potential_score'] = int(resp.total_score or 0)

# Calculate internal conflict (average of emotional and cognitive)
dimension_scores['internal_conflict_score'] = int(
    (dimension_scores['emotional_regulation_score'] +
     dimension_scores['cognitive_flexibility_score']) / 2
)
```

### 3. Create assessment with calculated scores
```python
assessment = PsychologyAssessment(
    user_id=conversation.user_id,
    assessment_type='questionnaire',
    completion_percentage=100,
    is_complete=True,
    completed_at=datetime.utcnow(),
    emotional_regulation_score=dimension_scores['emotional_regulation_score'],
    cognitive_flexibility_score=dimension_scores['cognitive_flexibility_score'],
    relationship_sensitivity_score=dimension_scores['relationship_sensitivity_score'],
    internal_conflict_score=dimension_scores['internal_conflict_score'],
    growth_potential_score=dimension_scores['growth_potential_score'],
    extra_data={'conversation_id': conversation_id}
)
```

### 4. Store conversation_id in extra_data
Since the model doesn't have a `conversation_id` field, we store it in the JSON `extra_data` field for reference.

## Data Flow

```
Questionnaire Responses (assessment_responses table)
    ↓
Calculate Dimension Scores
    ↓
Psychology Assessment (psychology_assessments table)
    ↓
Report Generation (psychology_reports table)
    ↓
DOCX File
```

## Questionnaire to Dimension Mapping

| Questionnaire | Dimension |
|--------------|-----------|
| questionnaire_2_1 (Emotional) | emotional_regulation_score |
| questionnaire_2_2 (Cognitive) | cognitive_flexibility_score |
| questionnaire_2_3 (Relational) | relationship_sensitivity_score |
| questionnaire_2_5 (Growth) | growth_potential_score |
| Calculated | internal_conflict_score (avg of emotional + cognitive) |

## Testing

1. Restart backend: `cd ai-chat-api && python run.py`
2. Complete all 4 questionnaires in UI
3. Backend should:
   - Calculate dimension scores from questionnaire responses
   - Create psychology assessment with scores
   - Trigger report generation
   - Return `report_id` and `report_status: 'pending'`
4. Frontend should:
   - Show blue card with progress bar
   - Poll report status every 2 seconds
   - Show green card with download button when complete

## Expected Backend Logs

```
INFO - Completed questionnaires count: 4
INFO - All questionnaires completed for conversation X, triggering report generation
INFO - Calculated dimension scores: {'emotional_regulation_score': 45, ...}
INFO - Created psychology_assessment with id=X and dimension scores
INFO - Created psychology_report with id=X, triggering background generation
INFO - Starting background report generation for report_id=X
INFO - Step 1: Identifying dominant elements
INFO - Step 2: Generating AI analysis texts
INFO - Step 3: Classifying personality style
INFO - Step 4: Assembling report data
INFO - Step 5: Generating charts
INFO - Step 6: Generating DOCX report
INFO - Step 7: Updating report status to completed
INFO - Report X generation completed successfully
```

## Status

✅ Fixed - Ready for testing
