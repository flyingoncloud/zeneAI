# Radar Chart Integration - 五维心理能力雷达图

## Overview

The psychology report displays a radar chart (五维心理能力雷达图) showing the five core psychological dimensions. The chart is generated on the backend and served as a static image to the frontend.

## Architecture

### Backend (Python/FastAPI)

**Chart Generation**
- Location: `ai-chat-api/src/resources/drawing_utils.py`
- Function: `draw_radar_chart(data, output_path)`
- Uses: matplotlib with Chinese font support
- Dimensions displayed:
  1. 情绪调节 (Emotional Regulation)
  2. 认知灵活 (Cognitive Flexibility)
  3. 关系敏感 (Relational Sensitivity)
  4. 内在冲突 (Inner Conflict)
  5. 成长潜能 (Growth Potential)

**Chart Storage**
- Directory: `ai-chat-api/reports/charts/report_{id}/`
- Filename: `radar_chart.png`
- Format: PNG image (5x5 inches, 100 DPI)

**Chart Serving**
- Endpoint: `/charts/report_{id}/radar_chart.png`
- Method: Static file serving via FastAPI's `StaticFiles`
- Configuration: `ai-chat-api/src/api/app.py` line 58

**Generation Flow**
1. Report generation triggered via `/api/psychology/report/{assessment_id}/generate`
2. Background task calls `generate_report_background()`
3. Charts generated in Step 5 of report generation
4. `draw_radar_chart()` creates PNG file
5. File saved to `reports/charts/report_{id}/radar_chart.png`

### Frontend (React/Next.js)

**Display Component**
- Location: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`
- Lines: 555-569

**Implementation**
```tsx
{reportId && (
  <Card className="p-6 bg-slate-900/40 border-white/5 backdrop-blur-md">
    <h2 className="text-2xl font-bold text-white mb-6 text-center">
      五维心理能力雷达图
    </h2>
    <div className="flex justify-center">
      <img
        src={`${process.env.NEXT_PUBLIC_API_URL}/charts/report_${reportId}/radar_chart.png`}
        alt="心理能力雷达图"
        className="max-w-full h-auto rounded-lg"
        style={{ maxHeight: '500px' }}
        onError={(e) => {
          console.error('Failed to load radar chart');
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  </Card>
)}
```

**Error Handling**
- If chart fails to load, error is logged to console
- Image element is hidden on error
- User sees no broken image placeholder

## Data Flow

```
User completes questionnaire
    ↓
Backend calculates dimension scores
    ↓
Report generation triggered
    ↓
draw_radar_chart() generates PNG
    ↓
Chart saved to reports/charts/report_{id}/
    ↓
Frontend requests chart via /charts endpoint
    ↓
FastAPI serves static PNG file
    ↓
Chart displayed in UI
```

## Configuration

**Environment Variables**
- Frontend: `NEXT_PUBLIC_API_URL` - API base URL (e.g., `http://localhost:8000`)
- Backend: No special config needed for chart serving

**Dependencies**
- Backend: matplotlib, numpy, PIL (for Chinese font support)
- Frontend: None (uses native `<img>` tag)

## Chart Specifications

**Visual Design**
- Type: Polar/Radar chart
- Shape: Pentagon (5 dimensions)
- Colors: Blue fill with 25% opacity, blue border (2px)
- Labels: Chinese dimension names
- Scale: 0-100 (hidden tick labels)
- Title: "五大核心心智雷达图" (blue, 13pt)

**File Specifications**
- Format: PNG
- Size: 5x5 inches
- DPI: 100
- Typical file size: ~15-65 KB

## Verification

To verify the system is working:

1. **Check chart generation**:
   ```bash
   ls -la ai-chat-api/reports/charts/report_{id}/radar_chart.png
   ```

2. **Test chart endpoint**:
   ```bash
   curl http://localhost:8000/charts/report_{id}/radar_chart.png -I
   ```
   Should return `200 OK` with `Content-Type: image/png`

3. **Check UI display**:
   - Complete questionnaire
   - View report
   - Verify radar chart appears under "五维心理能力雷达图" heading

## Troubleshooting

**Chart not displaying**
- Check backend logs for chart generation errors
- Verify `reports/charts/report_{id}/` directory exists
- Confirm `radar_chart.png` file was created
- Check browser console for image load errors
- Verify `NEXT_PUBLIC_API_URL` is set correctly

**Chart generation fails**
- Check Chinese font is available (see `drawing_utils.py` font detection)
- Verify matplotlib is installed: `pip list | grep matplotlib`
- Check report_data contains all required fields in `mind_indices`

**404 on chart endpoint**
- Verify FastAPI static files mount is configured
- Check `reports/charts` directory exists
- Confirm report ID is correct

## Related Files

**Backend**
- `ai-chat-api/src/resources/drawing_utils.py` - Chart generation
- `ai-chat-api/src/api/psychology_report_routes.py` - Report generation flow
- `ai-chat-api/src/api/app.py` - Static files configuration

**Frontend**
- `zeneme-next/src/components/features/tools/InnerQuickTest.tsx` - Chart display

## Status

✅ **COMPLETE** - System is fully implemented and working
- Backend generates radar chart correctly
- Charts are saved to correct directory
- Static file serving is configured
- Frontend loads and displays chart
- Error handling is in place
