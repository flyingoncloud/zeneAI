"""
Module Recommendation Engine

Orchestrates psychological state analysis, trigger detection, and
module recommendation generation for natural AI-guided module suggestions.
"""

from typing import Dict, List, Optional, Any
import random
import re
from sqlalchemy.orm import Session

from .llm_analyzer import LLMAnalyzer
from .trigger_detector import TriggerDetector
from .module_config import MODULES, get_module_by_id


class ModuleRecommender:
    """Main orchestrator for module recommendations"""

    def __init__(self):
        self.analyzer = LLMAnalyzer()
        self.detector = TriggerDetector()


    def _convert_state_to_numerical(self, llm_state: Dict, conversation_history: List[Dict[str, str]]) -> Dict:
        """Converts the LLM's categorical state into numerical scores for the frontend."""
        
        # Mapping for intensity and clarity
        intensity_map = {"high": 0.9, "medium": 0.6, "low": 0.3}
        clarity_map = {"clear": 0.8, "vague": 0.2}
        awareness_map = {"present": 0.8, "absent": 0.2}

        # Calculate conversation depth
        message_count = len(conversation_history)
        user_messages = [msg for msg in conversation_history if msg.get("role") == "user"]
        avg_length = sum(len(msg.get("content", "")) for msg in user_messages) / len(user_messages) if user_messages else 0
        depth_from_count = min(message_count / 10, 0.5)
        depth_from_length = min(avg_length / 200, 0.3)
        conversation_depth = depth_from_count + depth_from_length

        numerical_state = {
            "emotional_intensity": intensity_map.get(llm_state.get("emotional_intensity"), 0.0),
            "emotional_clarity": clarity_map.get(llm_state.get("expression_clarity"), 0.5),
            "self_awareness": awareness_map.get(llm_state.get("exploration_willingness"), 0.2),
            "expression_complexity": 0.5,  # Default value as there's no direct mapping
            "conversation_depth": min(conversation_depth, 1.0)
        }
        return numerical_state

    def get_recommendations(
        self,
        current_message: str,
        conversation_history: List[Dict[str, str]],
        conversation_id: Optional[int] = None,
        db_session: Optional[Session] = None,
        language: str = "zh",
        max_recommendations: int = 2
    ) -> Dict:
        """
        Analyze user state and generate module recommendations using LLM.
        """
        # Calculate conversation turn count
        turn_count = len([msg for msg in conversation_history if msg.get("role") == "user"])

        # Step 1: Enhanced psychological state analysis with LLM
        llm_psychological_state = self.analyzer.analyze_state_with_llm(
            current_message=current_message,
            conversation_history=conversation_history,
            turn_count=turn_count
        )

        # Step 2: Detect triggers based on the new psychological state format
        triggers = self.detector.detect_triggers(
            psychological_state=llm_psychological_state,
            turn_count=turn_count
        )

        # Step 3: Get top recommendations
        top_recommendations = self.detector.get_top_recommendations(
            triggers=triggers,
            max_recommendations=max_recommendations,
            psychological_state=llm_psychological_state
        )

        # Step 4: Build recommendation details with guidance
        recommendations = []
        for rec in top_recommendations:
            module_id = rec["module_id"]
            module_config = get_module_by_id(module_id)

            if module_config:
                guidance = self._select_guidance_template(
                    module_config=module_config,
                    reasons=rec["reasons"],
                    language=language
                )

                recommendations.append({
                    "module_id": module_id,
                    "name": module_config[f"name_{language}"],
                    "icon": module_config["icon"],
                    "description": module_config[f"description_{language}"],
                    "guidance": guidance,
                    "score": rec.get("score", 0.9), # Add default score
                    "priority": rec["priority"],
                    "reasons": rec["reasons"]
                })
        
        # Convert state to numerical format for frontend
        numerical_psychological_state = self._convert_state_to_numerical(llm_psychological_state, conversation_history)

        return {
            "has_recommendations": len(recommendations) > 0,
            "recommendations": recommendations,
            "psychological_state": numerical_psychological_state,
            "patterns": {}, # Patterns not implemented in this version
            "progression": {}, # Progression not implemented in this version
            "language": language
        }

    def _select_guidance_template(
        self,
        module_config: Dict,
        reasons: List[str],
        language: str
    ) -> str:
        """
        Select appropriate guidance template based on trigger reasons

        Args:
            module_config: Module configuration
            reasons: List of trigger reasons
            language: Language code

        Returns:
            Natural guidance text
        """
        templates_key = f"guidance_template_{language}"
        templates = module_config.get(templates_key, [])

        if not templates:
            return ""

        # Default: randomly select to avoid repetition
        return random.choice(templates)

    def format_for_ai_prompt(self, recommendations_result: Dict) -> str:
        """
        Format recommendations for inclusion in AI system prompt

        Enhanced with psychological context (patterns + progression)

        Args:
            recommendations_result: Output from get_recommendations()

        Returns:
            Formatted instruction for AI to naturally mention modules
        """
        if not recommendations_result.get("has_recommendations"):
            return ""

        recommendations = recommendations_result["recommendations"]
        patterns = recommendations_result.get("patterns", {})
        progression = recommendations_result.get("progression", {})
        language = recommendations_result.get("language", "zh")

        if language == "zh":
            return self._format_chinese_prompt(recommendations, patterns, progression)
        else:
            return self._format_english_prompt(recommendations, patterns, progression)

    def _format_chinese_prompt(
        self,
        recommendations: List[Dict],
        patterns: Dict[str, Any],
        progression: Dict[str, Any]
    ) -> str:
        """
        Format Chinese prompt for AI with psychological context

        Args:
            recommendations: List of module recommendations
            patterns: Pattern recognition results
            progression: Emotional progression analysis
        """
        if not recommendations:
            return ""

        # Build context awareness
        context_notes = []

        # Check emotional progression
        trajectory = progression.get("trajectory", "")
        if trajectory == "escalating":
            context_notes.append("用户情绪正在升高，需要immediate support")

        # Check defense mechanisms
        defense_mechanisms = patterns.get("defense_mechanisms", {})
        if defense_mechanisms.get("detected"):
            context_notes.append("用户可能在使用防御机制回避，需要更温柔非评判的语气")

        # Check attachment patterns
        attachment_patterns = patterns.get("attachment_patterns", {})
        if attachment_patterns.get("primary_pattern") == "anxious":
            context_notes.append("用户显示焦虑型依恋特征，需要额外的温暖和安全感")

        context_hint = "。".join(context_notes) + "。" if context_notes else ""

        # Format module list
        if len(recommendations) == 1:
            # Single module
            rec = recommendations[0]
            module_text = f"根据用户当前的状态，「{rec['name']}」可能有帮助。\n\n参考引导语：{rec['guidance']}"
        else:
            # Multiple modules
            module_list = []
            for i, rec in enumerate(recommendations, 1):
                module_list.append(f"{i}. 「{rec['name']}」\n   引导语：{rec['guidance']}")
            module_text = "根据用户当前的状态，以下模块可能有帮助：\n\n" + "\n\n".join(module_list)

        return f"""
---
💡 **可选建议** （请谨慎使用）：

{module_text}

{context_hint}

**何时【绝对不要】推荐模块** （优先级最高，必须遵守）：
❌ 用户明确说"不想做"/"不需要"/"不要推荐" - 绝对不要提及任何模块
❌ 用户说"我只想聊聊"/"听我说说就好"/"就想倾诉" - 专注倾听，不要推荐
❌ 用户正在深度倾诉、情绪宣泄或讲述重要经历时 - 不要打断
❌ 对话非常自然流畅，用户正在逐步打开心扉时 - 不要生硬插入工具
❌ 你觉得推荐会破坏对话节奏或让用户感到被打断 - 信任你的判断，不推荐

**何时【可以考虑】推荐模块** （自然时机）：
✅ 用户明确求助："有什么方法"/"怎么办"/"该怎么做"/"能帮我吗"
✅ 用户情绪卡住、重复表达同样困扰、似乎找不到出口时
✅ 用户表达探索意愿："我想了解自己"/"为什么我总是这样"
✅ 对话出现自然停顿、用户似乎在等待建议或下一步引导时
✅ 用户完成情绪表达后，进入更平静的反思阶段

**如何推荐** （像朋友聊天，不是任务清单）：
- 自然融入对话，不要突兀地转换话题
- 用试探语气："如果你愿意"/"要不要试试"/"或许可以"
- 永远给予选择空间，不是指令或要求
- 如果用户拒绝或回避，立即接受并继续对话
- 推荐后要能自然承接对话，不能让模块成为"对话终点"

**对话风格 - 避免公式化** （非常重要！）：
⚠️ 不要每次都用"我能感受到你..."/"听到你这样说..."开头
⚠️ 不要每次都以问题结尾——有时只需要陪伴和确认
⚠️ 不要问抽象问题："对你意味着什么？"太像咨询师
⚠️ 有时直接回应内容（不问问题）："情绪这东西，确实很难控制。尤其看着孩子那样，着急是正常的。"
⚠️ 有时只是确认和陪伴（不问问题）："控制不好情绪，然后又自责——这个循环听起来很累。"
⚠️ 有时问具体、简单的问题（不是哲学问题）："砸了电脑之后，你现在是什么感觉？"
⚠️ 像朋友聊天一样自然回应，不要像固定套路的咨询师
⚠️ 朋友聊天的节奏：说几句，停一下，再问——不是每句话都追问

**最重要的原则**：
- 倾听和理解 > 推荐模块
- 对话的自然流畅 > 完成推荐任务
- 用户的意愿和舒适度 > 我们的判断
- 建立信任和安全感 > 提供工具
"""

    def _build_chinese_context(self, patterns: Dict[str, Any], progression: Dict[str, Any]) -> str:
        """Build Chinese psychological context section"""
        context_parts = []

        # Pattern insights
        defense_mechanisms = patterns.get("defense_mechanisms", {})
        attachment_patterns = patterns.get("attachment_patterns", {})

        if defense_mechanisms.get("detected"):
            mechanisms = ", ".join(defense_mechanisms["detected"])
            context_parts.append(f"  - 用户可能使用了{mechanisms}的防御机制")

        if attachment_patterns.get("primary_pattern"):
            pattern = attachment_patterns["primary_pattern"]
            pattern_names = {
                "anxious": "焦虑型",
                "avoidant": "回避型",
                "disorganized": "混乱型"
            }
            pattern_zh = pattern_names.get(pattern, pattern)
            context_parts.append(f"  - 表现出{pattern_zh}的依恋模式")

        # Progression insights
        trajectory = progression.get("trajectory", "")
        if trajectory and trajectory not in ["unknown", "insufficient_data"]:
            trajectory_names = {
                "escalating": "正在升高",
                "de-escalating": "正在缓和",
                "stabilizing": "趋于平稳"
            }
            trajectory_zh = trajectory_names.get(trajectory, trajectory)
            context_parts.append(f"  - 情绪走向：{trajectory_zh}")

        if context_parts:
            context_section = "\n".join(context_parts)
            return f"\n\n🧠 **心理模式洞察**：\n{context_section}\n\n"
        else:
            return "\n"


    def _format_english_prompt(
        self,
        recommendations: List[Dict],
        patterns: Dict[str, Any],
        progression: Dict[str, Any]
    ) -> str:
        """
        Format English prompt for AI with psychological context

        Args:
            recommendations: List of module recommendations
            patterns: Pattern recognition results
            progression: Emotional progression analysis
        """
        modules_text = []
        for rec in recommendations:
            modules_text.append(
                f"  • {rec['icon']} **{rec['name']}**: {rec['description']}\n"
                f"    Suggested guidance: {rec['guidance']}"
            )

        recommendation_section = "\n".join(modules_text)

        # Build psychological context section
        context_text = self._build_english_context(patterns, progression)

        return f"""
---
💡 **Optional Suggestions** (Use with Caution):

{recommendation_section}
{context_text}

**When to【NEVER】Recommend Modules** (Highest Priority - Must Follow):
❌ User explicitly says "don't want to"/"no tools"/"don't recommend" - Absolutely do NOT mention any modules
❌ User says "I just want to talk"/"just let me vent"/"I need to talk" - Focus on listening, no recommendations
❌ User is deeply sharing, venting emotions, or telling important stories - Don't interrupt
❌ Conversation is flowing naturally and user is gradually opening up - Don't force tools in
❌ You feel recommending would disrupt the conversation rhythm or interrupt the user - Trust your judgment, don't recommend

**When You【CAN CONSIDER】Recommending Modules** (Natural Timing):
✅ User explicitly asks for help: "What should I do?"/"Any methods?"/"Can you help me?"
✅ User seems emotionally stuck, repeatedly expressing the same struggle without progress
✅ User expresses desire to explore: "I want to understand myself"/"Why do I always..."
✅ Natural pause in conversation, user seems to be waiting for guidance or next steps
✅ User has finished emotional expression and entered a calmer, reflective phase

**How to Recommend** (Like a Friend, Not a Task List):
- Integrate naturally into conversation, don't abruptly shift topics
- Use tentative language: "If you'd like"/"Want to try"/"Maybe we could"
- Always give choice, never command or require
- If user declines or avoids, accept immediately and continue conversation
- After suggesting, naturally continue the dialogue - module shouldn't be a "conversation ender"

**Conversation Style - Avoid Being Formulaic** (Very Important!):
⚠️ Don't always start with "I can sense..."/"I hear you saying..."
⚠️ Don't always end with a question—sometimes just be present and acknowledge
⚠️ Don't ask abstract questions: "What does this mean to you?" sounds too therapist-like
⚠️ Sometimes respond directly to content (no question): "Emotions are really hard to control. Especially when you see your kid like that, it's natural to feel anxious."
⚠️ Sometimes just acknowledge and sit with it (no question): "Losing control and then feeling bad about it—that cycle sounds exhausting."
⚠️ Sometimes ask concrete, simple questions (not philosophical ones): "After you smashed the computer, how are you feeling now?"
⚠️ Talk like a friend would, not like a scripted counselor
⚠️ Friend pacing: say something, pause, then maybe ask—not interrogating every turn

**Most Important Principles**:
- Listening and understanding > Recommending modules
- Natural conversation flow > Completing recommendation tasks
- User's wishes and comfort > Our judgment
- Building trust and safety > Providing tools
"""

    def _build_english_context(self, patterns: Dict[str, Any], progression: Dict[str, Any]) -> str:
        """Build English psychological context section"""
        context_parts = []

        # Pattern insights
        defense_mechanisms = patterns.get("defense_mechanisms", {})
        attachment_patterns = patterns.get("attachment_patterns", {})

        if defense_mechanisms.get("detected"):
            mechanisms = ", ".join(defense_mechanisms["detected"])
            context_parts.append(f"  - User may be using {mechanisms} defense mechanisms")

        if attachment_patterns.get("primary_pattern"):
            pattern = attachment_patterns["primary_pattern"]
            context_parts.append(f"  - Shows {pattern} attachment pattern")

        # Progression insights
        trajectory = progression.get("trajectory", "")
        if trajectory and trajectory not in ["unknown", "insufficient_data"]:
            context_parts.append(f"  - Emotional trajectory: {trajectory}")

        if context_parts:
            context_section = "\n".join(context_parts)
            return f"\n\n🧠 **Psychological Pattern Insights**:\n{context_section}\n\n"
        else:
            return "\n"



