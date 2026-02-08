# Questionnaire Refactoring Progress - 2026-02-08

## Overview
This document tracks the progress of the questionnaire system refactoring to support category-based scoring, progress tracking, and state persistence.

---

## ✅ Phase 1: Report UI Enhancement - COMPLETE

### Completed
- [x] Add reportData state to store complete report data
- [x] Fetch report_data when status becomes 'completed'
- [x] Display radar chart image from backend URL
- [x] Show 5 dimension scores with descriptions
- [x] Add comprehensive report view with download button
- [x] Implement two-stage success flow
- [x] Add error handling for image loading
- [x] Create documentation

**Status**: ✅ COMPLETE
**Files Modified**: 1 file (`InnerQuickTest.tsx`)
**Documentation**: `REPORT_UI_ENHANCEMENT_COMPLETE.md`

---

## 🚧 Phase 2: Database & Backend - IN PROGRESS

### Completed
- [x] Create database migration script (`add_progress_tracking.py`)
- [x] Run migration to create `user_questionnaire_progress` table
- [x] Add `simple_report_data` column to `psychology_reports`
- [x] Create `UserQuestionnaireProgress` model (`progress_models.py`)
- [x] Add relationships to `Conversation` and `PsychologyReport` models
- [x] Create `QuestionnaireProgressService` with methods:
  - [x] `start_or_resume()` - Start new or resume existing questionnaire
  - [x] `save_answer()` - Save answer and update progress
  - [x] `_generate_report()` - Generate report on completion
  - [x] `get_progress()` - Get current progress
  - [x] `abandon_progress()` - Mark as abandoned

### Remaining
- [ ] Add API endpoints to `app.py`:
  - [ ] `POST /api/questionnaire/start` - Start/resume questionnaire
  - [ ] `POST /api/questionnaire/answer` - Save answer
  - [ ] `GET /api/questionnaire/progress/{user_id}` - Get progress
- [ ] Update existing `/api/questionnaire/response` endpoint to use progress tracking
- [ ] Add category field to Admin Panel question editor
- [ ] Implement simple report generation (synchronous)
- [ ] Test backend with Postman/curl

**Status**: 🚧 50% COMPLETE
**Files Created**: 3 files
**Files Modified**: 2 files

---

## ⏳ Phase 3: Frontend Integration - NOT STARTED

### To Do
- [ ] Update `InnerQuickTest.tsx` to use progress tracking:
  - [ ] Call `/api/questionnaire/start` on component mount
  - [ ] Auto-save answers with `/api/questionnaire/answer`
  - [ ] Remove manual submission logic
  - [ ] Add resume functionality
  - [ ] Show progress indicator
- [ ] Update `QuestionEditor.tsx` to add category dropdown:
  - [ ] Add category field to form
  - [ ] Update save API call
  - [ ] Show category in questions list
- [ ] Test full flow:
  - [ ] Start questionnaire
  - [ ] Answer questions (auto-save)
  - [ ] Close and resume
  - [ ] Complete and generate report

**Status**: ⏳ NOT STARTED
**Estimated Time**: 2-3 hours

---

## 📊 Database Schema

### New Table: `user_questionnaire_progress`
```sql
CREATE TABLE user_questionnaire_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
    conversation_id INTEGER REFERENCES conversations(id),
    questionnaire_id VARCHAR(50) DEFAULT 'admin_created',

    -- Progress tracking
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER NOT NULL,
    answers JSONB DEFAULT '{}',
    category_scores JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(20) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,

    -- Report reference
    report_id INTEGER REFERENCES psychology_reports(id),

    UNIQUE(user_id, questionnaire_id)
);
```

### Modified Table: `psychology_reports`
```sql
ALTER TABLE psychology_reports
ADD COLUMN simple_report_data JSONB;
```

---

## 🔧 Service Layer

### QuestionnaireProgressService

**Methods**:
1. `start_or_resume(user_id, session_id, conversation_id, questionnaire_id, db)`
   - Checks for existing in-progress questionnaire
   - Creates new progress record if none exists
   - Returns progress record and questions list

2. `save_answer(progress_id, question_id, answer_value, db)`
   - Saves answer to progress.answers
   - Updates category scores based on question.category
   - Increments current_question_index
   - Checks for completion
   - Generates report if completed

3. `_generate_report(progress, db)`
   - Creates/updates PsychologyAssessment
   - Creates PsychologyReport with status 'pending'
   - Returns report_id

4. `get_progress(user_id, questionnaire_id, db)`
   - Retrieves current progress record

5. `abandon_progress(progress_id, db)`
   - Marks progress as 'abandoned'

---

## 🎯 Next Steps (Priority Order)

### 1. Add API Endpoints (1 hour)
**File**: `ai-chat-api/src/api/app.py`

