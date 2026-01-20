# DOCX Horizontal Rule Fix

## Issue Fixed
**Error**: `'ParagraphFormat' object has no attribute 'border_bottom'`
- **Location**: `ai-chat-api/src/services/psychology/docx_generator.py` line 277
- **Cause**: `python-docx` library doesn't support `border_bottom` attribute on `ParagraphFormat`

## Solution Applied
Replaced the unsupported border approach with a simple text-based horizontal rule:

```python
def _add_horizontal_rule(self, doc: Document):
    """Add horizontal rule (line separator)"""
    # Use a simple line of dashes as horizontal rule
    p = doc.add_paragraph('─' * 80)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    for run in p.runs:
        run.font.color.rgb = RGBColor(192, 192, 192)
        run.font.size = Pt(8)
```

## Changes Made
1. **File Modified**: `ai-chat-api/src/services/psychology/docx_generator.py`
   - Replaced `_add_horizontal_rule` method (lines 275-278)
   - Now uses Unicode box-drawing character (─) repeated 80 times
   - Styled with gray color and smaller font size
   - Added proper spacing before/after the rule

2. **Backend Restarted**: Successfully restarted with ai-chat-api conda environment

## Testing Instructions
1. Complete all 4 questionnaires (2.1, 2.2, 2.3, 2.5) in the frontend
2. Wait for report generation (~30-60 seconds)
3. Download the DOCX report
4. Verify:
   - Report generates without errors
   - Horizontal rules appear as gray dashed lines
   - All sections are properly formatted
   - Charts are embedded correctly

## Status
✅ **FIXED** - DOCX generation should now complete successfully
- Charts generation: ✅ Working (matplotlib Agg backend)
- DOCX generation: ✅ Fixed (horizontal rule method replaced)
- Backend: ✅ Running on port 8000

## Previous Fixes Applied
1. ✅ Frontend import errors (getPsychologyReportStatus, downloadPsychologyReport)
2. ✅ Backend user_id fallback logic
3. ✅ Foreign key constraint (UserProfile auto-creation)
4. ✅ Matplotlib backend (set to 'Agg' for background threads)
5. ✅ DOCX horizontal rule (this fix)

## Next Steps
Test the complete questionnaire → report → download flow in the frontend.
