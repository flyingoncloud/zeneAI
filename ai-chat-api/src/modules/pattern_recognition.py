"""
Pattern Recognition Analyzer for ZeneAI

Identifies psychological patterns from conversation history:
- Defense mechanisms (avoidance, projection, rationalization, denial)
- Attachment patterns (anxious, avoidant, disorganized)
- Recurring themes (repeated conflicts, relationship patterns, emotional triggers)

Uses hybrid approach: Keyword-based (Tier 1) + Selective LLM analysis (Tier 2)
"""

from typing import Dict, List, Optional, Any
from collections import Counter
import re
import json


class PatternRecognitionAnalyzer:
    """
    Detects psychological patterns from conversation history
    Phase 1: Keyword-based detection (always-on, free, fast)
    Phase 2: LLM-based analysis (selective, accurate, when needed)
    """

    # Defense mechanism keywords (bilingual)
    DEFENSE_MECHANISMS_ZH = {
        "avoidance": ["不想谈", "换个话题", "不愿意", "逃避", "避开", "不说了", "算了吧"],
        "projection": ["都是他们", "别人总是", "不是我的问题", "是他的错", "都怪"],
        "rationalization": ["其实也没什么", "这很正常", "大家都这样", "也没多大事", "不算什么"],
        "denial": ["没有", "不是", "我很好", "没问题", "没事", "没什么"]
    }

    DEFENSE_MECHANISMS_EN = {
        "avoidance": ["don't want to talk", "change the subject", "avoid", "don't wanna", "let's not"],
        "projection": ["it's their fault", "they always", "not my problem", "it's because of them"],
        "rationalization": ["actually fine", "it's normal", "everyone does", "no big deal", "not that bad"],
        "denial": ["no", "not", "i'm fine", "no problem", "nothing wrong"]
    }

    # Attachment pattern keywords (bilingual)
    ATTACHMENT_PATTERNS_ZH = {
        "anxious": ["害怕失去", "需要确认", "担心被抛弃", "过度依赖", "不安全", "总是担心", "需要保证"],
        "avoidant": ["需要空间", "保持距离", "不想太亲密", "独立", "不依赖", "自己解决"],
        "disorganized": ["矛盾", "又想又怕", "忽冷忽热", "不知道要不要", "摇摆不定"]
    }

    ATTACHMENT_PATTERNS_EN = {
        "anxious": ["fear of losing", "need reassurance", "abandoned", "clingy", "need confirmation", "insecure"],
        "avoidant": ["need space", "keep distance", "don't want intimacy", "independent", "alone"],
        "disorganized": ["conflicted", "push and pull", "hot and cold", "can't decide", "ambivalent"]
    }

    # Theme keywords for frequency tracking
    THEME_KEYWORDS_ZH = {
        "workplace_conflict": ["工作", "老板", "同事", "职场", "公司"],
        "relationship_issues": ["关系", "伴侣", "恋爱", "分手", "吵架"],
        "family_dynamics": ["家人", "父母", "家庭", "妈妈", "爸爸"],
        "self_worth": ["不够好", "没价值", "自卑", "配不上", "不值得"],
        "anxiety_stress": ["焦虑", "压力", "紧张", "担心", "害怕"]
    }

    THEME_KEYWORDS_EN = {
        "workplace_conflict": ["work", "boss", "colleague", "job", "office"],
        "relationship_issues": ["relationship", "partner", "dating", "breakup", "fight"],
        "family_dynamics": ["family", "parents", "mom", "dad", "home"],
        "self_worth": ["not good enough", "worthless", "insecure", "don't deserve"],
        "anxiety_stress": ["anxious", "stress", "worried", "nervous", "scared"]
    }

    def __init__(self):
        """Initialize pattern recognition analyzer"""
        self.min_confidence = 0.6  # Minimum confidence for pattern detection

    def analyze_patterns(
        self,
        conversation_history: List[Dict[str, str]],
        psychological_state: Dict[str, Any],
        language: str = "zh"
    ) -> Dict[str, Any]:
        """
        Main entry point for pattern analysis

        Args:
            conversation_history: List of messages [{"role": "user"|"assistant", "content": "..."}]
            psychological_state: Current psychological state from analyzer
            language: "zh" or "en"

        Returns:
            Pattern analysis results with confidence scores
        """
        # Extract user messages only
        user_messages = [msg["content"] for msg in conversation_history if msg["role"] == "user"]

        if len(user_messages) < 2:
            return self._empty_pattern_result()

        # Tier 1: Keyword-based detection (always-on)
        defense_mechanisms = self._detect_defense_mechanisms(user_messages, language)
        attachment_patterns = self._detect_attachment_patterns(user_messages, language)
        recurring_themes = self._detect_recurring_themes(user_messages, language)

        # Count keyword indicators for LLM trigger decision
        keyword_indicators = 0
        if defense_mechanisms.get("detected"):
            keyword_indicators += len(defense_mechanisms["detected"])
        if attachment_patterns.get("primary_pattern"):
            keyword_indicators += 1
        if recurring_themes.get("themes"):
            keyword_indicators += len(recurring_themes["themes"])

        # Tier 2: LLM-based analysis (selective, when conditions met)
        conversation_depth = psychological_state.get("conversation_depth", 0)
        message_count = len(user_messages)

        if self._should_use_llm_analysis(conversation_depth, message_count, keyword_indicators):
            try:
                llm_results = self._llm_pattern_analysis(
                    user_messages=user_messages,
                    keyword_results={
                        "defense_mechanisms": defense_mechanisms,
                        "attachment_patterns": attachment_patterns,
                        "recurring_themes": recurring_themes
                    },
                    language=language
                )

                # Enhance keyword results with LLM insights
                if llm_results:
                    defense_mechanisms = self._merge_pattern_results(
                        defense_mechanisms,
                        llm_results.get("defense_mechanisms", {})
                    )
                    attachment_patterns = self._merge_pattern_results(
                        attachment_patterns,
                        llm_results.get("attachment_patterns", {})
                    )

                analysis_method = "hybrid"
            except Exception as e:
                print(f"LLM pattern analysis failed, using keyword-only: {e}")
                analysis_method = "keyword_based"
        else:
            analysis_method = "keyword_based"

        return {
            "defense_mechanisms": defense_mechanisms,
            "attachment_patterns": attachment_patterns,
            "recurring_themes": recurring_themes,
            "analysis_method": analysis_method
        }

    def _detect_defense_mechanisms(
        self,
        messages: List[str],
        language: str
    ) -> Dict[str, Any]:
        """
        Detect defense mechanisms using keyword matching

        Returns:
            {
                "detected": ["avoidance", "rationalization"],
                "confidence": 0.75,
                "evidence": ["User changed topic 3 times"],
                "impact": "May be avoiding core emotional issue"
            }
        """
        keywords = self.DEFENSE_MECHANISMS_ZH if language == "zh" else self.DEFENSE_MECHANISMS_EN
        detected_mechanisms = []
        evidence = []

        for mechanism, patterns in keywords.items():
            count = 0
            occurrences = []

            for idx, message in enumerate(messages):
                message_lower = message.lower()
                for pattern in patterns:
                    if pattern in message_lower:
                        count += 1
                        occurrences.append(f"Message {idx + 1}: '{pattern}'")

            # Threshold: Need at least 2 occurrences to confirm pattern
            if count >= 2:
                detected_mechanisms.append(mechanism)
                evidence.extend(occurrences[:3])  # Keep first 3 examples

        if not detected_mechanisms:
            return {"detected": [], "confidence": 0.0, "evidence": [], "impact": ""}

        # Calculate confidence based on number of mechanisms and occurrences
        confidence = min(0.6 + (len(detected_mechanisms) * 0.15), 0.95)

        # Generate impact statement
        impact = self._generate_defense_impact(detected_mechanisms, language)

        return {
            "detected": detected_mechanisms,
            "confidence": round(confidence, 2),
            "evidence": evidence[:5],  # Max 5 evidence items
            "impact": impact
        }

    def _detect_attachment_patterns(
        self,
        messages: List[str],
        language: str
    ) -> Dict[str, Any]:
        """
        Detect attachment patterns using keyword matching

        Returns:
            {
                "primary_pattern": "anxious",
                "confidence": 0.65,
                "indicators": ["Fear of abandonment", "Seeking reassurance"]
            }
        """
        keywords = self.ATTACHMENT_PATTERNS_ZH if language == "zh" else self.ATTACHMENT_PATTERNS_EN
        pattern_scores = {}

        for pattern_type, patterns in keywords.items():
            count = 0
            indicators = []

            for message in messages:
                message_lower = message.lower()
                for pattern in patterns:
                    if pattern in message_lower:
                        count += 1
                        if pattern not in indicators:
                            indicators.append(pattern)

            if count >= 2:  # Need at least 2 indicators
                pattern_scores[pattern_type] = {
                    "score": count,
                    "indicators": indicators[:3]
                }

        if not pattern_scores:
            return {"primary_pattern": None, "confidence": 0.0, "indicators": []}

        # Select primary pattern (highest score)
        primary = max(pattern_scores.items(), key=lambda x: x[1]["score"])
        pattern_name = primary[0]
        pattern_data = primary[1]

        # Calculate confidence
        confidence = min(0.6 + (pattern_data["score"] * 0.1), 0.85)

        return {
            "primary_pattern": pattern_name,
            "confidence": round(confidence, 2),
            "indicators": pattern_data["indicators"]
        }

    def _detect_recurring_themes(
        self,
        messages: List[str],
        language: str
    ) -> Dict[str, Any]:
        """
        Detect recurring themes through frequency analysis

        Returns:
            {
                "themes": [
                    {
                        "theme": "workplace_conflict",
                        "frequency": 3,
                        "emotional_charge": 0.8
                    }
                ],
                "dominant_theme": "workplace_conflict"
            }
        """
        keywords = self.THEME_KEYWORDS_ZH if language == "zh" else self.THEME_KEYWORDS_EN
        theme_counts = {}

        for theme, patterns in keywords.items():
            count = 0
            for message in messages:
                message_lower = message.lower()
                for pattern in patterns:
                    if pattern in message_lower:
                        count += 1

            if count >= 2:  # Need at least 2 mentions
                theme_counts[theme] = count

        if not theme_counts:
            return {"themes": [], "dominant_theme": None}

        # Create theme objects
        themes = [
            {
                "theme": theme,
                "frequency": count,
                "emotional_charge": self._estimate_emotional_charge(theme, count)
            }
            for theme, count in theme_counts.items()
        ]

        # Sort by frequency
        themes.sort(key=lambda x: x["frequency"], reverse=True)

        return {
            "themes": themes,
            "dominant_theme": themes[0]["theme"] if themes else None
        }

    def _generate_defense_impact(self, mechanisms: List[str], language: str) -> str:
        """Generate human-readable impact statement for detected defense mechanisms"""
        if language == "zh":
            impacts = {
                "avoidance": "可能在回避核心情绪问题",
                "projection": "可能将内在冲突投射到外部",
                "rationalization": "可能在理智化以避免感受情绪",
                "denial": "可能在否认或最小化情绪体验"
            }
        else:
            impacts = {
                "avoidance": "May be avoiding core emotional issues",
                "projection": "May be projecting internal conflicts outward",
                "rationalization": "May be intellectualizing to avoid feeling emotions",
                "denial": "May be denying or minimizing emotional experiences"
            }

        # Return impact for first mechanism (most prominent)
        return impacts.get(mechanisms[0], "")

    def _estimate_emotional_charge(self, theme: str, frequency: int) -> float:
        """
        Estimate emotional charge of a theme based on frequency
        Higher frequency + certain themes = higher emotional charge
        """
        # Base charge from frequency
        base_charge = min(frequency * 0.2, 0.7)

        # High-charge themes get boost
        high_charge_themes = ["anxiety_stress", "self_worth", "relationship_issues"]
        if theme in high_charge_themes:
            base_charge += 0.2

        return min(round(base_charge, 2), 1.0)

    def _empty_pattern_result(self) -> Dict[str, Any]:
        """Return empty pattern result for insufficient data"""
        return {
            "defense_mechanisms": {"detected": [], "confidence": 0.0, "evidence": [], "impact": ""},
            "attachment_patterns": {"primary_pattern": None, "confidence": 0.0, "indicators": []},
            "recurring_themes": {"themes": [], "dominant_theme": None},
            "analysis_method": "insufficient_data"
        }

    def _should_use_llm_analysis(
        self,
        conversation_depth: float,
        message_count: int,
        keyword_indicators: int
    ) -> bool:
        """
        Determine if LLM-based analysis should be used

        Criteria:
        - Conversation depth ≥ 0.5 (meaningful conversation)
        - Message count ≥ 5 (enough context)
        - Keyword indicators ≥ 2 (some patterns detected)
        """
        try:
            from src.config.settings import (
                PATTERN_RECOGNITION_ENABLED,
                PATTERN_LLM_THRESHOLD,
                PATTERN_MIN_MESSAGES
            )

            return (
                PATTERN_RECOGNITION_ENABLED and
                conversation_depth >= PATTERN_LLM_THRESHOLD and
                message_count >= PATTERN_MIN_MESSAGES and
                keyword_indicators >= 2
            )
        except ImportError:
            # Fallback if settings not available
            return (
                conversation_depth >= 0.5 and
                message_count >= 5 and
                keyword_indicators >= 2
            )

    def _llm_pattern_analysis(
        self,
        user_messages: List[str],
        keyword_results: Dict[str, Any],
        language: str
    ) -> Optional[Dict[str, Any]]:
        """
        Use LLM (GPT-3.5) to enhance pattern recognition

        Args:
            user_messages: List of user messages
            keyword_results: Results from keyword-based detection
            language: Language code

        Returns:
            LLM-enhanced pattern analysis or None if failed
        """
        try:
            from openai import OpenAI
            from src.config.settings import OPENAI_API_KEY

            client = OpenAI(api_key=OPENAI_API_KEY)

            # Build conversation context (last 10 messages for efficiency)
            recent_messages = user_messages[-10:]
            conversation_text = "\n".join([f"User: {msg}" for msg in recent_messages])

            # Build analysis prompt
            if language == "zh":
                prompt = self._build_chinese_llm_prompt(conversation_text, keyword_results)
            else:
                prompt = self._build_english_llm_prompt(conversation_text, keyword_results)

            # Call GPT-3.5-turbo
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a clinical psychologist analyzing conversation patterns."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=500
            )

            result_text = response.choices[0].message.content

            # Parse JSON response
            llm_analysis = json.loads(result_text)
            return llm_analysis

        except Exception as e:
            print(f"LLM pattern analysis error: {e}")
            return None

    def _build_chinese_llm_prompt(
        self,
        conversation_text: str,
        keyword_results: Dict[str, Any]
    ) -> str:
        """Build Chinese prompt for LLM pattern analysis"""
        return f"""分析以下对话中的心理模式。基于关键词检测已发现以下初步模式：

**防御机制**: {keyword_results['defense_mechanisms'].get('detected', [])}
**依恋模式**: {keyword_results['attachment_patterns'].get('primary_pattern', 'None')}

**对话内容**:
{conversation_text}

请分析并以JSON格式返回：
{{
    "defense_mechanisms": {{
        "detected": ["list of mechanisms"],
        "confidence": 0.0-1.0,
        "evidence": ["brief examples"],
        "impact": "short description"
    }},
    "attachment_patterns": {{
        "primary_pattern": "anxious|avoidant|disorganized|secure|null",
        "confidence": 0.0-1.0,
        "indicators": ["brief indicators"]
    }}
}}

只返回JSON，不要其他文字。"""

    def _build_english_llm_prompt(
        self,
        conversation_text: str,
        keyword_results: Dict[str, Any]
    ) -> str:
        """Build English prompt for LLM pattern analysis"""
        return f"""Analyze psychological patterns in this conversation. Keyword detection found preliminary patterns:

**Defense Mechanisms**: {keyword_results['defense_mechanisms'].get('detected', [])}
**Attachment Pattern**: {keyword_results['attachment_patterns'].get('primary_pattern', 'None')}

**Conversation**:
{conversation_text}

Return JSON only:
{{
    "defense_mechanisms": {{
        "detected": ["list of mechanisms"],
        "confidence": 0.0-1.0,
        "evidence": ["brief examples"],
        "impact": "short description"
    }},
    "attachment_patterns": {{
        "primary_pattern": "anxious|avoidant|disorganized|secure|null",
        "confidence": 0.0-1.0,
        "indicators": ["brief indicators"]
    }}
}}

JSON only, no other text."""

    def _merge_pattern_results(
        self,
        keyword_result: Dict[str, Any],
        llm_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge keyword-based and LLM-based results

        Strategy: Use LLM confidence if higher, otherwise keep keyword results
        """
        if not llm_result:
            return keyword_result

        keyword_conf = keyword_result.get("confidence", 0.0)
        llm_conf = llm_result.get("confidence", 0.0)

        # If LLM has higher confidence, use LLM results
        if llm_conf > keyword_conf:
            # But combine evidence from both
            keyword_evidence = keyword_result.get("evidence", [])
            llm_evidence = llm_result.get("evidence", [])
            llm_result["evidence"] = llm_evidence + keyword_evidence[:2]  # Add top 2 keyword evidence
            return llm_result
        else:
            return keyword_result
