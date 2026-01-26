# Tasks: Psychology Report Generation System

## 1. Database Models and Schema

### 1.1 Create PsychologyReport Model
- [ ] Create `PsychologyReport` model in `ai-chat-api/src/database/psychology_models.py`
- [ ] Add fields: id, user_id, assessment_id, report_type, language, format, report_data (JSON), file_path, markdown_path, generation_status, error_message, generated_at, created_at
- [ ] Add relationship to PsychologyAssessment
- [ ] Add indexes on user_id, assessment_id, generation_status

### 1.2 Create PersonalityStyle Model
- [ ] Create `PersonalityStyle` model in `ai-chat-api/src/database/psychology_models.py`
- [ ] Add fields: id, assessment_id, style_type, confidence_score, classification_basis, created_at
- [ ] Add relationship to PsychologyAssessment

### 1.3 Create AnalysisText Model
- [ ] Create `AnalysisText` model in `ai-chat-api/src/database/psychology_models.py`
- [ ] Add fields: id, assessment_id, analysis_type, related_entity_type, related_entity_id, text, language, generation_method, model_version, created_at
- [ ] Add indexes on assessment_id, analysis_type

### 1.4 Create Database Migration
- [ ] Create Alembic migration script for new tables
- [ ] Test migration on development database
- [ ] Verify all relationships and constraints

## 2. Service Layer - Dominant Element Identification

### 2.1 Create dominant_elements.py Service
- [ ] Create `ai-chat-api/src/services/psychology/dominant_elements.py`
- [ ] Implement `identify_dominant_ifs_part(assessment_id)` function
- [ ] Implement `identify_dominant_cognitive_pattern(assessment_id)` function
- [ ] Implement `identify_dominant_narrative(assessment_id)` function
- [ ] Implement `identify_all_dominant_elements(assessment_id)` orchestrator function
- [ ] Add error handling for missing data
- [ ] Add logging for each identification step

### 2.2 Write Unit Tests for Dominant Elements
- [ ] Create `ai-chat-api/tests/unit/test_dominant_elements.py`
- [ ] Test identify_dominant_ifs_part with multiple detections
- [ ] Test identify_dominant_cognitive_pattern with tied counts
- [ ] Test identify_dominant_narrative with all five types
- [ ] Test graceful handling when no elements detected
- [ ] Test database update of dominant element IDs

### 2.3 Write Property-Based Test for Dominant Elements
**Validates: Requirements 1.1, 1.2, 1.3**
- [ ] Create property test in `ai-chat-api/tests/unit/test_dominant_elements_properties.py`
- [ ] Property: Dominant element must have highest metric value
- [ ] Generate random assessments with multiple detections
- [ ] Verify dominant element is always the maximum

## 3. Service Layer - AI Analysis Generation

### 3.1 Create analysis_generator.py Service
- [ ] Create `ai-chat-api/src/services/psychology/analysis_generator.py`
- [ ] Implement `generate_ifs_impact_analysis(ifs_part)` function
- [ ] Implement `generate_cognitive_pattern_impact(pattern)` function
- [ ] Implement `generate_narrative_summary(narrative)` function
- [ ] Implement `generate_conflict_trigger_analysis(attachment_style)` function
- [ ] Implement `generate_all_analysis_texts(assessment_id)` orchestrator
- [ ] Add OpenAI API integration with proper prompts
- [ ] Add fallback template text for each analysis type
- [ ] Add error handling and logging

### 3.2 Create Fallback Templates
- [ ] Create `ai-chat-api/src/services/psychology/analysis_templates.py`
- [ ] Define template for IFS impact analysis
- [ ] Define template for cognitive pattern impact
- [ ] Define template for narrative summary
- [ ] Define template for conflict trigger analysis
- [ ] Ensure all templates are 150-200 characters in Chinese

### 3.3 Write Unit Tests for Analysis Generation
- [ ] Create `ai-chat-api/tests/unit/test_analysis_generator.py`
- [ ] Test each generation function with mocked OpenAI API
- [ ] Test fallback to template text on API failure
- [ ] Test storage of generated texts in database
- [ ] Test character length constraints (150-200)
- [ ] Test Chinese language output

### 3.4 Write Property-Based Test for Analysis Generation
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**
- [ ] Create property test in `ai-chat-api/tests/unit/test_analysis_generator_properties.py`
- [ ] Property: Generated analysis texts must be non-empty
- [ ] Mock OpenAI API to return various responses
- [ ] Verify fallback text is used when API fails

## 4. Service Layer - Personality Classification

