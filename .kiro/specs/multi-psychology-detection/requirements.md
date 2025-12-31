# Requirements Document

## Introduction

This feature extends the existing IFS (Internal Family Systems) detection system to support comprehensive psychological framework detection across 5 major therapeutic approaches. The system will analyze conversations to identify patterns, concepts, and therapeutic elements from multiple psychological knowledge bases, enabling data collection and insights for therapeutic applications.

## Glossary

- **Psychology_Framework**: One of the 5 supported therapeutic approaches (IFS, CBT, Jungian, Narrative, Attachment)
- **Detection_Engine**: The core system that analyzes conversations for psychological patterns
- **Pattern_Matcher**: Fast keyword/regex-based detection component
- **LLM_Analyzer**: Deep contextual analysis component using language models
- **Framework_State**: Cumulative analysis data for a specific psychology framework
- **Conversation_Analysis**: Complete psychological analysis results for a conversation
- **Therapeutic_Element**: Specific concept, pattern, or indicator from a psychology framework

## Requirements

### Requirement 1: Multi-Framework Detection Architecture

**User Story:** As a system architect, I want to extend the existing IFS detection system to support multiple psychological frameworks, so that conversations can be analyzed across different therapeutic approaches.

#### Acceptance Criteria

1. THE Detection_Engine SHALL support analysis for all 5 psychological frameworks simultaneously
2. WHEN a conversation is analyzed, THE Detection_Engine SHALL check for patterns from all enabled frameworks
3. THE Detection_Engine SHALL maintain the existing two-stage hybrid approach (pattern matching + LLM analysis)
4. THE Detection_Engine SHALL preserve the existing IFS detection functionality without modification
5. THE Detection_Engine SHALL allow individual frameworks to be enabled or disabled via configuration

### Requirement 2: Cognitive Behavioral Therapy (CBT) Detection

**User Story:** As a therapist, I want to identify CBT elements in conversations, so that I can understand cognitive patterns and behavioral interventions.

#### Acceptance Criteria

1. WHEN CBT patterns are detected, THE CBT_Detector SHALL identify cognitive distortions (catastrophizing, all-or-nothing thinking, mind reading, etc.)
2. WHEN behavioral patterns are found, THE CBT_Detector SHALL detect behavioral activation, avoidance patterns, and coping strategies
3. WHEN thought records are present, THE CBT_Detector SHALL identify thoughts, feelings, and behaviors connections
4. THE CBT_Detector SHALL detect homework assignments, behavioral experiments, and skill practice mentions
5. THE CBT_Detector SHALL support both English and Chinese language detection

### Requirement 3: Jungian Psychology Detection

**User Story:** As a depth psychology practitioner, I want to identify Jungian concepts in conversations, so that I can understand archetypal patterns and individuation processes.

#### Acceptance Criteria

1. WHEN archetypal content appears, THE Jungian_Detector SHALL identify shadow, anima/animus, persona, and Self references
2. WHEN dream content is discussed, THE Jungian_Detector SHALL detect symbolic elements and archetypal themes
3. THE Jungian_Detector SHALL identify individuation process indicators and psychological development stages
4. THE Jungian_Detector SHALL detect projection, compensation, and psychological complexes
5. THE Jungian_Detector SHALL recognize active imagination and amplification techniques

### Requirement 4: Narrative Therapy Detection

**User Story:** As a narrative therapist, I want to identify narrative therapy elements in conversations, so that I can understand story patterns and meaning-making processes.

#### Acceptance Criteria

1. WHEN problem externalization occurs, THE Narrative_Detector SHALL identify separation between person and problem
2. THE Narrative_Detector SHALL detect unique outcomes, exceptions, and alternative story development
3. WHEN re-authoring conversations happen, THE Narrative_Detector SHALL identify preferred identity claims
4. THE Narrative_Detector SHALL recognize deconstruction of dominant cultural narratives
5. THE Narrative_Detector SHALL identify audience and witnessing practices in conversations

### Requirement 5: Attachment Theory Detection

**User Story:** As an attachment-focused therapist, I want to identify attachment patterns in conversations, so that I can understand relational dynamics and attachment styles.

#### Acceptance Criteria

1. THE Attachment_Detector SHALL identify secure, anxious, avoidant, and disorganized attachment patterns
2. WHEN relationship dynamics are discussed, THE Attachment_Detector SHALL detect attachment behaviors and strategies
3. THE Attachment_Detector SHALL recognize emotional regulation patterns and co-regulation attempts
4. THE Attachment_Detector SHALL identify attachment triggers, fears, and needs in relationships
5. THE Attachment_Detector SHALL detect repair attempts and relationship maintenance behaviors

### Requirement 6: Unified Data Collection System

**User Story:** As a researcher, I want to collect comprehensive psychological data from conversations, so that I can analyze therapeutic patterns and outcomes across frameworks.

#### Acceptance Criteria

1. WHEN any framework detects elements, THE Data_Collector SHALL store analysis results with framework identification
2. THE Data_Collector SHALL maintain conversation-level aggregated data across all frameworks
3. THE Data_Collector SHALL track detection frequency and confidence scores for each framework
4. THE Data_Collector SHALL preserve historical analysis data for longitudinal studies
5. THE Data_Collector SHALL export data in structured formats for research analysis

### Requirement 7: Performance and Scalability

**User Story:** As a system administrator, I want the multi-framework detection to maintain high performance, so that user experience remains optimal.

#### Acceptance Criteria

1. THE Detection_Engine SHALL complete pattern matching for all frameworks within 50ms
2. WHEN LLM analysis is triggered, THE Detection_Engine SHALL process all frameworks within 5 seconds
3. THE Detection_Engine SHALL analyze only recent messages (configurable window) to maintain constant memory usage
4. THE Detection_Engine SHALL allow framework-specific configuration of analysis intervals
5. THE Detection_Engine SHALL gracefully handle individual framework failures without affecting others

### Requirement 8: Configuration and Management

**User Story:** As a system administrator, I want to configure and manage multiple psychology frameworks, so that I can customize the system for different use cases.

#### Acceptance Criteria

1. THE Configuration_System SHALL allow enabling/disabling individual psychology frameworks
2. THE Configuration_System SHALL support framework-specific analysis intervals and confidence thresholds
3. THE Configuration_System SHALL allow customization of pattern matching keywords for each framework
4. THE Configuration_System SHALL provide monitoring and logging for each framework's performance
5. THE Configuration_System SHALL support different LLM models for different frameworks if needed

### Requirement 9: API Integration and Response Format

**User Story:** As a frontend developer, I want to receive comprehensive psychology analysis data, so that I can display insights to users and therapists.

#### Acceptance Criteria

1. WHEN analysis is complete, THE API SHALL return results for all enabled frameworks in the response
2. THE API SHALL maintain backward compatibility with existing IFS-only responses
3. THE API SHALL include framework-specific confidence scores and evidence
4. THE API SHALL provide aggregated cross-framework insights when patterns overlap
5. THE API SHALL support querying historical analysis data for specific frameworks

### Requirement 10: Bilingual Support Extension

**User Story:** As a multilingual therapist, I want psychology detection to work in both English and Chinese, so that I can serve diverse client populations.

#### Acceptance Criteria

1. THE Pattern_Matcher SHALL support English and Chinese keywords for all psychology frameworks
2. THE LLM_Analyzer SHALL process conversations in both languages with framework-appropriate prompts
3. THE Detection_Engine SHALL automatically detect conversation language and apply appropriate patterns
4. THE API SHALL return analysis results in the same language as the conversation when possible
5. THE Configuration_System SHALL allow language-specific pattern customization for each framework