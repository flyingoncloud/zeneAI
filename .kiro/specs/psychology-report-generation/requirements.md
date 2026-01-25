# Requirements: Psychology Report Generation System

## Overview

The Psychology Report Generation System automatically creates comprehensive psychological assessment reports for users who have completed psychology questionnaires. The system analyzes assessment data, identifies dominant psychological patterns, generates AI-powered insights, and produces professional reports in both Markdown and DOCX formats.

## User Stories

### US-1: Report Generation Request
**As a** user who has completed a psychology assessment
**I want to** request a comprehensive psychology report
**So that** I can understand my psychological profile and patterns

**Acceptance Criteria:**
- 1.1: System identifies the dominant IFS (Internal Family Systems) part with highest confidence score
- 1.2: System identifies the dominant cognitive pattern with highest detection count
- 1.3: System identifies the dominant narrative identity with highest score
- 1.4: System handles cases where no dominant elements are detected
- 1.5: System updates psychology_assessments table with identified dominant element IDs

### US-2: AI-Powered Analysis Generation
**As a** user receiving a psychology report
**I want to** receive natural language analysis of my psychological patterns
**So that** I can understand the implications and impacts in everyday language

**Acceptance Criteria:**
- 2.1: System generates 150-200 character impact analysis for dominant IFS part
- 2.2: System generates 150-200 character impact analysis for dominant cognitive pattern
- 2.3: System generates 150-200 character summary for dominant narrative
- 2.4: System generates 150-200 character conflict trigger analysis based on attachment style
- 2.5: All AI-generated texts are in Chinese with warm, professional, empathetic tone
- 2.6: System stores all generated analysis texts in analysis_texts table
- 2.7: System uses fallback template text when AI generation fails

### US-3: Personality Style Classification
**As a** user receiving a psychology report
**I want to** understand my overall personality style
**So that** I can see how my different psychological dimensions combine into a coherent pattern

**Acceptance Criteria:**
- 3.1: System classifies personality based on five core dimension scores
- 3.2: System recognizes "Emotion-Dominant Type" (感性驱动型) when relationship_sensitivity > 65 and emotional_regulation < 60
- 3.3: System recognizes "Logic-Dominant Type" (理性驱动型) when cognitive_flexibility > 70 and emotional_regulation < 55
- 3.4: System recognizes "Balanced Type" (平衡型) when all three dimensions (emotional, cognitive, relational) are between 55-70
- 3.5: System recognizes "Growth-Oriented Type" (成长导向型) when growth_potential > 75
- 3.6: System provides default "Complex Type" (复合型) classification when no specific pattern matches
- 3.7: System includes classification basis and reasoning in results

### US-4: Emotional Status Labeling
**As a** user receiving a psychology report
**I want to** see my emotional regulation status in categorical labels
**So that** I can understand my emotional patterns without interpreting numeric scores

**Acceptance Criteria:**
- 4.1: System calculates "Recognition & Expression" label from identification and expression sub-scores
- 4.2: System calculates "Regulation & Recovery" label from reasoning sub-score
- 4.3: System calculates "Tendency & Risk" label from physical_awareness sub-score (inverted)
- 4.4: System maps scores to appropriate Chinese labels (准确/清晰/基础/初步, 迅速/较快/一般/需要多些时间, 稳定/适度/敏感/焦虑)
- 4.8: Recognition & Expression uses thresholds: ≥75=准确, ≥60=清晰, ≥45=基础, <45=初步
- 4.9: Regulation & Recovery uses thresholds: ≥75=迅速, ≥60=较快, ≥45=一般, <45=需要多些时间

### US-5: Perspective Shifting Analysis
**As a** user receiving a psychology report
**I want to** see my perspective shifting ability with visual star rating
**So that** I can quickly understand my cognitive flexibility level

**Acceptance Criteria:**
- 5.1: System extracts perspective shifting questions from questionnaire responses
- 5.2: System calculates four sub-scores: self-other, spatial, cognitive-frame, emotional
- 5.3: System calculates average of four sub-scores
- 5.4: System maps average to summary label (高/中等/低)
- 5.5: System assigns 5 stars when average ≥ 70
- 5.6: System assigns 3 stars when average ≥ 50
- 5.7: System assigns 1 star when average < 50
- 5.8: System includes detailed breakdown of all four sub-scores

### US-6: Attachment Pattern Detection
**As a** user receiving a psychology report
**I want to** see which attachment styles are detected in my profile
**So that** I can understand my relational patterns

**Acceptance Criteria:**
- 6.1: System applies threshold of 12 for attachment style detection
- 6.2: System sets secure_detected = true when secure_score ≥ 12
- 6.3: System sets anxious_detected = true when anxious_score ≥ 12
- 6.4: System sets avoidant_detected = true when avoidant_score ≥ 12
- 6.5: System sets disorganized_detected = true when disorganized_score ≥ 12
- 6.6: System returns boolean flags for all four attachment styles

### US-7: Complete Report Assembly
**As a** user receiving a psychology report
**I want to** receive a complete report with all sections properly formatted
**So that** I have a comprehensive view of my psychological profile

