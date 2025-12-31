# Multi-Framework Psychology Detection System

## Overview

The Multi-Framework Psychology Detection system extends the existing IFS detection to support comprehensive psychological analysis across 5 major therapeutic frameworks:

1. **IFS (Internal Family Systems)** - Already implemented, now integrated
2. **CBT (Cognitive Behavioral Therapy)** - Cognitive distortions, behavioral patterns, thought records
3. **Jungian Psychology** - Archetypes, dream analysis, individuation, complexes
4. **Narrative Therapy** - Externalization, re-authoring, unique outcomes
5. **Attachment Theory** - Attachment styles, relational patterns, emotional regulation

## Architecture

### Core Components

- **MultiPsychologyDetector**: Main orchestrator coordinating all frameworks
- **FrameworkManager**: Manages framework registration and configuration
- **BaseFrameworkDetector**: Abstract interface for all framework detectors
- **DataCollector**: Comprehensive data collection and research export
- **Individual Detectors**: CBT, Jungian, Narrative, Attachment detectors

### Two-Stage Hybrid Approach

1. **Stage 1: Pattern Matching** (< 50ms)
   - Fast keyword/regex scanning for all frameworks
   - Bilingual support (English/Chinese)
   - Framework-specific pattern libraries

2. **Stage 2: LLM Analysis** (only when patterns found)
   - Framework-specific prompts and analysis
   - Structured JSON output
   - Evidence-based confidence scoring

## Configuration

### Environment Variables

```env
# Master switch
PSYCHOLOGY_DETECTION_ENABLED=true

# Individual framework controls
IFS_DETECTION_ENABLED=true
CBT_DETECTION_ENABLED=true
JUNGIAN_DETECTION_ENABLED=true
NARRATIVE_DETECTION_ENABLED=true
ATTACHMENT_DETECTION_ENABLED=true

# Framework-specific intervals (analyze every N messages)
IFS_ANALYSIS_INTERVAL=3
CBT_ANALYSIS_INTERVAL=2
JUNGIAN_ANALYSIS_INTERVAL=4
NARRATIVE_ANALYSIS_INTERVAL=3
ATTACHMENT_ANALYSIS_INTERVAL=3

# Framework-specific window sizes
IFS_WINDOW_SIZE=10
CBT_WINDOW_SIZE=8
JUNGIAN_WINDOW_SIZE=12
NARRATIVE_WINDOW_SIZE=10
ATTACHMENT_WINDOW_SIZE=10

# Framework-specific confidence thresholds
IFS_MIN_CONFIDENCE=0.6
CBT_MIN_CONFIDENCE=0.7
JUNGIAN_MIN_CONFIDENCE=0.6
NARRATIVE_MIN_CONFIDENCE=0.6
ATTACHMENT_MIN_CONFIDENCE=0.6

# LLM models (can be framework-specific)
PSYCHOLOGY_LLM_MODEL=gpt-3.5-turbo
```

## API Response Format

The system maintains backward compatibility while extending the response format:

```json
{
  "session_id": "...",
  "conversation_id": 1,
  "assistant_message": {
    "id": 2,
    "role": "assistant", 
    "content": "...",
    "extra_data": {
      "psychology_analysis": {
        "analyzed": true,
        "frameworks": {
          "ifs": {
            "framework_name": "ifs",
            "analyzed": true,
            "llm_used": true,
            "confidence_score": 0.75,
            "elements_detected": [...],
            "evidence": "..."
          },
          "cbt": {
            "framework_name": "cbt",
            "analyzed": true,
            "llm_used": true,
            "confidence_score": 0.82,
            "elements_detected": [...],
            "evidence": "..."
          }
        },
        "cross_framework_insights": {
          "multiple_frameworks": {
            "frameworks": ["ifs", "cbt"],
            "description": "Multiple therapeutic frameworks detected",
            "therapeutic_relevance": "Complex psychological presentation"
          }
        },
        "analysis_summary": {
          "total_frameworks_analyzed": 5,
          "frameworks_with_detections": ["ifs", "cbt"],
          "highest_confidence_framework": "cbt",
          "complexity_score": 0.4
        },
        "total_confidence": 0.78
      },
      "ifs_analysis": {...}  // Backward compatibility
    }
  }
}
```

## Framework-Specific Detection

### CBT Detection
- **Cognitive Distortions**: Catastrophizing, all-or-nothing thinking, mind reading, fortune telling, personalization, emotional reasoning, should statements, labeling
- **Behavioral Patterns**: Avoidance, behavioral activation, safety behaviors, coping strategies
- **Thought Records**: Thoughts-feelings-behaviors connections
- **Interventions**: Behavioral experiments, homework assignments, cognitive restructuring