### 4.1 Create personality_classifier.py Service
- [ ] Create `ai-chat-api/src/services/psychology/personality_classifier.py`
- [ ] Define PERSONALITY_RULES list with all classification rules
- [ ] Implement `classify_personality(dimension_scores)` function
- [ ] Implement rule matching logic (first-match wins)
- [ ] Add default "Complex Type" classification
- [ ] Store classification in PersonalityStyle table
- [ ] Add logging for classification reasoning

### 4.2 Write Unit Tests for Personality Classification
- [ ] Create `ai-chat-api/tests/unit/test_personality_classifier.py`
- [ ] Test emotion_dominant classification (relationship_sensitivity > 65, emotional_regulation < 60)
- [ ] Test logic_dominant classification (cognitive_flexibility > 70, emotional_regulation < 55)
- [ ] Test balanced classification (all three dimensions 55-70)
- [ ] Test growth_oriented classification (growth_potential > 75)
- [ ] Test default complex classification when no rules match
- [ ] Test boundary values for each rule

### 4.3 Write Property-Based Test for Personality Classification
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
- [ ] Create property test in `ai-chat-api/tests/unit/test_personality_classifier_properties.py`
- [ ] Property: Same scores must produce same classification (determinism)
- [ ] Generate random dimension scores
- [ ] Call classify multiple times and verify identical results

## 5. Service Layer - Status Calculation

### 5.1 Create status_calculator.py Service
- [ ] Create `ai-chat-api/src/services/psychology/status_calculator.py`
- [ ] Implement `calculate_emotional_status_labels(sub_scores)` function
- [ ] Implement `calculate_perspective_shifting_stars(sub_scores)` function
- [ ] Implement `calculate_attachment_boolean_flags(attachment_scores)` function
- [ ] Define threshold constants for each calculation
- [ ] Add Chinese label mappings

### 5.2 Write Unit Tests for Status Calculation
- [ ] Create `ai-chat-api/tests/unit/test_status_calculator.py`
- [ ] Test emotional status label thresholds (75, 60, 45)
- [ ] Test perspective shifting star mapping (≥70=5, ≥50=3, <50=1)
- [ ] Test attachment boolean threshold (≥12=true)
- [ ] Test boundary values for all thresholds
- [ ] Test inverted physical_awareness calculation

### 5.3 Write Property-Based Test for Status Calculation
**Validates: Requirements 4.1, 4.2, 4.3, 4.8, 4.9, 5.5, 5.6, 5.7, 6.2, 6.3, 6.4, 6.5**
- [ ] Create property test in `ai-chat-api/tests/unit/test_status_calculator_properties.py`
- [ ] Property: Higher scores must map to equal or better labels (monotonicity)
- [ ] Generate scores across threshold boundaries
- [ ] Verify label transitions occur at correct thresholds

## 6. Service Layer - Report Assembly

### 6.1 Create report_assembler.py Service
- [ ] Create `ai-chat-api/src/services/psychology/report_assembler.py`
- [ ] Implement `get_user_info_section(assessment)` function
- [ ] Implement `get_mind_indices_section(assessment)` function
- [ ] Implement `get_emotional_insight_section(assessment)` function
- [ ] Implement `get_cognitive_insight_section(assessment)` function
- [ ] Implement `get_relational_insight_section(assessment)` function
- [ ] Implement `get_personality_style_section(assessment)` function
- [ ] Implement `get_growth_potential_section(assessment)` function
- [ ] Implement `assemble_complete_report(assessment_id)` orchestrator
- [ ] Add validation for required sections

### 6.2 Write Unit Tests for Report Assembly
- [ ] Create `ai-chat-api/tests/unit/test_report_assembler.py`
- [ ] Test each section function independently
- [ ] Test complete report assembly
- [ ] Test validation of required sections
- [ ] Test handling of missing data
- [ ] Verify report structure matches report_data.json format

### 6.3 Write Property-Based Test for Report Assembly
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9**
- [ ] Create property test in `ai-chat-api/tests/unit/test_report_assembler_properties.py`
- [ ] Property: Assembled report must contain all required sections
- [ ] Generate random complete assessments
- [ ] Verify all sections present with valid data

## 7. Report Generation - Charts

### 7.1 Create Chart Generation Functions
- [ ] Create `ai-chat-api/src/reports/chart_generator.py`
- [ ] Implement `generate_radar_chart(mind_indices)` function
- [ ] Implement `generate_perspective_bar_chart(perspective_scores)` function
- [ ] Implement `generate_growth_bar_chart(growth_breakdown)` function
- [ ] Implement `generate_relational_rating_scale(attachment_scores)` function
- [ ] Save charts to `reports/charts/report_{id}/` directory
- [ ] Return chart file paths

### 7.2 Write Unit Tests for Chart Generation
- [ ] Create `ai-chat-api/tests/unit/test_chart_generator.py`
- [ ] Test each chart generation function
- [ ] Verify PNG files are created
- [ ] Test with various data ranges
- [ ] Test Chinese font rendering

