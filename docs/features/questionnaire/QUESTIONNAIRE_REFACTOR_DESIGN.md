# Questionnaire System Refactoring - Design Document

## Overview
Complete refactoring of the questionnaire system to support:
1. **Category-based scoring** (5 psychological dimensions)
2. **Progressive questionnaire completion** with state persistence
3. **Automatic report generation** on completion
4. **Two-tier report system** (simple UI + advanced downloadable)

---

## Key Principle: Template vs Category

**CRITICAL DISTINCTION:**
- **Template (F1-F8)** = UI display format (how the question looks)
- **Category** = Psychological dimension being measured (what it measures)

**Examples:**
- Question 1: Template=F3 (image+choice), Category="情绪识别能力"
- Question 2: Template=F1 (Likert), Category="情绪识别能力"
- Question 7: Template=F1 (Likert), Category="认知重构能力"

→ Same template can measure different categories!
→ Different templates can measure the same category!

---

## 1. Database Schema

### 1.1 Questions Table - Category Field
```sql
-- Category column already exists, just needs to be populated
-- via Admin Panel when creating/editing questions

SELECT
  question_number,
  template,      -- F1-F8 (UI format)
  category,      -- 5 dimensions (what it measures)
  text,
  options
FROM assessment_questions;

-- 5 Categories:
-- 1. 情绪识别能力 (Emotion Recognition)
-- 2. 认知重构能力 (Cognitive Restructuring)
-- 3. 内在对话能力 (Internal Dialogue)
-- 4. 关系互动能力 (Relational Interaction)
-- 5. 情绪调节能力 (Emotion Regulation)
```

### 1.2 User Questionnaire Progress Table (NEW)
```sql
CREATE TABLE user_questionnaire_progress (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    conversation_id INTEGER REFERENCES conversations(id),
    questionnaire_id VARCHAR(50) DEFAULT 'admin_created',

    -- Progress tracking
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER,
    answers JSONB DEFAULT '{}',  -- {question_id: answer_value}
    category_scores JSONB DEFAULT '{}',  -- {category: score}

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

### 1.3 Reports Table - Simple Report Data
```sql
ALTER TABLE psychology_reports
ADD COLUMN simple_report_data JSONB;

-- Structure:
{
  "category_scores": {
    "情绪识别能力": 75,
    "认知重构能力": 68,
    "内在对话能力": 82,
    "关系互动能力": 71,
    "情绪调节能力": 79
  },
  "radar_chart_url": "/charts/report_1/radar_chart.png",
  "total_score": 375,
  "completion_date": "2026-02-08"
}
```

---

## 2. Admin Panel - Category Assignment

### 2.1 Question Editor UI
```tsx
// Admin Panel - QuestionEditor.tsx
<FormField label="题目模板 (Template)">
  <Select value={question.template} onChange={handleTemplateChange}>
    <option value="F1">F1 - Likert Scale (5点量表)</option>
    <option value="F2">F2 - Single Choice (单选题)</option>
    <option value="F3">F3 - Single Choice + Image (图片+单选)</option>
    <option value="F4">F4 - Image Cards (图片卡片)</option>
    <option value="F5">F5 - Image Grid (图片网格)</option>
    <option value="F6">F6 - Ranking (排序题)</option>
    <option value="F7">F7 - TBD</option>
    <option value="F8">F8 - Video + Choice (视频+单选)</option>
  </Select>
</FormField>

<FormField label="心理维度 (Category)">
  <Select value={question.category} onChange={handleCategoryChange}>
    <option value="情绪识别能力">情绪识别能力 (Emotion Recognition)</option>
    <option value="认知重构能力">认知重构能力 (Cognitive Restructuring)</option>
    <option value="内在对话能力">内在对话能力 (Internal Dialogue)</option>
    <option value="关系互动能力">关系互动能力 (Relational Interaction)</option>
    <option value="情绪调节能力">情绪调节能力 (Emotion Regulation)</option>
  </Select>
