# Implementation Plan: Psychology Report Generation System

## Overview

This implementation plan breaks down the psychology report generation system into discrete, manageable tasks. Each task builds on previous work and includes testing to ensure correctness.

## Tasks

- [x] 1. Set up project structure and utilities
  - Create `src/services/psychology/` directory
  - Create `__init__.py` files
  - Set up logging configuration for psychology services
  - Create utility functions for database queries
  - _Requirements: All_

- [x] 2. Implement dominant element identification
  - [x] 2.1 Implement `identify_dominant_ifs_part()`
    - Query IFS parts ordered by confidence
    - Return highest confidence part with metadata
    - Handle case when no parts detected
    - _Requirements: 1.1, 1.4_

  - [ ]* 2.2 Write property test for dominant IFS part identification
    - **Property 1: Dominant Element Consistency**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Implement `identify_dominant_cognitive_pattern()`
    - Query cognitive patterns ordered by detection count
    - Return highest count pattern with metadata
    - Handle case when no patterns detected
    - _Requirements: 1.2, 1.4_

  - [ ]* 2.4 Write property test for dominant cognitive pattern identification
    - **Property 1: Dominant Element Consistency**
    - **Validates: Requirements 1.2**

  - [x] 2.5 Implement `identify_dominant_narrative()`
    - Query narratives ordered by score
    - Return highest score narrative with metadata
    - Handle case when no narratives detected
    - _Requirements: 1.3, 1.4_

  - [ ]* 2.6 Write property test for dominant narrative identification
    - **Property 1: Dominant Element Consistency**
    - **Validates: Requirements 1.3**

  - [x] 2.7 Implement `identify_all_dominant_elements()`
    - Call all three identification functions
    - Combine results into single dictionary
    - Update psychology_assessments table with dominant element IDs
    - _Requirements: 1.5_

  - [ ]* 2.8 Write unit tests for dominant element identification
    - Test with multiple detections
    - Test with no detections
    - Test database updates
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement status label calculation
  - [x] 4.1 Implement `calculate_emotional_status_labels()`
    - Calculate recognition & expression label from sub-scores
    - Calculate regulation & recovery label
    - Calculate tendency & risk label
    - Return dictionary with all three labels
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.8, 4.9_

  - [ ]* 4.2 Write property test for status label monotonicity
    - **Property 2: Status Label Monotonicity**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [x] 4.3 Implement `calculate_perspective_shifting_summary()`
    - Extract perspective shifting questions from responses
    - Calculate four sub-scores (self-other, spatial, cognitive-frame, emotional)
    - Calculate average and map to summary label
    - Calculate star rating based on summary
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 4.4 Write property test for perspective shifting star consistency
    - **Property 7: Perspective Shifting Star Consistency**
    - **Validates: Requirements 5.5, 5.6, 5.7**

  - [x] 4.5 Implement `calculate_attachment_boolean_flags()`
    - Apply threshold logic (score >= 12 = true)
    - Return boolean flags for all four attachment styles
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 4.6 Write property test for attachment boolean threshold
    - **Property 4: Attachment Boolean Threshold**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

  - [ ]* 4.7 Write unit tests for status calculation functions
    - Test edge cases (boundary values)
    - Test with missing data
    - Test with invalid data
    - _Requirements: 4.1-4.9, 5.1-5.8, 6.1-6.6_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement personality style classification
  - [x] 6.1 Define personality classification rules
    - Create PERSONALITY_RULES configuration
    - Define conditions for each personality type
    - Define description templates
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Implement `classify_personality_style()`
    - Iterate through classification rules
    - Apply condition functions to dimension scores
    - Return first matching rule or default
    - Include classification basis in result
    - _Requirements: 3.1, 3.6, 3.7_

  - [ ]* 6.3 Write property test for personality classification determinism
    - **Property 3: Personality Classification Determinism**
    - **Validates: Requirements 3.1**

  - [ ]* 6.4 Write unit tests for personality classification
    - Test each personality type condition
    - Test with edge case scores
    - Test default classification
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 7. Implement AI analysis text generation
  - [x] 7.1 Create AI prompt templates
    - Define IFS_IMPACT_PROMPT template
    - Define COGNITIVE_PATTERN_PROMPT template
    - Define NARRATIVE_SUMMARY_PROMPT template
    - Define CONFLICT_TRIGGER_PROMPT template
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 7.2 Implement `generate_ifs_impact_analysis()`
    - Format prompt with IFS part data
    - Call OpenAI API with prompt
    - Parse and return generated text
    - Handle API errors with fallback text
    - _Requirements: 2.1, 2.5, 2.7, 13.1_

  - [x] 7.3 Implement `generate_cognitive_pattern_impact()`
    - Format prompt with cognitive pattern data
    - Call OpenAI API with prompt
    - Parse and return generated text
    - Handle API errors with fallback text
    - _Requirements: 2.2, 2.5, 2.7, 13.1_

  - [x] 7.4 Implement `generate_narrative_summary()`
    - Format prompt with narrative data
    - Call OpenAI API with prompt
    - Parse and return generated text
    - Handle API errors with fallback text
    - _Requirements: 2.3, 2.5, 2.7, 13.1_

  - [x] 7.5 Implement `generate_conflict_trigger_analysis()`
    - Format prompt with attachment data
    - Call OpenAI API with prompt
    - Parse and return generated text
    - Handle API errors with fallback text
    - _Requirements: 2.4, 2.5, 2.7, 13.1_

  - [x] 7.6 Implement `generate_all_analysis_texts()`
    - Call all four generation functions
    - Store generated texts in analysis_texts table
    - Return dictionary with all texts
    - Log AI API calls and token usage
    - _Requirements: 2.6, 13.5_

  - [ ]* 7.7 Write property test for analysis text non-empty
    - **Property 6: Analysis Text Non-Empty**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [ ]* 7.8 Write unit tests for AI text generation
    - Test with mocked OpenAI API
    - Test error handling and fallbacks
    - Test text storage in database
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 13.1_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement report data assembly
  - [ ] 9.1 Implement `get_user_info_section()`
    - Query user_profiles table
    - Format user info with name, gender, age
    - Add current date as report_date
    - _Requirements: 7.2_

  - [ ] 9.2 Implement `get_mind_indices_section()`
    - Extract five core dimension scores from assessment
    - Return dictionary with dimension names and scores
    - _Requirements: 7.3_

  - [ ] 9.3 Implement `get_emotional_insight_section()`
    - Get emotional regulation score
    - Calculate status labels from sub-scores
    - Combine into emotional insight structure
    - _Requirements: 7.4_

  - [ ] 9.4 Implement `get_cognitive_insight_section()`
    - Get cognitive flexibility score
    - Get inner system (dominant IFS part + impact analysis)
    - Get automatic thought (dominant cognitive pattern + impact)
    - Get perspective shifting (summary + stars + details)
    - Get narrative structure (type + summary)
    - Combine into cognitive insight structure
    - _Requirements: 7.5_

  - [ ] 9.5 Implement `get_relational_insight_section()`
    - Get relationship sensitivity score
    - Get relational details (triggers, empathy, conflict)
    - Get attachment pattern (boolean flags + scores)
    - Get conflict triggers analysis text
    - Combine into relational insight structure
    - _Requirements: 7.6_

  - [ ] 9.6 Implement `get_personality_style_section()`
    - Query personality_styles table
    - Return personality type and name
    - _Requirements: 7.7_

  - [ ] 9.7 Implement `get_growth_potential_section()`
    - Get growth potential total score
    - Get breakdown scores (insight depth, plasticity, resilience)
    - Combine into growth potential structure
    - _Requirements: 7.8_

  - [ ] 9.8 Implement `assemble_report_data()`
    - Call all section functions
    - Combine into complete report structure
    - Validate all required sections present
    - Format according to report_data.json structure
    - _Requirements: 7.1, 7.9_

  - [ ]* 9.9 Write property test for report data completeness
    - **Property 5: Report Data Completeness**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8**

  - [ ]* 9.10 Write unit tests for report assembly
    - Test each section function independently
    - Test complete assembly
    - Test with missing data
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement report generation API endpoints
  - [ ] 11.1 Create Pydantic request/response models
    - Define ReportGenerationRequest
    - Define ReportGenerationResponse
    - Define ReportStatusResponse
    - Define AnalysisGenerationRequest
    - Define AnalysisGenerationResponse
    - _Requirements: 8.8, 8.9, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.6_

  - [ ] 11.2 Implement `POST /api/psychology/report/generate`
    - Validate assessment_id exists
    - Check assessment completeness (>= 70%)
    - Create psychology_reports record with status "pending"
    - Trigger async report generation
    - Return report_id and status
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7_

  - [ ] 11.3 Implement report generation background task
    - Identify dominant elements
    - Generate analysis texts
    - Classify personality style
    - Calculate status labels
    - Assemble report data
    - Update report status to "completed"
    - Handle errors and update status to "failed"
    - _Requirements: 8.5, 8.6, 13.2, 13.3, 13.4_

  - [ ] 11.4 Implement `GET /api/psychology/report/{report_id}/status`
    - Query psychology_reports table
    - Return current status and progress
    - Return download URL if completed
    - Return error message if failed
    - Calculate estimated time remaining
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 11.5 Implement `POST /api/psychology/analysis/generate`
    - Validate assessment_id exists
    - Identify dominant elements
    - Generate requested analysis types
    - Store in analysis_texts table
    - Return generated analyses
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7_

  - [ ]* 11.6 Write integration tests for API endpoints
    - Test report generation with complete assessment
    - Test report generation with incomplete assessment
    - Test report status polling
    - Test analysis text generation
    - Test error handling
    - _Requirements: 8.1-8.9, 9.1-9.6, 10.1-10.7_

