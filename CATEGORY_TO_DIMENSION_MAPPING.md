# Category to Dimension Score Mapping

## Overview
Categories now match report dimensions **1:1** for simplicity and clarity.

## Categories = Dimensions (5 total)

| # | Category/Dimension Name | English | Field Name |
|---|------------------------|---------|------------|
| 1 | 情绪调节能力 | Emotional Regulation | `emotional_regulation_score` |
| 2 | 认知重构能力 | Cognitive Flexibility | `cognitive_flexibility_score` |
| 3 | 关系互动能力 | Relational Sensitivity | `relationship_sensitivity_score` |
| 4 | 内在对话能力 | Internal Conflict | `internal_conflict_score` |
| 5 | 成长潜力 | Growth Potential | `growth_potential_score` |

## Mapping Logic

**Simple 1:1 Direct Mapping:**
```python
emotional_regulation_score = category_scores.get('情绪调节能力', 0)
cognitive_flexibility_score = category_scores.get('认知重构能力', 0)
relationship_sensitivity_score = category_scores.get('关系互动能力', 0)
internal_conflict_score = category_scores.get('内在对话能力', 0)
growth_potential_score = category_scores.get('成长潜力', 0)
```

No complex calculations, no combining categories - just direct mapping!

## Current Question Distribution

Based on the database (as of Feb 8, 2026 - after migration):

| Category | Question Count | Question IDs |
|----------|---------------|--------------|
| 情绪调节能力 | 3 | 80, 81, 85 |
| 认知重构能力 | 1 | 82 |
| 关系互动能力 | 1 | 83 |
| 内在对话能力 | 1 | 84 |
| 成长潜力 | 0 | (none yet) |
| **Total** | **6** | |

## Example Calculation

### Sample Answers:
- Question 80 (情绪调节能力): Answer value = 3
- Question 81 (情绪调节能力): Answer value = 4
- Question 82 (认知重构能力): Answer value = 2
- Question 83 (关系互动能力): Answer value = 5
- Question 84 (内在对话能力): Answer value = 1
- Question 85 (情绪调节能力): Answer value = 2

### Category Scores:
```
情绪调节能力: 3 + 4 + 2 = 9
认知重构能力: 2
关系互动能力: 5
内在对话能力: 1
成长潜力: 0 (no questions yet)
```

### Dimension Scores (same as category scores):
```
emotional_regulation_score = 9
cognitive_flexibility_score = 2
relationship_sensitivity_score = 5
internal_conflict_score = 1
growth_potential_score = 0
```

## Migration History

### February 8, 2026
**Changed from complex mapping to 1:1 mapping:**

**Old categories (6):**
- 情绪识别能力 (Emotion Recognition)
- 情绪调节能力 (Emotion Regulation)
- 认知重构能力 (Cognitive Restructuring)
- 内在对话能力 (Internal Dialogue)
- 关系互动能力 (Relational Interaction)
- (no category for Growth Potential)

**Old mapping logic:**
- emotional_regulation = 情绪识别能力 + 情绪调节能力 (combined)
- growth_potential = average of all categories (calculated)

**New categories (5):**
- Same as report dimensions (see table above)

**New mapping logic:**
- Direct 1:1 mapping (no combining, no calculations)

**Migration:**
- Merged 情绪识别能力 → 情绪调节能力
- Added 成长潜力 as new category option
- Updated 2 questions (IDs 80, 85)

## Implementation Details

### Frontend
File: `zeneme-next/src/hooks/useAdminStore.tsx`
```typescript
export const CATEGORY_OPTIONS = [
  { value: '情绪调节能力', label: '情绪调节能力 (Emotional Regulation)' },
  { value: '认知重构能力', label: '认知重构能力 (Cognitive Flexibility)' },
  { value: '关系互动能力', label: '关系互动能力 (Relational Sensitivity)' },
  { value: '内在对话能力', label: '内在对话能力 (Internal Conflict)' },
  { value: '成长潜力', label: '成长潜力 (Growth Potential)' },
];
```

### Backend
File: `ai-chat-api/src/services/questionnaire_progress.py`
Function: `_generate_report()` (lines ~230-240)

```python
# Direct 1:1 mapping from categories to dimension scores
emotional_regulation = category_scores.get('情绪调节能力', 0)
cognitive_flexibility = category_scores.get('认知重构能力', 0)
relationship_sensitivity = category_scores.get('关系互动能力', 0)
internal_conflict = category_scores.get('内在对话能力', 0)
growth_potential = category_scores.get('成长潜力', 0)
```

## Benefits of 1:1 Mapping

1. **Simplicity**: No complex calculations or combining logic
2. **Clarity**: Category names match report dimension names exactly
3. **Maintainability**: Easy to understand and modify
4. **Flexibility**: Can add questions to any dimension independently
5. **Transparency**: Users see exactly what they're being scored on

## Adding New Questions

To add questions for 成长潜力 (Growth Potential):
1. Create questions in admin panel
2. Assign category = "成长潜力"
3. Scores will automatically appear in reports
4. No code changes needed!

---

**Last Updated**: February 8, 2026
**Version**: 2.0 (Simplified to 1:1 mapping)
