# Emotional Awareness Charts Implementation

## Date: 2026-02-21

## Overview
Implemented three separate horizontal bar charts for the emotional awareness (2.1) sub-categories, replacing the single combined image with individual visualizations for each dimension.

## Changes Made

### 1. Chart Generation Functions
**File**: `ai-chat-api/src/resources/drawing_utils.py`

Added four new functions:

#### Base Function: `draw_emotional_awareness_bar()`
Creates a horizontal bar chart with:
- Gradient background (4 sections from dark green to light green)
- Red dot indicator showing user's score position
- Custom labels for each section
- Compact size (6x1.5 inches) for document layout

```python
def draw_emotional_awareness_bar(score, labels, output_path, title=''):
    """
    Draw a horizontal bar chart for emotional awareness sub-categories.
    Creates a gradient bar from green to light green with a red dot indicator.
    """
```

#### Specific Chart Functions:

**1. `draw_emotion_recognition_expression(score, output_path)`**
- Title: 情绪识别、表达能力
- Labels: ['准确', '清晰', '基础', '初步']
- Measures ability to identify and express emotions

**2. `draw_emotion_regulation_recovery(score, output_path)`**
- Title: 情绪调节和恢复能力
- Labels: ['迅速', '较快', '一般', '需要多些时间']
- Measures ability to regulate and recover from emotions

**3. `draw_emotion_tendency_risk(score, output_path)`**
- Title: 情绪倾向与风险指数
- Labels: ['稳定', '适度', '敏感', '焦虑']
- Measures emotional patterns and risks

### 2. Report Generation Integration
**File**: `ai-chat-api/src/api/psychology_report_routes.py`

#### Added Imports:
```python
from src.resources.drawing_utils import (
    draw_radar_chart,
    draw_perspective_bar_chart,
    draw_relational_rating_scale,
    draw_growth_bar_chart,
    draw_emotion_recognition_expression,  # NEW
    draw_emotion_regulation_recovery,     # NEW
    draw_emotion_tendency_risk            # NEW
)
```

#### Added Chart Generation:
```python
# Generate emotional awareness sub-category charts
emotion_recognition_score = category_scores.get('2.1.1', 50)
emotion_regulation_score = category_scores.get('2.1.2', 50)
emotion_tendency_score = category_scores.get('2.1.3', 50)

draw_emotion_recognition_expression(
    emotion_recognition_score,
    str(charts_dir / "emotion_recognition_expression.png")
)
draw_emotion_regulation_recovery(
    emotion_regulation_score,
    str(charts_dir / "emotion_regulation_recovery.png")
)
draw_emotion_tendency_risk(
    emotion_tendency_score,
    str(charts_dir / "emotion_tendency_risk.png")
)
```

### 3. Report Template Update
**File**: `ai-chat-api/src/resources/ZeneMe - 内视觉察专业报告.md`

Changed from single image to three separate images:

**Before:**
```markdown
![情绪觉察状态图](extracted_images/emotional_insight_status.png)

- **情绪识别、表达能力**：{{emotional_insight.status.recognition_expression}}
- **情绪调节和恢复能力**：{{emotional_insight.status.regulation_recovery}}
- **情绪倾向与风险指数**：{{emotional_insight.status.tendency_risk}}
```

**After:**
```markdown
**情绪识别与表达能力**：

![情绪识别与表达](extracted_images/emotion_recognition_expression.png)

{{emotional_insight.status.recognition_expression}}

**情绪调节与恢复能力**：

![情绪调节与恢复](extracted_images/emotion_regulation_recovery.png)

{{emotional_insight.status.regulation_recovery}}

**情绪倾向与风险指数**：

![情绪倾向与风险](extracted_images/emotion_tendency_risk.png)

{{emotional_insight.status.tendency_risk}}
```

## Chart Design Specifications

