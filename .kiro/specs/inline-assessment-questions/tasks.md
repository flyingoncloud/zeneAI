# Implementation Plan: Inline Assessment Questions (内嵌式测评问题)

## Overview

Embed psychological assessment questions naturally into AI chat conversations. The AI detects relevant psychological domains during conversation, requests questions via function calling, records answers, tracks progress, and enables report generation at 40+ questions. Implementation follows a 6-phase approach: core infrastructure, AI integration, pacing/UX, frontend, testing, and deployment.

## Tasks

- [x] 1. Core Infrastructure - Database Models and Services
  - [x] 1.1 Create InlineAssessmentProgress and InlineAssessmentSummary database models
    - Create new file `ai-chat-api/src/database/inline_assessment_models.py`
    - Define `InlineAssessmentProgress` model with columns: id, user_id, conversation_id, question_id, answer_value, domain, subcategory, asked_at, answered_at, conversation_context
    - Define `InlineAssessmentSummary` model with columns: id, user_id, total_answered, total_questions (default 83), completion_percentage, domains_covered, domain_question_counts, can_generate_report, report_generated, report_id, started_at, last_updated_at
    - Add UniqueConstraint on (user_id, question_id) for InlineAssessmentProgress
    - Add UniqueConstraint on user_id for InlineAssessmentSummary
    - Add composite indexes on (user_id, domain) and (user_id, question_id)
    - Add CheckConstraint for answer_value between 1 and 5
    - Add CheckConstraint for domain matching pattern "2.[1-5]"
    - Import Base from `src.database.models`
    - Add relationships to AssessmentQuestion, Conversation, PsychologyReport
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 1.2 Write property test for domain validation (Property 1)
    - **Property 1: Domain validation rejects invalid codes**
    - **Validates: Requirements 1.2, 8.2, 11.1**

  - [x] 1.3 Create database migration for new tables
    - Create Alembic migration script in `ai-chat-api/src/database/migrations/`
    - Create `inline_assessment_progress` table with all columns and constraints
    - Create `inline_assessment_summary` table with all columns and constraints
    - Add indexes for query performance
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 1.4 Implement QuestionSelectionService
    - Create new file `ai-chat-api/src/services/inline_assessment_service.py`
    - Implement `get_question_for_domain(db, user_id, conversation_id, domain, subcategory)` function
    - Query `AssessmentQuestion` table filtered by domain via `questionnaire_id` pattern matching
    - When subcategory provided, additionally filter by `sub_section` or `category`
    - Exclude already-answered questions by checking `InlineAssessmentProgress` for user
    - Return random selection from available questions with id, text, options, domain, subcategory
    - Return `{"status": "no_questions_available", "reason": "all_asked"}` when none available
    - Implement `extract_domain_from_questionnaire_id(questionnaire_id)` utility to parse "questionnaire_X_Y" → "X.Y"
    - Validate domain against whitelist ["2.1", "2.2", "2.3", "2.4", "2.5"]
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 11.1_

  - [ ]* 1.5 Write property tests for question selection (Properties 2, 3, 10)
    - **Property 2: Question selection returns only matching domain questions**
    - **Property 3: Question selection excludes already-answered questions**
    - **Property 10: Domain extraction round-trip**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 9.1, 9.2**

  - [x] 1.6 Implement AnswerRecordingService
    - Add `record_answer(db, user_id, conversation_id, question_id, answer_value, context)` to `inline_assessment_service.py`
    - Validate answer_value is integer between 1 and 5
    - Check for duplicate (user_id, question_id) and reject if exists
    - Validate question_id exists in assessment_questions table
    - Validate conversation_id exists in conversations table
    - Create InlineAssessmentProgress record
    - Get or create InlineAssessmentSummary for user
    - Update summary: increment total_answered, recalculate completion_percentage, update domains_covered and domain_question_counts
    - Set can_generate_report = True when total_answered >= 40
    - Wrap insert + summary update in single atomic transaction
    - Use parameterized queries throughout
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 11.2, 11.4_

  - [ ]* 1.7 Write property tests for answer recording (Properties 4, 5, 6, 7, 8)
    - **Property 4: No duplicate answers per user-question pair**
    - **Property 5: Answer value range enforcement**
    - **Property 6: Progress summary consistency**
    - **Property 7: Report generation threshold biconditional**
    - **Property 8: Atomic answer recording**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 8.1, 8.3**

- [x] 2. Checkpoint - Core infrastructure validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. AI Integration - Function Calling and Chat Service
  - [x] 3.1 Add request_assessment_question tool definition
    - Update `ai-chat-api/src/prompts/tools.py` `get_openai_tools()` to include the new `request_assessment_question` function tool
    - Define domain as required string enum ["2.1", "2.2", "2.3", "2.4", "2.5"]
    - Define subcategory as optional string parameter
    - Define reasoning as required string parameter
    - Add descriptive function description for AI context
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 3.2 Add inline assessment instructions to system prompt
    - Update `ai-chat-api/src/prompts/system_prompts.py`
    - Add `INLINE_ASSESSMENT_INSTRUCTIONS` constant with domain detection guidance, question weaving rules, pacing rules, and the five domain descriptions as specified in the design document
    - Integrate the instructions into the existing system prompt builder
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 3.3 Implement function call handler in chat_service.py
    - Update `ai-chat-api/src/api/chat_service.py` `get_ai_response()` to handle `request_assessment_question` function calls
    - When AI invokes the tool, call `get_question_for_domain()` with extracted parameters
    - Return question data back to AI for natural integration into response
    - Handle "no_questions_available" gracefully (AI continues without question)
    - Handle database errors gracefully (AI continues conversation, logs error)
    - _Requirements: 1.1, 2.4, 3.1, 3.2, 10.1, 10.5_

  - [x] 3.4 Implement answer recording integration in chat_service.py
    - Add `record_inline_answer` tool definition for recording answers via function calling, OR implement answer extraction logic that detects when user responds with a number (1-5) after an assessment question
    - Call `record_answer()` when answer detected
    - Pass progress data back to AI for insight generation and report-ready notification
    - When `can_generate_report` transitions to true, include notification context for AI
    - Handle recording errors gracefully without interrupting conversation
    - _Requirements: 4.1, 6.3, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 3.5 Write unit tests for function call handler
    - Test request_assessment_question tool call handling
    - Test answer recording integration
    - Test error handling for database failures
    - Test graceful degradation when services unavailable
    - _Requirements: 10.1, 10.2, 10.5_

