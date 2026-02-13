# Questionnaire Scoring to Report Flow

**Date**: February 11, 2026

## Overview

This document explains how questionnaire answers are scored and mapped to the 5 psychological dimensions in the final report.

## The 5 Core Dimensions

The psychology report is based on 5 core dimensions stored in `PsychologyAssessment`:

1. **情绪调节能力** (Emotional Regulation) → `emotional_regulation_score`
2. **认知重构能力** (Cognitive Flexibility) → `cognitive_flexibility_score`
3. **关系互动能力** (Relationship Sensitivity) → `relationship_sensitivity_score`
4. **内在对话能力** (Internal Conflict) → `internal_conflict_score`
5. **成长潜力** (Growth Potential) → `growth_potential_score`

## Scoring Flow

### Step 1: Answer Submission

When a user answers a question:

```python
# Frontend submits:
POST /api/questionnaire/answer
{
  "progress_id": 123,
  "question_id": 456,
  "answer_value": 4,  # Score (1-5 for F1, varies by template)
  "sub_category": "情绪调节能力"  # Optional: from F4 option selection
}
```

### Step 2: Real-Time Score Accumulation

In `questionnaire_progress.py` → `save_answer()`:

```python
# 1. Store answer by question_number
answers[str(question.question_number)] = answer_value

# 2. Determine scoring category
scoring_category = sub_category or question.category
# Priority: sub_category (from option) > question.category

# 3. Accumulate score for category
category_scores[scoring_category] = current_score + answer_value
```

**Example:**
- Question 1: Category = "情绪调节能力", Answer = 4
- Question 2: Category = "情绪调节能力", Answer = 3
- Question 3: Category = "认知重构能力", Answer = 5

**Result:**
```json
{
  "category_scores": {
    "情绪调节能力": 7,  // 4 + 3
    "认知重构能力": 5   // 5
  }
}
```

### Step 3: Completion & Report Generation

When all questions are answered (`current_question_index >= total_questions`):

```python
# In _generate_report():

# 1. Extract category scores
category_scores = progress.category_scores or {}

# 2. Direct 1:1 mapping to dimensions
emotional_regulation = category_scores.get('情绪调节能力', 0)
cognitive_flexibility = category_scores.get('认知重构能力', 0)
relationship_sensitivity = category_scores.get('关系互动能力', 0)
internal_conflict = category_scores.get('内在对话能力', 0)
growth_potential = category_scores.get('成长潜力', 0)

# 3. Create/update PsychologyAssessment
assessment = PsychologyAssessment(
    user_id=progress.user_id,
    assessment_type='questionnaire',
    emotional_regulation_score=emotional_regulation,
    cognitive_flexibility_score=cognitive_flexibility,
    relationship_sensitivity_score=relationship_sensitivity,
    internal_conflict_score=internal_conflict,
    growth_potential_score=growth_potential,
    # ... other fields
)

# 4. Create PsychologyReport
report = PsychologyReport(
    user_id=progress.user_id,
    assessment_id=assessment.id,
    report_type='comprehensive',
    language='zh',
    format='docx',
    generation_status='pending'
)
```

## Category to Dimension Mapping

### Direct 1:1 Mapping

The system uses a **direct 1:1 mapping** from question categories to report dimensions:

| Question Category (Chinese) | Report Dimension Field | English Name |
|----------------------------|------------------------|--------------|
| 情绪调节能力 | `emotional_regulation_score` | Emotional Regulation |
| 认知重构能力 | `cognitive_flexibility_score` | Cognitive Flexibility |
| 关系互动能力 | `relationship_sensitivity_score` | Relationship Sensitivity |
| 内在对话能力 | `internal_conflict_score` | Internal Conflict |
| 成长潜力 | `growth_potential_score` | Growth Potential |

### No Transformation

- **No normalization**: Raw scores are used directly
- **No weighting**: All questions contribute equally
- **No scaling**: Scores are simple sums (not percentages or standardized)

## Question Category Assignment

### Method 1: Question-Level Category

Each question has a `category` field:

```python
question = AssessmentQuestion(
    question_number=1,
    text="当你感到压力时，你通常如何应对？",
    category="情绪调节能力",  # ← This category
    template="F1",
    # ...
)
```

