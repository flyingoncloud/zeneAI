# Questionnaire to Report Integration Guide

## Overview

This guide shows how to integrate psychology report generation with the questionnaire completion flow.

## Current Flow

```
User completes questionnaire
         ↓
POST /conversations/{id}/questionnaires/submit
         ↓
Backend saves response & calculates score
         ↓
Returns to frontend
         ↓
Frontend shows next questionnaire
```

## New Flow (With Report Generation)

```
User completes questionnaire
         ↓
POST /conversations/{id}/questionnaires/submit
         ↓
Backend saves response & calculates score
         ↓
Backend checks: All 4 questionnaires completed?
         ↓
    YES → Trigger report generation
         ↓
Returns to frontend with report_id
         ↓
Frontend polls report status
         ↓
When completed → Show download button
```

## Backend Changes Needed

### 1. Update Questionnaire Submission Endpoint

**File**: `ai-chat-api/src/api/app.py`

**Current endpoint**: `POST /conversations/{conversation_id}/questionnaires/submit`

**Changes needed**:

```python
from fastapi import BackgroundTasks
from src.api.psychology_report_routes import generate_report_background

@app.post("/conversations/{conversation_id}/questionnaires/submit")
async def submit_questionnaire(
    conversation_id: int,
    response: QuestionnaireResponse,
    background_tasks: BackgroundTasks,  # ADD THIS
    db: Session = Depends(get_db)
):
    # ... existing code to save questionnaire response ...

    # NEW: Check if all questionnaires completed
    completed_questionnaires = db.query(AssessmentResponse).filter(
        AssessmentResponse.conversation_id == conversation_id
    ).count()

    report_id = None
    report_status = None

    if completed_questionnaires >= 4:  # All 4 questionnaires done
        # Get or create psychology_assessment
        assessment = db.query(PsychologyAssessment).filter(
            PsychologyAssessment.conversation_id == conversation_id
        ).first()

        if not assessment:
            # Create assessment record
            assessment = PsychologyAssessment(
                user_id=conversation.user_id,
                conversation_id=conversation_id,
                completion_percentage=100
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)

        # Create psychology_report record
        from src.database.psychology_models import PsychologyReport
        report = PsychologyReport(
            user_id=conversation.user_id,
            assessment_id=assessment.id,
            report_type='comprehensive',
            language='zh',
            format='docx',
            report_data={},
            generation_status='pending'
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        report_id = report.id
        report_status = 'pending'

        # Trigger background report generation
        background_tasks.add_task(
            generate_report_background,
            report_id=report.id,
            assessment_id=assessment.id,
            user_id=conversation.user_id,
            language='zh',
            db_session=db
        )

    return {
        "ok": True,
        "message": "问卷提交成功",
        "scoring": scoring_result,
        "module_completed": module_completed,
        "report_id": report_id,  # NEW
        "report_status": report_status  # NEW
    }
```

### 2. Import Required Models

Add to imports in `app.py`:

```python
from src.database.psychology_models import PsychologyAssessment, PsychologyReport
from src.api.psychology_report_routes import generate_report_background
```

## Frontend Changes Needed

### 1. Update Questionnaire Submission Response Type

**File**: `zeneme-next/src/lib/api.ts`

Update the `QuestionnaireSubmissionResult` interface:

```typescript
export interface QuestionnaireSubmissionResult {
  ok: boolean;
  message?: string;
  module_completed?: string;
  scoring?: {
    total_score: number;
    category_scores?: Record<string, number>;
    interpretation?: string;
  };
  report_id?: number;        // NEW
  report_status?: string;    // NEW
  error?: string;
}
```

### 2. Update InnerQuickTest Component

**File**: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`

Add state for report:

```typescript
const [reportId, setReportId] = useState<number | null>(null);
const [reportStatus, setReportStatus] = useState<string>('');
const [reportProgress, setReportProgress] = useState<number>(0);
```

Update questionnaire submission handler:

```typescript
const handleQuestionnaireSubmit = async (answers: Record<string, number>) => {
  try {
    const result = await submitQuestionnaireResponse(conversationId, {
      questionnaire_id: currentQuestionnaire.id,
      answers: answers
    });

    if (result.ok) {
      // Show success message
      setMessage(result.message || '问卷提交成功！');

      // NEW: Check if report generation started
      if (result.report_id) {
        setReportId(result.report_id);
        setReportStatus(result.report_status || 'pending');
        setMessage('所有问卷已完成！正在生成您的心理报告...');
      }

      // Move to next questionnaire or show completion
      // ... existing code ...
    }
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    setMessage('提交失败，请重试');
  }
};
```

Add polling effect:

```typescript
// Poll for report status
useEffect(() => {
  if (!reportId || reportStatus === 'completed' || reportStatus === 'failed') {
    return;
  }

  const pollInterval = setInterval(async () => {
    try {
      const status = await getPsychologyReportStatus(reportId);

      setReportStatus(status.status);
      setReportProgress(status.progress || 0);

      if (status.status === 'completed') {
        setMessage('报告生成完成！您可以下载查看。');
        clearInterval(pollInterval);
      } else if (status.status === 'failed') {
        setMessage('报告生成失败，请联系客服。');
        clearInterval(pollInterval);
      }
    } catch (error) {
      console.error('Error polling report status:', error);
    }
  }, 2000); // Poll every 2 seconds

  return () => clearInterval(pollInterval);
}, [reportId, reportStatus]);
```

Add download button in JSX:

```typescript
{reportStatus === 'completed' && reportId && (
  <div className="mt-6 p-4 bg-green-50 rounded-lg">
    <h3 className="text-lg font-semibold text-green-800 mb-2">
      ✅ 报告已生成
    </h3>
    <p className="text-green-700 mb-4">
      您的心理报告已经生成完成，点击下方按钮下载查看。
    </p>
    <button
      onClick={async () => {
        try {
          const result = await downloadPsychologyReport(reportId);
          if (!result.ok) {
            alert(`下载失败: ${result.error}`);
          }
        } catch (error) {
          console.error('Download error:', error);
          alert('下载失败，请重试');
        }
      }}
      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
    >
      📥 下载心理报告 (DOCX)
    </button>
  </div>
)}

