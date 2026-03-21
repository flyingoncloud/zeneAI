# Requirements Document

## Introduction

本功能在AI聊天对话中自然嵌入心理测评问题。AI检测对话涉及的心理领域（五大domain及其子类别），通过function calling请求相关问题，将问题自然融入对话。用户在不知不觉中完成83题测评，解决用户看到完整问卷就放弃的问题。系统记录答案、追踪进度，当回答达到40题以上时可生成心理报告。

This feature embeds psychological assessment questions naturally into AI chat conversations. The AI detects relevant psychological domains (5 major domains and subcategories) during conversation, requests appropriate questions via function calling, and weaves them seamlessly into dialogue. Users complete the 83-question assessment gradually without feeling tested. The system records answers, tracks progress, and enables psychology report generation once 40+ questions are answered.

## Glossary

- **AI_Chat_Service**: The system component that processes user messages and generates AI responses via OpenAI GPT-4o
- **Question_Selection_Service**: The system component responsible for selecting unasked assessment questions based on domain and subcategory
- **Answer_Recording_Service**: The system component responsible for recording user answers and updating progress tracking
- **Domain**: One of five major psychological assessment categories (2.1 情绪觉察, 2.2 认知模式, 2.3 关系模式, 2.4 MBTI性格类型, 2.5 成长指数)
- **Subcategory**: A more specific classification within a Domain (e.g., 2.1.2 情绪调节与恢复)
- **InlineAssessmentProgress**: The database record tracking each individual question answer collected during conversation
- **InlineAssessmentSummary**: The aggregated summary of a user's overall inline assessment progress
- **Pacing_Rules**: The set of rules controlling when and how often assessment questions are asked during conversation
- **Assessment_Question**: An existing question from the assessment_questions table that can be asked inline
- **Report_Threshold**: The minimum number of answered questions (40) required to generate a psychology report

## Requirements

### Requirement 1: Domain Detection and Question Request

**User Story:** As an AI chat system, I want to detect psychological domains in user messages and request relevant assessment questions, so that questions can be naturally embedded into conversation.

#### Acceptance Criteria

1. WHEN a user message contains themes related to a psychological Domain, THE AI_Chat_Service SHALL invoke the request_assessment_question function with the detected domain code
2. WHEN the AI_Chat_Service invokes request_assessment_question, THE AI_Chat_Service SHALL provide a domain parameter from the valid set ("2.1", "2.2", "2.3", "2.4", "2.5")
3. WHEN the AI_Chat_Service identifies a specific Subcategory within a Domain, THE AI_Chat_Service SHALL include the subcategory code in the function call
4. WHEN the AI_Chat_Service invokes request_assessment_question, THE AI_Chat_Service SHALL provide a reasoning parameter explaining why the domain is relevant to the current conversation

### Requirement 2: Question Selection

**User Story:** As a backend service, I want to select appropriate unasked questions for a given domain, so that the AI can embed fresh questions into conversation.

#### Acceptance Criteria

1. WHEN the Question_Selection_Service receives a request with a domain and subcategory, THE Question_Selection_Service SHALL query Assessment_Questions filtered by the specified domain and subcategory
2. WHEN the Question_Selection_Service receives a request with only a domain, THE Question_Selection_Service SHALL query Assessment_Questions filtered by the specified domain across all subcategories
3. WHEN selecting questions, THE Question_Selection_Service SHALL exclude questions already answered by the user (present in InlineAssessmentProgress)
4. WHEN unasked questions are available, THE Question_Selection_Service SHALL return a question object containing id, text, options, domain, and subcategory
5. WHEN no unasked questions are available for the requested domain, THE Question_Selection_Service SHALL return a response with status "no_questions_available" and reason "all_asked"
6. WHEN the Question_Selection_Service returns a question, THE Question_Selection_Service SHALL select from available questions randomly

### Requirement 3: Natural Question Integration

**User Story:** As a user, I want assessment questions to feel like a natural part of conversation, so that I don't feel like I'm taking a formal test.

#### Acceptance Criteria

1. WHEN the AI_Chat_Service receives a question from the Question_Selection_Service, THE AI_Chat_Service SHALL weave the question naturally into its conversational response
2. WHEN the Question_Selection_Service returns "no_questions_available", THE AI_Chat_Service SHALL continue the conversation without mentioning the technical status
3. WHEN presenting a question, THE AI_Chat_Service SHALL include all answer options with their numeric values (1-5 scale)

### Requirement 4: Answer Recording

**User Story:** As a system, I want to record user answers and update progress, so that assessment data is captured accurately for report generation.

#### Acceptance Criteria

1. WHEN a user provides an answer to an inline assessment question, THE Answer_Recording_Service SHALL create a new InlineAssessmentProgress record with user_id, conversation_id, question_id, answer_value, domain, and subcategory
2. WHEN recording an answer, THE Answer_Recording_Service SHALL validate that answer_value is an integer between 1 and 5 inclusive
3. IF a user attempts to answer a question they have already answered, THEN THE Answer_Recording_Service SHALL reject the duplicate and return an error status
4. WHEN an answer is successfully recorded, THE Answer_Recording_Service SHALL update the corresponding InlineAssessmentSummary atomically within the same database transaction
5. IF the database transaction for answer recording fails, THEN THE Answer_Recording_Service SHALL roll back both the InlineAssessmentProgress insert and the InlineAssessmentSummary update

### Requirement 5: Progress Tracking

