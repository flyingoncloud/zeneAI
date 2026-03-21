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

        # --- 5. Call OpenAI (with pacing-aware tool list) ---
        from src.services.inline_assessment_service import should_ask_question

        tools = get_openai_tools()

        # Extract the latest user message text for pacing check
        latest_user_text = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                content = msg.get("content", "")
                if isinstance(content, str):
                    latest_user_text = content
                break

        # Build conversation history (exclude system messages) for pacing
        conversation_history = [m for m in messages if m.get("role") != "system"]

        try:
            allow_question = should_ask_question(conversation_history, latest_user_text)
        except Exception as e:
            logger.error(f"Pacing check failed, defaulting to allow: {e}", exc_info=True)
            allow_question = True

        if not allow_question:
            # Remove request_assessment_question tool but keep record_inline_answer
            tools = [t for t in tools if t.get("function", {}).get("name") != "request_assessment_question"]
            logger.info("Pacing: removed request_assessment_question tool for this call")

        logger.info(f"Calling OpenAI ({model}) with {len(messages)} messages")
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
            temperature=AI_TEMPERATURE,
            max_tokens=AI_MAX_TOKENS,
            presence_penalty=AI_PRESENCE_PENALTY,
            frequency_penalty=AI_FREQUENCY_PENALTY,
        )

        message = response.choices[0].message
        ai_content = filter_function_call_text((message.content or "").strip())
        logger.info(f"AI content (filtered): {repr(ai_content[:120])}")

        # --- 6. Handle assessment tool calls (multi-turn) ---
        # If the AI requested an assessment question or recorded an answer,
        # execute the tool calls and make a follow-up API call so the AI can
        # weave the question/insight into its response.
        assessment_tool_calls = _find_inline_assessment_tool_calls(message)
        if assessment_tool_calls:
            user_id = conversation.user_id or conversation.session_id
            follow_up_message, assessment_fn_calls = _handle_assessment_tool_calls(
                assessment_tool_calls, db_session, user_id, conversation_id
            )

            if follow_up_message:
                # Build messages for the second API call:
                # original messages + assistant message with tool_calls + tool results
                follow_up_messages = messages + [message] + follow_up_message
                logger.info(
                    f"Making follow-up OpenAI call with {len(follow_up_messages)} messages "
                    f"(including {len(assessment_tool_calls)} tool response(s))"
                )
                try:
                    follow_up_response = client.chat.completions.create(
                        model=model,
                        messages=follow_up_messages,
                        tools=get_openai_tools(),
                        tool_choice="auto",
                        temperature=AI_TEMPERATURE,
                        max_tokens=AI_MAX_TOKENS,
                        presence_penalty=AI_PRESENCE_PENALTY,
                        frequency_penalty=AI_FREQUENCY_PENALTY,
                    )
                    follow_up_msg = follow_up_response.choices[0].message
                    ai_content = filter_function_call_text(
                        (follow_up_msg.content or "").strip()
                    )
                    logger.info(
                        f"Follow-up AI content (filtered): {repr(ai_content[:120])}"
                    )

                    # Check follow-up response for additional tool calls
                    # (e.g. record_inline_answer in the follow-up after a question request)
                    follow_up_tool_calls = _find_inline_assessment_tool_calls(follow_up_msg)
                    if follow_up_tool_calls:
                        logger.info(
                            f"Follow-up response has {len(follow_up_tool_calls)} "
                            "additional assessment tool call(s)"
                        )
                        fu_tool_msgs, fu_fn_calls = _handle_assessment_tool_calls(
                            follow_up_tool_calls, db_session, user_id, conversation_id
                        )
                        assessment_fn_calls.extend(fu_fn_calls)

                        if fu_tool_msgs:
                            # Third API call to let AI incorporate the tool results
                            third_messages = (
                                follow_up_messages + [follow_up_msg] + fu_tool_msgs
                            )
                            logger.info(
                                f"Making third OpenAI call with {len(third_messages)} messages"
                            )
                            try:
                                third_response = client.chat.completions.create(
                                    model=model,
                                    messages=third_messages,
                                    tools=get_openai_tools(),
                                    tool_choice="auto",
                                    temperature=AI_TEMPERATURE,
                                    max_tokens=AI_MAX_TOKENS,
                                    presence_penalty=AI_PRESENCE_PENALTY,
                                    frequency_penalty=AI_FREQUENCY_PENALTY,
                                )
                                message = third_response.choices[0].message
                                ai_content = filter_function_call_text(
                                    (message.content or "").strip()
                                )
                                logger.info(
                                    f"Third-call AI content (filtered): {repr(ai_content[:120])}"
                                )
                            except Exception as e:
                                logger.error(
                                    f"Third OpenAI call failed, using follow-up response: {e}"
                                )
                                message = follow_up_msg
                    else:
                        message = follow_up_msg
                except Exception as e:
                    logger.error(
                        f"Follow-up OpenAI call failed, using initial response: {e}"
                    )
                    # Fall through with original ai_content

            # Record assessment function calls for the response
            function_calls_from_assessment = assessment_fn_calls
        else:
            function_calls_from_assessment = []

        # --- 7. Extract module recommendations ---
        recommended_modules, function_calls = _extract_module_recommendations(
            message, language
        )
        function_calls.extend(function_calls_from_assessment)

        # --- 8. Fallback detection ---
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


def _find_inline_assessment_tool_calls(message) -> list:
    """
    Extract inline assessment tool calls from the AI response message.

    Finds both `request_assessment_question` and `record_inline_answer` calls.

    Returns a list of tool_call objects for inline assessment handling.
    """
    if not message.tool_calls:
        return []

    assessment_tool_names = {"request_assessment_question", "record_inline_answer"}
    return [
        tc for tc in message.tool_calls
        if tc.function.name in assessment_tool_names
    ]


