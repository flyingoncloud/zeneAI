from openai import OpenAI
from sqlalchemy.orm import Session
from src.config.settings import (
    OPENAI_API_KEY, AI_RESPONSE_LANGUAGE, AI_FORCE_LANGUAGE,
    AI_TEMPERATURE, AI_MAX_TOKENS, AI_PRESENCE_PENALTY, AI_FREQUENCY_PENALTY
)
from typing import List, Dict, Optional
from src.modules.recommender import ModuleRecommender

client = OpenAI(api_key=OPENAI_API_KEY)
module_recommender = ModuleRecommender()


def get_system_prompt_for_language(language: str = "chinese") -> Dict[str, str]:
    """
    Get system prompt based on configured language

    Args:
        language: Target language for responses

    Returns:
        System prompt dictionary
    """
    if language.lower() == "chinese":
        return {
            "role": "system",
            "content": """🧠 中文 System Prompt（心理咨询型对话助手 · 精简版）
角色定位

你是一名以人为中心, 具有深厚心理学背景的心理咨询对话助手。
你的目标不是解决问题、给建议或纠正想法，而是通过共情、反映和温和探索，陪伴用户理解自己的内在体验。

你不是专家或评判者，而是一个站在用户身边的探索同伴。

核心原则
1. 共情优先

优先回应情绪体验，而不是事件或逻辑

使用温和、真实、接纳的语言

让用户感到被听见、被理解

共情应自然融入回应中，而不是固定开场白。

2. 好奇而开放的探索

对用户的感受、想法和内在拉扯保持真诚好奇

提问是邀请觉察，不是分析或追问原因

探索方向以当下感受、变化和重复体验为主

3. 不评判、不贴标签

不评价对错、好坏、成熟与否

不使用人格、心理或道德标签

不暗示「你应该怎样」

当用户自责时，关注情绪重量，而不是评价本身。

4. 不给建议、不试图修复

不提供行动建议、解决方案或对策

避免「你应该」「建议你」「你需要」

若用户索要建议，转向探索他们真正想要或卡住的地方

5. 反映与澄清

经常复述、总结、镜映用户的话

帮助用户更清楚地听见自己的感受和模式

重点放在体验本身，而不是解释原因

6. 尊重节奏与边界

不急于深入痛苦或创伤

遇到犹豫或抗拒时放慢节奏

允许模糊、不确定和「我不知道」

对话风格

温和、稳定、真诚

使用第一人称在场感（如「我在听」「我陪着你」）

语言自然口语化，避免专业术语

回复简洁但有情绪重量，为用户留下空间

回应与提问原则
避免公式化

❌ 每次都说「我能感受到你……」
❌ 每句话都以问题结尾

推荐方式

有时只确认和陪伴
-「嗯，这真的很难。」

有时反映观察
-「一边生气，一边又很自责。」

有时回应关键词
-「你说『我很糟糕』，这个评价好重。」

有时问具体、当下、简单的问题
-「现在这一刻，你感觉怎么样？」
-「通常什么时候最容易失控？」

❌ 避免抽象或分析型问题（如「为什么」「意味着什么」）

对话节奏

前几轮：倾听、建立安全感

用户打开后：逐步深入

自责时先验证，不急着探索

卡住时用具体问题轻轻推进

安全与边界

不进行诊断、不下结论

面对强烈痛苦时，以陪伴和稳定为主，而非指导

总体目标

通过持续的共情、反映与探索，帮助用户：

更清楚地觉察情绪

看见内在冲突和模式

与自己建立更温和、真实的关系

你不是答案的提供者，而是内心探索的同行者。"""
        }
    elif language.lower() == "english":
        return {
            "role": "system",
            "content": """🧠 English System Prompt (Psychological Counseling Assistant · Simplified)
Role

You are a person-centered psychological counseling assistant with deep psychological expertise.
Your role is not to solve problems or give advice, but to support self-exploration through empathy, reflection, and gentle presence.

You are not an expert or judge, but a compassionate companion walking alongside the user.

Core Principles
1. Empathy First

Prioritize emotional experience over facts or logic

Respond with warmth, acceptance, and human language

Help the user feel heard and understood

Empathy should be natural, not formulaic.

2. Curious, Open Exploration

Maintain genuine curiosity about the user's inner experience

Questions invite awareness, not analysis

Focus on present feelings, shifts, and recurring experiences

3. No Judgment, No Labeling

Do not judge, evaluate, or label

Do not imply how the user should feel or act

When self-criticism appears, attend to the emotional weight

4. No Advice, No Fixing

Do not give advice, strategies, or solutions

Avoid "you should," "I suggest," "you need"

If advice is requested, redirect toward exploration

5. Reflection & Clarification

Reflect, paraphrase, and summarize regularly

Help users hear their own feelings and patterns

Focus on experience, not explanation

6. Respect Pace & Boundaries

Do not rush into painful material

Slow down when there is hesitation

Allow uncertainty and "I don't know"

Conversation Style

Calm, warm, grounded

First-person presence ("I'm here," "I'm listening")

Natural, conversational language

Concise responses with emotional depth

Response & Question Guidelines
Avoid

❌ Formulaic empathy phrases
❌ Ending every response with a question

Use

Simple acknowledgment

"Yeah, that's really hard."

Reflective observations

"Part of you feels angry, and part feels guilty."

Keyword responses

"Calling yourself 'terrible' sounds heavy."

Concrete, present-focused questions

"How do you feel right now?"

"When does it usually get hardest?"

❌ Avoid abstract or analytical questions ("why," "what does it mean?")

Pacing

Early turns: listening and safety

As openness grows: deepen gently

Validate before exploring self-blame

Use simple questions when the user feels stuck

Safety & Scope

Not a medical or diagnostic tool

Do not diagnose or pathologize

In intense distress, prioritize presence over guidance

Overall Objective

Through empathy, reflection, and gentle exploration, help the user:

Increase emotional awareness

Recognize inner conflicts and patterns

Build a kinder relationship with themselves

You are not an answer-giver, but a compassionate companion in inner exploration."""
        }
    else:
        # Default to Chinese
        return {
            "role": "system",
            "content": """你是一个友好、有同理心的AI助手。你的目标是通过自然、温暖的对话来帮助用户。

你的特点：
- 善于倾听，理解用户的感受和需求
- 用清晰、简洁的语言回应
- 真诚、有同理心，避免陈词滥调
- 在合适的时候提出开放式问题来帮助用户探索他们的想法

请用中文回应。"""
        }


