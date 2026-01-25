# Design: Psychology Report Generation System

## Architecture Overview

The Psychology Report Generation System follows a modular service-oriented architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  psychology_report_routes.py                                 │
│  - POST /api/psychology/report/generate                      │
│  - GET /api/psychology/report/{id}/status                    │
│  - POST /api/psychology/analysis/generate                    │
│  - GET /api/psychology/report/{id}/download                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ dominant_elements│  │ analysis_generator│                │
│  │  - identify IFS  │  │  - AI text gen   │                │
│  │  - identify cog  │  │  - fallback text │                │
│  │  - identify narr │  │  - store texts   │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │personality_class │  │ status_calculator│                │
│  │  - classify type │  │  - emotional     │                │
│  │  - save to DB    │  │  - perspective   │                │
│  └──────────────────┘  │  - attachment    │                │
│  ┌──────────────────┐  └──────────────────┘                │
│  │ report_assembler │  ┌──────────────────┐                │
│  │  - get sections  │  │ docx_generator   │                │
│  │  - validate data │  │  - generate DOCX │                │
│  │  - assemble      │  │  - charts        │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐                                       │
│  │markdown_generator│                                       │
│  │  - generate MD   │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  - PsychologyAssessment                                      │
│  - PsychologyReport                                          │
│  - IFSPartsDetection                                         │
│  - CognitivePatternsDetection                                │
│  - NarrativeIdentity                                         │
│  - AttachmentStyle                                           │
│  - PersonalityStyle                                          │
│  - AnalysisText                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Dominant Element Identification (`dominant_elements.py`)

**Purpose:** Identify the most prominent psychological characteristics from assessment data.

**Key Functions:**
- `identify_dominant_ifs_part()`: Queries IFS parts ordered by confidence, returns highest
- `identify_dominant_cognitive_pattern()`: Queries cognitive patterns ordered by detection count, returns highest
- `identify_dominant_narrative()`: Queries narratives, calculates highest score from five types
- `identify_all_dominant_elements()`: Orchestrates all three identifications and updates assessment

**Data Flow:**
```
Assessment ID → Query Detections → Order by Metric → Return Highest → Update Assessment
```

**Design Decisions:**
- Use database ordering for efficiency (ORDER BY confidence_score DESC)
- Return None when no elements detected (graceful degradation)
- Update psychology_assessments table with dominant IDs for quick access
- Include metadata (confidence, scores) in return values for transparency

### 2. AI Analysis Generation (`analysis_generator.py`)

**Purpose:** Generate natural language analysis texts using OpenAI API with fallback templates.

**Key Functions:**
- `generate_ifs_impact_analysis()`: 150-200 char impact analysis for IFS part
- `generate_cognitive_pattern_impact()`: 150-200 char impact analysis for cognitive pattern
- `generate_narrative_summary()`: 150-200 char summary for narrative
- `generate_conflict_trigger_analysis()`: 150-200 char analysis for attachment-based triggers
- `generate_all_analysis_texts()`: Orchestrates all four generations and stores in DB

**Prompt Engineering:**
- System role: "专业、温和、富有同理心的心理咨询师"
- Temperature: 0.7 (balanced creativity and consistency)
- Max tokens: 300 (ensures 150-200 character output)
- Structured prompts with evidence sections

