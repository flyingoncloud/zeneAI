# Psychology Report Integration Guide

## Overview
This guide explains how to integrate psychology report generation after questionnaire completion, allowing users to receive their comprehensive psychology report immediately after completing all questionnaires.

---

## Current System Architecture

### Existing Components

1. **Questionnaire Submission** (`/conversations/{id}/questionnaires/submit`)
   - Saves questionnaire responses
   - Calculates scores using `QuestionnaireScorer`
   - Marks `quick_assessment` module as complete

2. **Report Generation Pipeline** (`/api/psychology/report/generate`)
   - Step 1: Identify dominant elements
   - Step 2: Generate AI analysis texts (OpenAI)
   - Step 3: Classify personality style
   - Step 4: Assemble report data
   - Step 5: Render markdown template with Jinja2

3. **Report Status Checking** (`/api/psychology/report/{report_id}/status`)
   - Polls for report completion
   - Returns progress percentage
   - Returns final report data when complete

---

## Integration Strategy

### Option 1: Automatic Report Generation (Recommended)

**Flow:**
```
User completes questionnaire
  ↓
POST /conversations/{id}/questionnaires/submit
  ↓
Save scores to psychology_assessments table
  ↓
Check if ALL 4 questionnaires completed
  ↓
If YES → Trigger report generation automatically
  ↓
Return response with report_id
  ↓
Frontend polls /api/psychology/report/{report_id}/status
  ↓
Display report when status = "completed"
```

**Backend Changes:**

```python
# In ai-chat-api/src/api/app.py

from src.database.psychology_models import PsychologyAssessment, PsychologyReport
from src.api.psychology_report_routes import generate_report_background
from fastapi import BackgroundTasks

@app.post("/conversations/{conversation_id}/questionnaires/submit")
def submit_questionnaire_response(
    conversation_id: int,
    response: QuestionnaireResponse,
    background_tasks: BackgroundTasks,  # Add this
    db: Session = Depends(get_db)
):
    """
    Submit questionnaire responses, calculate scores, and save to database.
    Automatically triggers report generation when all questionnaires are complete.
    """
    try:
        # ... existing code for saving questionnaire response ...

        # After saving questionnaire response and marking module complete:

        # Check if all 4 questionnaires are completed
        all_questionnaires = ["questionnaire_2_1", "questionnaire_2_2",
                             "questionnaire_2_3", "questionnaire_2_5"]

        questionnaire_responses = conversation.extra_data.get("questionnaire_responses", {})
        completed_questionnaires = list(questionnaire_responses.keys())

        all_completed = all(q_id in completed_questionnaires for q_id in all_questionnaires)

        report_id = None
        report_status = None

        if all_completed:
            logger.info(f"All questionnaires completed for conversation {conversation_id}, triggering report generation")

            # Get or create psychology_assessment record
            assessment = db.query(PsychologyAssessment).filter(
                PsychologyAssessment.user_id == conversation.user_id,
                PsychologyAssessment.conversation_id == conversation_id
            ).first()

            if not assessment:
                # Create assessment from questionnaire scores
                assessment = PsychologyAssessment(
                    user_id=conversation.user_id,
                    conversation_id=conversation_id,
                    emotional_regulation_score=questionnaire_responses.get("questionnaire_2_1", {}).get("total_score", 0),
                    cognitive_flexibility_score=questionnaire_responses.get("questionnaire_2_2", {}).get("total_score", 0),
                    relationship_sensitivity_score=questionnaire_responses.get("questionnaire_2_3", {}).get("total_score", 0),
                    growth_potential_score=questionnaire_responses.get("questionnaire_2_5", {}).get("total_score", 0),
                    completion_percentage=100
                )
                db.add(assessment)
                db.commit()
                db.refresh(assessment)

            # Create psychology_reports record
            report = PsychologyReport(
                user_id=conversation.user_id,
                assessment_id=assessment.id,
                report_type='comprehensive',
                language='zh',
                format='json',
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

            logger.info(f"Started report generation with report_id={report_id}")

        return {
            "message": "Questionnaire response saved successfully",
            "conversation_id": conversation_id,
            "questionnaire_id": response.questionnaire_id,
            "response_id": db_response.id,
            "scoring": scoring_result,
            "module_completed": "quick_assessment",
            "all_questionnaires_completed": all_completed,
            "report_id": report_id,
            "report_status": report_status
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting questionnaire response: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

**Frontend Changes:**

```typescript
// In zeneme-next/src/lib/api.ts

/**
 * Get psychology report status
 */
