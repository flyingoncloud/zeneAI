# Questionnaire Completion and Report Generation Flow

## Overview
Implemented the complete flow for questionnaire completion, including report generation with loading and success screens.

## Implementation Details

### 1. Button Logic (Last Question)
- **Location**: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` (lines ~1063-1090)
- **Behavior**:
  - On last question (`currentQIndex === totalQuestions - 1`), button shows "完成" instead of "下一题"
  - Button is enabled when `answers[currentQIndex] !== undefined`
  - Clicking "完成" triggers `handleSubmit()` function

### 2. Submission Flow
- **Function**: `handleSubmit()` (lines ~253-395)
- **Steps**:
  1. Set `submissionState` to 'submitting'
  2. Switch to result view
  3. Submit all questionnaire responses to backend
  4. Backend returns `report_id` and `report_status` when all questionnaires completed
  5. Frontend stores `reportId` and `reportStatus` in state
  6. Keep showing loading screen while report generates

### 3. Loading Screen
- **Condition**: `submissionState === 'submitting'` OR `reportStatus === 'pending'`
- **Display**:
  - Sparkle icon (✨) with spinning border
  - Title: "生成中..."
  - Message: "正在为你整理内视快测结果，请稍候"
  - Estimate: "预计 5-10 秒"
  - Progress bar (if `reportProgress > 0`)

### 4. Report Status Polling
- **useEffect**: Lines ~108-133
- **Behavior**:
  - Polls `/api/psychology/report/{reportId}/status` every 2 seconds
  - Updates `reportStatus` and `reportProgress` state
  - Stops polling when status is 'completed' or 'failed'
  - Shows toast notification when completed

### 5. Success Screen Transition
- **useEffect**: Lines ~135-145
- **Behavior**:
  - Automatically transitions from 'submitting' to 'success' when `reportStatus === 'completed'`
  - Shows success screen for 2 seconds
  - Then transitions to 'idle' to show results

### 6. Success Screen
- **Condition**: `submissionState === 'success'` OR `reportStatus === 'completed'`
- **Display**:
  - Checkmark icon with emerald border
  - Title: "生成成功"
  - Message: "你的内视快测报告已准备好"
  - Button: "查看报告" (transitions to results view)

## Backend Integration

### Questionnaire Submission Endpoint
- **Endpoint**: `POST /conversations/{conversation_id}/questionnaires/submit`
- **Response includes**:
  ```json
  {
    "ok": true,
    "message": "所有问卷已完成！正在生成您的心理报告...",
    "report_id": 123,
    "report_status": "pending",
    "scoring": { ... },
    "module_completed": "quick_assessment"
  }
  ```

### Report Status Endpoint
- **Endpoint**: `GET /api/psychology/report/{report_id}/status`
- **Response**:
  ```json
  {
    "ok": true,
    "report_id": 123,
    "status": "pending" | "completed" | "failed",
    "progress": 0-100
  }
  ```

### Report Generation
- **Trigger**: Automatically triggered by backend when all questionnaires completed
- **Background Task**: `generate_report_background()` in `psychology_report_routes.py`
- **Process**:
  1. Creates `PsychologyAssessment` with dimension scores
  2. Creates `PsychologyReport` with status 'pending'
  3. Generates DOCX report in background
  4. Updates status to 'completed' when done

## Testing Checklist

### Admin Questionnaire (8 Questions)
- [ ] Navigate through all 8 questions
- [ ] On question 8 (F6: Ranking), select 3 items
- [ ] Verify "完成" button appears and is enabled
- [ ] Click "完成" button
- [ ] Verify loading screen appears with "生成中..."
- [ ] Wait for report generation (5-10 seconds)
- [ ] Verify success screen appears with "生成成功"
- [ ] Click "查看报告" button
- [ ] Verify results view displays

### Combined Questionnaire (Multiple Questionnaires)
- [ ] Complete all questionnaires
- [ ] Verify report generation triggers after last questionnaire
- [ ] Verify loading → success → results flow

## Debug Logging
Added console logs for debugging:
- `[F6 Ranking] Saving answer for question X with score: Y`
- `[F6 Ranking] Updated answers state: {...}`
- `[Report Generation Started] { report_id, status }`
- `[Waiting for report generation] { report_id }`
- `[Report Completed] Transitioning to success state`

## Files Modified
1. `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`
   - Updated button logic to show "完成" on last question
   - Added report generation flow with loading/success screens
   - Added useEffect for automatic success transition
   - Added debug logging for F6 ranking

2. `zeneme-next/src/lib/api.ts`
   - Already has `report_id` and `report_status` in `QuestionnaireSubmissionResult` interface
   - Already has `getPsychologyReportStatus()` function

## Known Issues
None currently. The flow should work end-to-end.

## Next Steps
1. Test with admin questionnaire (8 questions)
2. Verify report generation completes successfully
3. Add report download functionality in success screen
4. Add error handling for failed report generation