**Error Handling:**
- Try-catch around OpenAI API calls
- Fallback to template text on any exception
- Log errors with full context
- Continue processing (don't fail entire report)

**Design Decisions:**
- Store all generated texts in analysis_texts table for audit trail
- Include model version and generation method in database
- Use fallback templates that maintain professional tone
- Generate texts independently (failure of one doesn't affect others)

### 3. Personality Classification (`personality_classifier.py`)

**Purpose:** Classify personality style based on dimension score patterns.

**Classification Rules:**
```python
PERSONALITY_RULES = [
    {
        'style_type': 'emotion_dominant',
        'condition': lambda scores: (
            scores['relationship_sensitivity'] > 65 and
            scores['emotional_regulation'] < 60
        ),
        'confidence': 0.85
    },
    {
        'style_type': 'logic_dominant',
        'condition': lambda scores: (
            scores['cognitive_flexibility'] > 70 and
            scores['emotional_regulation'] < 55
        ),
        'confidence': 0.82
    },
    {
        'style_type': 'balanced',
        'condition': lambda scores: (
            all(55 <= scores[dim] <= 70 for dim in [
                'emotional_regulation',
                'cognitive_flexibility',
                'relationship_sensitivity'
            ])
        ),
        'confidence': 0.78
    },
    # ... more rules
]
```

**Design Decisions:**
- Rule-based classification for transparency and maintainability
- First-match wins (rules ordered by specificity)
- Default "Complex Type" when no rules match
- Include classification basis in results for explainability
- Store confidence scores for each classification

### 4. Status Calculation (`status_calculator.py`)

**Purpose:** Convert numeric scores to categorical labels for better user understanding.

**Emotional Status Labels:**
```
Recognition & Expression = avg(identification, expression)
  ≥75: 准确 (Accurate)
  ≥60: 清晰 (Clear)
  ≥45: 基础 (Basic)
  <45: 初步 (Initial)

Regulation & Recovery = reasoning score
  ≥75: 迅速 (Rapid)
  ≥60: 较快 (Fast)
  ≥45: 一般 (Average)
  <45: 需要多些时间 (Needs More Time)

Tendency & Risk = 100 - physical_awareness
  ≤30: 稳定 (Stable)
  ≤50: 适度 (Moderate)
  ≤70: 敏感 (Sensitive)
  >70: 焦虑 (Anxious)
```

**Perspective Shifting Stars:**
```
Average of 4 sub-scores (self-other, spatial, cognitive-frame, emotional)
  ≥70: 高 (High) → 5 stars ⭐⭐⭐⭐⭐
  ≥50: 中等 (Medium) → 3 stars ⭐⭐⭐
  <50: 低 (Low) → 1 star ⭐
```

**Attachment Boolean Flags:**
```
Threshold = 12 (on 3-15 scale)
  secure_detected = secure_score ≥ 12
  anxious_detected = anxious_score ≥ 12
  avoidant_detected = avoidant_score ≥ 12
  disorganized_detected = disorganized_score ≥ 12
```

**Design Decisions:**
- Use clear threshold-based logic for consistency
- Return both numeric scores and categorical labels
- Use Chinese labels that are culturally appropriate
- Calculate derived metrics (averages, inversions) transparently

### 5. Report Assembly (`report_assembler.py`)

**Purpose:** Assemble complete report data from all sources.

**Section Functions:**
- `get_user_info_section()`: User profile data
- `get_mind_indices_section()`: Five core dimension scores
- `get_emotional_insight_section()`: Emotional score + status labels
- `get_cognitive_insight_section()`: Cognitive score + inner system + automatic thought + perspective + narrative
- `get_relational_insight_section()`: Relational score + attachment + conflict triggers
- `get_personality_style_section()`: Classified personality type
- `get_growth_potential_section()`: Growth score + breakdown

**Assembly Process:**
```
1. Query assessment from database
2. Call all section functions in parallel (independent)
3. Combine into complete report structure
4. Validate all required sections present
5. Return report_data dictionary
```

**Design Decisions:**
- Each section function is independent (can be tested separately)
- Validation ensures report completeness before returning
- Structure matches report_data.json format exactly
- Include both raw scores and derived labels/analyses

### 6. Report Generation Workflow

**Background Task Process:**
```
Step 1: Identify dominant elements (3 queries)
Step 2: Generate AI analysis texts (4 API calls)
Step 3: Classify personality style (rule-based)
Step 4: Assemble report data (7 section functions)
Step 5: Generate charts (4 PNG images)
Step 6: Generate Markdown report
Step 7: Generate DOCX report from markdown
Step 8: Update report status to "completed"
```

**Error Handling:**
- Wrap entire background task in try-catch
- Update report status to "failed" on any exception
- Store error message in database
- Log full stack trace for debugging
- Rollback database transaction on failure

**Design Decisions:**
- Use FastAPI BackgroundTasks for async processing
- Return immediately with report_id (don't block API)
- Store intermediate results in database (can resume if needed)
- Generate both Markdown and DOCX (Markdown is source of truth)

## Data Models

### PsychologyReport
```python
{
    'id': int,
    'user_id': str,
    'assessment_id': int,
    'report_type': str,  # 'comprehensive'
    'language': str,  # 'zh'
    'format': str,  # 'json' or 'pdf'
    'report_data': dict,  # Complete report JSON
    'file_path': str,  # Path to DOCX file
    'markdown_path': str,  # Path to Markdown file
    'generation_status': str,  # 'pending', 'processing', 'completed', 'failed'
    'error_message': str,  # Error details if failed
    'generated_at': datetime,
    'created_at': datetime
}
```

### Report Data Structure
```python
{
    'user_info': {
        'name': str,
        'gender': str,
        'age': int,
        'report_date': str  # "2025 年 12 月"
    },
    'mind_indices': {
        'emotional_regulation': int,
        'cognitive_flexibility': int,
        'relational_sensitivity': int,
        'inner_conflict': int,
        'growth_potential': int
    },
    'emotional_insight': {
        'score': int,
        'status': {
            'recognition_expression': str,
            'regulation_recovery': str,
            'tendency_risk': str
        }
    },
    'cognitive_insight': {
        'flexibility_score': int,
        'inner_system': {
            'current_status': str,
            'impact_analysis': str
        },
        'automatic_thought': {
            'pattern': str,
            'impact': str
        },
        'perspective_shifting': {
            'summary': str,
            'stars': str,
            'stars_count': int,
            'details': {
                'self_other': int,
                'spatial': int,
                'cognitive_frame': int,
                'emotional': int
            }
        },
        'narrative_structure': {
            'type': str,
            'summary': str
        }
    },
    'relational_insight': {
        'sensitivity_score': int,
        'details': {
            'relational_triggers': int,
            'empathy_index': int,
            'inner_conflict_level': int
        },
        'attachment_pattern': {
            'anxious': bool,
            'disorganized': bool,
            'secure': bool,
            'avoidant': bool
        },
        'conflict_triggers': {
            'status': str
        }
    },
    'personality_style': {
        'type': str  # "感性驱动型人格（Emotion-Dominant Type）"
    },
    'growth_potential': {
        'total_score': int,
        'insight_depth': int,
        'psychological_plasticity': int,
        'resilience': int
    }
}
```

## API Design

### POST /api/psychology/report/generate

**Request:**
```json
{
    "assessment_id": 123,
    "language": "zh",
    "format": "json",
    "include_analysis": true
}
```

**Response:**
```json
{
    "ok": true,
    "report_id": 456,
    "status": "pending",
    "estimated_completion_time": 30
}
```

### GET /api/psychology/report/{report_id}/status

**Response:**
```json
{
    "ok": true,
    "report_id": 456,
    "status": "completed",
    "progress": 100,
    "current_step": "completed",
    "estimated_time_remaining": null,
    "report_data": { /* complete report data */ }
}
```

### POST /api/psychology/analysis/generate

**Request:**
```json
{
    "assessment_id": 123,
    "analysis_types": ["ifs_impact", "cognitive_impact"],
    "language": "zh"
}
```

**Response:**
```json
{
    "ok": true,
    "analyses": [
        {
            "analysis_type": "ifs_impact",
            "related_entity_type": "ifs_part",
            "related_entity_id": "inner_critic",
            "text": "你的内在系统中，小法官扮演着重要角色..."
        }
    ]
}
```

## Correctness Properties

### Property 1: Dominant Element Consistency
**Statement:** For any assessment with detected elements, the dominant element must be the one with the highest metric value.

**Formal Definition:**
```
∀ assessment_id, element_type:
  dominant = identify_dominant(assessment_id, element_type)
  all_elements = query_all(assessment_id, element_type)
  ⟹ ∀ e ∈ all_elements: metric(dominant) ≥ metric(e)
```

**Test Strategy:**
- Generate assessments with multiple detections
- Verify dominant element has highest confidence/count/score
- Test with tied values (should return first in order)

### Property 2: Status Label Monotonicity
**Statement:** Higher numeric scores must map to equal or better categorical labels.

**Formal Definition:**
```
∀ score1, score2:
  score1 < score2
  ⟹ label_rank(calculate_label(score1)) ≤ label_rank(calculate_label(score2))
```

**Test Strategy:**
- Generate scores across all threshold boundaries
- Verify label transitions occur at correct thresholds
- Test boundary values (74, 75, 76 for top threshold)

### Property 3: Personality Classification Determinism
**Statement:** Same dimension scores must always produce same personality classification.

**Formal Definition:**
```
∀ scores:
  classify(scores) = classify(scores)
  (idempotent)
```

**Test Strategy:**
- Generate random dimension scores
- Call classify multiple times
- Verify identical results

### Property 4: Attachment Boolean Threshold
**Statement:** Attachment style is detected if and only if score meets threshold.

**Formal Definition:**
```
∀ style, score:
  detected(style) ⟺ score(style) ≥ 12
```

**Test Strategy:**
- Generate scores around threshold (11, 12, 13)
- Verify boolean flags match threshold logic
- Test all four attachment styles

### Property 5: Report Data Completeness
**Statement:** Assembled report must contain all required sections with valid data.

**Formal Definition:**
```
∀ report_data:
  valid(report_data) ⟺
    has_section(report_data, 'user_info') ∧
    has_section(report_data, 'mind_indices') ∧
    has_section(report_data, 'emotional_insight') ∧
    has_section(report_data, 'cognitive_insight') ∧
    has_section(report_data, 'relational_insight') ∧
    has_section(report_data, 'personality_style') ∧
    has_section(report_data, 'growth_potential')
```

**Test Strategy:**
- Generate reports with complete assessments
- Verify all sections present
- Verify no null/missing required fields

### Property 6: Analysis Text Non-Empty
**Statement:** Generated analysis texts must be non-empty strings.

**Formal Definition:**
```
∀ analysis_type, dominant_element:
  text = generate_analysis(analysis_type, dominant_element)
  ⟹ len(text) > 0
```

**Test Strategy:**
- Mock OpenAI API to return empty string
- Verify fallback text is used
- Test all four analysis types

### Property 7: Perspective Shifting Star Consistency
**Statement:** Star rating must be consistent with summary label.

**Formal Definition:**
```
∀ summary, stars:
  summary = '高' ⟺ stars = 5
  summary = '中等' ⟺ stars = 3
  summary = '低' ⟺ stars = 1
```

**Test Strategy:**
- Generate scores that map to each summary level
- Verify star count matches summary
- Test boundary values

### Property 8: Report Generation Idempotency
**Statement:** Generating report multiple times for same assessment produces equivalent results (excluding timestamps and AI variations).

**Formal Definition:**
```
∀ assessment_id:
  report1 = generate_report(assessment_id)
  report2 = generate_report(assessment_id)
  ⟹ equivalent(report1, report2)
  where equivalent ignores:
    - timestamps
    - AI-generated text variations
    - report_id
```

**Test Strategy:**
- Generate report twice for same assessment
- Compare dominant elements (should be identical)
- Compare personality classification (should be identical)
- Compare status labels (should be identical)
- Allow AI text to differ (non-deterministic)

## Testing Strategy

### Unit Tests
- Test each service function independently
- Mock database queries and API calls
- Test edge cases (empty data, missing fields, boundary values)
- Test error handling (exceptions, invalid input)

### Property-Based Tests
- Use Hypothesis library for Python
- Generate random valid inputs
- Verify correctness properties hold
- Find counterexamples automatically

### Integration Tests
- Test complete report generation workflow
- Use test database with sample data
- Verify database updates occur correctly
- Test background task execution

### Performance Tests
- Measure report generation time
- Test concurrent generation
- Verify database query efficiency
- Test AI API rate limiting

## Security Considerations

- Validate all user inputs (assessment_id, report_id)
- Use parameterized queries to prevent SQL injection
- Sanitize AI-generated text before storing
- Implement rate limiting on API endpoints
- Log all access attempts for audit trail

## Scalability Considerations

- Use background tasks for async processing
- Support concurrent report generation
- Cache frequently accessed data
- Batch AI API calls when possible
- Use database connection pooling
- Implement queue management for high load

## Monitoring and Observability

- Log all processing steps with timestamps
- Track AI API usage and costs
- Monitor report generation success rate
- Alert on high failure rates
- Track average generation time
- Monitor database query performance
