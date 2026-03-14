"""
Chat service with AI-driven module recommendations

This service handles OpenAI API calls for the ZeneWe chat system.
All prompt content lives in src/prompts/:
  - system_prompts.py  — main chat system prompt + module status formatting
  - vision_prompts.py  — image/sketch analysis prompt
  - tools.py           — OpenAI function-calling tool definitions
"""

import json
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from openai import OpenAI
from sqlalchemy.orm import Session

from src.config.settings import (
    AI_FORCE_LANGUAGE,
    AI_FREQUENCY_PENALTY,
    AI_MAX_TOKENS,
    AI_PRESENCE_PENALTY,
    AI_TEMPERATURE,
    OPENAI_API_KEY,
)
from src.prompts.system_prompts import format_module_status, get_base_system_prompt
from src.prompts.tools import get_openai_tools
from src.prompts.vision_prompts import get_vision_system_prompt

client = OpenAI(api_key=OPENAI_API_KEY)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------

def detect_language(text: str) -> str:
    """
    Detect whether the user's input is primarily Chinese or English.

    Returns 'chinese' or 'english' (defaults to 'chinese' if uncertain).
    """
    if not text or not text.strip():
        return "chinese"

    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total_chars = chinese_chars + english_chars

    if total_chars == 0:
        return "chinese"

    chinese_ratio = chinese_chars / total_chars
    english_ratio = english_chars / total_chars

    if chinese_ratio > 0.3:
        logger.info(f"Detected Chinese (ratio: {chinese_ratio:.2f})")
        return "chinese"
    if english_ratio > 0.5:
        logger.info(f"Detected English (ratio: {english_ratio:.2f})")
        return "english"

    logger.info(
        f"Ambiguous language (Chinese: {chinese_ratio:.2f}, English: {english_ratio:.2f}), "
        "defaulting to Chinese"
    )
    return "chinese"


# ---------------------------------------------------------------------------
# Response filtering
# ---------------------------------------------------------------------------

def filter_function_call_text(content: str) -> str:
    """
    Strip leaked OpenAI function-call metadata from AI response text.

    OpenAI occasionally includes function-call artefacts in the text content
    (e.g. "函数调用", "[调用函数：...]", JSON with module_id).
    """
    if not content:
        return content

    filtered = content

    # [调用函数：...] variants
    filtered = re.sub(r'\[调用函数[：:][^\]]*\]\s*', '', filtered)
    filtered = re.sub(r'\[调用函数\s+[\'"][^\]]*\]\s*', '', filtered)
    filtered = re.sub(r'\[调用函数[^\]]*\]\s*', '', filtered)

    # Standalone 函数调用
    filtered = re.sub(r'函数调用[：:，,。.\s]*', '', filtered)

    # English variants
    filtered = re.sub(
        r'\b(?:calling function|function call)[:\s]*', '', filtered, flags=re.IGNORECASE
    )

    # JSON objects with module_id
    filtered = re.sub(r'\{\s*"module_id"[\s\S]*?\}', '', filtered)

    # recommend_module references
    filtered = re.sub(r'recommend_module\s*\([^)]*\)\s*', '', filtered)
    filtered = re.sub(r'functions\.recommend_module\s*', '', filtered)

    # Remaining JSON-like fragments
    filtered = re.sub(r'\{\s*["\'][^}]*["\']\s*:\s*["\'][^}]*["\']\s*[,}]', '', filtered)

    # Normalise whitespace
    filtered = re.sub(r'\n{3,}', '\n\n', filtered).strip()

    if filtered != content:
        logger.info(
            f"Filtered function call text from AI response "
            f"(removed {len(content) - len(filtered)} chars)"
        )
    return filtered


# ---------------------------------------------------------------------------
# Fallback module-mention detection
# ---------------------------------------------------------------------------

