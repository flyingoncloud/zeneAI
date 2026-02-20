# Cognitive Distortions Implementation Session - 2026-02-20

## Session Summary

Completed integration of cognitive distortions (2.2.2) scoring logic into the questionnaire scoring system and created comprehensive implementation guide for remaining work.

---

## What Was Completed

### 1. Integrated Cognitive Distortions Scoring

**File**: `ai-chat-api/src/services/questionnaire_scoring.py`

**Changes**:
- Updated `_score_2_2()` method to call cognitive distortions interpretation
- Changed interpretation structure to support multiple analysis types (IFS parts + cognitive distortions)
- Now returns comprehensive interpretation with both IFS and cognitive distortions analysis

**Before**:
```python
# Only IFS parts interpretation
interpretation = QuestionnaireScorer._interpret_2_2_1_parts(category_scores)

return {
    "total_score": total_score,
    "interpretation": interpretation,
    "category_scores": category_scores
}
```

**After**:
```python
# Build comprehensive interpretation
interpretation = {}

# Add interpretation for 2.2.1 subcategories (IFS parts)
ifs_interpretation = QuestionnaireScorer._interpret_2_2_1_parts(category_scores)
if ifs_interpretation:
    interpretation["ifs_parts"] = ifs_interpretation

# Add interpretation for 2.2.2 subcategories (Cognitive Distortions)
cd_interpretation = QuestionnaireScorer._interpret_2_2_2_cognitive_distortions(category_scores)
if cd_interpretation:
    interpretation["cognitive_distortions"] = cd_interpretation

return {
    "total_score": total_score,
    "interpretation": interpretation if interpretation else None,
    "category_scores": category_scores
}
```

### 2. Created Comprehensive Implementation Guide

**File**: `docs/features/questionnaire/COGNITIVE_DISTORTIONS_IMPLEMENTATION_GUIDE.md`

**Contents**:
- Current status (completed vs. not implemented)
- Detailed scoring method explanation
- Step-by-step implementation guide for remaining work
- Database model updates needed
- Answer processing logic changes
- Frontend UI requirements
- Testing plan
- API response examples
- CBT literature references

---

## Current Implementation Status

### ✅ Completed

1. **Scoring Logic** - Fully implemented in `questionnaire_scoring.py`
   - `_interpret_2_2_2_cognitive_distortions()` method
   - Score interpretation ranges (8-10, 5-7, 3-4, 0-2)
   - CBT-based recommendations for each distortion type
   - Compound bias detection
   - Integration with `_score_2_2()` method

2. **Category Hierarchy** - Defined in `categoryHierarchy.ts`
   - 5 cognitive distortion subcategories:
     - 2.2.2.1: 过度概括 (Overgeneralization)
     - 2.2.2.2: 非黑即白 (All-or-Nothing Thinking)
     - 2.2.2.3: 灾难化 (Catastrophizing)
     - 2.2.2.4: 应该/必须 (Should/Must Statements)
     - 2.2.2.5: 自我责备 (Self-Blame)

### ⚠️ Not Yet Implemented

1. **Question Structure**
   - Need to add `category` field to question options
   - Need to add `score` field to question options (2 for primary, 1 for secondary)
   - Need to add template settings for primary/secondary selection

2. **Answer Processing**
   - Need to handle primary/secondary choice format
   - Need to accumulate scores by category
   - Current format: `{"1": 3}` → Need: `{"1": {"primary": "A", "secondary": "C"}}`

3. **Frontend UI**
   - Question Editor: Add category and score fields to option editor
   - Question Display: Add primary/secondary selection interface
   - Validation: Ensure primary is required, secondary is optional

---

## Scoring Method Details

### How It Works

For each of the 5 questions in 2.2.2:
- User selects **primary choice** (必选): +2 points to that distortion category
- User optionally selects **secondary choice** (次选): +1 point to that distortion category
- Each question has 5 options, each mapped to a different cognitive distortion

### Example

Question 1: "在工作中收到负面反馈时，你的第一反应是什么？"
- Option A (过度概括): "这次失败了，以后也会一直失败"
- Option B (非黑即白): "要么完美，要么失败"
- Option C (灾难化): "这会导致灾难性后果"
- Option D (应该/必须): "我应该做得更好"
- Option E (自我责备): "都是我的错"

User selects:
- Primary: Option A → 过度概括 +2 points
- Secondary: Option E → 自我责备 +1 point