### Method 2: Option-Level Sub-Category (F4 Questions)

For F4 (multiple choice) questions, each option can have a `sub_category`:

```python
question = AssessmentQuestion(
    question_number=5,
    text="你更倾向于哪种方式？",
    category="情绪调节能力",  # Default category
    template="F4",
    options=[
        {
            "id": "A",
            "text": "直接表达情绪",
            "score": 5,
            "sub_category": "情绪调节能力"  # ← Option-specific category
        },
        {
            "id": "B",
            "text": "重新思考问题",
            "score": 4,
            "sub_category": "认知重构能力"  # ← Different category!
        }
    ]
)
```

**Priority**: `sub_category` (from selected option) > `question.category`

This allows a single question to contribute to different dimensions based on the user's choice.

## Score Ranges

### Typical Ranges by Template

- **F1 (Likert Scale)**: 1-5 per question
- **F2 (Binary)**: 0 or 1 per question
- **F3 (Image Choice)**: Varies by option scores
- **F4 (Multiple Choice)**: Varies by option scores (typically 1-5)
- **F5 (Ranking)**: Varies by ranking position
- **F6 (Slider)**: 0-100 per question
- **F7 (Direction Dial)**: 0-360 per question
- **F8 (Drawing)**: Varies by analysis

### Example Total Scores

If a questionnaire has:
- 5 questions for "情绪调节能力" (F1 template, 1-5 scale)
- Maximum possible score: 5 × 5 = 25
- Minimum possible score: 5 × 1 = 5

**Note**: Different categories may have different score ranges depending on:
- Number of questions assigned to that category
- Template types used
- Option score values

## Data Storage

### UserQuestionnaireProgress Table

```json
{
  "id": 123,
  "user_id": "user_abc",
  "questionnaire_id": "admin_created",
  "answers": {
    "1": 4,  // question_number: answer_value
    "2": 3,
    "3": 5,
    "4": 2
  },
  "category_scores": {
    "情绪调节能力": 7,
    "认知重构能力": 5,
    "关系互动能力": 2
  },
  "status": "completed",
  "report_id": 456
}
```

### PsychologyAssessment Table

```json
{
  "id": 789,
  "user_id": "user_abc",
  "assessment_type": "questionnaire",
  "emotional_regulation_score": 7,
  "cognitive_flexibility_score": 5,
  "relationship_sensitivity_score": 2,
  "internal_conflict_score": 0,
  "growth_potential_score": 0,
  "is_complete": true,
  "completion_percentage": 100
}
```

## Report Generation

After the assessment is created, a background task generates the actual report:

1. **Trigger**: `background_tasks.add_task(generate_report_background, ...)`
2. **Process**:
   - Fetches assessment data
   - Generates Chinese text analysis
   - Creates DOCX file with charts
   - Stores file URL
3. **Status**: `generation_status` changes from 'pending' → 'completed'

## Key Files

- `ai-chat-api/src/services/questionnaire_progress.py` - Scoring logic
- `ai-chat-api/src/database/progress_models.py` - Progress storage
- `ai-chat-api/src/database/psychology_models.py` - Assessment & report models
- `ai-chat-api/src/api/app.py` - API endpoints
- `ai-chat-api/src/reports/chinese_template_generator.py` - Report generation

## Important Notes

### 1. Simple Accumulation Model

The current system uses **simple score accumulation**:
- No complex algorithms
- No statistical normalization
- No weighted averages
- Just sum of answer values per category

### 2. Category Consistency

For accurate scoring, ensure:
- Questions are assigned to the correct category
- F4 options have appropriate sub_categories
- Category names match exactly (case-sensitive Chinese)

### 3. Score Interpretation

The report generation system should:
- Define meaningful score ranges for each dimension
- Provide context-appropriate interpretations
- Consider the number of questions per category when interpreting scores

### 4. Future Enhancements

Potential improvements:
- Normalize scores to 0-100 scale
- Weight questions by importance
- Apply statistical transformations
- Use the `QuestionnaireScorer` class for complex scoring rules
- Add confidence scores based on answer consistency
