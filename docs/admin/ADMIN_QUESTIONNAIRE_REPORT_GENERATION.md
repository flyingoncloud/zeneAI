# Admin Questionnaire Report Generation Fix

## Problem
When completing the admin-created questionnaire (8 questions), the backend was not generating a psychology report because it only triggered report generation when `completed_count >= 4` (expecting 4 separate questionnaires from the combined system).

Response showed:
```json
{
  "report_id": null,
  "report_status": null
}
```

## Root Cause
The backend logic in `ai-chat-api/src/api/app.py` only triggered report generation for the combined questionnaire system (4 questionnaires: emotional, cognitive, relational, growth). Admin-created questionnaires were not included in this logic.

## Solution
Modified the backend to also generate reports for admin-created questionnaires:

### 1. Updated Completion Check
**File**: `ai-chat-api/src/api/app.py` (line ~1130)

**Before**:
```python
if completed_count >= 4:  # All 4 questionnaires done
```

**After**:
```python
# Check if this is an admin-created questionnaire (single questionnaire for testing)
is_admin_questionnaire = response.questionnaire_id.startswith('admin_created')

if completed_count >= 4 or (is_admin_questionnaire and completed_count >= 1):
    # All 4 questionnaires done OR admin questionnaire completed
```

### 2. Updated Dimension Score Calculation
**File**: `ai-chat-api/src/api/app.py` (line ~1155)

Added handling for admin questionnaires:
```python
elif resp.questionnaire_id.startswith('admin_created'):  # Admin questionnaire
    # For admin questionnaires, distribute score across dimensions evenly
    score = int(resp.total_score or 0)
    dimension_scores['emotional_regulation_score'] = score
    dimension_scores['cognitive_flexibility_score'] = score
    dimension_scores['relationship_sensitivity_score'] = score
    dimension_scores['growth_potential_score'] = score
```

## How It Works Now

### For Admin Questionnaires:
1. User completes admin-created questionnaire
2. Backend detects `questionnaire_id.startswith('admin_created')`
3. Creates `PsychologyAssessment` with dimension scores (distributed evenly)
4. Creates `PsychologyReport` with status 'pending'
5. Triggers background report generation
6. Returns `report_id` and `report_status: 'pending'` to frontend

### For Combined Questionnaires:
1. User completes all 4 questionnaires
2. Backend detects `completed_count >= 4`
3. Calculates dimension scores from each questionnaire
4. Creates assessment and report
5. Triggers background generation

## Frontend Flow (Already Implemented)
1. Receives `report_id` and `report_status` from backend
2. Shows loading screen "生成中..." with spinning animation
3. Polls `/api/psychology/report/{report_id}/status` every 2 seconds
4. When status becomes 'completed', shows success screen "生成成功"
5. Success screen stays visible until user clicks "查看报告"

## Testing Steps
1. Start backend: `cd ai-chat-api && python run.py`
2. Start frontend: `cd zeneme-next && npm run dev`
3. Navigate to Inner Quick Test
4. Complete all 8 questions in admin questionnaire
5. Click "完成" button on last question
6. **Expected**: Loading screen appears with "生成中..."
7. **Expected**: After 5-10 seconds, success screen appears with "生成成功"
8. **Expected**: Response includes `report_id` and `report_status: 'pending'`

## Backend Restart Required
⚠️ **Important**: The backend must be restarted for these changes to take effect:
```bash
cd ~/zeneAI/ai-chat-api
# Stop the current backend process (Ctrl+C)
python run.py
```

## Files Modified
1. `ai-chat-api/src/api/app.py`
   - Added admin questionnaire detection
   - Updated completion check logic
   - Added dimension score distribution for admin questionnaires

## Expected Response After Fix
```json
{
  "ok": true,
  "message": "所有问卷已完成！正在生成您的心理报告...",
  "conversation_id": 114,
  "questionnaire_id": "admin_created",
  "response_id": 7,
  "scoring": {
    "total_score": 9,
    "interpretation": null
  },
  "module_completed": "quick_assessment",
  "module_status": { ... },
  "report_id": 15,  // ✅ Now has report_id
  "report_status": "pending"  // ✅ Now has status
}
```

## Next Steps
1. Restart backend to apply changes
2. Test admin questionnaire completion
3. Verify report generation triggers
4. Verify loading → success screen flow
5. Check that report is actually generated in database
