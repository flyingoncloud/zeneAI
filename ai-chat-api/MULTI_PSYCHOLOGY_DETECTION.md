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

## Psychology-Informed AI Responses

### Overview

The AI responses are now contextually informed by the detected psychological frameworks. When the multi-framework psychology detection system identifies patterns in the conversation, this information is provided to the AI to generate more therapeutically relevant and framework-appropriate responses.

### How It Works

1. **Pre-Response Analysis**: Psychology detection runs BEFORE generating the AI response
2. **Context Generation**: Detected patterns are converted into therapeutic context
3. **Informed Response**: AI receives psychology context in the system prompt
4. **Natural Integration**: Psychology insights are woven naturally into responses

### Framework-Specific Response Adaptations

#### IFS-Informed Responses
When IFS patterns are detected, the AI will:
- Acknowledge different parts that may be present
- Recognize Self-energy when detected
- Use parts-friendly language
- Avoid pathologizing internal conflicts

**Example Context**: "IFS部分活跃：perfectionist, critic；检测到自我能量存在"

#### CBT-Informed Responses  
When CBT patterns are detected, the AI will:
- Gently address cognitive distortions without being confrontational
- Suggest behavioral observations or experiments
- Acknowledge thought-feeling-behavior connections
- Support cognitive restructuring when appropriate

**Example Context**: "认知扭曲模式：catastrophizing, all_or_nothing；行为模式：avoidance"

#### Jungian-Informed Responses
When Jungian patterns are detected, the AI will:
- Honor symbolic and archetypal content
- Explore deeper meanings in dreams or imagery
- Support individuation process
- Acknowledge shadow work or projection

**Example Context**: "原型内容：shadow, anima；梦境或象征性内容；个体化过程指标"

#### Narrative-Informed Responses
When Narrative patterns are detected, the AI will:
- Support problem externalization language
- Encourage alternative story development
- Acknowledge unique outcomes and exceptions
- Honor preferred identity claims

**Example Context**: "问题外化语言；重新创作身份；独特结果或例外"

#### Attachment-Informed Responses
When Attachment patterns are detected, the AI will:
- Acknowledge attachment needs and fears
- Validate relational experiences
- Support emotional regulation
- Honor attachment styles without judgment

**Example Context**: "依恋模式：anxious, avoidant；情绪调节模式；关系动态模式"

### Multi-Framework Integration

When multiple frameworks are detected, the AI receives integrated context:

**Example**: "认知扭曲模式：catastrophizing；IFS部分活跃：critic；依恋模式：anxious；检测到多个心理学框架的模式：cbt, ifs, attachment，表明复杂的心理呈现"

This enables the AI to:
- Acknowledge the complexity of the psychological presentation
- Draw connections between different therapeutic perspectives
- Provide more nuanced and comprehensive responses
- Avoid over-focusing on a single therapeutic modality

### Response Quality Features

#### Natural Integration
- Psychology insights are woven naturally into conversation
- Avoids overly technical or clinical language
- Maintains conversational flow and empathy
- Doesn't feel robotic or template-based

#### Therapeutic Sensitivity
- Respects the user's psychological state
- Avoids triggering or confrontational language
- Supports the user's current capacity
- Honors their therapeutic journey

#### Cultural Adaptation
- Chinese responses incorporate culturally appropriate therapeutic concepts
- English responses maintain Western therapeutic frameworks
- Bilingual pattern detection ensures accurate cultural context

### Configuration

Psychology-informed responses can be controlled through:

```env
# Enable/disable psychology-informed responses
PSYCHOLOGY_DETECTION_ENABLED=true

# Individual framework controls affect response context
CBT_DETECTION_ENABLED=true
JUNGIAN_DETECTION_ENABLED=true
# ... etc

# Confidence thresholds affect when context is included
CBT_MIN_CONFIDENCE=0.7  # Higher = more selective context
```

### Example Response Comparison

#### Without Psychology Context:
**User**: "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应。"

**AI Response**: "听起来你在经历一些焦虑。你能告诉我更多关于这些感受的情况吗？"

#### With Psychology Context:
**Psychology Context**: "认知扭曲模式：catastrophizing；IFS部分活跃：manager, exile；检测到多个心理学框架的模式：cbt, ifs，表明复杂的心理呈现"

**AI Response**: "我听到你提到了灾难性思维的模式，这确实会带来很多焦虑。同时，你对内在不同部分的觉察很有价值——这些部分可能都在试图以自己的方式保护你。你能感受到这些不同部分是如何对压力做出反应的吗？"

### Benefits

1. **More Relevant Responses**: AI responses are tailored to detected psychological patterns
2. **Therapeutic Alignment**: Responses align with appropriate therapeutic frameworks
3. **Reduced Misunderstanding**: AI avoids responses that conflict with user's psychological state
4. **Enhanced Empathy**: Deeper understanding leads to more empathetic responses
5. **Therapeutic Support**: Responses can gently support therapeutic processes

### Monitoring and Quality Assurance

The system logs psychology context usage:

```bash
2025-01-01 10:01:00 - src.api.chat_service - DEBUG - Psychology context generated: 认知扭曲模式：catastrophizing；IFS部分活跃：critic
2025-01-01 10:01:02 - src.api.app - DEBUG - AI response generated with psychology context
```

This enables monitoring of:
- How often psychology context influences responses
- Which frameworks most commonly inform responses
- Response quality and therapeutic appropriateness

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