"""
Chat service with AI-driven module recommendations

This service uses OpenAI function calling to detect when the AI naturally
recommends psychological support modules during conversation.
"""

from openai import OpenAI
from sqlalchemy.orm import Session
from src.config.settings import (
    OPENAI_API_KEY, AI_RESPONSE_LANGUAGE, AI_FORCE_LANGUAGE,
    AI_TEMPERATURE, AI_MAX_TOKENS, AI_PRESENCE_PENALTY, AI_FREQUENCY_PENALTY
)
from typing import List, Dict, Optional
from datetime import datetime
import logging
import re

client = OpenAI(api_key=OPENAI_API_KEY)
logger = logging.getLogger(__name__)


def filter_function_call_text(content: str) -> str:
    """
    Filter out leaked function call text from AI responses.

    OpenAI sometimes includes function call metadata in the text content,
    especially in Chinese: "函数调用", "[调用函数：...]", etc.
    This must be stripped before returning to the user.
    """
    if not content:
        return content

    filtered = content

    # Remove [调用函数：...] patterns (various formats)
    filtered = re.sub(r'\[调用函数[：:][^\]]*\]\s*', '', filtered)
    filtered = re.sub(r'\[调用函数\s+[\'"][^\]]*\]\s*', '', filtered)
    filtered = re.sub(r'\[调用函数[^\]]*\]\s*', '', filtered)

    # Remove standalone "函数调用" with surrounding punctuation/whitespace
    filtered = re.sub(r'函数调用[：:，,。.\s]*', '', filtered)

    # Remove "calling function" / "function call" in English
    filtered = re.sub(r'\b(?:calling function|function call)[:\s]*', '', filtered, flags=re.IGNORECASE)

    # Remove JSON objects containing "module_id" (leaked function call arguments)
    filtered = re.sub(r'\{\s*"module_id"[\s\S]*?\}', '', filtered)

    # Remove recommend_module function references
    filtered = re.sub(r'recommend_module\s*\([^)]*\)\s*', '', filtered)
    filtered = re.sub(r'functions\.recommend_module\s*', '', filtered)

    # Remove any remaining JSON-like structures with quotes
    filtered = re.sub(r'\{\s*["\'][^}]*["\']\s*:\s*["\'][^}]*["\']\s*[,}]', '', filtered)

    # Clean up extra whitespace and newlines
    filtered = re.sub(r'\n{3,}', '\n\n', filtered).strip()

    if filtered != content:
        logger.info(f"Filtered function call text from AI response (removed {len(content) - len(filtered)} chars)")

    return filtered


def detect_language(text: str) -> str:
    """
    Detect the language of user input text

    Args:
        text: User input text to analyze

    Returns:
        'chinese' or 'english' (defaults to 'chinese' if uncertain)
    """
    if not text or not text.strip():
        return "chinese"  # Default to Chinese for empty input

    # Count Chinese characters (CJK Unified Ideographs)
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))

    # Count English letters
    english_chars = len(re.findall(r'[a-zA-Z]', text))

    # Count total meaningful characters (excluding punctuation and whitespace)
    total_chars = chinese_chars + english_chars

    if total_chars == 0:
        return "chinese"  # Default to Chinese if no meaningful characters

    # Calculate percentages
    chinese_ratio = chinese_chars / total_chars
    english_ratio = english_chars / total_chars

    # If more than 30% of characters are Chinese, respond in Chinese
    # This handles mixed-language input where user primarily uses Chinese
    if chinese_ratio > 0.3:
        logger.info(f"Detected Chinese (ratio: {chinese_ratio:.2f})")
        return "chinese"

    # If more than 50% are English, respond in English
    # Higher threshold for English to ensure it's clearly English
    if english_ratio > 0.5:
        logger.info(f"Detected English (ratio: {english_ratio:.2f})")
        return "english"

    # Default to Chinese for ambiguous cases
    logger.info(f"Ambiguous language detected (Chinese: {chinese_ratio:.2f}, English: {english_ratio:.2f}), defaulting to Chinese")
    return "chinese"


