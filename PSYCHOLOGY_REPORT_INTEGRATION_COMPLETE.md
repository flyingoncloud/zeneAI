# Psychology Report Integration - Implementation Complete

## Summary

Successfully integrated psychology report generation with the questionnaire completion flow. When users complete all 4 questionnaires, the system automatically generates a professional DOCX report with AI analysis and visualizations.

## What Was Implemented

### Backend Changes

**File**: `ai-chat-api/src/api/app.py`

1. **Added BackgroundTasks import**:
   ```python
   from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
   ```

2. **Updated questionnaire submission endpoint**:
   - Added `BackgroundTasks` parameter
   - Checks if all 4 questionnaires are completed
   - Creates `PsychologyAssessment` record if needed
   - Creates `PsychologyReport` record with status 'pending'
   - Triggers `generate_report_background()` task
   - Returns `report_id` and `report_status` in response

3. **Key logic**:
   ```python
   # Count completed questionnaires
   completed_count = db.query(DBQuestionnaireResponse).filter(
       DBQuestionnaireResponse.conversation_id == conversation_id
   ).count()

   if completed_count >= 4:  # All 4 questionnaires done
       # Create assessment and report
       # Trigger background generation
       background_tasks.add_task(generate_report_background, ...)
   ```

### Frontend Changes

**File**: `zeneme-next/src/lib/api.ts`

1. **Updated QuestionnaireSubmissionResult interface**:
   ```typescript
   export interface QuestionnaireSubmissionResult {
     ok: boolean;
     message?: string;
     scoring?: {...};
     report_id?: number;        // NEW
     report_status?: string;    // NEW
     error?: string;
   }
   ```

**File**: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`

1. **Added state for report tracking**:
   ```typescript
   const [reportId, setReportId] = useState<number | null>(null);
   const [reportStatus, setReportStatus] = useState<string>('');
   const [reportProgress, setReportProgress] = useState<number>(0);
   ```

2. **Added polling effect**:
   - Polls report status every 2 seconds
   - Updates progress bar
   - Shows toast notifications on completion/failure
   - Automatically stops polling when done

3. **Updated submission handler**:
   - Captures `report_id` and `report_status` from response
   - Logs report generation start

4. **Added UI components**:
   - **Pending state**: Shows loading spinner, progress bar, and message
   - **Completed state**: Shows success message and download button
   - **Failed state**: Shows error message

## User Flow

```
User completes questionnaire
         ↓
Submit questionnaire (1/4)
         ↓
Backend saves & scores
         ↓
... repeat for questionnaires 2, 3, 4 ...
         ↓
Submit questionnaire (4/4)
         ↓
Backend detects all 4 completed
         ↓
Backend creates PsychologyReport (status: pending)
         ↓
Backend triggers background task
         ↓
Frontend receives report_id
         ↓
Frontend starts polling (every 2 seconds)
         ↓
Backend generates report (30-60 seconds):
  - Identifies dominant elements
  - Generates AI analysis texts
  - Classifies personality style
  - Assembles report data
  - Generates charts (PNG)
  - Generates DOCX report
  - Updates status to 'completed'
         ↓
Frontend detects 'completed' status
         ↓
Frontend shows download button
         ↓
User clicks download
         ↓
