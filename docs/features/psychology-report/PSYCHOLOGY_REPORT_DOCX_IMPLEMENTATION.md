# Psychology Report DOCX Generation Implementation Guide

## Overview

This guide documents the complete implementation for generating psychology reports in DOCX format. The system converts markdown templates to Word documents with embedded charts.

## Architecture

### Flow Diagram

```
User Completes Questionnaires
         ↓
Backend Triggers Report Generation (Background Task)
         ↓
Step 1: Identify Dominant Elements
         ↓
Step 2: Generate AI Analysis Texts (OpenAI)
         ↓
Step 3: Classify Personality Style
         ↓
Step 4: Assemble Report Data (JSON)
         ↓
Step 5: Generate Charts (PNG images)
         ↓
Step 6: Render Markdown Template (Jinja2)
         ↓
Step 7: Convert Markdown → DOCX
         ↓
Step 8: Save DOCX File & Update Database
         ↓
Frontend Polls Status → Download DOCX
```

## Backend Implementation

### 1. DOCX Generator Service

**File**: `ai-chat-api/src/services/psychology/docx_generator.py`

**Key Features**:
- Renders markdown template with Jinja2
- Converts markdown to DOCX format
- Embeds chart images
- Handles Chinese fonts (SimSun)
- Supports markdown formatting (headers, tables, lists, bold, italic)

**Main Class**: `DocxReportGenerator`

**Key Methods**:
- `generate_docx()`: Main entry point for DOCX generation
- `_render_template()`: Renders markdown template with report data
- `_markdown_to_docx()`: Converts markdown to DOCX format
- `_add_heading()`, `_add_table()`, `_add_image()`: Format-specific converters

**Usage**:
```python
from src.services.psychology.docx_generator import generate_psychology_report_docx

docx_path = generate_psychology_report_docx(
    report_data=report_data,
    output_dir="/path/to/reports",
    report_id=123,
    charts_dir="/path/to/charts"
)
```

### 2. Updated Report Generation Flow

**File**: `ai-chat-api/src/api/psychology_report_routes.py`

**Background Task**: `generate_report_background()`

**New Steps Added**:

**Step 5: Generate Charts**
```python
# Create charts directory
charts_dir = base_dir / "reports" / "charts" / f"report_{report_id}"
charts_dir.mkdir(parents=True, exist_ok=True)

# Generate all charts
draw_radar_chart(report_data, str(charts_dir / "radar_chart.png"))
draw_perspective_bar_chart(report_data, str(charts_dir / "perspective_bar_chart.png"))
draw_relational_rating_scale(report_data, str(charts_dir / "relational_rating_scale.png"))
draw_growth_bar_chart(report_data, str(charts_dir / "growth_bar_chart.png"))
```

**Step 6: Generate DOCX**
```python
# Create reports directory
reports_dir = base_dir / "reports" / "generated"
reports_dir.mkdir(parents=True, exist_ok=True)

# Generate DOCX
docx_path = generate_psychology_report_docx(
    report_data=report_data,
    output_dir=str(reports_dir),
    report_id=report_id,
    charts_dir=str(charts_dir)
)
```

**Step 7: Update Database**
```python
report.report_data = report_data
report.file_path = docx_path  # Save DOCX file path
report.generation_status = 'completed'
report.generated_at = datetime.utcnow()
db_session.commit()
```

### 3. Download Endpoint

**Endpoint**: `GET /api/psychology/report/{report_id}/download`

**Features**:
- Validates report exists and is completed
- Returns DOCX file with friendly filename
- Handles errors with Chinese error messages

**Response**:
- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Filename: `ZeneMe心理报告_{user_name}_{report_id}.docx`

**Error Handling**:
- 404: Report not found
- 400: Report not completed yet
- 500: Internal server error

## Frontend Implementation

### 1. API Functions

**File**: `zeneme-next/src/lib/api.ts`

**New Functions**:

**Get Report Status**:
```typescript
export async function getPsychologyReportStatus(reportId: number): Promise<PsychologyReportStatus>
```

**Download Report**:
```typescript
export async function downloadPsychologyReport(reportId: number): Promise<{
  ok: boolean;
  error?: string;
}>
```

**Usage Example**:
```typescript
// Poll for status
const status = await getPsychologyReportStatus(reportId);

if (status.status === 'completed') {
  // Download report
  const result = await downloadPsychologyReport(reportId);

  if (result.ok) {
    console.log('Report downloaded successfully');
  } else {
    console.error('Download failed:', result.error);
  }
}
```

### 2. UI Integration (To Be Implemented)

**Recommended Location**: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`

**Implementation Steps**:

1. **After Questionnaire Submission**:
   - Check if all 4 questionnaires completed
   - Trigger report generation
   - Store `report_id` in state

2. **Polling Logic**:
   ```typescript
   useEffect(() => {
     if (!reportId || reportStatus === 'completed') return;

     const interval = setInterval(async () => {
       const status = await getPsychologyReportStatus(reportId);
       setReportStatus(status.status);
       setProgress(status.progress || 0);

       if (status.status === 'completed' || status.status === 'failed') {
         clearInterval(interval);
       }
     }, 2000); // Poll every 2 seconds

     return () => clearInterval(interval);
   }, [reportId, reportStatus]);
   ```

3. **Download Button**:
   ```typescript
   <button
     onClick={async () => {
       const result = await downloadPsychologyReport(reportId);
       if (!result.ok) {
         alert(`下载失败: ${result.error}`);
       }
     }}
     disabled={reportStatus !== 'completed'}
   >
     下载心理报告
   </button>
   ```

## File Structure

```
ai-chat-api/
├── src/
│   ├── api/
│   │   └── psychology_report_routes.py      # Updated with DOCX generation
│   ├── services/
│   │   └── psychology/
│   │       └── docx_generator.py            # NEW: DOCX generator service
│   ├── resources/
│   │   ├── ZeneMe - 内视觉察专业报告.md      # Markdown template
│   │   ├── generate_report.py               # Original markdown generator
│   │   └── drawing_utils.py                 # Chart generation utilities
│   └── reports/                             # NEW: Generated reports directory
│       ├── generated/                       # DOCX files
│       │   └── psychology_report_{id}.docx
│       └── charts/                          # Chart images
│           └── report_{id}/
│               ├── radar_chart.png
│               ├── perspective_bar_chart.png
│               ├── relational_rating_scale.png
│               └── growth_bar_chart.png
└── requirements.txt                         # python-docx already included

zeneme-next/
└── src/
    └── lib/
        └── api.ts                           # Updated with download functions
```

## Database Schema

**Table**: `psychology_reports`

**Key Columns**:
- `id`: Report ID (primary key)
- `assessment_id`: Foreign key to psychology_assessments
- `report_data`: JSONB - Complete report data
- `file_path`: VARCHAR - Path to generated DOCX file
- `generation_status`: VARCHAR - 'pending', 'processing', 'completed', 'failed'
- `generated_at`: TIMESTAMP - When report was completed
- `error_message`: TEXT - Error details if failed

## Dependencies

### Backend
- `python-docx==1.1.0` - DOCX generation (already in requirements.txt)
- `jinja2` - Template rendering (FastAPI dependency)
- `matplotlib` - Chart generation (existing)

### Frontend
- No new dependencies required

## Testing

### Backend Testing

1. **Test DOCX Generator**:
```python
from src.services.psychology.docx_generator import DocxReportGenerator

generator = DocxReportGenerator()
docx_path = generator.generate_docx(
    report_data=test_report_data,
    output_path="test_report.docx",
    charts_dir="test_charts"
)
```

2. **Test Report Generation**:
```bash
# Start backend
cd ai-chat-api
python run.py

