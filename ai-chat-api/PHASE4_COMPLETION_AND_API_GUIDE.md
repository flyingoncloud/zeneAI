# Phase 4 Completion & API Integration Guide

## Overview
Phase 4 (API Endpoints) is now complete! The Psychology Report Generation System now has a fully functional REST API ready for frontend integration.

## Phase 4: API Endpoints ✅

### Implementation Summary
**Status**: Complete
**Commit**: `cf74b557` - "Phase 4: API Endpoints for Report Generation"
**File**: `src/api/psychology_report_routes.py`

### API Endpoints

#### 1. Generate Report
```http
POST /api/psychology/report/generate
Content-Type: application/json

{
  "assessment_id": 123,
  "language": "zh",
  "format": "json",
  "include_analysis": true
}
```

**Response**:
```json
{
  "ok": true,
  "report_id": 456,
  "status": "pending",
  "estimated_completion_time": 30
}
```

**Features**:
- Validates assessment exists
- Checks completeness (>= 70%)
- Creates report record with "pending" status
- Triggers background processing
- Returns immediately with report_id

#### 2. Check Report Status
```http
GET /api/psychology/report/{report_id}/status
```

**Response (Pending)**:
```json
{
  "ok": true,
  "report_id": 456,
  "status": "pending",
  "progress": 10,
  "current_step": "pending",
  "estimated_time_remaining": 30
}
```

**Response (Completed)**:
```json
{
  "ok": true,
  "report_id": 456,
  "status": "completed",
  "progress": 100,
  "current_step": "completed",
  "estimated_time_remaining": null,
  "report_data": {
    "user_info": {...},
    "mind_indices": {...},
    "emotional_insight": {...},
    "cognitive_insight": {...},
    "relational_insight": {...},
    "personality_style": {...},
    "growth_potential": {...}
  }
}
```

**Features**:
- Real-time status tracking
- Progress percentage (0-100)
- Estimated time remaining
- Complete report data when finished
- Error messages if failed

#### 3. Generate Specific Analyses
```http
POST /api/psychology/analysis/generate
Content-Type: application/json

{
  "assessment_id": 123,
  "analysis_types": [
    "ifs_impact",
    "cognitive_impact",
    "narrative_summary",
    "conflict_triggers"
  ],
  "language": "zh"
}
```

**Response**:
```json
{
  "ok": true,
  "analyses": [
    {
      "analysis_type": "ifs_impact",
      "related_entity_type": "ifs_part",
      "related_entity_id": "pleaser",
      "text": "你目前的内在家庭系统状态显示出较强的迎合者特征...",
      "confidence": null
    },
    {
      "analysis_type": "cognitive_impact",
      "related_entity_type": "cognitive_pattern",
      "related_entity_id": "self_blame",
      "text": "当事情不顺时，你倾向于把原因往自己身上揽...",
      "confidence": null
    }
  ]
}
```

**Features**:
- Generate individual analysis texts
- Flexible - request only needed types
- Stores in database
- Returns immediately (no background task)

---

## Complete System Architecture

### Backend Processing Pipeline

```
1. POST /api/psychology/report/generate
   ↓
2. Validate Assessment (>= 70% complete)
   ↓
3. Create Report Record (status: pending)
   ↓
4. Background Task Starts
   ├─ Identify Dominant Elements (Phase 1)
   ├─ Generate AI Analysis Texts (Phase 2)
   ├─ Classify Personality Style (Phase 2)
   └─ Assemble Report Data (Phase 3)
   ↓
5. Update Report Status (completed/failed)
   ↓
6. GET /api/psychology/report/{id}/status
   ↓
7. Return Complete Report Data
```

### Technology Stack

**Backend**:
- FastAPI (async web framework)
- SQLAlchemy (ORM)
- OpenAI API (GPT-3.5-turbo for analysis)
- BackgroundTasks (async processing)
- Pydantic (validation)

**Database**:
- 12 psychology tables
- JSONB for flexible data
- Relationships and cascades