</FormField>
```

---

## 3. Backend Implementation

### 3.1 Progress Tracking Service
```python
class QuestionnaireProgressService:

    def start_or_resume(self, user_id, session_id, conversation_id):
        """Start new or resume existing questionnaire"""
        progress = db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.status == 'in_progress'
        ).first()

        if not progress:
            questions = db.query(Question).filter(
                Question.questionnaire_id == 'admin_created',
                Question.status == 'published'
            ).order_by(Question.question_number).all()

            progress = UserProgress(
                user_id=user_id,
                session_id=session_id,
                conversation_id=conversation_id,
                total_questions=len(questions)
            )
            db.add(progress)
            db.commit()

        return progress

    def save_answer(self, progress_id, question_id, answer_value):
        """Save answer and update category score"""
        progress = db.query(UserProgress).get(progress_id)
        question = db.query(Question).get(question_id)

        # Update answers
        answers = progress.answers or {}
        answers[str(question_id)] = answer_value
        progress.answers = answers

        # Update category scores
        category = question.category
        category_scores = progress.category_scores or {}
        category_scores[category] = category_scores.get(category, 0) + answer_value
        progress.category_scores = category_scores

        # Update progress
        progress.current_question_index += 1
        progress.last_updated_at = datetime.now()

        # Check completion
        if progress.current_question_index >= progress.total_questions:
            progress.status = 'completed'
            progress.completed_at = datetime.now()
            report_id = self.generate_report(progress)
            progress.report_id = report_id

        db.commit()
        return progress
```

### 3.2 Report Generation
```python
def generate_report(progress):
    """Generate simple + advanced reports"""
    # Create report
    report = PsychologyReport(
        conversation_id=progress.conversation_id,
        generation_status='pending'
    )
    db.add(report)
    db.commit()

    # Generate simple report (sync)
    simple_data = {
        "category_scores": progress.category_scores,
        "total_score": sum(progress.category_scores.values()),
        "completion_date": progress.completed_at.isoformat(),
        "radar_chart_url": f"/charts/report_{report.id}/radar_chart.png"
    }
    report.simple_report_data = simple_data
    db.commit()

    # Generate advanced report (async)
    background_tasks.add_task(
        generate_advanced_report,
        report.id,
        progress.category_scores
    )

    return report.id
```

---

## 4. API Endpoints

### 4.1 Start/Resume
```
POST /api/questionnaire/start
Request: {user_id, session_id, conversation_id}
Response: {progress_id, current_question_index, answers, questions}
```

### 4.2 Save Answer
```
POST /api/questionnaire/answer
Request: {progress_id, question_id, answer_value}
Response: {ok, current_question_index, category_scores, is_completed, report_id}
```

### 4.3 Get Simple Report
```
GET /api/report/{report_id}/simple
Response: {category_scores, radar_chart_url, dimension_details, total_score}
```

### 4.4 Download Report
```
GET /api/report/{report_id}/download?format=docx
GET /api/report/{report_id}/download?format=markdown
```

---

## 5. Frontend Implementation

### 5.1 Auto-save on Answer
```typescript
const handleAnswer = async (questionId: number, value: number) => {
  const result = await saveQuestionnaireAnswer({
    progress_id: progressId,
    question_id: questionId,
    answer_value: value
  });

  if (result.is_completed) {
    setReportId(result.report_id);
    setView('result');
  } else {
    setCurrentQuestionIndex(prev => prev + 1);
  }
};
```

### 5.2 Display Report from Backend
```typescript
<img src={`${API_BASE_URL}${simpleReport.radar_chart_url}`} />

{simpleReport.dimension_details.map(dim => (
  <div key={dim.name}>
    <h3>{dim.name}: {dim.score}</h3>
    <p>{dim.description}</p>
  </div>
))}

<Button onClick={() => downloadReport(reportId, 'docx')}>
  下载完整报告
</Button>
```

---

## Status: DESIGN PHASE - READY FOR IMPLEMENTATION