### Jungian Detection
- **Archetypal Content**: Shadow, anima/animus, persona, Self archetype
- **Dream Content**: Dream symbols, mythological themes, symbolic elements
- **Individuation**: Psychological development, self-realization markers
- **Complexes**: Emotional complexes, projections, compensation
- **Techniques**: Active imagination, amplification, synchronicity

### Narrative Therapy Detection
- **Externalization**: Problem separation, externalization language
- **Unique Outcomes**: Exceptions, alternative stories, different experiences
- **Re-authoring**: Preferred identity, identity claims, narrative shifts
- **Deconstruction**: Challenging dominant narratives, cultural critique
- **Witnessing**: Audience, community support, story sharing

### Attachment Theory Detection
- **Attachment Styles**: Secure, anxious, avoidant, disorganized patterns
- **Relational Patterns**: Pursuit-distance dynamics, repair attempts
- **Emotional Regulation**: Regulation strategies, co-regulation, dysregulation
- **Attachment Triggers**: Abandonment fears, intimacy fears, triggers
- **Attachment Needs**: Security, connection, autonomy needs

## Performance

### Speed Optimization
- **Pattern Matching**: < 50ms for all frameworks combined
- **LLM Analysis**: 1-5 seconds when triggered
- **Memory Usage**: Constant (analyzes only recent message window)
- **Error Isolation**: Individual framework failures don't affect others

### Cost Efficiency
- **Pattern-only**: $0 (when no patterns detected)
- **Hybrid Analysis**: ~$0.001-0.005 per analysis
- **Smart Triggering**: LLM only runs when patterns found

## Data Collection and Research

### Comprehensive Data Storage
- Framework-specific analysis results
- Cross-framework insights and correlations
- Historical analysis data for longitudinal studies
- Conversation-level aggregated metrics

### Research Export
```python
from src.psychology.multi_detector import MultiPsychologyDetector

detector = MultiPsychologyDetector()
research_data = detector.data_collector.export_research_data({
    'frameworks': ['cbt', 'attachment'],
    'date_from': '2025-01-01',
    'date_to': '2025-12-31'
})
```

## Usage Examples

### Basic Analysis
```python
from src.psychology.multi_detector import MultiPsychologyDetector

detector = MultiPsychologyDetector()
detector.register_all_frameworks()

messages = [
    {'role': 'user', 'content': 'I always think the worst will happen'},
    {'role': 'assistant', 'content': 'That sounds like catastrophic thinking'},
    {'role': 'user', 'content': 'Yes, and I have different parts that react differently'}
]

result = detector.analyze_conversation(messages)
print(f"Frameworks analyzed: {list(result['frameworks'].keys())}")
```

### Framework-Specific Configuration
```python
# Enable only specific frameworks
detector.framework_manager.disable_framework('jungian')
detector.framework_manager.enable_framework('cbt')

# Check enabled frameworks
enabled = detector.framework_manager.get_enabled_frameworks()
print(f"Enabled: {enabled}")
```

## Monitoring and Logging

The system provides comprehensive logging for monitoring:

```bash
# Framework registration
2025-01-01 10:00:00 - src.psychology.framework_manager - INFO - Registered framework: cbt

# Analysis execution
2025-01-01 10:01:00 - src.psychology.multi_detector - DEBUG - Patterns found for cbt, running LLM analysis
2025-01-01 10:01:02 - src.psychology.multi_detector - DEBUG - Psychology analysis completed: frameworks=['ifs', 'cbt'], total_confidence=0.78

# Error handling
2025-01-01 10:02:00 - src.psychology.multi_detector - ERROR - Framework cbt analysis failed: API timeout
```

## Migration from IFS-Only

The system maintains full backward compatibility:

1. **Existing IFS responses**: Continue to work unchanged
2. **IFS analysis**: Still available in `extra_data.ifs_analysis`
3. **New multi-framework data**: Available in `extra_data.psychology_analysis`
4. **Configuration**: IFS settings continue to work

## Troubleshooting

### Common Issues

**No frameworks detected:**
- Check `PSYCHOLOGY_DETECTION_ENABLED=true`
- Verify individual framework settings
- Check message count meets analysis intervals

**High API costs:**
- Increase analysis intervals
- Disable unused frameworks
- Monitor pattern sensitivity in logs

**Slow performance:**
- Reduce window sizes
- Increase analysis intervals
- Check LLM model configuration

### Health Check
```python
from src.psychology.multi_detector import MultiPsychologyDetector

detector = MultiPsychologyDetector()
detector.register_all_frameworks()

enabled = detector.framework_manager.get_enabled_frameworks()
print(f"System healthy: {len(enabled)} frameworks enabled")
```

## Future Extensions

The modular architecture supports easy addition of new frameworks:

1. Create new detector inheriting from `BaseFrameworkDetector`
2. Define framework-specific patterns and LLM prompts
3. Register with `FrameworkManager`
4. Add configuration variables

The system is designed for scalability and extensibility while maintaining performance and reliability.