{reportStatus === 'pending' && reportId && (
  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
    <h3 className="text-lg font-semibold text-blue-800 mb-2">
      ⏳ 正在生成报告...
    </h3>
    <p className="text-blue-700 mb-2">
      我们正在为您生成专业的心理报告，这可能需要30-60秒。
    </p>
    <div className="w-full bg-blue-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${reportProgress}%` }}
      />
    </div>
    <p className="text-sm text-blue-600 mt-2">
      进度: {reportProgress}%
    </p>
  </div>
)}

{reportStatus === 'failed' && reportId && (
  <div className="mt-6 p-4 bg-red-50 rounded-lg">
    <h3 className="text-lg font-semibold text-red-800 mb-2">
      ❌ 报告生成失败
    </h3>
    <p className="text-red-700">
      很抱歉，报告生成过程中出现了问题。请联系客服或稍后重试。
    </p>
  </div>
)}
```

## Testing the Integration

### Step 1: Start Backend

```bash
cd ai-chat-api
python run.py
```

### Step 2: Complete Questionnaires

1. Open the questionnaire interface
2. Complete all 4 questionnaires:
   - 2.1 情绪觉察
   - 2.2 认知模式
   - 2.3 关系模式
   - 2.5 成长指数

### Step 3: Observe Report Generation

After submitting the 4th questionnaire:

1. **Frontend should show**: "正在生成报告..." with progress bar
2. **Backend logs should show**:
   ```
   Starting background report generation for report_id=X
   Step 1: Identifying dominant elements
   Step 2: Generating AI analysis texts
   Step 3: Classifying personality style
   Step 4: Assembling report data
   Step 5: Generating charts
   Step 6: Generating DOCX report
   Step 7: Updating report status to completed
   ```
3. **After 30-60 seconds**: Download button appears

### Step 4: Download Report

Click the download button and verify:
- DOCX file downloads
- File opens in Word/LibreOffice
- Contains all sections with Chinese text
- Charts are embedded correctly

## Troubleshooting

### Report Not Generating

**Check**:
1. All 4 questionnaires completed?
2. Backend logs for errors?
3. Database has `psychology_assessments` record?
4. Database has `psychology_reports` record with status 'pending'?

### Download Not Working

**Check**:
1. Report status is 'completed'?
2. File exists at `file_path` in database?
3. File permissions correct?
4. Backend logs for download errors?

### Charts Not Showing

**Check**:
1. Charts directory created?
2. Chart files generated?
3. Chart file paths correct in DOCX generator?

## Database Queries for Debugging

```sql
-- Check assessment
SELECT * FROM psychology_assessments
WHERE conversation_id = YOUR_CONVERSATION_ID;

-- Check report
SELECT id, assessment_id, generation_status, file_path, error_message
FROM psychology_reports
WHERE assessment_id = YOUR_ASSESSMENT_ID;

-- Check questionnaire responses
SELECT questionnaire_id, COUNT(*)
FROM assessment_responses
WHERE conversation_id = YOUR_CONVERSATION_ID
GROUP BY questionnaire_id;
```

## Summary

**Backend Changes**:
1. ✅ Add `BackgroundTasks` to questionnaire submission
2. ✅ Check if all 4 questionnaires completed
3. ✅ Create `PsychologyReport` record
4. ✅ Trigger `generate_report_background` task
5. ✅ Return `report_id` and `report_status`

**Frontend Changes**:
1. ✅ Update response type with `report_id` and `report_status`
2. ✅ Add state for report tracking
3. ✅ Add polling logic for status
4. ✅ Add UI for progress and download

**Testing**:
1. Complete all 4 questionnaires
2. Verify report generation starts
3. Wait for completion (~30-60 seconds)
4. Download and verify DOCX file

---

**Next Step**: Implement the backend changes in `app.py` to trigger report generation after questionnaire completion.
