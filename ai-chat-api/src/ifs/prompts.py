"""Optimized prompts for IFS LLM analysis.

Bilingual support (English/Chinese) with focused, concise prompts for speed.
"""

# Compact, focused IFS analysis prompt
IFS_ANALYSIS_PROMPT = """You are an expert in Internal Family Systems (IFS) therapy. Analyze the conversation and identify:

1. **Self-energy** (8 C's): curiosity, compassion, calm, clarity, confidence, courage, creativity, connectedness
2. **Parts**:
   - Managers (protective/controlling): perfectionist, caretaker, planner, critic
   - Firefighters (reactive/distracting): anger, avoidance, numbing
   - Exiles (wounded/vulnerable): shame, fear, sadness, unworthiness

Focus on: {focus_areas}

Recent conversation:
{conversation}

Return JSON only:
{{
  "self_presence": {{
    "detected": bool,
    "score": 0.0-1.0,
    "indicators": ["curiosity", ...],
    "evidence": "brief quote or observation"
  }},
  "parts": [
    {{
      "type": "manager|firefighter|exile",
      "subtype": "perfectionist|critic|...",
      "name": "suggested name",
      "intensity": 0.0-1.0,
      "emotions": ["anxiety", ...],
      "triggers": ["failure", ...],
      "evidence": "brief quote",
      "confidence": 0.0-1.0
    }}
  ]
}}

Be concise. Use evidence from conversation. Support both English and Chinese."""

# Simplified prompt for when only specific types detected
IFS_FOCUSED_PROMPT = """Analyze this conversation for IFS {part_types}.

Conversation:
{conversation}

Return JSON with detected parts only:
{{
  "parts": [
    {{
      "type": "{part_type}",
      "subtype": "...",
      "intensity": 0.0-1.0,
      "evidence": "quote",
      "confidence": 0.0-1.0
    }}
  ]
}}

Brief analysis only. English/Chinese supported."""


def build_analysis_prompt(messages: list, detected_patterns: dict) -> str:
    """
    Build focused prompt based on detected patterns for speed.

    Args:
        messages: Recent conversation messages
        detected_patterns: Results from pattern matcher

    Returns:
        Optimized prompt string
    """
    # Format conversation (only last few exchanges for speed)
    conversation = _format_conversation(messages[-6:])  # Last 3 exchanges

    # Determine focus areas based on pattern detection
    focus_areas = []
    if detected_patterns.get('self_indicators'):
        focus_areas.append("Self-energy")
    if detected_patterns.get('manager_parts'):
        focus_areas.append("Manager parts")
    if detected_patterns.get('firefighter_parts'):
        focus_areas.append("Firefighter parts")
    if detected_patterns.get('exile_parts'):
        focus_areas.append("Exile parts")

    focus_str = ", ".join(focus_areas) if focus_areas else "all IFS elements"

    # Use compact prompt
    return IFS_ANALYSIS_PROMPT.format(
        focus_areas=focus_str,
        conversation=conversation
    )


def build_focused_prompt(messages: list, part_types: list) -> str:
    """
    Build ultra-focused prompt for specific part types only.
    Even faster for simple cases.

    Args:
        messages: Recent conversation messages
        part_types: List of part types to focus on

    Returns:
        Focused prompt string
    """
    conversation = _format_conversation(messages[-4:])  # Even shorter for speed
    types_str = ", ".join(part_types)

    return IFS_FOCUSED_PROMPT.format(
        part_types=types_str,
        part_type=part_types[0] if len(part_types) == 1 else "various",
        conversation=conversation
    )


def _format_conversation(messages: list) -> str:
    """
    Format messages for LLM analysis.
    Keep it compact for speed.
    """
    formatted = []
    for msg in messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        # Truncate very long messages
        if len(content) > 300:
            content = content[:300] + "..."
        formatted.append(f"{role.capitalize()}: {content}")

    return "\n".join(formatted)
