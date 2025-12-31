# Implementation Plan: Multi-Psychology Detection

## Overview

This implementation extends the existing IFS detection system to support 5 psychological frameworks (IFS, CBT, Jungian, Narrative Therapy, Attachment Theory) while maintaining the proven two-stage hybrid approach and performance characteristics.

## Tasks

- [x] 1. Create base framework architecture and interfaces
  - Create BaseFrameworkDetector abstract class with common interface
  - Implement FrameworkManager for registration and configuration management
  - Set up framework-specific configuration structure
  - _Requirements: 1.1, 1.5, 8.1, 8.2_

- [ ]* 1.1 Write property test for framework architecture
  - **Property 1: Multi-Framework Analysis Completeness**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2. Implement MultiPsychologyDetector core orchestrator
  - Create main detector class that coordinates multiple frameworks
  - Implement framework-aware analysis workflow
  - Add error isolation between frameworks
  - Maintain backward compatibility with existing IFS integration
  - _Requirements: 1.2, 1.3, 1.4, 7.5_

- [ ]* 2.1 Write property test for framework independence
  - **Property 2: Framework Independence**
  - **Validates: Requirements 7.5**

- [ ]* 2.2 Write property test for IFS backward compatibility
  - **Property 3: IFS Backward Compatibility**
  - **Validates: Requirements 1.4, 9.2**

- [ ] 3. Create CBT framework detector
  - [x] 3.1 Implement CBT pattern definitions (English and Chinese)
    - Define cognitive distortion patterns (catastrophizing, black-and-white thinking, mind reading, etc.)
    - Define behavioral pattern keywords (avoidance, behavioral activation, coping strategies)
    - Define thought record indicators and CBT technique mentions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Implement CBTDetector class
    - Create CBT-specific pattern matching logic
    - Implement CBT LLM analysis with specialized prompts
    - Define CBT element data models (CBTElement)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.3 Write property test for CBT detection accuracy
    - **Property 5: CBT Pattern Detection Accuracy**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [ ] 4. Create Jungian framework detector
  - [x] 4.1 Implement Jungian pattern definitions (English and Chinese)
    - Define archetypal patterns (shadow, anima/animus, persona, Self)
    - Define dream content and symbolic element keywords
    - Define individuation process and psychological complex indicators
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.2 Implement JungianDetector class
    - Create Jungian-specific pattern matching logic
    - Implement Jungian LLM analysis with archetypal prompts
    - Define Jungian element data models (JungianElement)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.3 Write property test for Jungian detection accuracy
    - **Property 6: Jungian Pattern Detection Accuracy**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [ ] 5. Create Narrative Therapy framework detector
  - [x] 5.1 Implement Narrative pattern definitions (English and Chinese)
    - Define externalization language patterns
    - Define unique outcome and exception keywords
    - Define re-authoring and preferred identity indicators
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.2 Implement NarrativeDetector class
    - Create Narrative-specific pattern matching logic
    - Implement Narrative LLM analysis with story-focused prompts
    - Define Narrative element data models (NarrativeElement)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 5.3 Write property test for Narrative detection accuracy
    - **Property 7: Narrative Pattern Detection Accuracy**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [ ] 6. Create Attachment Theory framework detector
  - [x] 6.1 Implement Attachment pattern definitions (English and Chinese)
    - Define attachment style patterns (secure, anxious, avoidant, disorganized)
    - Define relational behavior and emotional regulation keywords
    - Define attachment trigger and repair attempt indicators
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.2 Implement AttachmentDetector class
    - Create Attachment-specific pattern matching logic
    - Implement Attachment LLM analysis with relational prompts
    - Define Attachment element data models (AttachmentElement)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.3 Write property test for Attachment detection accuracy
    - **Property 8: Attachment Pattern Detection Accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 7. Enhance pattern matcher for multi-framework support
  - Extend PatternMatcher to handle multiple frameworks in single pass
  - Implement framework-specific pattern caching and optimization
  - Add language detection and framework-appropriate pattern selection
  - _Requirements: 7.1, 7.3, 10.1, 10.3_

