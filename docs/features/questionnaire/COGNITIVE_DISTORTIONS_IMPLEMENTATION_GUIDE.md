# Cognitive Distortions (2.2.2) Implementation Guide

## Overview

This guide explains how to implement the complete flow for Cognitive Distortions (自动思维模式) scoring in questionnaire 2.2.2.

## Current Status

### ✅ Completed

1. **Scoring Logic** (`ai-chat-api/src/services/questionnaire_scoring.py`)
   - `_interpret_2_2_2_cognitive_distortions()` method implemented
   - Score interpretation ranges defined (8-10, 5-7, 3-4, 0-2)
   - CBT-based recommendations for each distortion type
   - Compound bias detection for tied highest scores
   - Integration with `_score_2_2()` method

2. **Category Hierarchy** (`zeneme-next/src/data/categoryHierarchy.ts`)
   - 5 cognitive distortion subcategories defined:
     - 2.2.2.1: 过度概括 (Overgeneralization)
     - 2.2.2.2: 非黑即白 (All-or-Nothing Thinking)
     - 2.2.2.3: 灾难化 (Catastrophizing)
     - 2.2.2.4: 应该/必须 (Should/Must Statements)
     - 2.2.2.5: 自我责备 (Self-Blame)

### ⚠️ Not Yet Implemented

1. **Question Structure** - Need to define how questions store category and score information
2. **Answer Processing** - Need to handle primary/secondary choice scoring
3. **Frontend UI** - Need to support primary/secondary selection interface

---

## Scoring Method

### Scoring Rules

For each of the 5 questions in 2.2.2:
- **Primary choice (主选)**: +2 points to that distortion category
- **Secondary choice (次选)**: +1 point to that distortion category
- **Total questions**: 5
- **Max score per distortion**: 10 points (all primary) or 5 points (all secondary)

### Score Interpretation

Per distortion type:
- **8-10 分**: 显著偏向 (Significant bias) - Highly likely to activate under stress
- **5-7 分**: 中度偏向 (Moderate bias) - Appears in key situations, practice recommended
- **3-4 分**: 轻度偏向 (Mild bias) - Occasional, self-awareness cue
- **0-2 分**: 低偏向 (Low bias) - Rarely used as default response

### Compound Bias Detection

If multiple distortions have the same highest score (≥5):
- Indicates compound bias (e.g., catastrophizing + self-blame both significant)
- Recommendation: Prioritize addressing the pattern with broadest impact or strongest emotional activation

---

## Implementation Steps

### Step 1: Define Question Options Structure

Each question option needs to include:
- `category`: The cognitive distortion subcategory (e.g., "2.2.2.1")
- `score`: The score value (2 for primary, 1 for secondary)

**Example question structure:**

```json
{
  "id": 1,
  "questionnaire_id": "questionnaire_2_2",
  "question_number": 1,
  "sub_section": "2.2.2",
  "category": "2.2.2",
  "stem": "在工作中收到负面反馈时，你的第一反应是什么？",
  "template": "F2",
  "options": [
    {
      "id": "A",
      "text": "这次失败了，以后也会一直失败",
      "category": "2.2.2.1",
      "score": 2,
      "label": "A"
    },
    {
      "id": "B",
      "text": "要么完美，要么失败",
      "category": "2.2.2.2",
      "score": 2,
      "label": "B"
    },
    {
      "id": "C",
      "text": "这会导致灾难性后果",
      "category": "2.2.2.3",
      "score": 2,
      "label": "C"
    },
    {
      "id": "D",
      "text": "我应该做得更好",
      "category": "2.2.2.4",
      "score": 2,
      "label": "D"
    },
    {
      "id": "E",
      "text": "都是我的错",
      "category": "2.2.2.5",
      "score": 2,
      "label": "E"
    }
  ],
  "template_settings": {
    "allow_multiple": true,
    "primary_required": true,
    "secondary_optional": true,
    "max_selections": 2
  }
}
```

### Step 2: Update Database Models

**File**: `ai-chat-api/src/database/admin_questionnaire_models.py`

The `AdminQuestion.options` field already supports JSON, so we just need to ensure options include:

```python
# Example option structure in options JSON array:
{
  "id": "A",
  "text": "选项文本",
  "category": "2.2.2.1",  # NEW: Cognitive distortion category
  "score": 2,              # NEW: Score value (2 for primary, 1 for secondary)
  "label": "A"
}
```