## 8. Report Generation - Markdown

### 8.1 Create Markdown Generator
- [ ] Create `ai-chat-api/src/reports/markdown_generator.py`
- [ ] Implement `generate_markdown_report(report_data, chart_paths)` function
- [ ] Create markdown template with all sections
- [ ] Add chart image references
- [ ] Format tables and lists properly
- [ ] Save to `reports/generated/psychology_report_{id}.md`

### 8.2 Write Unit Tests for Markdown Generation
- [ ] Create `ai-chat-api/tests/unit/test_markdown_generator.py`
- [ ] Test markdown generation with complete report data
- [ ] Verify markdown syntax is correct
- [ ] Test chart image references
- [ ] Test Chinese character rendering

## 9. Report Generation - DOCX

### 9.1 Create DOCX Generator
- [ ] Create `ai-chat-api/src/reports/docx_generator.py`
- [ ] Implement `generate_docx_from_markdown(markdown_path, report_data)` function
- [ ] Use python-docx library
- [ ] Parse markdown and convert to DOCX formatting
- [ ] Embed chart images
- [ ] Apply Chinese font (SimSun or similar)
- [ ] Save to `reports/generated/psychology_report_{id}.docx`

### 9.2 Write Unit Tests for DOCX Generation
- [ ] Create `ai-chat-api/tests/unit/test_docx_generator.py`
- [ ] Test DOCX generation from markdown
- [ ] Verify DOCX file is created and valid
- [ ] Test image embedding
- [ ] Test Chinese font rendering

## 10. API Endpoints

### 10.1 Create Report Generation Endpoint
- [ ] Create POST `/api/psychology/report/generate` endpoint in `psychology_report_routes.py`
- [ ] Define `ReportGenerationRequest` Pydantic model
- [ ] Define `ReportGenerationResponse` Pydantic model
- [ ] Validate assessment_id exists
- [ ] Check assessment completeness ≥ 70%
- [ ] Create PsychologyReport record with status "pending"
- [ ] Start background task for report generation
- [ ] Return report_id and status immediately

### 10.2 Create Report Status Endpoint
- [ ] Create GET `/api/psychology/report/{report_id}/status` endpoint
- [ ] Query PsychologyReport by report_id
- [ ] Return status, progress, estimated_time_remaining
- [ ] Return report_data when status is "completed"
- [ ] Return error_message when status is "failed"

### 10.3 Create Analysis Generation Endpoint
- [ ] Create POST `/api/psychology/analysis/generate` endpoint
- [ ] Define `AnalysisGenerationRequest` Pydantic model
- [ ] Define `AnalysisGenerationResponse` Pydantic model
- [ ] Validate assessment_id exists
- [ ] Generate requested analysis types only
- [ ] Store in AnalysisText table
- [ ] Return generated analyses

### 10.4 Create Report Download Endpoint
- [ ] Create GET `/api/psychology/report/{report_id}/download` endpoint
- [ ] Validate report exists and is completed
- [ ] Return DOCX file with appropriate content-type
- [ ] Generate friendly filename with user name and report ID
- [ ] Handle 404 if report not found
- [ ] Handle 400 if report not completed

### 10.5 Write API Integration Tests
- [ ] Create `ai-chat-api/tests/integration/test_report_api.py`
- [ ] Test complete report generation workflow
- [ ] Test status polling
- [ ] Test analysis generation
- [ ] Test report download
- [ ] Test error cases (invalid IDs, incomplete assessments)

## 11. Background Task Processing

### 11.1 Create Report Generation Background Task
- [ ] Create `ai-chat-api/src/services/psychology/report_generator.py`
- [ ] Implement `generate_report_background(report_id)` function
- [ ] Step 1: Identify dominant elements
- [ ] Step 2: Generate AI analysis texts
- [ ] Step 3: Classify personality style
- [ ] Step 4: Assemble report data
- [ ] Step 5: Generate charts
- [ ] Step 6: Generate markdown report
- [ ] Step 7: Generate DOCX report
- [ ] Step 8: Update report status to "completed"
- [ ] Add comprehensive error handling
- [ ] Update status to "failed" on exceptions
- [ ] Log all processing steps

### 11.2 Write Integration Tests for Background Task
- [ ] Create `ai-chat-api/tests/integration/test_report_generation.py`
- [ ] Test complete background task execution
- [ ] Test with real database
- [ ] Verify all files are created
- [ ] Test error handling and rollback
- [ ] Test concurrent generation for multiple users

## 12. Data Validation