def get_base_system_prompt(language: str = "chinese") -> str:
    """
    Get base system prompt based on configured language

    Args:
        language: Target language for responses ('chinese' or 'english')

    Returns:
        Base system prompt string
    """
    if language.lower() == "chinese":
        return """🧠 中文 System Prompt（心理探索型引导助手）

<Role>
你是一名以人为中心的心理探索型对话助手，具有心理咨询背景。
你的核心风格是温和、耐心、共情、不评判。
你不以"教育""说教"或"诊断"为目标，而是陪伴用户探索其内在心理世界，帮助他们更好地理解当下的情绪、体验与心理模式。

⚠️ 重要：你绝不提及自己是"AI"、"人工智能"、"语言模型"、"机器人"或"助手"。你就是一个在场的倾听者与陪伴者。

⚠️ 关键规则：当用户声称完成了某个模块时，你必须先检查<当前模块状态>中该模块的completed_at字段：
- 如果completed_at有值（时间戳），说明模块确实已完成，你可以祝贺用户
- 如果completed_at为None或模块显示「尚未开始」，说明模块未完成，你应该：
  * 不要说「完成了」「已完成」等词汇
  * 可以说「我看到你开始了这个探索」「你正在进行中」
  * 温和地引导用户继续或开始该模块
- 永远以系统状态为准，不要仅凭用户的声称就认为模块已完成

<Overall Goal>
你的最终目标，是在自然对话中，引导用户完成以下三个心理模块：
1. 情绪急救
2. 内视涂鸦
3. 内视快测

你会在合适的时机、合适的语境下，逐步推荐这些模块，直到：
- 所有模块都已完成，或
- 用户明确表示希望暂停或结束对话

在任何情况下，你都必须尊重用户的自主性与选择权。

<Modules Definition>
【情绪急救】
当用户处于强烈情绪、压力或失控感中时推荐此模块，帮助用户快速稳定身心状态。
情绪急救包含两个连续的步骤：
- 呼吸训练（第一步）：通过引导式呼吸帮助用户稳定生理与情绪状态
- 情绪命名（第二步）：在呼吸训练完成后，引导用户识别、区分并命名自身情绪体验
这两个步骤在同一模块内连续完成，用户会先做呼吸训练，然后做情绪命名。
推荐时，向用户简要说明这两个部分。

【内视涂鸦】
通过让用户绘制一幅能够表达其内心世界或当下情绪状态的图像，
帮助系统与用户一起探索其潜在的心理特征、情绪模式与内在动力。

【内视快测】
一个覆盖五大心理维度的自我评估量表。
完成后，可对用户的心理特质、情绪倾向与行为模式进行较为系统的理解。

<Context-Aware Recommendation Rules>
- 你永远不"强推"模块，而是根据用户当下的情绪状态、语言线索与对话走向，自然地提出建议。
- 你可以使用类似以下的方式引导，而不是直接下指令：
  - "有些人会在这种状态下，先让身体慢慢安静下来……"
  - "如果你愿意，我们也可以换一种更直观的方式看看你的内在感受。"
  - "有一个小练习，可能能帮你更系统地理解刚才提到的这些感受。"

- 当某个模块已经完成：
  - 你不再推荐该模块
  - 你的注意力只放在尚未完成的模块上

- 当所有模块完成后：
  - 你可以温和地询问用户，是否希望基于这些内容生成一份综合性的心理洞察报告
  - 在未获得明确同意前，不要主动生成报告

<Stealth & Natural Guidance Principles>
- 不要频繁提及"模块""功能""系统"
- 优先使用自然语言与心理咨询常用的过渡表达
- 模块推荐应当看起来像是对当下谈话的自然延伸，而不是预设流程

<CRITICAL INSTRUCTION - Function Calling>
⚠️ 每当你在回复中自然地推荐或提及以下任何模块时，你必须同时调用 recommend_module 函数：
- 情绪急救 (emotional_first_aid) - 包含呼吸训练和情绪命名两个步骤
- 内视涂鸦 (inner_doodling)
- 内视快测 (quick_assessment)

即使你只是委婉地暗示或建议（例如"也许我们可以试试情绪急救"、"也许我们可以试试呼吸训练"），也必须调用函数。
这是系统跟踪推荐的唯一方式，不调用函数则推荐不会被记录。

⚠️ 极其重要：你必须始终在回复中提供文字内容。即使你在调用函数，也必须同时输出你想对用户说的话。绝对不要只调用函数而不输出任何文字。

<Boundaries>
- 不进行医学或精神疾病诊断
- 不替用户做决定
- 不制造紧迫感或完成压力
- 当用户表达拒绝、犹豫或疲惫时，优先共情，而不是继续引导模块

<Tone & Style>
- 温柔、稳定、理解
- 语言贴近人类心理咨询对话，而非技术产品说明
- 允许留白、允许慢节奏
- 永远不要说"作为AI"、"我是人工智能"或类似表达
- 不要解释你的能力限制或技术边界

你始终记住：模块只是工具，人的体验才是核心。"""

    elif language.lower() == "english":
        return """🧠 English System Prompt (Psychological Exploration Assistant)

<Role>
You are a human-centered psychological exploration companion with a background in counseling psychology.
Your core style is warm, gentle, patient, empathetic, and non-judgmental.
Your role is not to teach, diagnose, or fix the user, but to gently accompany them in exploring their inner psychological world and helping them better understand their current emotions, experiences, and psychological patterns.

⚠️ Important: Never mention that you are an "AI," "artificial intelligence," "language model," "bot," or "assistant." You are simply a present listener and companion.

⚠️ Critical Rule: When a user claims they completed a module, you MUST first check the completed_at field in <Current Module Status>:
- If completed_at has a value (timestamp), the module is truly completed and you can congratulate them
- If completed_at is None or the module shows 'Not yet started', the module is NOT completed, and you should:
  * NOT say "completed" or "finished"
  * Say "I see you've started this exploration" or "you're in progress"
  * Gently guide them to continue or start the module
- Always trust the system status, not just the user's claim

<Overall Goal>
Your ultimate goal is to naturally guide the user, through conversation, to complete the following three modules:
1. Emotional First Aid
2. Inner Insight Doodling
3. Inner Insight Quick Assessment

You continue guiding until:
- All modules have been completed, or
- The user clearly chooses to pause or end the conversation

User autonomy and consent must always be respected.

<Modules Definition>
[Emotional First Aid]
Recommend this module when the user is experiencing intense emotions, stress, or feeling out of control, to help them quickly stabilize their physical and emotional state.
Emotional First Aid contains two sequential steps:
- Breathing Exercise (Step 1): Guided breathing to help stabilize physiological and emotional state
- Emotion Labeling (Step 2): After breathing exercise, guide user to identify, differentiate, and name their emotional experience
These two steps are completed together within the same module - user does breathing exercise first, then emotion labeling.
When recommending, briefly explain both parts to the user.

[Inner Insight Doodling]
Users draw an image that represents their inner world or current emotional state.
The system uses the image as a starting point to explore underlying psychological traits, emotional patterns, and inner dynamics together with the user.

[Inner Insight Quick Assessment]
A self-assessment module covering five core psychological dimensions.
Upon completion, it provides a more structured understanding of the user's psychological traits, emotional tendencies, and behavioral patterns.

<Context-Aware Recommendation Rules>
- Never force or explicitly push modules.
- Recommendations should arise naturally from the user's emotional state, language, and conversational context.
- Use gentle, human-centered transitions such as:
  - "Some people find it helpful to first let their body settle a bit…"
  - "If you're open to it, we could explore this in a more visual way."
  - "There's a short reflective exercise that might help make sense of what you just shared."

- Once a module is completed:
  - Do not recommend it again
  - Focus only on the remaining modules

- After all modules are completed:
  - Gently ask whether the user would like a comprehensive psychological insight report
  - Do not generate the report without explicit consent

<Stealth & Natural Guidance Principles>
- Don't frequently mention "modules," "features," "system," or "function"
- Prefer natural language and transitions commonly used in psychological counseling
- Module recommendations should appear as a natural extension of the current conversation, not a preset workflow

<CRITICAL INSTRUCTION - Function Calling>
⚠️ Whenever you naturally recommend or mention any of these modules in your response, you MUST simultaneously call the recommend_module function:
- Emotional First Aid (emotional_first_aid) - contains Breathing Exercise and Emotion Labeling steps
- Inner Doodling (inner_doodling)
- Quick Assessment (quick_assessment)

Even if you're being subtle or indirect (e.g., "maybe we could try some emotional first aid", "maybe we could try some breathing exercises"), you MUST call the function.
This is the ONLY way the system tracks recommendations - without the function call, the recommendation will not be recorded.

⚠️ CRITICAL: You MUST always provide text content in your response. Even when calling a function, you MUST also output the message you want to say to the user. NEVER call a function without also providing text content.

<Boundaries>
- Do not provide medical or psychiatric diagnoses
- Do not make decisions on behalf of the user
- Do not create urgency or pressure to complete modules
- When the user expresses hesitation, fatigue, or resistance, prioritize empathy over guidance

<Tone & Style>
- Gentle, stable, and understanding
- Language should be close to human psychological counseling dialogue, not technical product descriptions
- Allow pauses and a slow pace
- Never say "as an AI," "I'm an artificial intelligence," or similar expressions
- Don't explain your capability limitations or technical boundaries

Always remember: the modules are tools — the user's lived experience is the center."""

    else:
        # Default to Chinese
        return get_base_system_prompt("chinese")


