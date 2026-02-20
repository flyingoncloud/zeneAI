# Questionnaire Scoring Analysis

## Overview

This document analyzes the current questionnaire scoring implementation to identify potential issues and recommend improvements.

## Current Scoring Logic

### Questionnaire 2.1 - Emotional Insight Analysis

**Method**: `_score_2_1()`

**Logic**:
```python
total_score = sum(answers.values())  # Simple sum of all answers
```

**Marking Criteria**:
- Scale: 1-5 (Likert scale)
- Total questions: 10
- Score range: [10, 50]
- Interpretation levels:
  - High (40-50): 高情绪觉察
  - Medium (25-39): 中等情绪觉察
  - Low (10-24): 低情绪觉察

**Assessment**: ✅ **CORRECT**
- Simple sum is appropriate for uniform Likert scale questions
- Interpretation ranges match the expected score range
- All questions have equal weight

---

### Questionnaire 2.2 - Cognitive Insight Analysis

**Method**: `_score_2_2()`

**Logic**:
```python
# Groups questions by sub_section and category
# Calculates score per category
total_score = sum(answers.values())
```

**Structure**:
- Multiple sub-sections (2.2.1, 2.2.2, 2.2.3, 2.2.4)
- Different question types and scales
- Complex category grouping

**Potential Issues**: ⚠️
1. **Mixed scales**: Different sub-sections use different scales
   - 2.2.1: 1-5 scale
   - 2.2.2: 0-4 scale (frequency)
   - 2.2.3: 0-4 scale + spatial scoring
   - 2.2.4: 1-5 scale

2. **Simple sum may not be appropriate**: Combining different scales without normalization can skew results

3. **No interpretation logic**: Returns `interpretation: None`

**Recommendation**: 🔧
- Normalize scores from different scales before summing
- Implement weighted scoring if some sections are more important
- Add interpretation logic based on category scores

---

### Questionnaire 2.3 - Relational Insight

**Method**: `_score_2_3()`

**Logic**:
```python
# Groups by attachment patterns
# Identifies dominant pattern (highest score)
total_score = sum(answers.values())
```

**Structure**:
- Sub-section 2.3.1: Attachment patterns (安全型, 焦虑型, 回避型, 混乱型)
- Sub-section 2.3.2: Relationship dimensions

**Assessment**: ✅ **MOSTLY CORRECT**
- Correctly identifies dominant attachment pattern
- Groups scores by category
- However, simple sum may not reflect attachment theory properly

**Potential Issue**: ⚠️
- Attachment patterns should be evaluated independently, not summed
- A person can score high on multiple patterns
- Current logic assumes highest score = dominant pattern (may be oversimplified)

**Recommendation**: 🔧
- Consider threshold-based classification instead of simple max
- Allow for mixed attachment styles
- Provide scores for each pattern separately

---

### Questionnaire 2.5 - Growth & Transformation Potential

**Method**: `_score_2_5()`

**Logic**:
```python
total_score = sum(answers.values())  # Answers are 1, 3, or 5 (A, B, C)

# Standardization formula
standardized_score = (Q1 + Q2) / 10 * 100
```

**Marking Criteria**:
- Option scores: A=1, B=3, C=5
- Standardization formula: `(Q1 + Q2) / 10 * 100`

**Critical Issue**: ❌ **INCORRECT**

**Problem 1: Hardcoded formula**
```python
if len(answers) >= 2:
    q_values = list(answers.values())
    standardized_score = (q_values[0] + q_values[1]) / 10 * 100
```

Issues:
- Only uses first 2 questions (Q1, Q2)
- Ignores remaining questions
- Formula assumes exactly 2 questions, but questionnaire may have more

**Problem 2: Formula doesn't match criteria**
- Criteria says: `(Q1 + Q2) / 10 * 100`
- But if Q1=5, Q2=5: `(5 + 5) / 10 * 100 = 100`
- This seems to be a percentage calculation, but the divisor (10) is fixed
- Should it be: `(Q1 + Q2) / (max_possible_score) * 100`?