### 12.1 Create Assessment Validation Service
- [ ] Create `ai-chat-api/src/services/psychology/assessment_validator.py`
- [ ] Implement `validate_assessment_completeness(assessment_id)` function
- [ ] Check all five core dimensions have scores
- [ ] Check confidence scores are present
- [ ] Check at least one detection exists
- [ ] Calculate completion percentage
- [ ] Return list of missing components
- [ ] Reject if completeness < 70%

### 12.2 Write Unit Tests for Validation
- [ ] Create `ai-chat-api/tests/unit/test_assessment_validator.py`
- [ ] Test with complete assessment (100%)
- [ ] Test with incomplete assessment (< 70%)
- [ ] Test with missing dimensions
- [ ] Test with missing detections
- [ ] Verify error messages are helpful

## 13. Error Handling and Logging

### 13.1 Add Comprehensive Logging
- [ ] Add logging to all service functions
- [ ] Log processing steps with timestamps
- [ ] Log AI API calls with token usage
- [ ] Log database queries
- [ ] Log errors with full stack traces
- [ ] Use structured logging (JSON format)

### 13.2 Add Error Recovery
- [ ] Implement retry logic for AI API calls
- [ ] Implement database transaction rollback
- [ ] Store error messages in database
- [ ] Send error notifications (optional)
- [ ] Add circuit breaker for AI API

### 13.3 Write Tests for Error Handling
- [ ] Create `ai-chat-api/tests/unit/test_error_handling.py`
- [ ] Test OpenAI API failure scenarios
- [ ] Test database exception handling
- [ ] Test transaction rollback
- [ ] Test error message storage
- [ ] Test retry logic

## 14. Performance Optimization

### 14.1 Optimize Database Queries
- [ ] Add database indexes on frequently queried fields
- [ ] Use joins to minimize query count
- [ ] Implement query result caching
- [ ] Use connection pooling
- [ ] Profile slow queries

### 14.2 Optimize AI API Calls
- [ ] Batch multiple analysis texts in single API call
- [ ] Implement rate limiting
- [ ] Add request caching for identical inputs
- [ ] Use streaming for long responses
- [ ] Monitor token usage and costs

### 14.3 Write Performance Tests
- [ ] Create `ai-chat-api/tests/performance/test_report_generation_performance.py`
- [ ] Measure report generation time
- [ ] Test concurrent generation
- [ ] Profile database query performance
- [ ] Profile AI API call latency
- [ ] Verify generation completes within 30-60 seconds

## 15. Documentation and Deployment

### 15.1 Create API Documentation
- [ ] Document all API endpoints with examples
- [ ] Create Postman collection
- [ ] Add OpenAPI/Swagger documentation
- [ ] Document error codes and messages

### 15.2 Create User Guide
- [ ] Write user guide for report generation
- [ ] Add screenshots of reports
- [ ] Document report sections and meanings
- [ ] Create FAQ for common issues

### 15.3 Create Deployment Guide
- [ ] Document database migration steps
- [ ] Document environment variables
- [ ] Document OpenAI API key setup
- [ ] Create deployment checklist
- [ ] Add monitoring and alerting setup

### 15.4 Create Developer Guide
- [ ] Document service architecture
- [ ] Document data models
- [ ] Document testing strategy
- [ ] Add code examples for extending system
- [ ] Document correctness properties

## 16. Property-Based Testing Summary

### 16.1 Write Property Test for Report Generation Idempotency
**Validates: Requirements 8.1-8.9**
- [ ] Create property test in `ai-chat-api/tests/unit/test_report_generation_properties.py`
- [ ] Property: Generating report twice produces equivalent results
- [ ] Generate report twice for same assessment
- [ ] Compare dominant elements (must be identical)
- [ ] Compare personality classification (must be identical)
- [ ] Compare status labels (must be identical)
- [ ] Allow AI text to differ (non-deterministic)

### 16.2 Write Property Test for Perspective Shifting Consistency
**Validates: Requirements 5.1-5.8**
- [ ] Property: Star rating must match summary label
- [ ] Generate scores that map to each summary level
- [ ] Verify star count matches summary (高=5, 中等=3, 低=1)
- [ ] Test boundary values

### 16.3 Write Property Test for Attachment Boolean Threshold
**Validates: Requirements 6.1-6.6**
- [ ] Property: Attachment detected if and only if score ≥ 12
- [ ] Generate scores around threshold (11, 12, 13)
- [ ] Verify boolean flags match threshold logic
- [ ] Test all four attachment styles

## Progress Tracking

- Total Tasks: 16 major sections
- Completed: 0
- In Progress: 0
- Not Started: 16

## Notes

- All property-based tests should use Hypothesis library
- All tests should use pytest framework
- Database tests should use test database with sample data
- AI API tests should mock OpenAI responses
- Follow existing code style and conventions in the project
