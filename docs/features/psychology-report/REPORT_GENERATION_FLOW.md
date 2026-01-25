# Psychology Report Generation - Complete Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  (zeneme-next/src/components/features/tools/InnerQuickTest.tsx)    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ 1. Complete Questionnaires
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    QUESTIONNAIRE SUBMISSION                          │
│         POST /conversations/{id}/questionnaires/submit               │
│                    (ai-chat-api/src/api/app.py)                     │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ 2. Check: All 4 completed?
                         ↓
                    ┌────┴────┐
                    │   YES   │
                    └────┬────┘
                         │ 3. Create PsychologyReport record
                         │    (status: 'pending')
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   BACKGROUND TASK TRIGGERED                          │
│              generate_report_background()                            │
│        (ai-chat-api/src/api/psychology_report_routes.py)            │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ 4. Return report_id to frontend
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND POLLING STARTS                           │
│         GET /api/psychology/report/{id}/status (every 2s)            │
└─────────────────────────────────────────────────────────────────────┘
```

## Detailed Backend Processing Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  BACKGROUND REPORT GENERATION                        │
│                  (30-60 seconds total)                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Step 1: Identify Dominant Elements (2-5s)
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  dominant_elements.py                                                │
│  - Identify dominant IFS part                                        │
│  - Identify dominant cognitive pattern                               │
│  - Identify dominant narrative structure                             │
│  - Identify attachment style                                         │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Step 2: Generate AI Analysis (20-40s)
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  analysis_generator.py                                               │
│  - Generate IFS impact analysis (OpenAI)                             │
│  - Generate cognitive impact analysis (OpenAI)                       │
│  - Generate narrative summary (OpenAI)                               │
│  - Generate conflict triggers analysis (OpenAI)                      │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Step 3: Classify Personality (1-2s)
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  personality_classifier.py                                           │
│  - Analyze dimension scores                                          │
│  - Classify into 6 personality types                                 │
│  - Save to database                                                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Step 4: Assemble Report Data (1-2s)
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  report_assembler.py                                                 │
│  - Combine all data into JSON structure                              │
│  - Format for template rendering                                     │
│  - Include user info, scores, analyses                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Step 5: Generate Charts (2-3s)
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  drawing_utils.py                                                    │
│  - draw_radar_chart() → radar_chart.png                             │
│  - draw_perspective_bar_chart() → perspective_bar_chart.png         │
│  - draw_relational_rating_scale() → relational_rating_scale.png     │
│  - draw_growth_bar_chart() → growth_bar_chart.png                   │
│  Save to: reports/charts/report_{id}/                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Step 6: Generate DOCX (2-5s)
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  docx_generator.py                                                   │
│  1. Render markdown template with Jinja2                             │
│  2. Parse markdown structure                                         │
│  3. Convert to DOCX format:                                          │
│     - Headers → Word headings                                        │
│     - Tables → Word tables                                           │
│     - Lists → Word lists                                             │
│     - Images → Embedded PNG files                                    │
│     - Text → Formatted paragraphs                                    │
│  4. Apply Chinese fonts (SimSun)                                     │
│  5. Save to: reports/generated/psychology_report_{id}.docx          │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Step 7: Update Database
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│  Update psychology_reports table:                                    │
│  - report_data = complete JSON                                       │
│  - file_path = path to DOCX file                                     │
│  - generation_status = 'completed'                                   │
│  - generated_at = current timestamp                                  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ Frontend detects status = 'completed'
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    SHOW DOWNLOAD BUTTON                              │
│         GET /api/psychology/report/{id}/download                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────┐
│  Questionnaire   │
│   Responses      │
│  (4 completed)   │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│              PsychologyAssessment                             │
│  - emotional_regulation_score                                 │
│  - cognitive_flexibility_score                                │
│  - relationship_sensitivity_score                             │
│  - internal_conflict_score                                    │
│  - growth_potential_score                                     │
└────────┬─────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│           Dominant Elements Identification                    │
│  - dominant_ifs_part: "小护士" (Caregiver)                    │
│  - dominant_cognitive_pattern: "非黑即白" (Black/White)       │
│  - dominant_narrative: "英雄型" (Hero)                        │
│  - attachment_style: "焦虑型" (Anxious)                       │
└────────┬─────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│              AI Analysis Generation (OpenAI)                  │
│  - ifs_impact: "你的内在小护士总是..."                        │
│  - cognitive_impact: "你的思维模式倾向于..."                  │
│  - narrative_summary: "你的人生故事呈现出..."                 │
│  - conflict_triggers: "在关系中，你容易被..."                 │
└────────┬─────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│            Personality Classification                         │
│  - personality_type: "完美主义者"                             │
│  - characteristics: [...]                                     │
│  - strengths: [...]                                           │
│  - growth_areas: [...]                                        │
└────────┬─────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│                Report Data Assembly (JSON)                    │
│  {                                                            │
│    "user_info": {...},                                        │
│    "mind_indices": {...},                                     │
│    "emotional_insight": {...},                                │
│    "cognitive_insight": {...},                                │
│    "relational_insight": {...},                               │
│    "personality_style": {...},                                │
│    "growth_potential": {...}                                  │
│  }                                                            │
└────────┬─────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────────────┐
         │                                                      │
         ↓                                                      ↓
┌──────────────────┐                              ┌──────────────────┐
│  Chart Generation│                              │ Markdown Template│
│  (matplotlib)    │                              │  (Jinja2)        │
│                  │                              │                  │
│  - radar_chart   │                              │  - Headers       │
│  - bar_charts    │                              │  - Tables        │
│  - rating_scale  │                              │  - Placeholders  │
│  → PNG files     │                              │  → Rendered MD   │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                  │
         └──────────────────┬───────────────────────────────┘
                            │
                            ↓
                  ┌──────────────────┐
                  │  DOCX Generator  │
                  │  (python-docx)   │
                  │                  │
                  │  - Parse MD      │
                  │  - Convert       │
                  │  - Embed images  │
                  │  - Format        │
                  │  → DOCX file     │
                  └────────┬─────────┘
                           │
                           ↓
                  ┌──────────────────┐
                  │  File Storage    │
                  │  + Database      │
                  │                  │
                  │  file_path saved │
                  │  status updated  │
                  └────────┬─────────┘
                           │
                           ↓
                  ┌──────────────────┐
                  │  User Download   │
                  │  (DOCX file)     │
                  └──────────────────┘
```