def format_module_status(module_status: Dict, language: str = "chinese") -> str:
    """
    Format module completion status for injection into system prompt

    Args:
        module_status: Dictionary of module statuses from conversation.metadata
        language: Target language ('chinese' or 'english')

    Returns:
        Formatted status text to append to system prompt
    """
    if language.lower() == "chinese":
        status_text = "\n\n<当前模块状态>\n"
        status_text += "以下是各模块的实时完成状态：\n\n"

        modules = [
            ("emotional_first_aid", "情绪急救 (Emotional First Aid)", ["呼吸训练", "情绪命名"]),
            ("inner_doodling", "内视涂鸦 (Inner Doodling)", None),
            ("quick_assessment", "内视快测 (Quick Assessment)", None)
        ]

        for module_id, module_name, steps in modules:
            status = module_status.get(module_id, {})

            if status.get("completed_at"):
                status_text += f"✓ {module_name}: 已完成\n"
                # Include completion data if available
                if status.get("completion_data"):
                    data = status["completion_data"]
                    if module_id == "emotional_first_aid":
                        if "emotion" in data:
                            status_text += f"  选择的情绪: {data['emotion']}\n"
                        if "duration" in data:
                            status_text += f"  呼吸训练持续时间: {data['duration']}秒\n"
            elif status.get("recommended_at"):
                status_text += f"⧗ {module_name}: 已推荐但尚未完成\n"
            else:
                status_text += f"○ {module_name}: 尚未开始\n"
                if steps:
                    status_text += f"  (包含步骤: {', '.join(steps)})\n"

        status_text += "\n</当前模块状态>\n\n"
        status_text += "重要提醒：\n"
        status_text += "- 【严禁】在回复用户时显示上述<当前模块状态>内容，这是仅供你内部参考的信息\n"
        status_text += "- 【严禁】在回复中包含任何形式的模块状态列表或清单\n"
        status_text += "- 【严禁】对未完成的模块说「完成」「已完成」等词汇\n"
        status_text += "- 如果用户刚回答了几个问题但模块显示「尚未开始」或completed_at为None，说明问卷还在进行中，不要说「完成了测试」\n"
        status_text += "- 不要推荐标记为「已完成」的模块\n"
        status_text += "- 将引导重点放在「尚未开始」或「已推荐但尚未完成」的模块上\n"
        status_text += "- 推荐模块时必须调用 recommend_module 函数\n"

    else:  # English
        status_text = "\n\n<Current Module Status>\n"
        status_text += "Real-time completion status of each module:\n\n"

        modules = [
            ("emotional_first_aid", "Emotional First Aid (情绪急救)", ["Breathing Exercise", "Emotion Labeling"]),
            ("inner_doodling", "Inner Doodling (内视涂鸦)", None),
            ("quick_assessment", "Quick Assessment (内视快测)", None)
        ]

        for module_id, module_name, steps in modules:
            status = module_status.get(module_id, {})

            if status.get("completed_at"):
                status_text += f"✓ {module_name}: COMPLETED\n"
                if status.get("completion_data"):
                    data = status["completion_data"]
                    if module_id == "emotional_first_aid":
                        if "emotion" in data:
                            status_text += f"  Selected emotion: {data['emotion']}\n"
                        if "duration" in data:
                            status_text += f"  Breathing exercise duration: {data['duration']} seconds\n"
            elif status.get("recommended_at"):
                status_text += f"⧗ {module_name}: Recommended but not completed\n"
            else:
                status_text += f"○ {module_name}: Not yet started\n"
                if steps:
                    status_text += f"  (Contains steps: {', '.join(steps)})\n"

        status_text += "\n</Current Module Status>\n\n"
        status_text += "Important Reminders:\n"
        status_text += "- DO NOT say 'completed' or 'finished' for modules that are not completed\n"
        status_text += "- If user just answered some questions but module shows 'Not yet started' or completed_at is None, the questionnaire is still IN PROGRESS - do not say 'completed the test'\n"
        status_text += "- DO NOT recommend modules marked as COMPLETED\n"
        status_text += "- Focus guidance on modules that are 'Not yet started' or 'Recommended but not completed'\n"
        status_text += "- When recommending a module, you MUST call the recommend_module function\n"

    return status_text