### Step 3: Update Answer Processing Logic

**File**: `ai-chat-api/src/api/app.py` (around line 1050-1080)

Current answer format: `{"1": 3, "2": 5}` (question_number -> answer_value)

For cognitive distortions, we need:
```json
{
  "1": {
    "primary": "A",
    "secondary": "C"
  },
  "2": {
    "primary": "B",
    "secondary": null
  }
}
```

**Proposed changes:**

```python
# In submit_questionnaire_response endpoint

# Check if this is a cognitive distortions questionnaire
is_cognitive_distortions = any(
    q.sub_section == "2.2.2" for q in questions
)

if is_cognitive_distortions:
    # Process primary/secondary choices
    processed_answers = {}

    for question_number, answer_data in response.answers.items():
        question = next((q for q in questions if q.question_number == int(question_number)), None)
        if not question:
            continue

        # answer_data can be: {"primary": "A", "secondary": "C"}
        if isinstance(answer_data, dict):
            primary_id = answer_data.get("primary")
            secondary_id = answer_data.get("secondary")

            # Find options and accumulate scores by category
            for option in question.options:
                if option["id"] == primary_id:
                    # Primary choice: use score from option (should be 2)
                    category = option.get("category")
                    score = option.get("score", 2)
                    # Store in processed_answers for scoring
                    # This needs to be accumulated by category

                if option["id"] == secondary_id:
                    # Secondary choice: use score from option (should be 1)
                    category = option.get("category")
                    score = option.get("score", 1)
                    # Store in processed_answers for scoring
        else:
            # Regular single-choice answer
            processed_answers[int(question_number)] = answer_data

    answers_int = processed_answers
else:
    # Regular answer processing
    answers_int = {int(k): v for k, v in response.answers.items()}
```

**Alternative approach**: Pre-process answers on frontend to send category scores directly:

```json
{
  "questionnaire_id": "questionnaire_2_2",
  "answers": {
    "1": 3,
    "2": 5
  },
  "category_scores": {
    "2.2.2.1": 4,  // Overgeneralization: 2 (primary) + 1 (secondary) + 1 (secondary)
    "2.2.2.2": 6,  // All-or-Nothing: 2 + 2 + 2
    "2.2.2.3": 3,  // Catastrophizing: 2 + 1
    "2.2.2.4": 5,  // Should/Must: 2 + 2 + 1
    "2.2.2.5": 2   // Self-Blame: 2
  }
}
```

### Step 4: Update Frontend Question Editor

**File**: `zeneme-next/src/components/admin/QuestionEditor.tsx`

Add support for:
1. Setting `category` field on each option
2. Setting `score` field on each option (2 or 1)
3. Template settings for primary/secondary selection:
   - `allow_multiple: true`
   - `primary_required: true`
   - `secondary_optional: true`
   - `max_selections: 2`

**UI mockup:**

```
Question Options:
┌─────────────────────────────────────────────────────────┐
│ Option A                                                │
│ Text: [这次失败了，以后也会一直失败_______________]      │
│ Category: [2.2.2.1 - 过度概括 ▼]                       │
│ Score: [2 ▼] (Primary=2, Secondary=1)                  │
└─────────────────────────────────────────────────────────┘

Template Settings:
☑ Allow multiple selections
☑ Primary choice required
☑ Secondary choice optional
Max selections: [2]
```

### Step 5: Update Frontend Question Display

**File**: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` (or similar)

Add UI for primary/secondary selection:

```tsx
// For cognitive distortions questions (2.2.2)
<div className="cognitive-distortions-question">
  <h3>请选择最符合你的反应（主选）和次要反应（次选）</h3>

  <div className="options">
    {question.options.map(option => (
      <div key={option.id} className="option">
        <label>
          <input
            type="radio"
            name={`primary-${question.id}`}
            value={option.id}
            checked={answers[question.id]?.primary === option.id}
            onChange={() => handlePrimarySelect(question.id, option.id)}
          />
          <span className="primary-label">主选</span>
        </label>

        <label>
          <input
            type="radio"
            name={`secondary-${question.id}`}
            value={option.id}
            checked={answers[question.id]?.secondary === option.id}
            onChange={() => handleSecondarySelect(question.id, option.id)}
          />
          <span className="secondary-label">次选</span>
        </label>

        <span className="option-text">{option.text}</span>
      </div>
    ))}
  </div>
