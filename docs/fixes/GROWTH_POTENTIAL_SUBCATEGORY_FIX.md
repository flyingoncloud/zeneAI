# Growth Potential Sub-Category Score Fix

## Issue Summary

Report section 2.5 (Growth Potential) was showing overall score of 28/100 but all three sub-categories (2.5.1, 2.5.2, 2.5.3) displayed as 0.

## Root Cause

The `get_growth_potential_section()` function in `report_assembler.py` had two issues:

1. **Key Mismatch**: The function was looking for keys `'insight_depth'`, `'plasticity'`, and `'resilience'` in the sub-scores dictionary, but the actual data was stored with category codes `'2.5.1'`, `'2.5.2'`, `'2.5.3'`

2. **Missing Normalization**: The raw scores (e.g., 2, 2, 4) were not normalized to the 0-100 scale that the report template expects

## The Fix

Updated `get_growth_potential_section()` in `ai-chat-api/src/services/psychology/report_assembler.py`:

### 1. Category Code Mapping
```python
# Map category codes to field names
raw_scores = {
    'insight_depth': sub_scores.get('2.5.1', 0),
    'psychological_plasticity': sub_scores.get('2.5.2', 0),
    'resilience': sub_scores.get('2.5.3', 0)
}
```

### 2. Score Normalization
The function now:
- Queries all questions for categories 2.5.1, 2.5.2, 2.5.3
- Calculates the maximum possible score for each sub-category
- Normalizes raw scores to 0-100 scale using the formula:
  ```
  normalized_score = (raw_score / max_possible) * 100
  ```
- Returns integer scores (rounded)

### 3. Database Session Parameter
Added `db_session` parameter to the function signature to enable database queries for normalization.

## Example Calculation

For a user with raw scores:
- 2.5.1 (Insight Depth): 2 points
- 2.5.2 (Psychological Plasticity): 2 points
- 2.5.3 (Resilience): 4 points

If max possible scores are:
- 2.5.1: 10 points
- 2.5.2: 10 points
- 2.5.3: 9 points

Normalized scores would be:
- Insight Depth: (2/10) × 100 = 20/100
- Psychological Plasticity: (2/10) × 100 = 20/100
- Resilience: (4/9) × 100 = 44/100

## Files Modified

1. `ai-chat-api/src/services/psychology/report_assembler.py`
   - Updated `get_growth_potential_section()` function (lines 340-450)
   - Added db_session parameter to function call (line 428)

## Testing

The fix ensures:
- ✅ Category codes (2.5.1, 2.5.2, 2.5.3) are correctly mapped to field names
- ✅ Raw scores are normalized to 0-100 scale
- ✅ Report template receives the expected data structure
- ✅ Sub-category scores are displayed correctly in the report

## Related Context

This fix completes the pattern detection system implementation that was added for:
- IFS Parts Detection (2.2.1)
- Cognitive Patterns Detection (2.2.2)
- Narrative Identity (2.2.4)
- Growth Potential Sub-Categories (2.5.1, 2.5.2, 2.5.3)

All pattern detection systems now properly store and normalize scores for report generation.