export async function getPsychologyReportStatus(
  reportId: number
): Promise<{
  ok: boolean;
  report_id: number;
  status: string;
  progress?: number;
  current_step?: string;
  report_data?: any;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/psychology/report/${reportId}/status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting psychology report status:', error);
    return {
      ok: false,
      report_id: reportId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download psychology report
 */
export async function downloadPsychologyReport(
  reportId: number,
  format: 'json' | 'markdown' | 'pdf' = 'json'
): Promise<{
  ok: boolean;
  report?: any;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/psychology/report/${reportId}/download?format=${format}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { ok: true, report: data };
  } catch (error) {
    console.error('Error downloading psychology report:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Frontend Component (InnerQuickTest.tsx):**

```typescript
// In zeneme-next/src/components/features/tools/InnerQuickTest.tsx

import { getPsychologyReportStatus, downloadPsychologyReport } from '@/lib/api';

// After questionnaire submission:
const handleSubmit = async () => {
  try {
    setSubmitting(true);

    const response = await submitQuestionnaireResponse(
      conversationId,
      currentQuestionnaire.id,
      answers
    );

    if (response.ok) {
      toast.success('问卷提交成功！');

      // Check if all questionnaires completed and report is being generated
      if (response.all_questionnaires_completed && response.report_id) {
        toast.info('正在生成您的心理报告，请稍候...');

        // Start polling for report status
        pollReportStatus(response.report_id);
      } else {
        // Move to next questionnaire
        moveToNextQuestionnaire();
      }
    }
  } catch (error) {
    toast.error('提交失败，请重试');
  } finally {
    setSubmitting(false);
  }
};

// Poll report status
const pollReportStatus = async (reportId: number) => {
  const maxAttempts = 60; // 60 attempts = 2 minutes max
  let attempts = 0;

  const checkStatus = async () => {
    attempts++;

    const statusResponse = await getPsychologyReportStatus(reportId);

    if (statusResponse.status === 'completed') {
      // Report is ready!
      toast.success('报告生成完成！');

      // Download report data
      const reportResponse = await downloadPsychologyReport(reportId, 'json');

      if (reportResponse.ok) {
        // Display report or navigate to report page
        setReportData(reportResponse.report);
        setShowReport(true);
      }

      return;
    } else if (statusResponse.status === 'failed') {
      toast.error('报告生成失败，请联系客服');
      return;
    } else if (attempts >= maxAttempts) {
      toast.error('报告生成超时，请稍后查看');
      return;
    }

    // Continue polling
    setTimeout(checkStatus, 2000); // Check every 2 seconds
  };

  checkStatus();
};
```

---

### Option 2: Manual Report Request

**Flow:**
```
User completes all questionnaires
  ↓
Frontend shows "Generate Report" button
  ↓
User clicks button
  ↓
POST /api/psychology/report/generate
  ↓
Poll for completion
  ↓
Display report
```

This is simpler but requires an extra user action.

---

## Report Display Options

### Option A: Inline Markdown Display

Render the markdown report directly in the UI using a markdown renderer:

```typescript
import ReactMarkdown from 'react-markdown';

<ReactMarkdown>{reportData.markdown_content}</ReactMarkdown>
```

### Option B: PDF Download

Provide a download button for the PDF version:

```typescript
const downloadPDF = async () => {
  const response = await fetch(
    `${API_BASE_URL}/api/psychology/report/${reportId}/download?format=pdf`
  );
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `psychology_report_${reportId}.pdf`;
  a.click();
};
```

### Option C: Interactive Report Page

Create a dedicated report page with:
- Radar charts (using Chart.js or Recharts)
- Bar charts for growth potential
- Formatted sections with collapsible panels
- Print/download options

---

## Database Schema

Ensure these tables exist:

```sql
-- psychology_assessments table
CREATE TABLE psychology_assessments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    conversation_id INTEGER,
    emotional_regulation_score INTEGER,
    cognitive_flexibility_score INTEGER,
    relationship_sensitivity_score INTEGER,
    internal_conflict_score INTEGER,
    growth_potential_score INTEGER,
    completion_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- psychology_reports table
CREATE TABLE psychology_reports (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    assessment_id INTEGER REFERENCES psychology_assessments(id),
    report_type VARCHAR(50),
    language VARCHAR(10),
    format VARCHAR(20),
    report_data JSONB,
    generation_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

---

## Testing Checklist

- [ ] Complete all 4 questionnaires in sequence
- [ ] Verify report generation triggers automatically
- [ ] Check report_id is returned in response
- [ ] Poll report status endpoint
- [ ] Verify report data structure matches template
- [ ] Test markdown rendering in UI
- [ ] Test PDF download (if implemented)
- [ ] Test error handling (report generation failure)
- [ ] Test timeout handling (if generation takes too long)
- [ ] Verify charts are generated correctly

---

## Next Steps

1. **Implement backend changes** in `app.py`
2. **Add frontend API functions** in `api.ts`
3. **Update InnerQuickTest component** to handle report generation
4. **Create report display component** (markdown or interactive)
5. **Test end-to-end flow**
6. **Add error handling and loading states**

---

## Notes

- Report generation takes ~30-60 seconds due to OpenAI API calls
- Consider showing progress indicator during generation
- Cache generated reports to avoid regeneration
- Add option to regenerate report if needed
- Consider email notification when report is ready (for long generation times)
