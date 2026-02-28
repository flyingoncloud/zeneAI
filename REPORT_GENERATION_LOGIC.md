# Report Generation Logic Implementation

## Overview

Implemented dual-path report generation system with two distinct triggers:

1. **Simple Report (Conversation-based)**: Generated when conversation contains IFS data (category 2.2.1)
2. **Advanced Report (Questionnaire-based)**: Generated when questionnaire is fully completed

---

## Backend Implementation

### File: `ai-chat-api/src/api/chat_service.py`

Added IFS data detection in the `get_ai_response()` function (around line 500):

```python
# Check if conversation has IFS data (category 2.2.1) for simple report generation
# This is separate from questionnaire completion
has_ifs_data = False
if progress and progress.category_scores:
    # Check if any category starting with 2.2.1 has data
    ifs_categories = {k: v for k, v in progress.category_scores.items() if k.startswith('2.2.1')}
    if ifs_categories:
        has_ifs_data = True
        logger.info(f"✓ IFS data detected in conversation: {ifs_categories}")
    else:
        logger.info("✗ No IFS (2.2.1) data in conversation")

# Store IFS data detection in module_status for frontend
if "conversation_data" not in module_status:
    module_status["conversation_data"] = {}
module_status["conversation_data"]["has_ifs_data"] = has_ifs_data
```

**What it does:**
- Queries `UserQuestionnaireProgress` table for the user
- Checks `category_scores` JSON field for any keys starting with "2.2.1"
- Sets `has_ifs_data` flag in `module_status["conversation_data"]`
- Returns this status to frontend in every chat response

---

## Frontend Implementation

### File: `zeneme-next/src/components/features/chat/ChatInterface.tsx`

Updated report button logic (around line 518):

```typescript
// Two paths for report generation:
// 1. Simple Report: Conversation has IFS data (category 2.2.1) detected
// 2. Advanced Report: Questionnaire (quick_assessment) completed

const hasIFSData = !!moduleStatus?.['conversation_data']?.has_ifs_data;
const isQuestionnaireCompleted = !!moduleStatus?.['quick_assessment']?.completed_at;

// Show report button if either condition is met
const isReadyForReport = hasIFSData || isQuestionnaireCompleted;

// Determine report type for UI messaging
const reportType = isQuestionnaireCompleted ? 'advanced' : 'simple';
```

**UI Updates:**

Before report ready:
- Chinese: "继续对话或完成内视快测以生成报告"
- English: "Continue conversation or complete Quick Test to generate report"

After report ready:
- Advanced (questionnaire completed):
  - Chinese: "深度报告就绪"
  - English: "Advanced Report Ready"
- Simple (IFS data detected):
  - Chinese: "基础报告就绪"
  - English: "Basic Report Ready"

---

## Category 2.2.1 - IFS Assessment

**Category Hierarchy:**
```
2.2.1 - 自我内在系统评估量表 (Internal Family Systems Assessment)
  2.2.1.1 - Managers (管理者)
  2.2.1.2 - Firefighters (消防员)
  2.2.1.3 - Exiles (流放者)
  2.2.1.4 - Self (自我)
```

**Detection Logic:**
- Backend checks if `category_scores` contains any key starting with "2.2.1"
- Examples: "2.2.1", "2.2.1.1", "2.2.1.2", "2.2.1.3", "2.2.1.4"
- If any of these categories have scores, `has_ifs_data = True`

---

## Report Generation Flow

### Path 1: Simple Report (Conversation-based)

1. User has conversation with AI
2. AI detects IFS-related topics and asks relevant questions
3. User answers questions that map to category 2.2.1
4. Backend detects IFS data in `category_scores`
5. Frontend shows "基础报告就绪" (Basic Report Ready)
6. User clicks "生成报告" → Generates simple report in chat interface

### Path 2: Advanced Report (Questionnaire-based)

1. User completes full questionnaire (79/79 questions)
2. Backend sets `status = 'completed'` and `completed_at` timestamp
3. Frontend shows "深度报告就绪" (Advanced Report Ready)
4. User clicks "生成报告" → **Navigates to test view (same as 内视快测)**
5. Test view displays the completed questionnaire report

---

## Data Structure

### module_status (returned in chat API response)

```json
{
  "conversation_data": {
    "has_ifs_data": true  // NEW: IFS data detection flag
  },
  "quick_assessment": {
    "completed_at": "2026-02-28T03:21:37.444483",  // Questionnaire completion
    "recommended_at": "2026-02-28T02:15:00.000000"
  },
  "emotional_first_aid": { ... },
  "inner_doodling": { ... }
}
```

### UserQuestionnaireProgress.category_scores

```json
{
  "2.1": 45,           // Emotional Regulation
  "2.2.1": 32,         // IFS Assessment (triggers has_ifs_data)
  "2.2.1.1": 8,        // Managers
  "2.2.1.2": 12,       // Firefighters
  "2.2.1.3": 7,        // Exiles
  "2.2.1.4": 5,        // Self
  "2.3": 28,           // Relationship Sensitivity
  "2.4": 19,           // Internal Conflict
  "2.5": 22            // Growth Potential
}
```

---

## Testing Checklist

- [ ] User has conversation without questionnaire → IFS data detected → Simple report button shows
- [ ] User completes questionnaire → Advanced report button shows
- [ ] User has conversation with IFS data + completes questionnaire → Shows "Advanced Report Ready"
- [ ] User has conversation without IFS data → No report button
- [ ] Report button shows correct label (基础/深度) based on data type

---

## Next Steps (Optional Enhancements)

1. **Backend Report API**: Update report generation endpoint to handle both report types
2. **Report Content**: Differentiate simple vs advanced report content
3. **UI Polish**: Add tooltip explaining difference between report types
4. **Analytics**: Track which path users take more often

---

## Files Modified

1. `ai-chat-api/src/api/chat_service.py` - Added IFS data detection
2. `zeneme-next/src/components/features/chat/ChatInterface.tsx` - Updated report button logic

---

## Commit Message

```
feat: implement dual-path report generation

- Add IFS data detection (category 2.2.1) in conversation
- Show simple report button when IFS data detected
- Show advanced report button when questionnaire completed
- Update UI labels to distinguish report types
- Backend returns has_ifs_data flag in module_status
```