**Recommendation**: 🔧
```python
# Better approach
if len(answers) >= 2:
    q_values = list(answers.values())
    max_score_per_question = 5  # Maximum option score (C=5)
    max_total = max_score_per_question * 2  # For 2 questions
    standardized_score = (q_values[0] + q_values[1]) / max_total * 100
    # Result: 0-100 percentage
```

---

### Admin-Created Questionnaires

**Method**: `_score_admin_created()`

**Logic**:
```python
# Groups by question category
# Calculates score per category
total_score = sum(answers.values())
```

**Categories**:
- 情绪识别能力 (Emotion Recognition)
- 认知重构能力 (Cognitive Restructuring)
- 内在对话能力 (Internal Dialogue)
- 关系互动能力 (Relational Interaction)
- 情绪调节能力 (Emotion Regulation)

**Assessment**: ✅ **CORRECT**
- Flexible grouping by category
- Tracks question count per category
- Appropriate for admin-defined questionnaires

**Note**: This method is defined but **NOT CALLED** in `calculate_score()`

**Critical Issue**: ❌ **MISSING LOGIC**

The main `calculate_score()` method doesn't handle admin-created questionnaires:

```python
def calculate_score(questionnaire_id, ...):
    if questionnaire_id == "questionnaire_2_1":
        return QuestionnaireScorer._score_2_1(...)
    elif questionnaire_id == "questionnaire_2_2":
        return QuestionnaireScorer._score_2_2(...)
    # ... other questionnaires ...
    else:
        # ❌ Falls through to simple sum - doesn't call _score_admin_created()
        return {"total_score": sum(answers.values()), "interpretation": None}
```

**Recommendation**: 🔧
```python
def calculate_score(questionnaire_id, ...):
    if questionnaire_id == "questionnaire_2_1":
        return QuestionnaireScorer._score_2_1(...)
    elif questionnaire_id == "questionnaire_2_2":
        return QuestionnaireScorer._score_2_2(...)
    elif questionnaire_id == "questionnaire_2_3":
        return QuestionnaireScorer._score_2_3(...)
    elif questionnaire_id == "questionnaire_2_5":
        return QuestionnaireScorer._score_2_5(...)
    elif questionnaire_id.startswith("admin_created"):
        # ✅ Call admin scoring logic
        return QuestionnaireScorer._score_admin_created(answers, questions)
    else:
        logger.warning(f"No scoring logic for {questionnaire_id}")
        return {"total_score": sum(answers.values()), "interpretation": None}
```

---

## Summary of Issues

### Critical Issues ❌

1. **Questionnaire 2.5**: Standardization formula only uses first 2 questions
2. **Admin questionnaires**: Scoring logic exists but is never called

### Moderate Issues ⚠️

3. **Questionnaire 2.2**: Mixed scales without normalization
4. **Questionnaire 2.3**: Oversimplified attachment pattern detection
5. **Missing interpretations**: Most questionnaires return `interpretation: None`

### Minor Issues 📝

6. **No validation**: Doesn't check if all questions were answered
7. **No error handling**: Missing answers are silently skipped
8. **No score bounds checking**: Doesn't validate scores are within expected ranges

---

## Recommended Fixes

### Priority 1: Fix Critical Issues

#### Fix 1: Update Questionnaire 2.5 Scoring

```python
@staticmethod
def _score_2_5(criteria: Dict[str, Any], answers: Dict[int, int]) -> Dict[str, Any]:
    """
    Score questionnaire 2.5 - Growth & Transformation Potential
    Uses option scores (A=1, B=3, C=5) and standardization formula
    """
    total_score = sum(answers.values())

    # Apply standardization formula if specified
    standardized_score = None
    if criteria and "standardization_formula" in criteria:
        # Get all answer values
        answer_values = list(answers.values())

        # Calculate based on actual number of questions
        if len(answer_values) >= 2:
            # Use first 2 questions as specified in criteria
            q1, q2 = answer_values[0], answer_values[1]
            max_score_per_q = 5  # Maximum option score (C=5)
            max_total = max_score_per_q * 2

            # Standardize to 0-100 scale
            standardized_score = (q1 + q2) / max_total * 100

            logger.info(f"Q2.5 standardization: Q1={q1}, Q2={q2}, "
                       f"standardized={standardized_score:.1f}%")

    return {
        "total_score": total_score,
        "standardized_score": standardized_score,
        "interpretation": None,
        "category_scores": None
    }
```