After 5 questions, each distortion has a score from 0-10.

### Score Interpretation

- **8-10 分**: 显著偏向 - Highly likely to activate under stress
- **5-7 分**: 中度偏向 - Appears in key situations, practice recommended
- **3-4 分**: 轻度偏向 - Occasional, self-awareness cue
- **0-2 分**: 低偏向 - Rarely used as default response

### Compound Bias

If multiple distortions have the same highest score (≥5):
- System detects compound bias
- Recommends prioritizing the pattern with broadest impact

---

## Next Steps

### Immediate (Backend)

1. Update `AdminQuestion.options` structure:
   ```python
   {
     "id": "A",
     "text": "选项文本",
     "category": "2.2.2.1",  # NEW
     "score": 2,              # NEW
     "label": "A"
   }
   ```

2. Update answer processing in `app.py`:
   - Detect cognitive distortions questions (sub_section == "2.2.2")
   - Handle primary/secondary choice format
   - Accumulate scores by category

### Short-term (Frontend)

1. Update `QuestionEditor.tsx`:
   - Add category dropdown for each option
   - Add score selector (2 or 1)
   - Add template settings for primary/secondary selection

2. Update question display component:
   - Add primary/secondary selection UI
   - Validate primary is required
   - Allow optional secondary selection

### Medium-term (Testing)

1. Create 5 test questions in admin panel
2. Test scoring with various answer combinations
3. Verify interpretation appears in report
4. Test compound bias detection

---

## Files Modified

1. `ai-chat-api/src/services/questionnaire_scoring.py`
   - Updated `_score_2_2()` to call cognitive distortions interpretation
   - Changed interpretation structure to support multiple analysis types

2. `docs/features/questionnaire/COGNITIVE_DISTORTIONS_IMPLEMENTATION_GUIDE.md` (NEW)
   - Comprehensive implementation guide
   - Step-by-step instructions
   - Code examples and API response format

3. `docs/sessions/COGNITIVE_DISTORTIONS_SESSION_2026-02-20.md` (NEW)
   - This session summary

---

## Technical Notes

### Why Primary/Secondary Scoring?

Based on CBT research (Beck, Burns, Greenberger & Padesky):
- People often have a dominant automatic thought pattern (primary)
- But may also have a secondary pattern that emerges
- This dual-choice method increases scoring sensitivity and reliability
- Helps identify compound biases (multiple patterns co-occurring)

### Why These 5 Distortions?

These are the most common cognitive distortions in CBT literature:
1. **Overgeneralization**: One event → "always" or "never"
2. **All-or-Nothing**: No middle ground, only extremes
3. **Catastrophizing**: Expecting worst-case scenarios
4. **Should/Must**: Rigid rules and expectations
5. **Self-Blame**: Taking excessive personal responsibility

### Integration with IFS Parts (2.2.1)

The cognitive distortions analysis complements IFS parts analysis:
- IFS identifies which internal parts are active (managers, firefighters, exiles, self)
- Cognitive distortions identify the thinking patterns these parts use
- Together they provide a comprehensive cognitive insight profile

---

## References

### Code Files

- `ai-chat-api/src/services/questionnaire_scoring.py` - Scoring logic
- `ai-chat-api/src/api/app.py` - Answer processing endpoint
- `ai-chat-api/src/database/admin_questionnaire_models.py` - Question models
- `zeneme-next/src/data/categoryHierarchy.ts` - Category definitions
- `zeneme-next/src/components/admin/QuestionEditor.tsx` - Question editor
- `docs/features/questionnaire/COGNITIVE_DISTORTIONS_IMPLEMENTATION_GUIDE.md` - Implementation guide

### CBT Literature

1. Beck, J. S. (2011). *Cognitive Behavior Therapy: Basics and Beyond* (2nd ed.). Guilford Press.
2. Burns, D. D. (1999). *Feeling Good: The New Mood Therapy*. Harper.
3. Greenberger, D., & Padesky, C. A. (2015). *Mind Over Mood* (2nd ed.). Guilford Press.

---

## Context Transfer Notes

For next session:
- Scoring logic is complete and integrated
- Need to implement answer processing for primary/secondary choices
- Need to update frontend UI for question creation and display
- See `COGNITIVE_DISTORTIONS_IMPLEMENTATION_GUIDE.md` for detailed steps