</div>
```

---

## Testing Plan

### 1. Create Test Questions

Create 5 test questions in admin panel with:
- Sub-section: 2.2.2
- Template: F2 (Single Choice)
- 5 options per question, each mapped to a different cognitive distortion
- Template settings: `allow_multiple: true`, `primary_required: true`, `secondary_optional: true`

### 2. Test Scoring Logic

Test cases:
1. All primary choices for one distortion → Score = 10
2. All secondary choices for one distortion → Score = 5
3. Mixed primary/secondary → Score = 6-9
4. Tied highest scores → Compound bias detected
5. All low scores → All distortions show "低偏向"

### 3. Verify Report Generation

Check that cognitive distortions interpretation appears in:
- Questionnaire response JSON
- Psychology report generation
- Report display in frontend

---

## API Response Example

After implementing, the response should look like:

```json
{
  "total_score": 25,
  "category_scores": {
    "2.2.2_2.2.2.1": {"score": 4, "count": 5},
    "2.2.2_2.2.2.2": {"score": 6, "count": 5},
    "2.2.2_2.2.2.3": {"score": 3, "count": 5},
    "2.2.2_2.2.2.4": {"score": 5, "count": 5},
    "2.2.2_2.2.2.5": {"score": 7, "count": 5}
  },
  "interpretation": {
    "ifs_parts": { ... },
    "cognitive_distortions": {
      "type": "cognitive_distortions_analysis",
      "distortions": {
        "2.2.2.1": {
          "distortion_name": "过度概括 (Overgeneralization)",
          "score": 4,
          "level": "轻度偏向",
          "level_en": "Mild Bias",
          "description": "偶发；可作为自我觉察提示",
          "severity": "low",
          "recommendation": {
            "zh": "证据检视：寻找反例和例外情况",
            "en": "Evidence examination: Look for counter-examples and exceptions"
          }
        },
        "2.2.2.2": {
          "distortion_name": "非黑即白 (All-or-Nothing Thinking)",
          "score": 6,
          "level": "中度偏向",
          "level_en": "Moderate Bias",
          "description": "在部分关键情境中易出现，建议针对性练习",
          "severity": "medium",
          "recommendation": {
            "zh": "灰度思维训练：使用0-100的连续量表评估",
            "en": "Gray-scale thinking: Use 0-100 continuous scale for evaluation"
          }
        },
        "2.2.2.5": {
          "distortion_name": "自我责备 (Self-Blame)",
          "score": 7,
          "level": "中度偏向",
          "level_en": "Moderate Bias",
          "description": "在部分关键情境中易出现，建议针对性练习",
          "severity": "medium",
          "recommendation": {
            "zh": "归因平衡：考虑情境因素和他人责任",
            "en": "Attribution balance: Consider situational factors and others' responsibility"
          }
        }
      },
      "compound_bias": {
        "detected": true,
        "distortions": ["非黑即白 (All-or-Nothing Thinking)", "自我责备 (Self-Blame)"],
        "description": "存在复合偏向，建议在后续干预中优先处理影响面最广或情绪激活最强的模式"
      },
      "total_questions": 5,
      "scoring_method": "主选+2分, 次选+1分"
    }
  }
}
```

---

## References

### CBT Literature

1. Beck, J. S. (2011). *Cognitive Behavior Therapy: Basics and Beyond* (2nd ed.). Guilford Press.
2. Burns, D. D. (1999). *Feeling Good: The New Mood Therapy*. Harper.
3. Greenberger, D., & Padesky, C. A. (2015). *Mind Over Mood* (2nd ed.). Guilford Press.

### Related Files

- `ai-chat-api/src/services/questionnaire_scoring.py` - Scoring logic (✅ implemented)
- `ai-chat-api/src/api/app.py` - Answer processing endpoint (⚠️ needs update)
- `ai-chat-api/src/database/admin_questionnaire_models.py` - Question/option models (⚠️ needs update)
- `zeneme-next/src/data/categoryHierarchy.ts` - Category definitions (✅ implemented)
- `zeneme-next/src/components/admin/QuestionEditor.tsx` - Question creation UI (⚠️ needs update)
- `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` - Question display UI (⚠️ needs update)

---

## Next Steps

1. **Immediate**: Update `AdminQuestion.options` structure to include `category` and `score` fields
2. **Short-term**: Implement answer processing logic for primary/secondary choices
3. **Medium-term**: Update frontend UI for question creation and display
4. **Long-term**: Add validation and testing for complete flow