#### Fix 2: Add Admin Questionnaire Support

```python
@staticmethod
def calculate_score(
    questionnaire_id: str,
    marking_criteria: Dict[str, Any],
    answers: Dict[int, int],
    questions: List[Any]
) -> Dict[str, Any]:
    """Calculate scores based on questionnaire type"""
    try:
        if questionnaire_id == "questionnaire_2_1":
            return QuestionnaireScorer._score_2_1(marking_criteria, answers)
        elif questionnaire_id == "questionnaire_2_2":
            return QuestionnaireScorer._score_2_2(marking_criteria, answers, questions)
        elif questionnaire_id == "questionnaire_2_3":
            return QuestionnaireScorer._score_2_3(marking_criteria, answers, questions)
        elif questionnaire_id == "questionnaire_2_5":
            return QuestionnaireScorer._score_2_5(marking_criteria, answers)
        elif questionnaire_id.startswith("admin_created"):
            # ✅ Handle admin-created questionnaires
            return QuestionnaireScorer._score_admin_created(answers, questions)
        else:
            logger.warning(f"No scoring logic for {questionnaire_id}, using simple sum")
            return {
                "total_score": sum(answers.values()),
                "interpretation": None,
                "category_scores": None
            }
    except Exception as e:
        logger.error(f"Error calculating score for {questionnaire_id}: {e}")
        raise
```

### Priority 2: Add Validation

```python
@staticmethod
def _validate_answers(
    answers: Dict[int, int],
    questions: List[Any],
    expected_range: tuple = (1, 5)
) -> Dict[str, Any]:
    """
    Validate questionnaire answers

    Returns:
        Dict with validation results and warnings
    """
    warnings = []

    # Check if all questions were answered
    question_numbers = {q.question_number for q in questions}
    answered_numbers = set(answers.keys())

    missing = question_numbers - answered_numbers
    if missing:
        warnings.append(f"Missing answers for questions: {sorted(missing)}")

    # Check if answers are in valid range
    min_val, max_val = expected_range
    for q_num, answer in answers.items():
        if not (min_val <= answer <= max_val):
            warnings.append(f"Question {q_num}: answer {answer} out of range [{min_val}, {max_val}]")

    return {
        "is_valid": len(warnings) == 0,
        "warnings": warnings,
        "completion_rate": len(answered_numbers) / len(question_numbers) * 100
    }
```

---

## Testing Recommendations

### Test Cases

1. **Test Q2.5 with 2 questions**:
   - Input: Q1=5, Q2=5
   - Expected: standardized_score = 100

2. **Test Q2.5 with more than 2 questions**:
   - Input: Q1=5, Q2=3, Q3=1
   - Expected: standardized_score = 80 (only uses Q1, Q2)

3. **Test admin questionnaire**:
   - Input: Questions with different categories
   - Expected: category_scores grouped correctly

4. **Test missing answers**:
   - Input: Only 8 out of 10 questions answered
   - Expected: Warning logged, score calculated from available answers

5. **Test invalid answer values**:
   - Input: Answer value = 10 (out of 1-5 range)
   - Expected: Warning logged or error raised

---

## Conclusion

The scoring system has **2 critical issues** that need immediate attention:

1. ❌ **Q2.5 standardization formula is incorrect** - only uses first 2 questions
2. ❌ **Admin questionnaires are not scored properly** - logic exists but isn't called

Additionally, there are several moderate issues around mixed scales, interpretation logic, and validation that should be addressed for a more robust system.

**Recommended Action**: Fix the critical issues first, then gradually improve validation and interpretation logic.