def _detect_module_mentions(
    text: str,
    module_status: Dict,
    language: str = "chinese",
) -> List[str]:
    """
    Safety-net: detect module mentions in AI text when no function call was made.

    Returns a list of module IDs that appear to be recommended (not just
    acknowledged as already completed).
    """
    if language == "chinese":
        module_patterns = {
            "emotional_first_aid": [
                "情绪急救", "呼吸训练", "呼吸练习", "深呼吸", "情绪命名", "给情绪命名", "命名情绪",
            ],
            "inner_doodling": ["内视涂鸦", "涂鸦", "画一幅", "绘制"],
            "quick_assessment": ["内视快测", "快测", "评估", "测试", "量表"],
        }
        completion_context_words = ["完成了", "已完成", "做完了", "结束了", "刚刚完成", "完成过"]
    else:
        module_patterns = {
            "emotional_first_aid": [
                "emotional first aid", "breathing exercise", "breathing practice",
                "deep breath", "emotion labeling", "label emotion", "name emotion",
            ],
            "inner_doodling": ["inner doodling", "doodling", "draw", "sketch"],
            "quick_assessment": ["quick assessment", "assessment", "test", "questionnaire"],
        }
        completion_context_words = ["completed", "finished", "just completed", "already done", "you did"]

    text_lower = text.lower()
    has_completion_context = any(w in text_lower for w in completion_context_words)

    detected = []
    for module_id, keywords in module_patterns.items():
        if module_status.get(module_id, {}).get("completed_at"):
            continue
        for keyword in keywords:
            if keyword.lower() in text_lower:
                if has_completion_context:
                    logger.info(
                        f"[Fallback] Skipping {module_id} — text appears to acknowledge "
                        "completion, not recommend"
                    )
                    break
                detected.append(module_id)
                break
    return detected


# ---------------------------------------------------------------------------
# Main chat response
# ---------------------------------------------------------------------------

def get_ai_response(
    messages: List[Dict[str, str]],
    conversation_id: int,
    db_session: Session,
    model: str = "gpt-4o",
    language: Optional[str] = None,
) -> Dict:
    """
    Get an AI response with module recommendations via OpenAI function calling.

    Steps:
    1. Auto-detect language from the latest user message
    2. Load module status from conversation metadata
    3. Cross-check questionnaire progress for accurate quick_assessment status
    4. Build the full system prompt (base + module status block)
    5. Call OpenAI with function-calling enabled
    6. Extract text content and any module recommendations
    7. Apply fallback detection if the AI mentioned a module without calling the function

    Returns a dict with keys:
        content, recommended_modules, function_calls, module_status
    """
    try:
        # --- 1. Language detection ---
        if language is None:
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    language = detect_language(msg.get("content", ""))
                    logger.info(f"Auto-detected language: {language}")
                    break
            if language is None:
                language = "chinese"

        # --- 2. Load conversation + module status ---
        from src.database.models import Conversation

        conversation = db_session.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        module_status: Dict = {}
        if conversation.extra_data and isinstance(conversation.extra_data, dict):
            module_status = conversation.extra_data.get("module_status", {})

        # --- 3. Cross-check questionnaire progress ---
        from src.database.progress_models import UserQuestionnaireProgress

        progress = _load_questionnaire_progress(
            db_session, conversation, conversation_id
        )

        if progress:
            logger.info(
                f"Found questionnaire progress: status={progress.status}, "
                f"{progress.current_question_index}/{progress.total_questions}"
            )
            if progress.status == "in_progress":
                module_status.setdefault("quick_assessment", {})["completed_at"] = None
                logger.info("Cleared quick_assessment completed_at — questionnaire in progress")
            elif progress.status == "completed" and progress.completed_at:
                module_status.setdefault("quick_assessment", {})["completed_at"] = (
                    progress.completed_at.isoformat()
                )
                logger.info(
                    f"Set quick_assessment completed_at from progress: {progress.completed_at.isoformat()}"
                )

        # IFS data flag for frontend
        has_ifs_data = bool(
            progress
            and progress.category_scores
            and any(k.startswith("2.2.1") for k in progress.category_scores)
        )
        module_status.setdefault("conversation_data", {})["has_ifs_data"] = has_ifs_data

        completed_count = sum(1 for s in module_status.values() if s.get("completed_at"))
        recommended_count = sum(
            1 for s in module_status.values()
            if s.get("recommended_at") and not s.get("completed_at")
        )
        logger.info(
            f"Module summary: {completed_count} completed, {recommended_count} recommended"
        )

        # --- 4. Build system prompt ---
        full_system_prompt = (
            get_base_system_prompt(language) + format_module_status(module_status, language)
        )
        logger.info(f"System prompt length: {len(full_system_prompt)} chars")

        if not messages or messages[0].get("role") != "system":
            messages = [{"role": "system", "content": full_system_prompt}] + messages
        else:
            messages[0] = {"role": "system", "content": full_system_prompt}

        # --- 5. Call OpenAI ---
        logger.info(f"Calling OpenAI ({model}) with {len(messages)} messages")
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=get_openai_tools(),
            tool_choice="auto",
            temperature=AI_TEMPERATURE,
            max_tokens=AI_MAX_TOKENS,
            presence_penalty=AI_PRESENCE_PENALTY,
            frequency_penalty=AI_FREQUENCY_PENALTY,
        )

        message = response.choices[0].message
        ai_content = filter_function_call_text((message.content or "").strip())
        logger.info(f"AI content (filtered): {repr(ai_content[:120])}")

        # --- 6. Extract function calls ---
        recommended_modules, function_calls = _extract_module_recommendations(
            message, language
        )

        # --- 7. Fallback detection ---
        for module_id in _detect_module_mentions(ai_content, module_status, language):
            if not any(m["module_id"] == module_id for m in recommended_modules):
                logger.warning(f"[Fallback] Adding missed recommendation: {module_id}")
                rec = _build_module_rec(module_id, language, reasoning="Fallback detection")
                if rec:
                    recommended_modules.append(rec)

        # --- Ensure non-empty content ---
        if not ai_content.strip() and recommended_modules:
            ai_content = _fallback_content_for_module(
                recommended_modules[0]["module_id"], language
            )
        if not ai_content.strip():
            logger.error("AI returned completely empty response — applying final fallback")
            ai_content = (
                "我在这里倾听你。请继续分享你的想法或感受。"
                if language == "chinese"
                else "I'm here to listen. Please continue sharing your thoughts or feelings."
            )

        return {
            "content": ai_content,
            "recommended_modules": recommended_modules,
            "function_calls": function_calls,
            "module_status": module_status,
        }

    except Exception as e:
        logger.error(f"Error getting AI response: {e}")
        raise