## File System Structure

```
ai-chat-api/
├── src/
│   ├── api/
│   │   ├── app.py                              # Questionnaire submission
│   │   └── psychology_report_routes.py         # Report generation & download
│   │
│   ├── services/
│   │   └── psychology/
│   │       ├── dominant_elements.py            # Step 1
│   │       ├── analysis_generator.py           # Step 2
│   │       ├── personality_classifier.py       # Step 3
│   │       ├── report_assembler.py             # Step 4
│   │       └── docx_generator.py               # Step 6 (NEW)
│   │
│   ├── resources/
│   │   ├── ZeneMe - 内视觉察专业报告.md         # Template
│   │   └── drawing_utils.py                    # Step 5
│   │
│   └── reports/                                # Generated files
│       ├── generated/
│       │   └── psychology_report_1.docx        # Final DOCX
│       └── charts/
│           └── report_1/
│               ├── radar_chart.png
│               ├── perspective_bar_chart.png
│               ├── relational_rating_scale.png
│               └── growth_bar_chart.png
│
└── database/
    └── psychology_models.py
        ├── PsychologyAssessment                # Stores scores
        └── PsychologyReport                    # Stores report data & file path
```

## Database Schema

```
psychology_assessments
├── id (PK)
├── user_id
├── conversation_id
├── emotional_regulation_score
├── cognitive_flexibility_score
├── relationship_sensitivity_score
├── internal_conflict_score
├── growth_potential_score
└── completion_percentage

psychology_reports
├── id (PK)
├── user_id
├── assessment_id (FK)
├── report_type
├── language
├── format
├── report_data (JSONB)          ← Complete report JSON
├── file_path (VARCHAR)          ← Path to DOCX file
├── generation_status            ← 'pending', 'processing', 'completed', 'failed'
├── generated_at
└── error_message

assessment_responses
├── id (PK)
├── conversation_id
├── questionnaire_id
├── answers (JSONB)
├── total_score
├── category_scores (JSONB)
└── interpretation
```

## API Endpoints Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Submit Questionnaire                                             │
│     POST /conversations/{id}/questionnaires/submit                   │
│     → Returns: report_id (if all 4 completed)                        │
│                                                                      │
│  2. Check Report Status                                              │
│     GET /api/psychology/report/{id}/status                           │
│     → Returns: status, progress, report_data                         │
│                                                                      │
│  3. Download Report                                                  │
│     GET /api/psychology/report/{id}/download                         │
│     → Returns: DOCX file                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Timeline

```
Time    Event
─────────────────────────────────────────────────────────────────────
0s      User submits 4th questionnaire
        ↓
0s      Backend creates PsychologyReport (status: 'pending')
        ↓
0s      Backend returns report_id to frontend
        ↓
0s      Frontend starts polling every 2 seconds
        ↓
0-5s    Step 1: Identify dominant elements
        ↓
5-45s   Step 2: Generate AI analysis (OpenAI calls)
        ↓
45-47s  Step 3: Classify personality
        ↓
47-49s  Step 4: Assemble report data
        ↓
49-52s  Step 5: Generate charts
        ↓
52-57s  Step 6: Generate DOCX
        ↓
57s     Step 7: Update database (status: 'completed')
        ↓
58s     Frontend detects completion
        ↓
58s     Show download button
        ↓
User clicks download → DOCX file downloads
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ERROR SCENARIOS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Scenario 1: OpenAI API Failure                                     │
│  ├─ Catch exception in analysis_generator.py                        │
│  ├─ Update report status to 'failed'                                │
│  ├─ Save error_message to database                                  │
│  └─ Frontend shows error message                                    │
│                                                                      │
│  Scenario 2: Chart Generation Failure                               │
│  ├─ Catch exception in drawing_utils.py                             │
│  ├─ Log warning                                                      │
│  ├─ Continue with DOCX generation (without charts)                  │
│  └─ DOCX shows placeholder text for missing charts                  │
│                                                                      │
│  Scenario 3: DOCX Generation Failure                                │
│  ├─ Catch exception in docx_generator.py                            │
│  ├─ Update report status to 'failed'                                │
│  ├─ Save error_message to database                                  │
│  └─ Frontend shows error message                                    │
│                                                                      │
│  Scenario 4: File Not Found on Download                             │
│  ├─ Check file_path exists                                          │
│  ├─ Return 404 error                                                │
│  └─ Frontend shows "报告文件未找到"                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

**This diagram shows the complete end-to-end flow from questionnaire completion to DOCX download.**