- [ ] 12. Implement data validation and completeness checks
  - [ ] 12.1 Implement `check_assessment_completeness()`
    - Verify all five core dimensions have scores
    - Verify confidence scores are present
    - Verify at least one detection exists
    - Calculate completion percentage
    - Return missing components list
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 12.2 Write unit tests for completeness checks
    - Test with complete assessment
    - Test with incomplete assessment
    - Test with missing dimensions
    - Test with missing detections
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 13. Implement error handling and logging
  - [ ] 13.1 Add comprehensive logging
    - Log all processing steps with timestamps
    - Log AI API calls with token usage
    - Log database operations
    - Log errors with stack traces
    - _Requirements: 13.4, 13.5_

  - [ ] 13.2 Implement error handling for AI failures
    - Catch OpenAI API errors
    - Use template-based fallback text
    - Log error details
    - Continue processing
    - _Requirements: 13.1_

  - [ ] 13.3 Implement error handling for database failures
    - Catch database exceptions
    - Rollback transactions
    - Return appropriate error responses
    - Log error details
    - _Requirements: 13.2_

  - [ ] 13.4 Implement error handling for report generation
    - Catch all exceptions in background task
    - Update report status to "failed"
    - Store error message
    - Log error details
    - _Requirements: 13.3, 13.6_

  - [ ]* 13.5 Write unit tests for error handling
    - Test AI API failure handling
    - Test database failure handling
    - Test report generation failure handling
    - _Requirements: 13.1, 13.2, 13.3, 13.6_