**Acceptance Criteria:**
- 7.1: System assembles report data from all sources (assessments, dominant elements, analysis texts, personality classification)
- 7.2: System includes user_info section with name, gender, age, and report_date
- 7.3: System includes mind_indices section with five core dimension scores
- 7.4: System includes emotional_insight section with score and status labels
- 7.5: System includes cognitive_insight section with flexibility score, inner system, automatic thought, perspective shifting, and narrative structure
- 7.6: System includes relational_insight section with sensitivity score, details, attachment pattern, and conflict triggers
- 7.7: System includes personality_style section with classified type
- 7.8: System includes growth_potential section with total score and breakdown
- 7.9: System validates all required sections are present before returning report

### US-8: Report Generation API
**As a** frontend application
**I want to** request report generation via API
**So that** users can generate reports on demand

**Acceptance Criteria:**
- 8.1: System provides POST /api/psychology/report/generate endpoint
- 8.2: System validates assessment_id exists before processing
- 8.3: System checks assessment completeness is ≥ 70%
- 8.4: System creates psychology_reports record with status "pending"
- 8.5: System processes report generation in background task
- 8.6: System updates report status to "completed" when finished
- 8.7: System returns report_id and status immediately
- 8.8: System accepts ReportGenerationRequest with assessment_id, language, format, include_analysis
- 8.9: System returns ReportGenerationResponse with ok, report_id, status, estimated_completion_time, error

### US-9: Report Status Polling
**As a** frontend application
**I want to** check report generation status
**So that** I can show progress to users and retrieve completed reports

**Acceptance Criteria:**
- 9.1: System provides GET /api/psychology/report/{report_id}/status endpoint
- 9.2: System returns current generation status (pending/processing/completed/failed)
- 9.3: System returns progress percentage (0-100)
- 9.4: System returns estimated time remaining in seconds
- 9.5: System returns report_data when status is "completed"
- 9.6: System returns error message when status is "failed"

### US-10: Analysis Text Generation API
**As a** frontend application
**I want to** generate specific analysis texts without full report
**So that** I can show partial insights to users

**Acceptance Criteria:**
- 10.1: System provides POST /api/psychology/analysis/generate endpoint
- 10.2: System accepts AnalysisGenerationRequest with assessment_id, analysis_types, language
- 10.3: System validates assessment_id exists
- 10.4: System identifies dominant elements
- 10.5: System generates requested analysis types only
- 10.6: System returns AnalysisGenerationResponse with ok, analyses list, error
- 10.7: System stores generated analyses in analysis_texts table

### US-11: Report Download
**As a** user
**I want to** download my psychology report as a DOCX file
**So that** I can save and review it offline

**Acceptance Criteria:**
- 11.1: System provides GET /api/psychology/report/{report_id}/download endpoint
- 11.2: System validates report exists and is completed
- 11.3: System returns DOCX file with appropriate content-type
- 11.4: System generates friendly filename with user name and report ID
- 11.5: System returns 404 error if report not found or file missing
- 11.6: System returns 400 error if report not yet completed

### US-12: Data Validation
**As a** system
**I want to** validate assessment completeness before report generation
**So that** reports are only generated for sufficiently complete assessments

**Acceptance Criteria:**
- 12.1: System verifies all five core dimensions have scores
- 12.2: System verifies confidence scores are present
- 12.3: System verifies at least one detection exists (IFS/cognitive/narrative)
- 12.4: System calculates completion percentage
- 12.5: System returns list of missing components
- 12.6: System rejects report generation if completeness < 70%

### US-13: Error Handling and Logging
**As a** system administrator
**I want to** comprehensive error handling and logging
**So that** I can troubleshoot issues and ensure system reliability

**Acceptance Criteria:**
- 13.1: System catches OpenAI API errors and uses fallback template text
- 13.2: System catches database exceptions and rolls back transactions
- 13.3: System catches all exceptions in background task and updates report status to "failed"
- 13.4: System logs all processing steps with timestamps
- 13.5: System logs AI API calls with token usage
- 13.6: System stores error messages in psychology_reports table when generation fails

### US-14: Performance Optimization
**As a** system
**I want to** optimize report generation performance
**So that** users receive reports quickly

**Acceptance Criteria:**
- 14.1: System batches multiple AI analysis texts in single API call when possible
- 14.2: System uses database joins to minimize query count
- 14.3: System caches frequently accessed data
- 14.4: System uses background tasks for async report generation
- 14.5: System supports concurrent generation for different users
- 14.6: System implements rate limiting and retry logic for AI API calls

## Non-Functional Requirements

### Performance
- Report generation completes within 30-60 seconds
- API endpoints respond within 200ms (excluding background tasks)
- System supports concurrent report generation for multiple users

### Reliability
- System handles AI API failures gracefully with fallback text
- System maintains data consistency with transaction rollbacks
- System logs all errors with sufficient detail for debugging

### Usability
- All user-facing text is in Chinese
- Analysis texts use warm, professional, empathetic tone
- Reports are formatted professionally with clear sections

### Maintainability
- Code is modular with clear separation of concerns
- Each service has single responsibility
- Comprehensive logging for troubleshooting

## Constraints

- Assessment must be at least 70% complete for report generation
- AI-generated texts must be 150-200 characters
- System uses OpenAI API for text generation
- Reports are generated in both Markdown and DOCX formats
- All analysis texts are stored in database for future reference

## Dependencies

- OpenAI API for text generation
- PostgreSQL database for data storage
- FastAPI for API endpoints
- SQLAlchemy for database ORM
- python-docx for DOCX generation
- Matplotlib for chart generation
