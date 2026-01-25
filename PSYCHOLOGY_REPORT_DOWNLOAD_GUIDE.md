# Psychology Report Download Guide

## Overview

The psychology report download system generates DOCX (Word) files and stores them on the backend filesystem. Users can download these reports through the frontend.

## Report Storage Location

### Filesystem Path
Reports are stored in the backend at:
```
ai-chat-api/reports/generated/
```

### File Naming Convention
```
psychology_report_{report_id}.docx
```

Example: `psychology_report_123.docx`

### Charts Storage
Charts (images) are stored separately at:
```
ai-chat-api/reports/charts/report_{report_id}/
```

Charts include:
- `radar_chart.png` - 5-dimension radar chart
- `perspective_bar_chart.png` - Perspective analysis
- `relational_rating_scale.png` - Relationship patterns
- `growth_bar_chart.png` - Growth potential

## API Endpoints

### 1. Check Report Status
**Endpoint:** `GET /api/psychology/report/{report_id}/status`

**Response:**
```json
{
  "ok": true,
  "report_id": 123,
  "status": "completed",  // pending | processing | completed | failed
  "progress": 100,
  "current_step": "completed",
  "estimated_time_remaining": null,
  "report_data": { ... }
}
```

### 2. Download Report
**Endpoint:** `GET /api/psychology/report/{report_id}/download`

**Response:** DOCX file download

**Filename Format:** `ZeneMe心理报告_{user_name}_{report_id}.docx`

**Error Responses:**
- `404` - Report not found or file doesn't exist
- `400` - Report not completed yet
- `500` - Server error

## Frontend Implementation

### API Functions (in `zeneme-next/src/lib/api.ts`)

#### 1. Get Report Status
```typescript
export async function getPsychologyReportStatus(reportId: number): Promise<PsychologyReportStatus>
```

Usage:
```typescript
const status = await getPsychologyReportStatus(123);
if (status.status === 'completed') {
  // Show download button
}
```

#### 2. Download Report
```typescript
export async function downloadPsychologyReport(reportId: number): Promise<{ ok: boolean; error?: string }>
```

Usage:
```typescript
const result = await downloadPsychologyReport(123);
if (result.ok) {
  // File downloaded successfully
} else {
  console.error(result.error);
}
```

### Download Flow

1. **User completes all 4 questionnaires**
   - Backend automatically triggers report generation
   - Returns `report_id` and `report_status: 'pending'`

2. **Frontend polls for status**
   ```typescript
   const checkStatus = async () => {
     const status = await getPsychologyReportStatus(reportId);

     if (status.status === 'completed') {
       // Show download button
       setReportReady(true);
     } else if (status.status === 'failed') {
       // Show error message
       setError(status.error);
     } else {
       // Still processing, check again in 3 seconds
       setTimeout(checkStatus, 3000);
     }
   };
   ```

3. **User clicks download button**
   ```typescript
   const handleDownload = async () => {
     const result = await downloadPsychologyReport(reportId);
     if (!result.ok) {
       alert(`下载失败: ${result.error}`);
     }
   };
   ```

## Backend Implementation

### Report Generation Flow (in `psychology_report_routes.py`)

```python
def generate_report_background(report_id, assessment_id, user_id, language, db_session):
    """
    Background task for report generation

    Steps:
    1. Identify dominant elements
    2. Generate AI analysis texts (30-60 seconds)
    3. Classify personality style
    4. Assemble report data
    5. Generate charts (PNG images)
    6. Generate DOCX report
    7. Update report status to 'completed'
    """
```

### File Path Storage

The DOCX file path is saved in the database:

```python
# In generate_report_background()
report.file_path = docx_path  # e.g., "/path/to/ai-chat-api/reports/generated/psychology_report_123.docx"
report.generation_status = 'completed'
db_session.commit()
```

### Download Endpoint

```python
@router.get("/report/{report_id}/download")
async def download_report(report_id: int, db: Session = Depends(get_db)):
    """
    Download psychology report as DOCX file

    1. Query report from database
    2. Check if status is 'completed'
    3. Check if file exists on filesystem
    4. Return FileResponse with DOCX file
    """
```

## Database Schema

### `psychology_reports` Table

```sql
CREATE TABLE psychology_reports (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    assessment_id INTEGER REFERENCES psychology_assessments(id),
    report_type VARCHAR DEFAULT 'comprehensive',
    language VARCHAR DEFAULT 'zh',
    format VARCHAR DEFAULT 'docx',
    report_data JSONB,
    file_path VARCHAR,  -- Path to generated DOCX file
    generation_status VARCHAR DEFAULT 'pending',  -- pending | processing | completed | failed
    error_message TEXT,
    generated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## UI Components (To Be Implemented)

### Report Status Display

```tsx
interface ReportStatusProps {
  reportId: number;
  onReady: () => void;
}

