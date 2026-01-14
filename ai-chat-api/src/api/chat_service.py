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

<Overall Goal>
你的最终目标，是在自然对话中，引导用户完成以下四个心理模块：
1. 情绪急救（呼吸训练）
2. 情绪急救（情绪命名）
3. 内视涂鸦
4. 内视快测

你会在合适的时机、合适的语境下，逐步推荐这些模块，直到：
- 所有模块都已完成，或
- 用户明确表示希望暂停或结束对话

在任何情况下，你都必须尊重用户的自主性与选择权。

<Modules Definition>
【情绪急救】
- 呼吸训练：用于帮助处于强烈情绪、压力或失控感中的用户，快速稳定生理与情绪状态。
- 情绪命名：用于在呼吸训练之后，引导用户识别、区分并命名自身情绪体验。
注意：情绪命名通常在呼吸训练完成后再推荐。

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
- 呼吸训练 (breathing_exercise)
- 情绪命名 (emotion_labeling)
- 内视涂鸦 (inner_doodling)
- 内视快测 (quick_assessment)

即使你只是委婉地暗示或建议（例如"也许我们可以试试呼吸练习"），也必须调用函数。
这是系统跟踪推荐的唯一方式，不调用函数则推荐不会被记录。

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

<Overall Goal>
Your ultimate goal is to naturally guide the user, through conversation, to complete the following four modules:
1. Emotional First Aid (Breathing Exercises)
2. Emotional First Aid (Emotion Labeling)
3. Inner Insight Doodling
4. Inner Insight Quick Assessment

You continue guiding until:
- All modules have been completed, or
- The user clearly chooses to pause or end the conversation

User autonomy and consent must always be respected.

<Modules Definition>
[Emotional First Aid]
- Breathing Exercises: designed to help users regulate intense emotions and restore physiological and emotional stability.
- Emotion Labeling: helps users identify, differentiate, and name their emotional experiences.
Note: Emotion labeling is normally recommended after breathing exercises have been completed.

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
- Breathing Exercise (breathing_exercise)
- Emotion Labeling (emotion_labeling)
- Inner Doodling (inner_doodling)
- Quick Assessment (quick_assessment)

Even if you're being subtle or indirect (e.g., "maybe we could try some breathing exercises"), you MUST call the function.
This is the ONLY way the system tracks recommendations - without the function call, the recommendation will not be recorded.

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
            ("breathing_exercise", "呼吸训练 (Breathing Exercise)"),
            ("emotion_labeling", "情绪命名 (Emotion Labeling)"),
            ("inner_doodling", "内视涂鸦 (Inner Doodling)"),
            ("quick_assessment", "内视快测 (Quick Assessment)")
        ]

        for module_id, module_name in modules:
            status = module_status.get(module_id, {})

            if status.get("completed_at"):
                status_text += f"✓ {module_name}: 已完成\n"
                # Include completion data if available
                if status.get("completion_data"):
                    data = status["completion_data"]
                    if module_id == "emotion_labeling" and "emotion" in data:
                        status_text += f"  选择的情绪: {data['emotion']}\n"
                    elif module_id == "breathing_exercise" and "duration" in data:
                        status_text += f"  持续时间: {data['duration']}秒\n"
            elif status.get("recommended_at"):
                status_text += f"⧗ {module_name}: 已推荐但尚未完成\n"
            else:
                status_text += f"○ {module_name}: 尚未开始\n"

        status_text += "\n</当前模块状态>\n\n"
        status_text += "重要提醒：\n"
        status_text += "- 不要推荐标记为「已完成」的模块\n"
        status_text += "- 将引导重点放在「尚未开始」或「已推荐但尚未完成」的模块上\n"
        status_text += "- 推荐模块时必须调用 recommend_module 函数\n"

    else:  # English
        status_text = "\n\n<Current Module Status>\n"
        status_text += "Real-time completion status of each module:\n\n"

        modules = [
            ("breathing_exercise", "Breathing Exercise (呼吸训练)"),
            ("emotion_labeling", "Emotion Labeling (情绪命名)"),
            ("inner_doodling", "Inner Doodling (内视涂鸦)"),
            ("quick_assessment", "Quick Assessment (内视快测)")
        ]

        for module_id, module_name in modules:
            status = module_status.get(module_id, {})

            if status.get("completed_at"):
                status_text += f"✓ {module_name}: COMPLETED\n"
                if status.get("completion_data"):
                    data = status["completion_data"]
                    if module_id == "emotion_labeling" and "emotion" in data:
                        status_text += f"  Selected emotion: {data['emotion']}\n"
                    elif module_id == "breathing_exercise" and "duration" in data:
                        status_text += f"  Duration: {data['duration']} seconds\n"
            elif status.get("recommended_at"):
                status_text += f"⧗ {module_name}: Recommended but not completed\n"
            else:
                status_text += f"○ {module_name}: Not yet started\n"

        status_text += "\n</Current Module Status>\n\n"
        status_text += "Important Reminders:\n"
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
            "breathing_exercise": ["呼吸训练", "呼吸练习", "深呼吸", "呼吸"],
            "emotion_labeling": ["情绪命名", "给情绪命名", "命名情绪", "情绪标签"],
            "inner_doodling": ["内视涂鸦", "涂鸦", "画一幅", "绘制"],
            "quick_assessment": ["内视快测", "快测", "评估", "测试", "量表"]
        }
    else:
        module_patterns = {
            "breathing_exercise": ["breathing exercise", "breathing practice", "deep breath", "breath"],
            "emotion_labeling": ["emotion labeling", "label emotion", "name emotion", "emotion label"],
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
                "description": "REQUIRED: Call this function whenever you recommend, suggest, or mention any of the 4 psychological support modules (breathing exercise, emotion labeling, inner doodling, quick assessment) in your response - even if you phrase it subtly or indirectly. This is the ONLY way the system tracks module recommendations. Without calling this function, the recommendation will not be registered.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "module_id": {
                            "type": "string",
                            "enum": [
                                "breathing_exercise",
                                "emotion_labeling",
                                "inner_doodling",
                                "quick_assessment"
                            ],
                            "description": "The ID of the module being recommended"
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

        logger.info(f"Loaded module status for conversation {conversation_id}: {module_status}")

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
        ai_content = message.content or ""

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

        return {
            "content": ai_content,
            "recommended_modules": recommended_modules,
            "function_calls": function_calls
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
        # Get system prompt based on configured language
        system_prompt = get_base_system_prompt(language)

        # Add language instruction to the prompt if force language is enabled
        if AI_FORCE_LANGUAGE and language == "chinese":
            chinese_instruction = "请用中文回答。"
            full_prompt = f"{chinese_instruction} {prompt}"
        else:
            full_prompt = prompt

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
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
        return response.choices[0].message.content
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