**User Story:** As a user, I want my assessment progress to be tracked accurately, so that I can eventually generate a comprehensive psychology report.

#### Acceptance Criteria

1. WHEN an answer is recorded, THE Answer_Recording_Service SHALL increment the total_answered count in InlineAssessmentSummary by one
2. WHEN an answer is recorded, THE Answer_Recording_Service SHALL recalculate completion_percentage as (total_answered / 83) * 100
3. WHEN an answer is recorded for a new Domain, THE Answer_Recording_Service SHALL add that domain code to the domains_covered list in InlineAssessmentSummary
4. WHEN an answer is recorded, THE Answer_Recording_Service SHALL increment the domain_question_counts entry for the corresponding domain
5. THE InlineAssessmentSummary SHALL maintain a total_answered value equal to the count of InlineAssessmentProgress records for that user

### Requirement 6: Report Generation Threshold

**User Story:** As a user, I want to be notified when I have answered enough questions to generate a psychology report, so that I can request my report at the right time.

#### Acceptance Criteria

1. WHEN total_answered reaches or exceeds 40, THE Answer_Recording_Service SHALL set can_generate_report to true in InlineAssessmentSummary
2. WHILE total_answered is less than 40, THE Answer_Recording_Service SHALL keep can_generate_report as false in InlineAssessmentSummary
3. WHEN can_generate_report transitions from false to true, THE AI_Chat_Service SHALL inform the user that a psychology report is available for generation

### Requirement 7: Conversation Pacing

**User Story:** As a user, I want assessment questions to be paced appropriately, so that the conversation feels natural and not like an interrogation.

#### Acceptance Criteria

1. WHILE the conversation has fewer than 4 messages (2 rounds), THE AI_Chat_Service SHALL not request assessment questions
2. WHEN an assessment question has been asked within the last 2 conversation rounds, THE AI_Chat_Service SHALL not request another assessment question
3. WHILE the user is in acute emotional distress, THE AI_Chat_Service SHALL not request assessment questions
4. WHEN Pacing_Rules allow a question, THE AI_Chat_Service SHALL apply a probabilistic gate (approximately 30% chance) before requesting a question

### Requirement 8: Data Model Integrity

**User Story:** As a system administrator, I want data integrity constraints enforced on assessment data, so that the stored data is always valid and consistent.

#### Acceptance Criteria

1. THE InlineAssessmentProgress table SHALL enforce a unique constraint on the combination of user_id and question_id
2. THE InlineAssessmentProgress table SHALL enforce that domain values match the pattern "2.[1-5]"
3. THE InlineAssessmentProgress table SHALL enforce that answer_value is between 1 and 5 inclusive
4. THE InlineAssessmentSummary table SHALL enforce a unique constraint on user_id
5. THE InlineAssessmentSummary table SHALL maintain indexes on user_id and domain fields for query performance

### Requirement 9: Domain Code Extraction

**User Story:** As a backend service, I want to reliably extract domain codes from questionnaire identifiers, so that questions are correctly classified by domain.

#### Acceptance Criteria

1. WHEN extracting a domain from a questionnaire_id, THE Question_Selection_Service SHALL parse the format "questionnaire_X_Y" into domain code "X.Y"
2. IF a questionnaire_id does not follow the expected format, THEN THE Question_Selection_Service SHALL return an error rather than an incorrect domain code

### Requirement 10: Error Handling

**User Story:** As a user, I want the system to handle errors gracefully, so that my conversation is not interrupted by technical issues.

#### Acceptance Criteria

1. IF the database is unavailable during question selection, THEN THE Question_Selection_Service SHALL return an error status without interrupting the conversation flow
2. IF the database is unavailable during answer recording, THEN THE Answer_Recording_Service SHALL return an error status and log the failure with full details
3. IF a question_id referenced during answer recording does not exist, THEN THE Answer_Recording_Service SHALL return a "question_not_found" error status
4. IF a conversation_id referenced during answer recording does not exist, THEN THE Answer_Recording_Service SHALL return a "conversation_not_found" error status
5. WHEN any error occurs in the inline assessment flow, THE AI_Chat_Service SHALL continue the conversation normally without exposing technical error details to the user

### Requirement 11: Input Validation and Security

**User Story:** As a system administrator, I want all inputs validated and access controlled, so that the assessment data is secure and accurate.

#### Acceptance Criteria

1. WHEN the Question_Selection_Service receives a domain parameter, THE Question_Selection_Service SHALL validate it against the whitelist ["2.1", "2.2", "2.3", "2.4", "2.5"]
2. WHEN the Answer_Recording_Service receives an answer_value, THE Answer_Recording_Service SHALL reject non-integer values and values outside the range [1, 5]
3. WHEN a user requests assessment data, THE Answer_Recording_Service SHALL verify the request is for the authenticated user's own data
4. THE Answer_Recording_Service SHALL use parameterized database queries to prevent SQL injection

### Requirement 12: Function Calling Tool Definition

**User Story:** As a developer, I want a well-defined OpenAI function calling tool for assessment questions, so that the AI can request questions through a structured interface.

#### Acceptance Criteria

1. THE AI_Chat_Service SHALL register a function tool named "request_assessment_question" with OpenAI's function calling interface
2. THE request_assessment_question tool SHALL define domain as a required string parameter with enum values ["2.1", "2.2", "2.3", "2.4", "2.5"]
3. THE request_assessment_question tool SHALL define subcategory as an optional string parameter for subcategory codes
4. THE request_assessment_question tool SHALL define reasoning as a required string parameter