**Processing**:
- 5 core modules (Phases 1-3)
- 3 API endpoints (Phase 4)
- ~2,000 lines of production code

---

## Frontend Integration Guide

### Step 1: Generate Report

```typescript
// In your frontend API client (zeneme-next/src/lib/api.ts)

interface ReportGenerationRequest {
  assessment_id: number;
  language?: string;
  format?: string;
  include_analysis?: boolean;
}

interface ReportGenerationResponse {
  ok: boolean;
  report_id?: number;
  status: string;
  estimated_completion_time?: number;
  error?: string;
}

export async function generatePsychologyReport(
  assessmentId: number
): Promise<ReportGenerationResponse> {
  const response = await fetch('/api/psychology/report/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assessment_id: assessmentId,
      language: 'zh',
      format: 'json',
      include_analysis: true
    })
  });

  return response.json();
}
```

### Step 2: Poll Report Status

```typescript
interface ReportStatusResponse {
  ok: boolean;
  report_id: number;
  status: string;
  progress?: number;
  current_step?: string;
  estimated_time_remaining?: number;
  report_data?: any;
  error?: string;
}

export async function getReportStatus(
  reportId: number
): Promise<ReportStatusResponse> {
  const response = await fetch(
    `/api/psychology/report/${reportId}/status`
  );

  return response.json();
}

// Poll every 2 seconds until completed
export async function pollReportStatus(
  reportId: number,
  onProgress?: (progress: number) => void
): Promise<any> {
  while (true) {
    const status = await getReportStatus(reportId);

    if (onProgress && status.progress) {
      onProgress(status.progress);
    }

    if (status.status === 'completed') {
      return status.report_data;
    }

    if (status.status === 'failed') {
      throw new Error(status.error || 'Report generation failed');
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### Step 3: Use in React Component

```typescript
// Example React component
import { useState } from 'react';
import { generatePsychologyReport, pollReportStatus } from '@/lib/api';

export function ReportGenerator({ assessmentId }: { assessmentId: number }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Request report generation
      const response = await generatePsychologyReport(assessmentId);

      if (!response.ok) {
        throw new Error(response.error);
      }

      // Step 2: Poll for completion
      const reportData = await pollReportStatus(
        response.report_id!,
        setProgress
      );

      // Step 3: Display report
      setReport(reportData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerateReport} disabled={loading}>
        {loading ? `生成中... ${progress}%` : '生成心理报告'}
      </button>

      {error && <div className="error">{error}</div>}

      {report && (
        <div className="report">
          <h2>{report.user_info.name}的心理报告</h2>
          {/* Render report sections */}
        </div>
      )}
    </div>
  );
}
```

---

## Report Data Structure

The complete report data follows this structure (matching `report_data.json`):

```typescript
interface PsychologyReport {
  user_info: {
    name: string;
    gender: string;
    age: number;
    report_date: string;
  };

  mind_indices: {
    emotional_regulation: number;
    cognitive_flexibility: number;
    relational_sensitivity: number;
    inner_conflict: number;
    growth_potential: number;
  };

  emotional_insight: {
    score: number;
    status: {
      recognition_expression: string;  // '基础', '清晰', '准确'
      regulation_recovery: string;     // '迅速', '较快', '一般'
      tendency_risk: string;           // '稳定', '适度', '敏感'
    };
  };

  cognitive_insight: {
    flexibility_score: number;
    inner_system: {
      current_status: string;
      impact_analysis: string;
    };
    automatic_thought: {
      pattern: string;
      impact: string;
    };
    perspective_shifting: {
      summary: string;
      stars: string;
      details: {
        self_other: number;
        spatial: number;
        cognitive_frame: number;
        emotional: number;
      };
    };
    narrative_structure: {
      type: string;
      summary: string;
    };
  };

  relational_insight: {
    sensitivity_score: number;
    details: {
      relational_triggers: number;
      empathy_index: number;
      inner_conflict_level: number;
    };
    attachment_pattern: {
      anxious: boolean;
      disorganized: boolean;
      secure: boolean;
      avoidant: boolean;
    };
    conflict_triggers: {
      status: string;
    };
  };

