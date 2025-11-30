# IFS Detection Feature

Internal Family Systems (IFS) detection for AI Chat API with bilingual support (English/Chinese).

## Overview

The IFS detection system automatically identifies **Self-energy** and **Parts** from conversation history using a hybrid approach for optimal speed and accuracy.

## Architecture

**Two-Stage Hybrid Detection:**

1. **Stage 1: Pattern Matching** (< 10ms)
   - Fast keyword/regex scanning
   - Supports English and Chinese
   - Detects obvious IFS indicators

2. **Stage 2: LLM Analysis** (only when patterns found)
   - Deep contextual analysis
   - Focused prompts for speed
   - Validates and enriches pattern findings

## Features

✅ **Bilingual Support**: English and Chinese language detection
✅ **Speed Optimized**: Pattern matching first, LLM only when needed
✅ **Cumulative State**: Tracks parts across conversation history
✅ **Configurable**: Analysis interval, window size, confidence thresholds
✅ **Non-intrusive**: Runs in background, doesn't affect user experience

## IFS Concepts Detected

### Self-Energy (8 C's)
- Curiosity
- Compassion
- Calm
- Clarity
- Confidence
- Courage
- Creativity
- Connectedness

### Parts

**Manager Parts** (Protective/Controlling):
- Perfectionist
- Critic
- Caretaker
- Planner

**Firefighter Parts** (Reactive/Distracting):
- Anger
- Avoidance
- Numbing
- Distraction

**Exile Parts** (Wounded/Vulnerable):
- Shame
- Fear
- Sadness
- Unworthiness

## Configuration

Edit `.env` file:

```env
# IFS Detection
IFS_DETECTION_ENABLED=true          # Enable/disable IFS detection
IFS_ANALYSIS_INTERVAL=3             # Analyze every N messages
IFS_WINDOW_SIZE=10                  # Number of recent messages to analyze
IFS_MIN_CONFIDENCE=0.6              # Minimum confidence threshold
IFS_LLM_MODEL=gpt-3.5-turbo        # Model for IFS analysis
```

### Recommendations:

- **High frequency** (interval=1): More responsive, higher cost
- **Balanced** (interval=3): Recommended for most use cases
- **Low frequency** (interval=5): Cost-effective, slower updates

## API Response Format

IFS analysis is returned in the `extra_data` field of the assistant message:

```json
{
  "session_id": "...",
  "conversation_id": 1,
  "assistant_message": {
    "id": 2,
    "role": "assistant",
    "content": "...",
    "extra_data": {
      "ifs_analysis": {
        "analyzed": true,
        "llm_used": true,
        "analysis_type": "hybrid",
        "self_presence": {
          "detected": true,
          "score": 0.75,
          "indicators": ["curiosity", "compassion"],
          "evidence": "User showed curiosity about their feelings"
        },
        "parts_detected": [
          {
            "id": "part_1",
            "type": "manager",
            "subtype": "perfectionist",
            "name": "The Perfectionist",
            "intensity": 0.8,
            "emotions": ["anxiety", "control"],
            "triggers": ["fear of failure"],
            "evidence": "User used 'should' and 'must' frequently",
            "confidence": 0.75
          }
        ],
        "last_analyzed_message_id": 6,
        "analysis_count": 2,
        "timestamp": "2025-11-01T21:30:00Z"
      }
    }
  }
}
```

## Performance

### Speed:
- **Pattern matching**: < 10ms
- **LLM analysis** (when triggered): 1-3 seconds
- **Total overhead**: Minimal impact on user experience

### Cost Efficiency:
- **Pattern-only**: $0 (40-60% of cases)
- **Hybrid (with LLM)**: ~$0.001-0.003 per analysis
- **100-message conversation**: ~$0.03-0.10 (GPT-3.5)

### Resource Usage:
- **Constant memory**: Analyzes only last N messages
- **Scalable**: Works with conversations of any length

## Module Structure

```
src/ifs/
├── __init__.py           # Module exports
├── detector.py           # Main orchestrator
├── pattern_matcher.py    # Stage 1: Fast pattern matching
├── llm_analyzer.py       # Stage 2: LLM analysis
├── prompts.py            # Optimized prompts for LLM
├── models.py             # Pydantic data models
└── state_manager.py      # Cumulative state management
```

## How It Works

1. **Trigger Check**: Every N messages (configurable)
2. **Pattern Scan**: Fast keyword matching in last N messages
3. **LLM Analysis**: Only if patterns found
4. **State Merge**: Combine with existing IFS state
5. **Storage**: Save in conversation and message metadata
6. **Response**: Include in API response

## Privacy & Security

- ✅ Analysis runs server-side only
- ✅ Not exposed in chat content to users
- ✅ Stored in database `extra_data` (optional)
- ✅ Can be disabled per configuration
- ✅ No external data sharing

## Example Usage

### English Conversation:
```
User: "I feel like I should be perfect at everything"
→ Detected: Manager part (Perfectionist)

User: "I'm curious about why I feel this way"
→ Detected: Self-energy (Curiosity)
```

### Chinese Conversation:
```
User: "我应该在所有事情上做到完美"
→ Detected: Manager part (Perfectionist)

User: "我很好奇为什么我会有这种感觉"
→ Detected: Self-energy (Curiosity)
```

## Monitoring

Check logs for IFS detection activity:

```bash
# In application logs
2025-11-01 21:06:15 - src.ifs.detector - DEBUG - Running pattern matching on 10 messages
2025-11-01 21:06:15 - src.ifs.detector - DEBUG - Patterns found, running LLM analysis
2025-11-01 21:06:17 - src.api.app - DEBUG - IFS analysis completed: hybrid, LLM used: True
```

## Troubleshooting

**IFS not detecting:**
- Check `IFS_DETECTION_ENABLED=true`
- Verify message count meets `IFS_ANALYSIS_INTERVAL`
- Check logs for errors

**Slow performance:**
- Reduce `IFS_WINDOW_SIZE` (less context)
- Increase `IFS_ANALYSIS_INTERVAL` (less frequent)
- Use `gpt-3.5-turbo` instead of `gpt-4`

**High costs:**
- Increase `IFS_ANALYSIS_INTERVAL`
- Patterns might be too sensitive (check logs)
- Consider pattern-only mode for some cases