DOCX file downloads
```

## Report Generation Pipeline

The background task performs these steps:

1. **Identify Dominant Elements** (5-10s)
   - Dominant IFS part
   - Dominant cognitive pattern
   - Dominant narrative
   - Attachment style

2. **Generate AI Analysis Texts** (20-30s)
   - Uses OpenAI API
   - Generates 4 analysis texts (150-200 chars each)
   - IFS impact, cognitive impact, narrative summary, conflict triggers

3. **Classify Personality Style** (1-2s)
   - Analyzes score patterns
   - Classifies into 6 personality types

4. **Assemble Report Data** (1-2s)
   - Combines all data into JSON structure
   - Prepares for template rendering

5. **Generate Charts** (3-5s)
   - Radar chart (5 core dimensions)
   - Perspective bar chart
   - Relational rating scale
   - Growth potential bar chart

6. **Generate DOCX Report** (5-10s)
   - Renders markdown template with Jinja2
   - Converts to DOCX format
   - Embeds chart images
   - Saves to disk

7. **Update Status** (1s)
   - Sets status to 'completed'
   - Saves file path to database

**Total time**: ~30-60 seconds

## API Endpoints Used

### Backend
- `POST /conversations/{id}/questionnaires/submit` - Submit questionnaire (modified)
- `GET /api/psychology/report/{report_id}/status` - Check report status
- `GET /api/psychology/report/{report_id}/download` - Download DOCX

### Frontend
- `submitQuestionnaireResponse()` - Submit questionnaire
- `getPsychologyReportStatus()` - Poll status
- `downloadPsychologyReport()` - Download file

## Database Tables

### psychology_assessments
- Stores overall assessment data
- Links to conversation
- Tracks completion percentage

### psychology_reports
- Stores report metadata
- Fields: `id`, `assessment_id`, `generation_status`, `file_path`, `report_data`
- Status values: 'pending', 'processing', 'completed', 'failed'

### assessment_responses
- Stores individual questionnaire responses
- Used to count completed questionnaires

## File Storage

Reports are saved to:
```
ai-chat-api/reports/
├── generated/
│   └── psychology_report_{id}.docx
└── charts/
    └── report_{id}/
        ├── radar_chart.png
        ├── perspective_bar_chart.png
        ├── relational_rating_scale.png
        └── growth_bar_chart.png
```

## Testing Instructions

### 1. Start Backend
```bash
cd ai-chat-api
python run.py
```

### 2. Complete Questionnaires
1. Open the questionnaire interface
2. Complete all 4 questionnaires:
   - 2.1 情绪觉察 (Emotional Awareness)
   - 2.2 认知模式 (Cognitive Patterns)
   - 2.3 关系模式 (Relational Patterns)
   - 2.5 成长指数 (Growth Index)

### 3. Observe Report Generation
After submitting the 4th questionnaire:

**Frontend should show**:
- Message: "所有问卷已完成！正在生成您的心理报告..."
- Blue card with loading spinner
- Progress bar (0% → 100%)
- Progress text: "进度: X%"

**Backend logs should show**:
```
INFO - Completed questionnaires count: 4
INFO - All questionnaires completed for conversation X, triggering report generation
INFO - Created psychology_report with id=X, triggering background generation
INFO - Starting background report generation for report_id=X
INFO - Step 1: Identifying dominant elements
INFO - Step 2: Generating AI analysis texts
INFO - Step 3: Classifying personality style
INFO - Step 4: Assembling report data
INFO - Step 5: Generating charts
INFO - Step 6: Generating DOCX report
INFO - Step 7: Updating report status to completed
INFO - Report X generation completed successfully
```

### 4. Download Report
After 30-60 seconds:
- Green card appears with "报告已生成"
- Click "📥 下载心理报告 (DOCX)" button
- DOCX file downloads
- Open in Word/LibreOffice to verify:
  - Chinese text displays correctly
  - Charts are embedded
  - All sections present

## Troubleshooting

### Report Not Generating

**Check**:
1. All 4 questionnaires completed?
   ```sql
   SELECT COUNT(*) FROM assessment_responses WHERE conversation_id = X;
   ```
2. Backend logs for errors?
3. Database has `psychology_assessments` record?
   ```sql
   SELECT * FROM psychology_assessments WHERE conversation_id = X;
   ```
4. Database has `psychology_reports` record?
   ```sql
   SELECT * FROM psychology_reports WHERE assessment_id = X;
   ```

### Download Not Working

**Check**:
1. Report status is 'completed'?
2. File exists at `file_path`?
3. File permissions correct?
4. Backend logs for download errors?

### Charts Not Showing

**Check**:
1. Charts directory created?
2. Chart files generated?
3. Chart file paths correct in DOCX?

## Dependencies

All dependencies already installed:
- Backend: `python-docx==1.2.0`, `matplotlib==3.10.8`, `numpy==2.2.6`
- Frontend: No new dependencies

## Related Documentation

- `PSYCHOLOGY_REPORT