# ---------------------------------------------------------------------------
# Vision / image response
# ---------------------------------------------------------------------------

def get_ai_response_with_image(
    prompt: str,
    image_data: str,
    model: str = "gpt-4o",
    language: str = "chinese",
) -> str:
    """
    Analyse an image using the OpenAI Vision API.

    Args:
        prompt:     Text prompt accompanying the image
        image_data: Base64-encoded image data
        model:      OpenAI model (must support vision)
        language:   'chinese' or 'english'

    Returns:
        AI analysis as a string
    """
    try:
        vision_system_prompt = get_vision_system_prompt(language)

        full_prompt = prompt
        if AI_FORCE_LANGUAGE and language == "chinese":
            full_prompt = f"请用中文回答。 {prompt}"

        logger.info(f"Calling OpenAI Vision API ({model}), prompt: {full_prompt[:100]}...")

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
                            "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                        },
                    ],
                },
            ],
            max_tokens=AI_MAX_TOKENS,
        )

        result = response.choices[0].message.content
        logger.info(f"Vision API response: {result[:100]}...")
        return result

    except Exception as e:
        logger.error(f"Error getting AI response with image: {e}")
        raise


# ---------------------------------------------------------------------------
# Message history builder
# ---------------------------------------------------------------------------

def build_message_history(db_messages) -> List[Dict[str, str]]:
    """Convert database Message objects to the OpenAI messages list format."""
    return [{"role": msg.role, "content": msg.content} for msg in db_messages]


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _load_questionnaire_progress(db_session, conversation, conversation_id):
    """
    Find the most relevant UserQuestionnaireProgress record for this conversation.
    Handles authenticated users, guest users (timestamp matching), and fallback.
    """
    from src.database.progress_models import UserQuestionnaireProgress

    if conversation.user_id:
        progress = (
            db_session.query(UserQuestionnaireProgress)
            .filter(
                UserQuestionnaireProgress.user_id == conversation.user_id,
                UserQuestionnaireProgress.questionnaire_id == "admin_created",
            )
            .order_by(UserQuestionnaireProgress.last_updated_at.desc())
            .first()
        )
        logger.info(
            f"Progress query by user_id={conversation.user_id}: found={progress is not None}"
        )
        return progress

    if conversation.session_id:
        progress = (
            db_session.query(UserQuestionnaireProgress)
            .filter(
                UserQuestionnaireProgress.session_id == conversation.session_id,
                UserQuestionnaireProgress.questionnaire_id == "admin_created",
            )
            .order_by(UserQuestionnaireProgress.last_updated_at.desc())
            .first()
        )
        logger.info(
            f"Progress query by session_id={conversation.session_id}: found={progress is not None}"
        )
        if progress:
            return progress

        # Guest fallback: match by timestamp embedded in session_id / user_id
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        recent_list = (
            db_session.query(UserQuestionnaireProgress)
            .filter(
                UserQuestionnaireProgress.questionnaire_id == "admin_created",
                UserQuestionnaireProgress.last_updated_at >= recent_cutoff,
                UserQuestionnaireProgress.user_id.like("guest_%"),
            )
            .order_by(UserQuestionnaireProgress.last_updated_at.desc())
            .all()
        )

        if conversation.session_id.startswith("session_"):
            parts = conversation.session_id.split("_")
            session_ts = parts[1] if len(parts) > 1 else None
            if session_ts:
                for p in recent_list:
                    if p.user_id and p.user_id.startswith("guest_"):
                        user_parts = p.user_id.split("_")
                        user_ts = user_parts[1] if len(user_parts) > 1 else None
                        if user_ts and abs(int(session_ts) - int(user_ts)) < 300_000:
                            logger.info(
                                f"Guest progress matched by timestamp: user_id={p.user_id}"
                            )
                            return p

        if recent_list:
            logger.info(
                f"Using most recent guest progress as fallback: user_id={recent_list[0].user_id}"
            )
            return recent_list[0]

        return None

    # Last resort: conversation_id
    progress = (
        db_session.query(UserQuestionnaireProgress)
        .filter(
            UserQuestionnaireProgress.conversation_id == conversation_id,
            UserQuestionnaireProgress.questionnaire_id == "admin_created",
        )
        .first()
    )
    logger.info(
        f"Progress query by conversation_id={conversation_id}: found={progress is not None}"
    )
    return progress