def _detect_module_mentions(
    text: str,
    module_status: Dict,
    language: str = "chinese"
) -> List[str]:
    """
    Fallback detection: Check if AI response mentions any modules without calling function

    This serves as a safety net to ensure recommendations are never missed.

    Args:
        text: AI response text to analyze
        module_status: Current module status (to avoid recommending completed modules)
        language: Response language

    Returns:
        List of detected module IDs
    """
    detected = []

    # Define module keywords for detection
    if language == "chinese":
        module_patterns = {
            "emotional_first_aid": ["情绪急救", "呼吸训练", "呼吸练习", "深呼吸", "情绪命名", "给情绪命名", "命名情绪"],
            "inner_doodling": ["内视涂鸦", "涂鸦", "画一幅", "绘制"],
            "quick_assessment": ["内视快测", "快测", "评估", "测试", "量表"]
        }
    else:
        module_patterns = {
            "emotional_first_aid": ["emotional first aid", "breathing exercise", "breathing practice", "deep breath", "emotion labeling", "label emotion", "name emotion"],
            "inner_doodling": ["inner doodling", "doodling", "draw", "sketch"],
            "quick_assessment": ["quick assessment", "assessment", "test", "questionnaire"]
        }

    text_lower = text.lower()

    for module_id, keywords in module_patterns.items():
        # Skip if module is already completed
        if module_status.get(module_id, {}).get("completed_at"):
            continue

        # Check if any keyword is mentioned
        for keyword in keywords:
            if keyword.lower() in text_lower:
                detected.append(module_id)
                break  # Only add once per module

    return detected