- [x] 4. Pacing Rules and Error Handling
  - [x] 4.1 Implement conversation pacing logic
    - Add `should_ask_question(conversation_history, user_message)` function to `inline_assessment_service.py`
    - Return False if conversation has fewer than 4 messages (2 rounds)
    - Return False if assessment question was asked in last 2 rounds (check assistant messages for question patterns)
    - Return False if user is in acute emotional distress (basic keyword detection)
    - Apply probabilistic gate (~30% chance) when all other rules pass
    - Integrate pacing check into chat_service.py before allowing AI to request questions
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 4.2 Write property test for pacing rules (Property 9)
    - **Property 9: Conversation pacing prevents early and consecutive questions**
    - **Validates: Requirements 7.1, 7.2**

  - [x] 4.3 Implement comprehensive error handling
    - Add try/except blocks around question selection with fallback to continue conversation
    - Add try/except blocks around answer recording with transaction rollback
    - Validate question_id existence before recording (return "question_not_found")
    - Validate conversation_id existence before recording (return "conversation_not_found")
    - Add structured logging for all error scenarios (database failures, validation errors, unexpected exceptions)
    - Ensure no technical error details leak to user-facing responses
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 4.4 Add progress retrieval API endpoint
    - Add GET endpoint to `ai-chat-api/src/api/psychology_report_routes.py` or create new route file for inline assessment progress
    - Return user's InlineAssessmentSummary data (total_answered, completion_percentage, domains_covered, can_generate_report)
    - Validate authenticated user can only access their own data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.3_

  - [ ]* 4.5 Write property test for user data isolation (Property 11)
    - **Property 11: User data access isolation**
    - **Validates: Requirements 11.3**

- [x] 5. Checkpoint - Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend Integration
  - [x] 6.1 Create InlineQuestionDisplay component
    - Create `zeneme-next/src/components/features/chat/InlineQuestionDisplay.tsx`
    - Render assessment question with numbered options (1-5 scale) styled to match chat conversation flow
    - Handle option selection and submit answer to backend
    - Ensure component is accessible (keyboard navigation, ARIA labels)
    - _Requirements: 3.1, 3.3_

  - [x] 6.2 Create subtle progress indicator component
    - Create `zeneme-next/src/components/features/chat/AssessmentProgressIndicator.tsx`
    - Display completion percentage and domains covered in a non-intrusive way
    - Only show when user has started answering inline questions (total_answered > 0)
    - Fetch progress data from the progress API endpoint
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.3 Create report-ready notification component
    - Create `zeneme-next/src/components/features/chat/ReportReadyNotification.tsx`
    - Display notification when can_generate_report becomes true
    - Link to report generation page
    - _Requirements: 6.3_

  - [x] 6.4 Integrate inline assessment components into chat interface
    - Update the chat interface to detect inline assessment questions in AI responses
    - Render InlineQuestionDisplay when assessment question is present
    - Wire answer submission to backend record_answer endpoint
    - Show AssessmentProgressIndicator in appropriate location
    - Show ReportReadyNotification when threshold reached
    - _Requirements: 3.1, 3.3, 6.3_

  - [ ]* 6.5 Write unit tests for frontend components
    - Test InlineQuestionDisplay renders options correctly
    - Test answer submission flow
    - Test progress indicator updates
    - Test report-ready notification display
    - _Requirements: 3.1, 3.3, 6.3_

- [x] 7. Checkpoint - Full stack integration complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Testing and Optimization
  - [ ]* 8.1 Write integration tests for end-to-end conversation flow
    - Test multi-turn conversation with domain detection → question request → answer recording → progress update
    - Test pacing rules across multiple conversation rounds
    - Test report threshold notification flow
    - Test concurrent answer recordings for data integrity
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1, 6.3, 7.1_

  - [ ]* 8.2 Add database query optimization
    - Verify composite indexes are effective with EXPLAIN ANALYZE
    - Implement Redis caching for InlineAssessmentSummary with 5-minute TTL (if Redis is available in the project)
    - Cache invalidation on answer recording
    - Ensure question selection query < 50ms and answer recording < 100ms
    - _Requirements: 8.5_

- [x] 9. Final checkpoint - All tests pass and feature is ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Backend is Python (FastAPI) in `ai-chat-api/`, frontend is Next.js in `zeneme-next/`
- Existing models (AssessmentQuestion, Conversation, PsychologyReport) are not modified
- Property tests use Hypothesis library for Python
- Checkpoints ensure incremental validation at key milestones
