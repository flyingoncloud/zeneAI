# Hierarchical Category Implementation Plan

## Overview
Implement hierarchical category system with question-level categories (required) and answer-level sub-categories (optional).

## Phase 1: Database Schema Updates

### 1.1 Add sub_category to Answer Options
**File**: `ai-chat-api/src/database/admin_questionnaire_models.py`

```python
# In AdminQuestion model, update options JSON structure:
options = Column(JSON)  # Structure:
# [
#   {
#     "id": "A",
#     "text": "Answer text",
#     "value": 3,
#     "label": "A",
#     "imageUrl": "...",  # optional
#     "sub_category": "2.2.2.1"  # NEW: optional sub-category
#   }
# ]
```

**Migration**: No database migration needed (JSON field is flexible)

### 1.2 Update Category Field
**Current**: Single string field
**New**: Still single string, but now uses hierarchical codes

**Example values**:
- `"2.1"` - Top-level dimension
- `"2.2.2"` - Sub-category
- `"2.3.1.1"` - Deep sub-category

## Phase 2: Frontend Updates

### 2.1 Create Category Hierarchy Constant
**File**: `zeneme-next/src/hooks/useAdminStore.tsx`

```typescript
export const CATEGORY_HIERARCHY = {
  "2.1": {
    code: "2.1",
    name: "情绪觉察",
    nameEn: "Emotional Awareness",
    children: null
  },
  "2.2": {
    code: "2.2",
    name: "认知模式",
    nameEn: "Cognitive Patterns",
    children: {
      "2.2.1": {
        code: "2.2.1",
        name: "自我内在系统分析",
        nameEn: "Internal System Analysis"
      },
      "2.2.2": {
        code: "2.2.2",
        name: "自动思维模式",
        nameEn: "Automatic Thought Patterns",
        children: {
          "2.2.2.1": { code: "2.2.2.1", name: "过度概括", nameEn: "Overgeneralization" },
          "2.2.2.2": { code: "2.2.2.2", name: "非黑即白", nameEn: "Black-and-White" },
          "2.2.2.3": { code: "2.2.2.3", name: "灾难化", nameEn: "Catastrophizing" },
          "2.2.2.4": { code: "2.2.2.4", name: "应该/必须", nameEn: "Should/Must" },
          "2.2.2.5": { code: "2.2.2.5", name: "自我责备", nameEn: "Self-Blame" }
        }
      },
      // ... more sub-categories
    }
  },
  // ... more dimensions
};

// Flatten for dropdown
export const CATEGORY_OPTIONS = flattenHierarchy(CATEGORY_HIERARCHY);
// Returns: [
//   { value: "2.1", label: "2.1 - 情绪觉察 (Emotional Awareness)", level: 0 },
//   { value: "2.2", label: "2.2 - 认知模式 (Cognitive Patterns)", level: 0 },
//   { value: "2.2.1", label: "  2.2.1 - 自我内在系统分析", level: 1 },
//   { value: "2.2.2", label: "  2.2.2 - 自动思维模式", level: 1 },
//   { value: "2.2.2.1", label: "    2.2.2.1 - 过度概括", level: 2 },
//   // ...
// ]
```

### 2.2 Update QuestionEditor Component
**File**: `zeneme-next/src/components/admin/QuestionEditor.tsx`

**Changes:**
1. Question category dropdown: Show hierarchical structure with indentation
2. Add sub-category dropdown for each answer option
3. Sub-category is optional (can be empty)
4. Visual indicator when answer sub-category differs from question category

**UI Mockup:**
```
Question Category: [2.2.2 - 自动思维模式 ▼]

Answer Options:
┌─────────────────────────────────────────────────┐
│ A. This always happens to me                    │
│ Score: [3]                                      │
│ Sub-category: [2.2.2.1 - 过度概括 ▼] (optional)│
│ ⚠️ Different from question category             │
└─────────────────────────────────────────────────┘
```

### 2.3 Update AdminOption Interface
**File**: `zeneme-next/src/hooks/useAdminStore.tsx`

```typescript
export interface AdminOption {
  id: string;
  text: string;
  imageUrl?: string;
  value: number;
  label: string;
  sub_category?: string;  // NEW: optional sub-category
}
```

## Phase 3: Backend Updates

### 3.1 Update Scoring Logic
**File**: `ai-chat-api/src/services/questionnaire_scoring.py`

```python
def _score_admin_created(self, responses, db):
    """Score admin-created questionnaire with hierarchical categories"""

    category_scores = {}

    for response in responses:
        question = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.id == response.question_id
        ).first()

        if not question:
            continue

        # Find the selected option
        selected_option = next(
            (opt for opt in question.options if opt['value'] == response.answer_value),
            None
        )

        if not selected_option:
            continue

        # Determine which category to score
        score_category = selected_option.get('sub_category') or question.category

        # Accumulate score
        if score_category not in category_scores:
            category_scores[score_category] = 0
        category_scores[score_category] += selected_option['value']

    return category_scores
```