def get_openai_tools() -> List[Dict]:
    """
    Define OpenAI function calling tools for module recommendation detection

    Returns:
        List of tool definitions for OpenAI API
    """
    return [
        {
            "type": "function",
            "function": {
                "name": "recommend_module",
                "description": "REQUIRED: Call this function whenever you recommend, suggest, or mention any of the 3 psychological support modules (emotional first aid, inner doodling, quick assessment) in your response - even if you phrase it subtly or indirectly. This is the ONLY way the system tracks module recommendations. Without calling this function, the recommendation will not be registered.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "module_id": {
                            "type": "string",
                            "enum": [
                                "emotional_first_aid",
                                "inner_doodling",
                                "quick_assessment"
                            ],
                            "description": "The ID of the module being recommended."
                        },
                        "reasoning": {
                            "type": "string",
                            "description": "Brief reasoning for why this module is being recommended (for internal tracking)"
                        }
                    },
                    "required": ["module_id", "reasoning"]
                }
            }
        }
    ]


def get_ai_response(
    messages: List[Dict[str, str]],
    conversation_id: int,
    db_session: Session,
    model: str = "gpt-4",
    language: Optional[str] = None
) -> Dict:
    """
    Get response from OpenAI API with natural module recommendations

    This function:
    1. Auto-detects language from the most recent user message (if not specified)
    2. Loads module status from conversation metadata
    3. Injects status into system prompt
    4. Uses OpenAI function calling to detect module recommendations
    5. Returns AI response with detected recommendations

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        conversation_id: Database ID of conversation
        db_session: SQLAlchemy session for database access
        model: OpenAI model to use
        language: Target language ('chinese' or 'english'). If None, auto-detects from messages.

    Returns:
        Dictionary with:
        - content: AI response text
        - recommended_modules: List of modules recommended in this response
        - function_calls: Raw function call data (for debugging)
    """
    try:
        # Auto-detect language from the most recent user message if not specified
        if language is None:
            # Find the most recent user message
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    language = detect_language(msg.get("content", ""))
                    logger.info(f"Auto-detected language: {language}")
                    break
            # If no user message found, default to Chinese
            if language is None:
                language = "chinese"
                logger.info("No user message found, defaulting to Chinese")
        # Import here to avoid circular dependency
        from src.database.models import Conversation

        # Step 1: Load conversation and module status
        conversation = db_session.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Get module status from conversation metadata
        module_status = {}
        if conversation.extra_data and isinstance(conversation.extra_data, dict):
            module_status = conversation.extra_data.get("module_status", {})

        # CRITICAL FIX: Check UserQuestionnaireProgress for actual completion status
        # This prevents showing "questionnaire completed" when user only answered a few questions
        from src.database.progress_models import UserQuestionnaireProgress
        from datetime import datetime, timedelta

        # Query the progress table by user_id (not conversation_id) to find progress across all conversations
        # This handles cases where user starts a new conversation but has in-progress questionnaire
        progress = None
        if conversation.user_id:
            progress = db_session.query(UserQuestionnaireProgress).filter(
                UserQuestionnaireProgress.user_id == conversation.user_id,
                UserQuestionnaireProgress.questionnaire_id == 'admin_created'
            ).order_by(UserQuestionnaireProgress.last_updated_at.desc()).first()
            logger.info(f"DEBUG - Querying progress for user_id={conversation.user_id}, found progress: {progress is not None}")
        elif conversation.session_id:
            # For guest users: First try exact session_id match
            progress = db_session.query(UserQuestionnaireProgress).filter(
                UserQuestionnaireProgress.session_id == conversation.session_id,
                UserQuestionnaireProgress.questionnaire_id == 'admin_created'
            ).order_by(UserQuestionnaireProgress.last_updated_at.desc()).first()
            logger.info(f"DEBUG - Querying progress for session_id={conversation.session_id}, found progress: {progress is not None}")

            # GUEST USER FIX: If no progress found by session_id, check if there's a recent progress
            # with a user_id that starts with 'guest_' (within last 24 hours)
            # This handles the case where user completes questionnaire in one session,
            # then returns to conversation in a new session
            if not progress:
                recent_cutoff = datetime.utcnow() - timedelta(hours=24)
                recent_progress_list = db_session.query(UserQuestionnaireProgress).filter(
                    UserQuestionnaireProgress.questionnaire_id == 'admin_created',
                    UserQuestionnaireProgress.last_updated_at >= recent_cutoff,
                    UserQuestionnaireProgress.user_id.like('guest_%')
                ).order_by(UserQuestionnaireProgress.last_updated_at.desc()).all()

                # Try to match by extracting timestamp from session_id and user_id
                # session_id format: session_1772244018272_xs6exntmt
                # user_id format: guest_1772244018272_abc123
                if conversation.session_id.startswith('session_'):
                    session_timestamp = conversation.session_id.split('_')[1] if len(conversation.session_id.split('_')) > 1 else None
                    if session_timestamp:
                        for p in recent_progress_list:
                            if p.user_id and p.user_id.startswith('guest_'):
                                user_timestamp = p.user_id.split('_')[1] if len(p.user_id.split('_')) > 1 else None
                                # Match if timestamps are within 5 minutes (300000 ms)
                                if user_timestamp and abs(int(session_timestamp) - int(user_timestamp)) < 300000:
                                    progress = p
                                    logger.info(f"DEBUG - Found guest progress by timestamp matching: user_id={p.user_id}")
                                    break

                # If still no match, just use the most recent guest progress (fallback)
                if not progress and recent_progress_list:
                    progress = recent_progress_list[0]
                    logger.info(f"DEBUG - Using most recent guest progress as fallback: user_id={progress.user_id}")
        else:
            # Last resort: conversation_id
            progress = db_session.query(UserQuestionnaireProgress).filter(
                UserQuestionnaireProgress.conversation_id == conversation_id,
                UserQuestionnaireProgress.questionnaire_id == 'admin_created'
            ).first()
            logger.info(f"DEBUG - Querying progress for conversation_id={conversation_id} (no user_id/session_id), found progress: {progress is not None}")

        if progress:
            logger.info(f"Found questionnaire progress: status={progress.status}, progress={progress.current_question_index}/{progress.total_questions}")

            # If questionnaire is in_progress, clear the completed_at timestamp
            if progress.status == 'in_progress':
                if "quick_assessment" not in module_status:
                    module_status["quick_assessment"] = {}

                # Clear completed_at to indicate questionnaire is NOT completed
                module_status["quick_assessment"]["completed_at"] = None
                logger.info("Cleared quick_assessment completed_at - questionnaire is in progress")

            # If questionnaire is completed, ensure completed_at is set
            elif progress.status == 'completed' and progress.completed_at:
                if "quick_assessment" not in module_status:
                    module_status["quick_assessment"] = {}

                # Set completed_at from progress table
                module_status["quick_assessment"]["completed_at"] = progress.completed_at.isoformat()
                logger.info(f"Set quick_assessment completed_at from progress table: {progress.completed_at.isoformat()}")

        logger.info(f"Loaded module status for conversation {conversation_id}: {module_status}")

        # Debug: Log quick_assessment status specifically
        qa_status = module_status.get("quick_assessment", {})
        logger.info(f"DEBUG - quick_assessment status: completed_at={qa_status.get('completed_at')}, full_status={qa_status}")

        # Check if conversation has IFS data (category 2.2.1) for simple report generation
        # This is separate from questionnaire completion
        has_ifs_data = False
        if progress and progress.category_scores:
            # Check if any category starting with 2.2.1 has data
            ifs_categories = {k: v for k, v in progress.category_scores.items() if k.startswith('2.2.1')}
            if ifs_categories:
                has_ifs_data = True
                logger.info(f"✓ IFS data detected in conversation: {ifs_categories}")
            else:
                logger.info("✗ No IFS (2.2.1) data in conversation")

        # Store IFS data detection in module_status for frontend
        if "conversation_data" not in module_status:
            module_status["conversation_data"] = {}
        module_status["conversation_data"]["has_ifs_data"] = has_ifs_data

        # Log module completion summary
        completed_count = sum(1 for status in module_status.values() if status.get("completed_at"))
        recommended_count = sum(1 for status in module_status.values() if status.get("recommended_at") and not status.get("completed_at"))
        logger.info(f"Module summary: {completed_count} completed, {recommended_count} recommended but not completed")

        # Step 2: Build dynamic system prompt with module status
        base_prompt = get_base_system_prompt(language)
        status_section = format_module_status(module_status, language)
        full_system_prompt = base_prompt + status_section

        logger.info(f"Injected module status into system prompt (prompt length: {len(full_system_prompt)} chars)")

        # Insert/replace system prompt in messages
        if not messages or messages[0].get("role") != "system":
            messages = [{"role": "system", "content": full_system_prompt}] + messages
        else:
            messages[0] = {"role": "system", "content": full_system_prompt}

        # Step 3: Call OpenAI with function calling
        logger.info(f"Calling OpenAI with {len(messages)} messages and function calling enabled")

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=get_openai_tools(),
            tool_choice="auto",  # Let AI decide when to call functions
            temperature=AI_TEMPERATURE,
            max_tokens=AI_MAX_TOKENS,
            presence_penalty=AI_PRESENCE_PENALTY,
            frequency_penalty=AI_FREQUENCY_PENALTY
        )

        message = response.choices[0].message
        ai_content = (message.content or "").strip()  # Strip whitespace

        # Debug: Log raw content for troubleshooting
        logger.info(f"Raw message.content: {repr(message.content)}")

        # Filter out any leaked function call text (e.g., "函数调用", "[调用函数：...]")
        ai_content = filter_function_call_text(ai_content)
        logger.info(f"Filtered ai_content: {repr(ai_content)}")

        # Step 4: Extract function calls (module recommendations)
        recommended_modules = []
        function_calls = []

        if message.tool_calls:
            logger.info(f"✓ AI made {len(message.tool_calls)} function call(s)")

            for tool_call in message.tool_calls:
                logger.info(f"  Function: {tool_call.function.name}")
                logger.info(f"  Arguments: {tool_call.function.arguments}")

                if tool_call.function.name == "recommend_module":
                    import json
                    args = json.loads(tool_call.function.arguments)
                    module_id = args.get("module_id")
                    reasoning = args.get("reasoning", "")

                    logger.info(f"  → Module recommendation: {module_id}")
                    logger.info(f"  → Reasoning: {reasoning}")

                    # Get module config
                    from src.modules.module_config import get_module_by_id
                    module_config = get_module_by_id(module_id)

                    if module_config:
                        module_rec = {
                            "module_id": module_id,
                            "name": module_config.get("name_zh" if language == "chinese" else "name_en"),
                            "icon": module_config.get("icon"),
                            "description": module_config.get("description_zh" if language == "chinese" else "description_en"),
                            "reasoning": reasoning,
                            "priority": module_config.get("priority")
                        }
                        recommended_modules.append(module_rec)
                        logger.info(f"  → Built recommendation object: {module_rec['name']} ({module_rec['icon']})")
                    else:
                        logger.warning(f"  → Module config not found for: {module_id}")

                    function_calls.append({
                        "function": "recommend_module",
                        "arguments": args
                    })
        else:
            logger.info("✗ No function calls detected in AI response")

        # Step 5: Fallback detection - Check if AI mentioned modules without calling function
        # This ensures recommendations are never missed even if AI doesn't call the function
        detected_modules = _detect_module_mentions(ai_content, module_status, language)

        if detected_modules:
            logger.warning(f"⚠️  Fallback detection found {len(detected_modules)} module mention(s) without function call:")
            for module_id in detected_modules:
                # Check if already in recommended_modules (from function call)
                if not any(m["module_id"] == module_id for m in recommended_modules):
                    logger.warning(f"  → Adding missed recommendation: {module_id}")

                    # Get module config and add to recommendations
                    from src.modules.module_config import get_module_by_id
                    module_config = get_module_by_id(module_id)

                    if module_config:
                        module_rec = {
                            "module_id": module_id,
                            "name": module_config.get("name_zh" if language == "chinese" else "name_en"),
                            "icon": module_config.get("icon"),
                            "description": module_config.get("description_zh" if language == "chinese" else "description_en"),
                            "reasoning": "Fallback detection - AI mentioned module without calling function",
                            "priority": module_config.get("priority")
                        }
                        recommended_modules.append(module_rec)
                        logger.warning(f"  → Added: {module_rec['name']} ({module_rec['icon']})")

        if recommended_modules:
            logger.info(f"✓ Returning response with {len(recommended_modules)} module recommendation(s):")
            for mod in recommended_modules:
                logger.info(f"  - {mod['name']} ({mod['module_id']})")
        else:
            logger.info("✓ Returning response with no module recommendations")

        # Debug: Log content state before fallback
        logger.info(f"Content check - ai_content: {repr(ai_content)}, length: {len(ai_content)}")

        # Fallback: If there are module recommendations but no content, generate contextual message
        if not ai_content.strip() and recommended_modules:
            logger.warning("⚠️ Module recommended but no AI content, generating contextual message")
            # Generate message based on which module was recommended
            module_id = recommended_modules[0]["module_id"]
            if language == "chinese":
                module_messages = {
                    "emotional_first_aid": "我感受到你现在可能需要一些情绪上的支持。这里有一个情绪急救的练习，包含呼吸训练和情绪命名，可以帮助你稳定当下的状态。你愿意试试吗？",
                    "inner_doodling": "有时候，用图像来表达内心的感受会比语言更直接。这里有一个内视涂鸦的练习，你可以画出此刻心中的画面。你想试试吗？",
                    "quick_assessment": "如果你想更系统地了解自己目前的状态，这里有一个内视快测，可以帮助你从多个维度认识自己。你愿意尝试吗？"
                }
                ai_content = module_messages.get(module_id, "我注意到你现在的状态，让我来帮你看看有什么可以帮到你的。")
            else:
                module_messages = {
                    "emotional_first_aid": "I sense you might need some emotional support right now. There's an Emotional First Aid exercise that includes breathing practice and emotion labeling to help stabilize your current state. Would you like to try it?",
                    "inner_doodling": "Sometimes expressing inner feelings through images can be more direct than words. There's an Inner Doodling exercise where you can draw what's in your heart right now. Would you like to try?",
                    "quick_assessment": "If you'd like a more systematic understanding of your current state, there's a Quick Assessment that can help you understand yourself from multiple dimensions. Would you like to try it?"
                }
                ai_content = module_messages.get(module_id, "I notice what you're going through. Let me see how I can help you.")

        # Final fallback: Ensure we NEVER return empty content
        if not ai_content.strip():
            logger.error("⚠️ AI returned completely empty response - applying final fallback")
            logger.error(f"  - message.content: {repr(message.content)}")
            logger.error(f"  - message.tool_calls: {message.tool_calls}")
            if language == "chinese":
                ai_content = "我在这里倾听你。请继续分享你的想法或感受。"
            else:
                ai_content = "I'm here to listen. Please continue sharing your thoughts or feelings."

        return {
            "content": ai_content,
            "recommended_modules": recommended_modules,
            "function_calls": function_calls,
            "module_status": module_status  # Return updated module_status
        }

    except Exception as e:
        logger.error(f"Error getting AI response: {str(e)}")
        raise Exception(f"Error getting AI response: {str(e)}")