- [ ] 14. Implement performance optimizations
  - [ ] 14.1 Optimize database queries
    - Use joins to minimize queries
    - Add database indexes if needed
    - Cache frequently accessed data
    - _Requirements: 14.2_

  - [ ] 14.2 Implement AI API batching
    - Batch multiple analysis texts in single call when possible
    - Implement rate limiting
    - Add retry logic with exponential backoff
    - _Requirements: 14.1, 14.6_

  - [ ] 14.3 Implement async report generation
    - Use background tasks for report generation
    - Support concurrent generation for different users
    - Add queue management
    - _Requirements: 14.4, 14.5_

  - [ ]* 14.4 Write performance tests
    - Test concurrent report generation
    - Test database query performance
    - Test AI API batching
    - _Requirements: 14.1, 14.2, 14.4, 14.5, 14.6_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Integration and end-to-end testing
  - [ ]* 16.1 Write end-to-end test for complete report generation
    - Create test assessment with all data
    - Generate report
    - Verify all sections present
    - Verify data accuracy
    - _Requirements: All_

  - [ ]* 16.2 Write property test for report generation idempotency
    - **Property 8: Report Generation Idempotency**
    - **Validates: Requirements 7.9**

  - [ ]* 16.3 Test with real OpenAI API (manual)
    - Generate reports with actual AI
    - Verify text quality
    - Check token usage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate complete workflows
- Background task implementation may use Celery or FastAPI BackgroundTasks
- AI text generation should be mocked in most tests for consistency