  personality_style: {
    type: string;  // e.g., "感性驱动型人格（Emotion-Dominant Type）"
  };

  growth_potential: {
    total_score: number;
    insight_depth: number;
    psychological_plasticity: number;
    resilience: number;
  };
}
```

---

## Testing the API

### Using curl

```bash
# 1. Generate report
curl -X POST http://localhost:8000/api/psychology/report/generate \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": 1,
    "language": "zh",
    "format": "json"
  }'

# Response: {"ok":true,"report_id":1,"status":"pending",...}

# 2. Check status
curl http://localhost:8000/api/psychology/report/1/status

# 3. Generate specific analyses
curl -X POST http://localhost:8000/api/psychology/analysis/generate \
  -H "Content-Type: application/json" \
  -d '{
    "assessment_id": 1,
    "analysis_types": ["ifs_impact", "cognitive_impact"],
    "language": "zh"
  }'
```

### Using Postman

1. Import the API endpoints
2. Set base URL: `http://localhost:8000`
3. Test each endpoint with sample data

---

## Error Handling

### Common Errors

**Assessment Not Found**:
```json
{
  "ok": false,
  "status": "error",
  "error": "Assessment 123 not found"
}
```

**Assessment Incomplete**:
```json
{
  "ok": false,
  "status": "error",
  "error": "Assessment must be at least 70% complete (current: 45%)"
}
```

**Report Generation Failed**:
```json
{
  "ok": true,
  "report_id": 456,
  "status": "failed",
  "error": "OpenAI API error: Rate limit exceeded"
}
```

### Frontend Error Handling

```typescript
try {
  const response = await generatePsychologyReport(assessmentId);

  if (!response.ok) {
    // Handle validation errors
    if (response.error?.includes('70% complete')) {
      showMessage('请先完成更多评估问题');
    } else {
      showMessage(response.error);
    }
    return;
  }

  // Poll for completion
  const report = await pollReportStatus(response.report_id);

} catch (error) {
  // Handle network or processing errors
  showMessage('生成报告时出错，请稍后重试');
}
```

---

## Performance Considerations

### Background Processing
- Report generation runs asynchronously
- Doesn't block API response
- Typical completion time: 20-40 seconds
- Depends on OpenAI API response time

### Polling Strategy
- Poll every 2-3 seconds
- Stop when status is 'completed' or 'failed'
- Show progress to user
- Consider exponential backoff for long waits

### Optimization Opportunities
- Cache frequently accessed data
- Batch OpenAI API calls
- Add database indexes
- Implement request queuing

---

## Next Steps for Frontend

### Required UI Components

1. **Report Generation Button**
   - Trigger report generation
   - Show loading state
   - Display progress

2. **Progress Indicator**
   - Show percentage complete
   - Estimated time remaining
   - Current processing step

3. **Report Display**
   - User info section
   - Mind indices visualization
   - Emotional insight cards
   - Cognitive insight sections
   - Relational insight
   - Personality style
   - Growth potential

4. **Error Handling**
   - Validation errors
   - Processing errors
   - Retry mechanism

### Recommended Flow

```
User completes assessment (>= 70%)
    ↓
Click "生成心理报告" button
    ↓
Show loading spinner with progress
    ↓
Poll status every 2 seconds
    ↓
Display complete report
    ↓
Allow download/share
```

---

## Summary

**Phase 4 Status**: ✅ Complete

**API Endpoints**: 3 endpoints fully functional
- POST `/api/psychology/report/generate`
- GET `/api/psychology/report/{id}/status`
- POST `/api/psychology/analysis/generate`

**Features**:
- ✅ Background processing
- ✅ Progress tracking
- ✅ Error handling
- ✅ Validation
- ✅ Complete report data

**Ready For**:
- Frontend integration
- UI development
- User testing

**Total Implementation**:
- 4 Phases complete
- ~2,500 lines of code
- 12 database tables
- 3 REST API endpoints
- Full report generation pipeline

The backend is production-ready and waiting for frontend integration! 🎉