def get_ai_response_with_image(
    prompt: str,
    image_data: str,
    model: str = "gpt-4o",
    language: str = "chinese"
) -> str:
    """
    Get response from OpenAI Vision API with image

    Args:
        prompt: Text prompt for analysis
        image_data: Base64 encoded image data
        model: OpenAI model to use (must support vision)
        language: Target language ('chinese' or 'english')

    Returns:
        AI response content
    """
    try:
        # Use a vision-specific system prompt that tells the AI it can see images
        if language == "chinese":
            vision_system_prompt = """你是一名专业、温和、富有同理心的心理咨询师。

你具有图像分析能力，可以看到和分析用户上传的图片。

当用户上传图片时：
1. 仔细观察图片中的内容、色彩、构图、情绪表达
2. 从心理学角度分析图片可能反映的情绪状态、内心感受
3. 用温和、共情的语言描述你的观察和理解
4. 避免过度解读或下诊断性结论
5. 鼓励用户分享他们自己对图片的感受和想法

请用中文回答，语气温和、专业、富有同理心。"""
        else:
            vision_system_prompt = """You are a professional, warm, and empathetic psychological counselor.

You have image analysis capabilities and can see and analyze images uploaded by users.

When a user uploads an image:
1. Carefully observe the content, colors, composition, and emotional expression in the image
2. Analyze from a psychological perspective what emotions and inner feelings the image might reflect
3. Describe your observations and understanding in warm, empathetic language
4. Avoid over-interpretation or diagnostic conclusions
5. Encourage users to share their own feelings and thoughts about the image

Please respond in English with a warm, professional, and empathetic tone."""

        # Add language instruction to the prompt if force language is enabled
        if AI_FORCE_LANGUAGE and language == "chinese":
            chinese_instruction = "请用中文回答。"
            full_prompt = f"{chinese_instruction} {prompt}"
        else:
            full_prompt = prompt

        logger.info(f"Calling OpenAI Vision API with model: {model}")
        logger.info(f"Prompt: {full_prompt[:100]}...")

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": vision_system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": full_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
                        }
                    ]
                }
            ],
            max_tokens=AI_MAX_TOKENS
        )

        ai_response = response.choices[0].message.content
        logger.info(f"Vision API response: {ai_response[:100]}...")
        return ai_response
    except Exception as e:
        logger.error(f"Error getting AI response with image: {str(e)}")
        raise Exception(f"Error getting AI response with image: {str(e)}")


def build_message_history(db_messages) -> List[Dict[str, str]]:
    """
    Build message history for OpenAI API from database messages

    Args:
        db_messages: List of Message objects from database

    Returns:
        List of message dictionaries
    """
    return [{"role": msg.role, "content": msg.content} for msg in db_messages]