### Visual Style
- **Size**: 6 inches wide × 1.5 inches tall
- **DPI**: 100 (consistent with other charts)
- **Background**: 4-section gradient bar
  - Section 1 (0-25): Dark green (#6B8E23)
  - Section 2 (25-50): Medium green (#8FBC8F)
  - Section 3 (50-75): Light green (#90EE90)
  - Section 4 (75-100): Very light green (#E0F0E0)
- **Indicator**: Red dot (12pt) at score position
- **Labels**: Positioned at center of each section (12.5, 37.5, 62.5, 87.5)

### Label Meanings

#### 情绪识别、表达能力
- 准确 (0-25): Accurate recognition and expression
- 清晰 (25-50): Clear recognition and expression
- 基础 (50-75): Basic recognition and expression
- 初步 (75-100): Initial/developing recognition and expression

#### 情绪调节和恢复能力
- 迅速 (0-25): Rapid regulation and recovery
- 较快 (25-50): Relatively fast regulation and recovery
- 一般 (50-75): Average regulation and recovery
- 需要多些时间 (75-100): Needs more time for regulation and recovery

#### 情绪倾向与风险指数
- 稳定 (0-25): Stable emotional patterns
- 适度 (25-50): Moderate emotional patterns
- 敏感 (50-75): Sensitive emotional patterns
- 焦虑 (75-100): Anxious emotional patterns

## Data Flow

1. **Questionnaire Completion**: User answers questions assigned to 2.1.1, 2.1.2, 2.1.3
2. **Scoring**: `questionnaire_scoring.py` calculates scores for each sub-category
3. **Storage**: Scores stored in `assessment.sub_dimension_scores` under category_scores
4. **Chart Generation**: `psychology_report_routes.py` retrieves scores and generates three charts
5. **Template Rendering**: Jinja2 template includes three separate images
6. **DOCX Generation**: `docx_generator.py` embeds all three charts in document

## File Locations

Generated charts are saved to:
```
reports/charts/report_{report_id}/
├── radar_chart.png
├── perspective_bar_chart.png
├── relational_rating_scale.png
├── growth_bar_chart.png
├── emotion_recognition_expression.png  # NEW
├── emotion_regulation_recovery.png     # NEW
└── emotion_tendency_risk.png           # NEW
```

## Testing Recommendations

1. **Chart Generation**:
   - Test with various score values (0, 25, 50, 75, 100)
   - Verify red dot appears at correct position
   - Check gradient colors display correctly
   - Ensure Chinese labels render properly

2. **Integration Testing**:
   - Generate complete report with all charts
   - Verify three emotional awareness charts appear in correct sections
   - Check DOCX document includes all three images
   - Verify image sizing is appropriate (not too large)

3. **Score Validation**:
   - Verify scores from 2.1.1, 2.1.2, 2.1.3 are correctly retrieved
   - Test with missing scores (should default to 50)
   - Check score ranges are valid (0-100)

4. **Visual Quality**:
   - Ensure charts are readable at document size
   - Verify gradient transitions are smooth
   - Check red dot is clearly visible
   - Confirm labels are properly aligned

## Known Considerations

1. **Score Interpretation**: Lower scores are better for some dimensions (e.g., 2.1.3 risk), but the chart design is neutral
2. **Default Values**: If sub-category scores are missing, defaults to 50 (middle of scale)
3. **Label Positioning**: Labels are centered in each 25-point section for clarity
4. **Font Handling**: Uses same Chinese font detection as other charts

## Related Files

- `ai-chat-api/src/resources/drawing_utils.py` - Chart generation functions
- `ai-chat-api/src/api/psychology_report_routes.py` - Report generation workflow
- `ai-chat-api/src/resources/ZeneMe - 内视觉察专业报告.md` - Report template
- `docs/features/inner-quick-test/EMOTIONAL_AWARENESS_SUBCATEGORIES.md` - Sub-category structure
- `docs/features/inner-quick-test/CHART_FIXES_COMPLETE.md` - Previous chart improvements

## Next Steps

1. Test chart generation with real questionnaire data
2. Verify all three charts display correctly in DOCX
3. Review chart design with UX team for visual consistency
4. Consider adding tooltips or legends if needed
5. Validate that score ranges align with psychological interpretations