def _handle_assessment_tool_calls(
    tool_calls: list,
    db_session: Session,
    user_id: str,
    conversation_id: int,
) -> tuple:
    """
    Execute inline assessment tool calls and build tool response messages.

    Handles both tool types:
    - request_assessment_question: fetch a new question for a domain
    - record_inline_answer: record the user's answer to a previous question

    For each tool call:
    1. Parse the arguments
    2. Dispatch to the appropriate service function
    3. Build a tool response message with the result

    Returns:
        (tool_response_messages, function_calls_log)
        - tool_response_messages: list of dicts for the follow-up OpenAI call
        - function_calls_log: list of dicts recording what was called
    """
    from src.services.inline_assessment_service import get_question_for_domain, record_answer

    tool_response_messages = []
    function_calls_log = []

    for tool_call in tool_calls:
        tool_call_id = tool_call.id
        fn_name = tool_call.function.name

        try:
            args = json.loads(tool_call.function.arguments)
        except (json.JSONDecodeError, TypeError) as e:
            logger.error(f"Failed to parse {fn_name} arguments: {e}")
            tool_response_messages.append({
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": json.dumps({
                    "status": "error",
                    "reason": "invalid_arguments",
                }),
            })
            continue

        if fn_name == "request_assessment_question":
            result = _execute_request_assessment_question(
                args, db_session, user_id, conversation_id
            )
        elif fn_name == "record_inline_answer":
            result = _execute_record_inline_answer(
                args, db_session, user_id, conversation_id
            )
        else:
            logger.warning(f"Unknown assessment tool call: {fn_name}")
            result = {
                "status": "error",
                "reason": "unknown_tool",
                "message": f"Unknown tool: {fn_name}",
            }

        tool_response_messages.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "content": json.dumps(result, ensure_ascii=False),
        })
        function_calls_log.append({
            "function": fn_name,
            "arguments": args,
            "result_status": result.get("status"),
        })

    return tool_response_messages, function_calls_log


def _execute_request_assessment_question(
    args: dict,
    db_session: Session,
    user_id: str,
    conversation_id: int,
) -> dict:
    """Execute a request_assessment_question tool call."""
    from src.services.inline_assessment_service import get_question_for_domain

    domain = args.get("domain", "")
    subcategory = args.get("subcategory")
    reasoning = args.get("reasoning", "")

    logger.info(
        f"  request_assessment_question: domain={domain}, "
        f"subcategory={subcategory}, reasoning={reasoning}"
    )

    try:
        result = get_question_for_domain(
            db=db_session,
            user_id=user_id,
            conversation_id=conversation_id,
            domain=domain,
            subcategory=subcategory,
        )
        logger.info(
            f"  Assessment question result: status={result.get('status')}"
        )
        return result
    except Exception as e:
        logger.error(
            f"Error calling get_question_for_domain: {e}", exc_info=True
        )
        return {
            "status": "error",
            "reason": "service_error",
            "message": "Failed to retrieve assessment question",
        }


def _execute_record_inline_answer(
    args: dict,
    db_session: Session,
    user_id: str,
    conversation_id: int,
) -> dict:
    """
    Execute a record_inline_answer tool call.

    Parses question_id, answer_value, and optional reasoning from the AI's
    tool call arguments, then delegates to record_answer() in the
    inline_assessment_service.
    """
    from src.services.inline_assessment_service import record_answer

    question_id = args.get("question_id")
    answer_value = args.get("answer_value")
    reasoning = args.get("reasoning", "")

    logger.info(
        f"  record_inline_answer: question_id={question_id}, "
        f"answer_value={answer_value}, reasoning={reasoning}"
    )

    # Basic argument validation before calling the service
    if question_id is None or answer_value is None:
        logger.error(
            "record_inline_answer missing required arguments: "
            f"question_id={question_id}, answer_value={answer_value}"
        )
        return {
            "status": "error",
            "reason": "invalid_arguments",
            "message": "question_id and answer_value are required",
        }

    # Coerce question_id and answer_value to int safely
    # The AI may send strings like "15" or floats like 3.0
    try:
        question_id_int = int(question_id)
    except (ValueError, TypeError):
        logger.error(
            f"record_inline_answer: non-numeric question_id={question_id!r}"
        )
        return {
            "status": "error",
            "reason": "invalid_arguments",
            "message": "question_id must be a valid integer",
        }

    try:
        answer_value_int = int(answer_value)
    except (ValueError, TypeError):
        logger.error(
            f"record_inline_answer: non-numeric answer_value={answer_value!r}"
        )
        return {
            "status": "error",
            "reason": "invalid_arguments",
            "message": "answer_value must be a valid integer",
        }

    # Build context dict with AI reasoning if provided
    context = {}
    if reasoning:
        context["ai_reasoning"] = reasoning

    try:
        result = record_answer(
            db=db_session,
            user_id=user_id,
            conversation_id=conversation_id,
            question_id=question_id_int,
            answer_value=answer_value_int,
            context=context if context else None,
        )
        logger.info(
            f"  Record answer result: status={result.get('status')}, "
            f"progress={result.get('progress', {}).get('total_answered', 'N/A')}"
        )

        # Log when report generation threshold is reached
        progress = result.get("progress", {})
        if progress.get("can_generate_report"):
            logger.info(
                f"  Report generation threshold reached for user={user_id} "
                f"(total_answered={progress.get('total_answered')})"
            )

        return result
    except Exception as e:
        logger.error(
            f"Error calling record_answer: {e}", exc_info=True
        )
        return {
            "status": "error",
            "reason": "service_error",
            "message": "Failed to record answer",
        }


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