- [ ]* 7.1 Write property test for bilingual detection consistency
  - **Property 9: Bilingual Detection Consistency**
  - **Validates: Requirements 2.5, 10.1, 10.2, 10.3**

- [ ]* 7.2 Write property test for performance bounds
  - **Property 11: Performance Bounds**
  - **Validates: Requirements 7.1, 7.2**

- [x] 8. Enhance LLM analyzer for multi-framework support
  - Extend LLMAnalyzer to handle framework-specific prompts
  - Implement batch analysis for multiple frameworks
  - Add bilingual prompt support for all frameworks
  - _Requirements: 10.2, 7.2_

- [ ] 9. Implement comprehensive data collection system
  - [x] 9.1 Create DataCollector class
    - Implement framework-specific data storage
    - Create conversation-level data aggregation
    - Add cross-framework insight generation
    - _Requirements: 6.1, 6.2, 9.4_

  - [x] 9.2 Implement data export and research functionality
    - Create structured data export for research analysis
    - Implement historical data preservation and querying
    - Add framework-specific metrics tracking
    - _Requirements: 6.3, 6.4, 6.5, 9.5_

  - [ ]* 9.3 Write property test for data collection completeness
    - **Property 10: Data Collection Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 9.4 Write property test for historical data persistence
    - **Property 15: Historical Data Persistence**
    - **Validates: Requirements 6.4, 9.5**

- [x] 10. Update configuration system for multi-framework support
  - Extend settings.py with framework-specific configurations
  - Implement framework enable/disable functionality
  - Add framework-specific analysis intervals and thresholds
  - Create pattern customization support per framework and language
  - _Requirements: 8.1, 8.2, 8.3, 8.5, 10.5_

- [ ]* 10.1 Write property test for configuration consistency
  - **Property 4: Configuration Consistency**
  - **Validates: Requirements 1.5, 8.1, 8.2**

- [ ] 11. Integrate multi-framework detection into chat API
  - [x] 11.1 Update chat service integration
    - Modify app.py to use MultiPsychologyDetector instead of IFSDetector
    - Ensure backward compatibility with existing IFS responses
    - Add framework-specific analysis triggering logic
    - _Requirements: 1.4, 9.1, 9.2_

  - [x] 11.2 Update API response format
    - Extend response structure to include all framework results
    - Maintain backward compatibility for IFS-only clients
    - Add cross-framework insights to responses
    - Include framework-specific confidence scores and evidence
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 11.3 Write property test for API response completeness
    - **Property 13: API Response Completeness**
    - **Validates: Requirements 9.1, 9.3**

  - [ ]* 11.4 Write property test for cross-framework insight generation
    - **Property 14: Cross-Framework Insight Generation**
    - **Validates: Requirements 9.4**

- [x] 12. Implement memory efficiency and performance optimizations
  - Ensure constant memory usage with configurable message windows
  - Implement framework-specific analysis intervals
  - Add performance monitoring and logging for each framework
  - _Requirements: 7.3, 7.4, 8.4_

- [ ]* 12.1 Write property test for memory efficiency
  - **Property 12: Memory Efficiency**
  - **Validates: Requirements 7.3**

- [x] 13. Create comprehensive error handling and monitoring
  - Implement framework-level error isolation
  - Add comprehensive logging for each framework's performance
  - Create graceful degradation when individual frameworks fail
  - Add monitoring dashboards for framework health
  - _Requirements: 7.5, 8.4_

- [x] 14. Final integration and testing checkpoint
  - Ensure all frameworks work together seamlessly
  - Verify backward compatibility with existing IFS functionality
  - Test performance under realistic conversation loads
  - Validate bilingual support across all frameworks
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties across all frameworks
- Unit tests validate specific examples and edge cases for each framework
- The implementation maintains the existing IFS system while adding comprehensive multi-framework support