function ReportStatus({ reportId, onReady }: ReportStatusProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      const result = await getPsychologyReportStatus(reportId);
      setStatus(result.status);
      setProgress(result.progress || 0);

      if (result.status === 'completed') {
        onReady();
      } else if (result.status !== 'failed') {
        setTimeout(checkStatus, 3000);
      }
    };

    checkStatus();
  }, [reportId]);

  return (
    <div>
      {status === 'pending' && <p>正在准备生成报告...</p>}
      {status === 'processing' && <p>正在生成报告... {progress}%</p>}
      {status === 'completed' && <p>报告已生成！</p>}
      {status === 'failed' && <p>报告生成失败</p>}
    </div>
  );
}
```

### Download Button

```tsx
function DownloadButton({ reportId }: { reportId: number }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const result = await downloadPsychologyReport(reportId);
    setDownloading(false);

    if (!result.ok) {
      alert(`下载失败: ${result.error}`);
    }
  };

  return (
    <button onClick={handleDownload} disabled={downloading}>
      {downloading ? '下载中...' : '下载报告'}
    </button>
  );
}
```

## Complete User Flow

1. **User completes questionnaire 4/4**
   ```
   POST /conversations/{id}/questionnaires/submit
   Response: { report_id: 123, report_status: 'pending' }
   ```

2. **Frontend shows "报告生成中..."**
   - Polls status every 3 seconds
   - Shows progress indicator

3. **Backend generates report (30-60 seconds)**
   - Calls OpenAI API for analysis
   - Generates charts
   - Creates DOCX file
   - Saves to `reports/generated/psychology_report_123.docx`

4. **Status changes to 'completed'**
   ```
   GET /api/psychology/report/123/status
   Response: { status: 'completed', progress: 100 }
   ```

5. **Frontend shows download button**
   - User clicks "下载报告"
   - Browser downloads DOCX file

6. **User opens report in Microsoft Word**
   - Full psychology report with charts
   - Formatted with proper styling
   - Ready to read and share

## Troubleshooting

### Report Not Found (404)
- Check if `report_id` exists in database
- Verify `file_path` is set in database
- Check if file exists on filesystem

### Report Not Ready (400)
- Status is still 'pending' or 'processing'
- Wait for generation to complete
- Check backend logs for errors

### File Not Found
- Check `reports/generated/` directory exists
- Verify file permissions
- Check if DOCX generation succeeded

### Generation Failed
- Check backend logs for errors
- Common issues:
  - OpenAI API timeout
  - Missing assessment data
  - Chart generation errors
  - File write permissions

## Testing

### Manual Test Flow

1. **Complete all 4 questionnaires**
   ```bash
   # Use frontend or API
   ```

2. **Check report was created**
   ```bash
   cd ai-chat-api
   ls -la reports/generated/
   # Should see: psychology_report_123.docx
   ```

3. **Test download endpoint**
   ```bash
   curl -O http://localhost:8000/api/psychology/report/123/download
   # Should download DOCX file
   ```

4. **Open DOCX file**
   ```bash
   open psychology_report_123.docx
   # Should open in Microsoft Word
   ```

## Security Considerations

1. **Authentication** - Add user authentication to prevent unauthorized downloads
2. **Authorization** - Verify user owns the report before allowing download
3. **File Access** - Use secure file paths, prevent directory traversal
4. **Rate Limiting** - Limit download requests per user
5. **Cleanup** - Implement periodic cleanup of old report files

## Future Enhancements

1. **PDF Format** - Add PDF export option
2. **Email Delivery** - Send report via email
3. **Cloud Storage** - Store reports in S3/cloud storage
4. **Report History** - Show list of all user reports
5. **Report Sharing** - Generate shareable links
6. **Report Preview** - Show preview before download
7. **Multiple Languages** - Support English reports

## Summary

- **Storage:** `ai-chat-api/reports/generated/psychology_report_{id}.docx`
- **Download API:** `GET /api/psychology/report/{id}/download`
- **Status API:** `GET /api/psychology/report/{id}/status`
- **Frontend Functions:** `getPsychologyReportStatus()`, `downloadPsychologyReport()`
- **Generation Time:** 30-60 seconds (OpenAI API calls)
- **File Format:** DOCX (Microsoft Word)