### 3.2 Update Report Generation
**File**: `ai-chat-api/src/services/questionnaire_progress.py`

```python
def _generate_report(progress, db):
    """Generate report with hierarchical category aggregation"""

    category_scores = progress.category_scores or {}

    # Roll up sub-categories to main dimensions
    dimension_scores = {
        "2.1": 0,
        "2.2": 0,
        "2.3": 0,
        "2.4": 0,
        "2.5": 0
    }

    for category, score in category_scores.items():
        # Extract main dimension (first 3 chars: "2.1", "2.2", etc.)
        main_dim = category[:3]
        if main_dim in dimension_scores:
            dimension_scores[main_dim] += score

    # Map to assessment fields
    assessment = PsychologyAssessment(
        emotional_regulation_score=dimension_scores["2.1"],
        cognitive_flexibility_score=dimension_scores["2.2"],
        relationship_sensitivity_score=dimension_scores["2.3"],
        internal_conflict_score=dimension_scores["2.4"],
        growth_potential_score=dimension_scores["2.5"],
        extra_data={
            'category_scores': category_scores,  # Detailed breakdown
            'dimension_scores': dimension_scores  # Rolled-up totals
        }
    )
```

## Phase 4: API Updates

### 4.1 Update Question Create/Update Endpoints
**File**: `ai-chat-api/src/api/app.py`

**Changes:**
- Accept `sub_category` in option objects
- Validate category codes against hierarchy
- Store sub_category in options JSON

**Example Request:**
```json
{
  "internalTitle": "Cognitive Distortion Test",
  "template": "F2",
  "stem": "When facing a setback, what's your first thought?",
  "category": "2.2.2",
  "options": [
    {
      "id": "A",
      "text": "This always happens to me",
      "value": 3,
      "label": "A",
      "sub_category": "2.2.2.1"
    },
    {
      "id": "B",
      "text": "Everything is ruined",
      "value": 4,
      "label": "B",
      "sub_category": "2.2.2.3"
    },
    {
      "id": "C",
      "text": "I'll learn from this",
      "value": 1,
      "label": "C"
      // No sub_category - uses question category
    }
  ]
}
```

## Phase 5: Migration

### 5.1 Update Existing Questions
**Script**: `ai-chat-api/migrate_to_hierarchical_categories.py`

```python
# Map old categories to new codes
CATEGORY_MAPPING = {
    "情绪调节能力": "2.1",
    "认知重构能力": "2.2",
    "关系互动能力": "2.3",
    "内在对话能力": "2.3.4",  # Internal conflict
    "成长潜力": "2.5"
}

# Update all questions
for question in questions:
    old_category = question.category
    new_category = CATEGORY_MAPPING.get(old_category, "2.1")
    question.category = new_category
```

## Phase 6: Testing

### 6.1 Test Cases
1. **Simple question** (no sub-categories)
   - All answers score to question category

2. **Complex question** (with sub-categories)
   - Each answer scores to its sub-category

3. **Cross-category question**
   - Answer from different dimension scores correctly

4. **Mixed question**
   - Some answers with sub-category, some without

5. **Report generation**
   - Sub-categories roll up to main dimensions
   - Detailed breakdown available in extra_data

### 6.2 Validation
- Category codes must exist in hierarchy
- Sub-category codes must be valid
- Scores accumulate correctly
- Report shows correct totals

## Timeline Estimate

- **Phase 1** (Database): 30 minutes
- **Phase 2** (Frontend): 2-3 hours
- **Phase 3** (Backend): 1-2 hours
- **Phase 4** (API): 1 hour
- **Phase 5** (Migration): 30 minutes
- **Phase 6** (Testing): 1-2 hours

**Total**: 6-9 hours

## Benefits

1. **Flexibility**: Questions can assess multiple dimensions
2. **Precision**: Fine-grained scoring at sub-category level
3. **Insights**: Detailed breakdown of cognitive patterns, attachment styles, etc.
4. **Scalability**: Easy to add new sub-categories
5. **Backward Compatible**: Existing questions work (no sub-categories = use question category)

## Next Steps

1. Review and approve this plan
2. Implement Phase 1 (Database)
3. Implement Phase 2 (Frontend UI)
4. Implement Phase 3 (Backend scoring)
5. Test with sample questions
6. Migrate existing questions
7. Deploy and monitor

---

**Created**: February 8, 2026
**Status**: Proposed - Awaiting Approval