# Trigger report generation via API
curl -X POST http://localhost:8000/api/psychology/report/generate \
  -H "Content-Type: application/json" \
  -d '{"assessment_id": 1, "language": "zh"}'
```

3. **Test Download**:
```bash
# Download report
curl -X GET http://localhost:8000/api/psychology/report/1/download \
  --output report.docx
```

### Frontend Testing

1. **Test Status Polling**:
```typescript
const status = await getPsychologyReportStatus(1);
console.log('Status:', status);
```

2. **Test Download**:
```typescript
const result = await downloadPsychologyReport(1);
console.log('Download result:', result);
```

## Error Handling

### Backend Errors

1. **Template Not Found**:
   - Error: `FileNotFoundError: Template not found`
   - Solution: Verify template path in `docx_generator.py`

2. **Chart Generation Failed**:
   - Error: Charts not found during DOCX generation
   - Solution: Check `drawing_utils.py` and chart directory permissions

3. **DOCX Generation Failed**:
   - Error: Various python-docx errors
   - Solution: Check report_data structure matches template expectations

### Frontend Errors

1. **Download Failed**:
   - Show user-friendly error message in Chinese
   - Log detailed error to console

2. **Polling Timeout**:
   - Stop polling after 5 minutes
   - Show error message to user

## Performance Considerations

### Report Generation Time

**Estimated Time**: 30-60 seconds

**Breakdown**:
- Dominant elements identification: 2-5 seconds
- AI analysis generation (OpenAI): 20-40 seconds
- Personality classification: 1-2 seconds
- Report assembly: 1-2 seconds
- Chart generation: 2-3 seconds
- DOCX generation: 2-5 seconds

### Optimization Tips

1. **Parallel Processing**:
   - Generate charts in parallel (future enhancement)
   - Cache OpenAI responses for similar patterns

2. **File Storage**:
   - Consider moving to S3 for production
   - Implement cleanup for old reports

3. **Database**:
   - Index on `generation_status` for faster queries
   - Archive old reports periodically

## Deployment Checklist

### Backend

- [ ] Verify `python-docx` is installed
- [ ] Create `reports/generated` directory with write permissions
- [ ] Create `reports/charts` directory with write permissions
- [ ] Verify markdown template exists
- [ ] Test chart generation
- [ ] Test DOCX generation
- [ ] Test download endpoint

### Frontend

- [ ] Update API base URL for production
- [ ] Implement polling logic in UI
- [ ] Add download button
- [ ] Test download functionality
- [ ] Add error handling and user feedback

### Database

- [ ] Verify `file_path` column exists in `psychology_reports` table
- [ ] Add index on `generation_status` if needed

## Future Enhancements

1. **Email Delivery**:
   - Send report via email when completed
   - Add email notification preferences

2. **PDF Generation**:
   - Convert DOCX to PDF for easier sharing
   - Use `python-docx2pdf` or similar

3. **Report Customization**:
   - Allow users to select report sections
   - Support multiple languages

4. **Analytics**:
   - Track report generation success rate
   - Monitor generation time
   - Identify common failure patterns

5. **Caching**:
   - Cache generated reports
   - Regenerate only when data changes

## Troubleshooting

### Common Issues

1. **Charts Not Appearing in DOCX**:
   - Check chart file paths are correct
   - Verify charts were generated successfully
   - Check image file permissions

2. **Chinese Characters Not Displaying**:
   - Verify SimSun font is available
   - Check font configuration in `docx_generator.py`

3. **Download Not Working**:
   - Check file path in database
   - Verify file exists on disk
   - Check file permissions

4. **Report Generation Stuck**:
   - Check OpenAI API key and quota
   - Review backend logs for errors
   - Verify database connection

## Support

For issues or questions:
1. Check backend logs: `ai-chat-api/logs/`
2. Check frontend console for errors
3. Review this documentation
4. Contact development team

---

**Last Updated**: January 2025
**Version**: 1.0