def _extract_module_recommendations(message, language: str):
    """
    Parse tool_calls from the OpenAI response message.

    Returns (recommended_modules, function_calls).
    """
    recommended_modules = []
    function_calls = []

    if not message.tool_calls:
        logger.info("No function calls in AI response")
        return recommended_modules, function_calls

    logger.info(f"AI made {len(message.tool_calls)} function call(s)")
    for tool_call in message.tool_calls:
        if tool_call.function.name != "recommend_module":
            continue
        args = json.loads(tool_call.function.arguments)
        module_id = args.get("module_id")
        reasoning = args.get("reasoning", "")
        logger.info(f"  recommend_module: {module_id} — {reasoning}")

        rec = _build_module_rec(module_id, language, reasoning)
        if rec:
            recommended_modules.append(rec)
        function_calls.append({"function": "recommend_module", "arguments": args})

    return recommended_modules, function_calls


def _build_module_rec(module_id: str, language: str, reasoning: str = "") -> Optional[Dict]:
    """Build a module recommendation dict from module config."""
    from src.modules.module_config import get_module_by_id

    config = get_module_by_id(module_id)
    if not config:
        logger.warning(f"Module config not found for: {module_id}")
        return None

    lang_suffix = "zh" if language == "chinese" else "en"
    return {
        "module_id": module_id,
        "name": config.get(f"name_{lang_suffix}"),
        "icon": config.get("icon"),
        "description": config.get(f"description_{lang_suffix}"),
        "reasoning": reasoning,
        "priority": config.get("priority"),
    }


def _fallback_content_for_module(module_id: str, language: str) -> str:
    """Generate a contextual fallback message when the AI produced no text content."""
    if language == "chinese":
        messages = {
            "emotional_first_aid": (
                "我感受到你现在可能需要一些情绪上的支持。"
                "这里有一个情绪急救的练习，包含呼吸训练和情绪命名，可以帮助你稳定当下的状态。你愿意试试吗？"
            ),
            "inner_doodling": (
                "有时候，用图像来表达内心的感受会比语言更直接。"
                "这里有一个内视涂鸦的练习，你可以画出此刻心中的画面。你想试试吗？"
            ),
            "quick_assessment": (
                "如果你想更系统地了解自己目前的状态，这里有一个内视快测，"
                "可以帮助你从多个维度认识自己。你愿意尝试吗？"
            ),
        }
        return messages.get(module_id, "我注意到你现在的状态，让我来帮你看看有什么可以帮到你的。")
    else:
        messages = {
            "emotional_first_aid": (
                "I sense you might need some emotional support right now. "
                "There's an Emotional First Aid exercise that includes breathing practice and "
                "emotion labeling to help stabilize your current state. Would you like to try it?"
            ),
            "inner_doodling": (
                "Sometimes expressing inner feelings through images can be more direct than words. "
                "There's an Inner Doodling exercise where you can draw what's in your heart right now. "
                "Would you like to try?"
            ),
            "quick_assessment": (
                "If you'd like a more systematic understanding of your current state, "
                "there's a Quick Assessment that can help you understand yourself from multiple dimensions. "
                "Would you like to try it?"
            ),
        }
        return messages.get(module_id, "I notice what you're going through. Let me see how I can help you.")