```python
@app.post("/api/questionnaire/start")
def start_questionnaire(
    request: StartQuestionnaireRequest,
    db: Session = Depends(get_db)
):
    """Start or resume questionnaire"""
    progress, questions = QuestionnaireProgressService.start_or_resume(
        user_id=request.user_id,
        session_id=request.session_id,
        conversation_id=request.conversation_id,
        questionnaire_id=request.questionnaire_id or 'admin_created',
        db=db
    )

    return {
        'ok': True,
        'progress': progress.to_dict(),
        'questions': [q.to_dict() for q in questions]
    }

@app.post("/api/questionnaire/answer")
def save_questionnaire_answer(
    request: SaveAnswerRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Save answer and update progress"""
    result = QuestionnaireProgressService.save_answer(
        progress_id=request.progress_id,
        question_id=request.question_id,
        answer_value=request.answer_value,
        db=db
    )

    # If completed, trigger background report generation
    if result['is_completed'] and result.get('report_id'):
        background_tasks.add_task(
            generate_report_background,
            report_id=result['report_id'],
            # ... other params
        )

    return result
```

### 2. Add Category Field to Admin Panel (30 min)
**File**: `zeneme-next/src/components/admin/QuestionEditor.tsx`

Add dropdown:
```tsx
<FormField label="心理维度 (Category)">
  <Select value={question.category} onChange={handleCategoryChange}>
    <option value="情绪识别能力">情绪识别能力</option>
    <option value="认知重构能力">认知重构能力</option>
    <option value="内在对话能力">内在对话能力</option>
    <option value="关系互动能力">关系互动能力</option>
    <option value="情绪调节能力">情绪调节能力</option>
  </Select>
</FormField>
```

### 3. Update Frontend to Use Progress Tracking (1-2 hours)
**File**: `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`

Changes:
- Call `/api/questionnaire/start` on mount
- Auto-save each answer with `/api/questionnaire/answer`
- Remove manual submission
- Add resume functionality
- Show progress from backend

### 4. Testing (30 min)
- Test start/resume flow
- Test auto-save
- Test completion and report generation
- Test category-based scoring
- Test error handling

---

## 📝 Implementation Notes

### Category Mapping
**CRITICAL**: Categories are assigned per question in Admin Panel, NOT based on template type!

**5 Categories**:
1. 情绪识别能力 (Emotion Recognition)
2. 认知重构能力 (Cognitive Restructuring)
3. 内在对话能力 (Internal Dialogue)
4. 关系互动能力 (Relational Interaction)
5. 情绪调节能力 (Emotion Regulation)

### Template vs Category
- **Template (F1-F8)**: UI display format
- **Category**: Psychological dimension measured
- Same template can measure different categories
- Different templates can measure same category

### Progress Tracking Flow
1. User starts questionnaire → Create progress record
2. User answers question → Auto-save to progress.answers
3. Update category_scores based on question.category
4. Increment current_question_index
5. Check if completed (current_question_index >= total_questions)
6. If completed → Generate report

### Report Generation
- Simple report: Synchronous, stored in simple_report_data
- Advanced report: Asynchronous, generates DOCX with charts
- Both use same PsychologyReport record

---

## 🐛 Known Issues

### None Yet
No issues encountered during Phase 2 implementation.

---

## 📚 Related Documentation

- **Design Document**: `QUESTIONNAIRE_REFACTOR_DESIGN.md`
- **Report UI Enhancement**: `REPORT_UI_ENHANCEMENT_COMPLETE.md`
- **F1 Likert Fix**: `F1_LIKERT_SCALE_FIX.md`
- **Context Transfer**: `../../CONTEXT_TRANSFER_2026-02-08.md`

---

## 📈 Progress Metrics

### Overall Progress
- **Phase 1 (Report UI)**: ✅ 100% complete
- **Phase 2 (Backend)**: 🚧 50% complete
- **Phase 3 (Frontend)**: ⏳ 0% complete
- **Total**: 🚧 50% complete

### Time Estimates
- **Completed**: ~3 hours
- **Remaining**: ~3-4 hours
- **Total**: ~6-7 hours

### Files Created/Modified
- **Created**: 5 files
- **Modified**: 4 files
- **Total**: 9 files

---

## ✅ Completion Checklist

### Phase 1: Report UI
- [x] Report data state management
- [x] Fetch report_data from backend
- [x] Display radar chart
- [x] Display dimension scores
- [x] Download button
- [x] Documentation

### Phase 2: Backend
- [x] Database migration
- [x] Progress model
- [x] Service layer
- [ ] API endpoints
- [ ] Testing

### Phase 3: Frontend
- [ ] Progress tracking integration
- [ ] Auto-save functionality
- [ ] Resume functionality
- [ ] Category field in admin
- [ ] Testing

---

**Last Updated**: 2026-02-08
**Status**: 🚧 IN PROGRESS (50% complete)
**Next Session**: Continue with API endpoints and frontend integration