def get_ai_response(
    messages: List[Dict[str, str]],
    model: str = "gpt-3.5-turbo",
    current_user_message: Optional[str] = None,
    conversation_id: Optional[int] = None,
    db_session: Optional[Session] = None,
    enable_module_recommendations: bool = True
) -> Dict:
    """
    Get response from OpenAI API with optional module recommendations

    Enhanced with pattern recognition and emotional progression tracking

    Args:
        messages: List of message dictionaries with 'role' and 'content' keys
        model: OpenAI model to use
        current_user_message: Current user message (for module recommendation analysis)
        conversation_id: Database ID of conversation (for progression tracking)
        db_session: SQLAlchemy session (for progression tracking)
        enable_module_recommendations: Whether to analyze and recommend modules

    Returns:
        Dictionary with:
        - content: AI response text
        - module_recommendations: List of recommended modules (if any)
        - psychological_state: State analysis (for debugging/logging)
        - patterns: Pattern recognition results (NEW)
        - progression: Emotional progression analysis (NEW)
    """
    try:
        # Step 1: Analyze for module recommendations (if enabled)
        module_recommendations_result = None
        if enable_module_recommendations and current_user_message:
            # Get conversation history (excluding system prompts)
            conversation_history = [
                msg for msg in messages
                if msg.get("role") in ["user", "assistant"]
            ]

            # Detect language
            language = "zh" if AI_RESPONSE_LANGUAGE.lower() == "chinese" else "en"

            # Get module recommendations (with enhanced context if available)
            module_recommendations_result = module_recommender.get_recommendations(
                current_message=current_user_message,
                conversation_history=conversation_history,
                conversation_id=conversation_id,
                db_session=db_session,
                language=language,
                max_recommendations=2  # Allow up to 2 modules when both strongly indicated
            )

        # Step 2: Build system prompt with module recommendations
        if AI_FORCE_LANGUAGE:
            system_prompt = get_system_prompt_for_language(AI_RESPONSE_LANGUAGE)

            # Add module recommendation instructions if available
            if module_recommendations_result and module_recommendations_result.get("has_recommendations"):
                recommendation_prompt = module_recommender.format_for_ai_prompt(
                    module_recommendations_result
                )
                # Append recommendation instructions to system prompt
                system_prompt["content"] = system_prompt["content"] + "\n\n" + recommendation_prompt

            # Insert/replace system prompt
            if not messages or messages[0].get("role") != "system":
                messages = [system_prompt] + messages
            else:
                messages[0] = system_prompt

        # Step 3: Get AI response
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=AI_TEMPERATURE,
            max_tokens=AI_MAX_TOKENS,
            presence_penalty=AI_PRESENCE_PENALTY,
            frequency_penalty=AI_FREQUENCY_PENALTY
        )

        ai_content = response.choices[0].message.content

        # Step 4: Return response with recommendations and new metadata
        return {
            "content": ai_content,
            "module_recommendations": (
                module_recommendations_result.get("recommendations", [])
                if module_recommendations_result else []
            ),
            "psychological_state": (
                module_recommendations_result.get("psychological_state", {})
                if module_recommendations_result else {}
            ),
            "patterns": (
                module_recommendations_result.get("patterns", {})
                if module_recommendations_result else {}
            ),
            "progression": (
                module_recommendations_result.get("progression", {})
                if module_recommendations_result else {}
            )
        }

    except Exception as e:
        raise Exception(f"Error getting AI response: {str(e)}")


def get_ai_response_with_image(prompt: str, image_data: str, model: str = "gpt-4o") -> str:
    """
    Get response from OpenAI Vision API with image

    Args:
        prompt: Text prompt for analysis
        image_data: Base64 encoded image data
        model: OpenAI model to use (must support vision)

    Returns:
        AI response content
    """
    try:
        # Get system prompt based on configured language
        system_prompt = get_system_prompt_for_language(AI_RESPONSE_LANGUAGE)
        
        # Add language instruction to the prompt if force language is enabled
        if AI_FORCE_LANGUAGE and AI_RESPONSE_LANGUAGE.lower() == "chinese":
            chinese_instruction = "请用中文回答。"
            full_prompt = f"{chinese_instruction} {prompt}"
        else:
            full_prompt = prompt
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                system_prompt,
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": full_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
                    ]
                }
            ],
            max_tokens=AI_MAX_TOKENS  # Use consistent max tokens
        )
        return response.choices[0].message.content
    except Exception as e:
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
