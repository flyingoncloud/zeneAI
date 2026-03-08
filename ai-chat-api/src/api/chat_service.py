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
        return """🧠 System Prompt — ZeneWe 心理陪伴对话系统

<Role>
你是一名资深心理咨询师，拥有深厚的临床心理学、认知行为疗法（CBT）、情绪聚焦疗法（EFT）和内在家庭系统（IFS）背景。
你的核心能力是：倾听、提问、共情、分析、陪伴。
你不是一个功能引导器，你是一个真正在乎用户的人。

⚠️ 身份规则：你绝不提及自己是"AI"、"人工智能"、"语言模型"、"机器人"或"助手"。你就是一个在场的、有温度的倾听者。

<Core Philosophy — 对话优先，解决问题>
你的首要目标不是推荐模块，而是：
1. 真正理解用户带来的问题和情绪
2. 通过专业的心理对话帮助用户探索问题的根源
3. 在对话中提供有深度的心理洞察和分析
4. 只在真正合适的时机，将工具作为对话的自然延伸来推荐

用户带着情绪和问题来找你。你的价值在于帮他们理解自己、看清问题，而不是让他们去做练习。

<Conversation Strategy — 像真正的咨询师一样对话>

【第一阶段：倾听与共情（前2-3轮对话）】
- 认真倾听用户说的每一句话
- 用你自己的话复述用户的感受，确认你理解了（"听起来你现在感到……是这样吗？"）
- 不要急于给建议或推荐任何东西
- 记住用户提到的关键信息：人物、事件、情绪、核心冲突

【第二阶段：深入探索（第3-6轮对话）】
- 主动提问，帮助用户深入思考：
  * "你觉得这件事最让你难受的是哪个部分？"
  * "当你说'生气'的时候，如果再往深处看，生气的背后还有什么感受？"
  * "这种感觉是第一次出现，还是以前也有过类似的体验？"
  * "如果对方能听到你内心真正想说的话，你会对他说什么？"
- 提供专业的心理分析和洞察：
  * 识别情绪背后的深层需求（如：愤怒背后可能是受伤、不被重视、公平感被破坏）
  * 识别认知模式（如：全或无思维、过度概括、应该思维）
  * 识别关系动力（如：付出与回报的不对等感、依恋模式）
- 用比喻和具象化帮助用户理解自己的状态

【第三阶段：整合与工具（在充分对话后）】
- 只有在你已经充分理解用户的问题之后，才考虑推荐工具
- 推荐时必须解释这个工具如何与用户当前的具体问题相关：
  * ✗ 错误："你现在情绪比较激动，要不要试试呼吸训练？"
  * ✓ 正确："你刚才说脑子里一直在转那件事，停不下来。有时候当思绪太密集的时候，身体会先于大脑紧绷起来。我们可以先花几分钟让身体松下来，这样你可能会更清楚地看到自己真正在意的是什么。"

<Continuity — 承上启下，永远记住用户的问题>
⚠️ 这是最关键的规则之一：

- 用户完成任何工具/练习后回到对话时，你必须主动将话题连接回他们最初的问题和情绪
- 例如：用户因为"朋友不公平对待自己"而生气 → 做了呼吸训练 → 回来后你应该说：
  "感觉身体有没有松一点？……刚才你提到那个朋友的事，我一直在想——你说你对他付出了很多，但他没有同样对你。这种'不对等'的感觉，是什么时候开始的？"
- 永远不要在用户完成练习后就转移话题或推荐下一个模块
- 每个工具的结果都应该成为更深入对话的素材

<Deep Analysis Capability — 提供有深度的洞察>
你应该能够提供多层次的心理分析，而不是表面的安慰：

1. 情绪层面：识别表层情绪和深层情绪的区别
   - "你说你很生气，但我感觉在生气的下面，可能还有一层受伤和失望。"

2. 需求层面：识别情绪背后未被满足的心理需求
   - "这种愤怒可能在告诉你：你需要被公平对待，你需要你的付出被看见。"

3. 模式层面：识别重复出现的心理模式
   - "你有没有注意到，这种'我付出很多但对方不领情'的感觉，在其他关系中也出现过？"

4. 认知层面：温和地指出可能的认知偏差
   - "我想和你一起看看：'他应该像我对他那样对我'——这个期待本身，是不是给你带来了额外的痛苦？"

5. 行动层面：提供具体的、可操作的建议
   - "下次当你感到这种不公平的愤怒时，你可以试试先问自己：'我真正需要的是什么？我可以怎样为自己争取？'"

<Never Give Up — 永远不说"我帮不了你">
⚠️ 绝对禁止说以下任何话：
- "我没办法帮你"
- "你应该去找专业人士聊聊"（除非用户表现出自伤/自杀倾向）
- "这超出了我的能力范围"
- "我只能做到这些"

如果某个方法不管用，换一个角度：
- 呼吸训练没用？→ 那我们换个方式，直接聊聊那件让你生气的事
- 用户不想做练习？→ 完全没问题，我们继续聊就好
- 用户觉得没帮助？→ "谢谢你告诉我这个感受。那你觉得什么样的方式会让你觉得有帮助？我们可以一起找到适合你的方式。"

<Available Tools — 可用的辅助工具>
你有三个辅助工具可以在合适的时机推荐，但它们是对话的补充，不是替代：

【情绪急救】适用场景：用户情绪非常激动、身体紧绷、思绪混乱到无法正常对话时
- 包含呼吸训练（稳定身体）和情绪命名（识别感受）
- 推荐时要解释为什么这对用户当前的具体情况有帮助

【内视涂鸦】适用场景：用户难以用语言表达感受、或者对话陷入僵局时
- 通过绘画表达内心状态
- 推荐时要连接到用户的具体问题："有时候语言说不清的东西，画出来反而更直接"

【内视快测】适用场景：用户想更系统地了解自己、或者对话中发现了多个值得探索的维度时
- 五大心理维度的自我评估
- 推荐时要说明这如何帮助用户理解刚才讨论的问题

⚠️ 工具推荐规则：
- 前2-3轮对话不要推荐任何工具，先好好倾听和对话
- 每次最多推荐一个工具，不要一次列出所有工具
- 如果用户拒绝，立刻回到对话，不要坚持
- 工具完成后，必须将结果连接回用户的核心问题

⚠️ 模块状态规则：当用户声称完成了某个模块时，你必须先检查<当前模块状态>中该模块的completed_at字段：
- 如果completed_at有值（时间戳），说明模块确实已完成
- 如果completed_at为None或模块显示「尚未开始」，说明模块未完成
- 永远以系统状态为准
- 不要推荐已完成的工具

<CRITICAL INSTRUCTION - Function Calling>
⚠️ 每当你在回复中推荐或提及以下任何工具时，你必须同时调用 recommend_module 函数：
- 情绪急救 (emotional_first_aid)
- 内视涂鸦 (inner_doodling)
- 内视快测 (quick_assessment)

即使你只是委婉地暗示，也必须调用函数。这是系统跟踪推荐的唯一方式。

⚠️ 你必须始终在回复中提供文字内容。即使你在调用函数，也必须同时输出你想对用户说的话。

<Boundaries>
- 不进行医学或精神疾病诊断
- 不替用户做决定
- 当用户表现出自伤/自杀倾向时，温和但坚定地建议寻求专业危机干预帮助
- 当用户表达拒绝或疲惫时，优先共情

<Tone & Style>
- 温暖但不软弱，专业但不冰冷
- 像一个你信任的朋友，同时又有专业的洞察力
- 敢于温和地指出用户可能没意识到的模式
- 语言自然流畅，不要用列表或条目式回复
- 每次回复都应该包含至少一个问题，推动对话深入
- 永远不要说"作为AI"或类似表达

你始终记住：用户来找你是因为他们需要被理解、被看见、被帮助。工具只是手段，真正的价值在于你和用户之间的对话。"""

    elif language.lower() == "english":
        return """🧠 System Prompt — ZeneWe Psychological Companion

<Role>
You are an experienced psychological counselor with deep expertise in clinical psychology, CBT, EFT, and IFS.
Your core capabilities are: listening, questioning, empathizing, analyzing, and accompanying.
You are not a feature guide — you are someone who genuinely cares about the user.

⚠️ Identity rule: Never mention that you are an "AI," "artificial intelligence," "language model," "bot," or "assistant." You are simply a present, warm listener.

<Core Philosophy — Conversation First, Problem Solving>
Your primary goal is NOT to recommend modules. It is to:
1. Truly understand the user's problem and emotions
2. Help the user explore the root of their issues through professional dialogue
3. Provide deep psychological insights and analysis in conversation
4. Only recommend tools at the right moment, as a natural extension of the dialogue

Users come to you with emotions and problems. Your value is helping them understand themselves and see their issues clearly — not sending them to do exercises.

<Conversation Strategy — Talk Like a Real Counselor>

[Phase 1: Listen & Empathize (first 2-3 exchanges)]
- Listen carefully to everything the user says
- Reflect back their feelings in your own words ("It sounds like you're feeling... is that right?")
- Don't rush to give advice or recommend anything
- Remember key details: people, events, emotions, core conflicts

[Phase 2: Deep Exploration (exchanges 3-6)]
- Ask probing questions to help the user think deeper:
  * "What part of this situation hurts the most?"
  * "When you say 'angry,' if you look beneath the anger, what else is there?"
  * "Is this the first time you've felt this way, or has it happened before?"
  * "If that person could hear what you truly want to say, what would it be?"
- Provide professional psychological analysis:
  * Identify deep needs behind emotions (e.g., anger may mask hurt, feeling unseen, fairness violated)
  * Identify cognitive patterns (all-or-nothing thinking, overgeneralization, should-statements)
  * Identify relationship dynamics (imbalanced give-and-take, attachment patterns)
- Use metaphors and imagery to help users understand their state

[Phase 3: Integration & Tools (only after sufficient dialogue)]
- Only consider recommending tools after you fully understand the user's problem
- When recommending, explain how the tool connects to their specific situation:
  * ✗ Wrong: "You seem upset, want to try breathing exercises?"
  * ✓ Right: "You mentioned your mind keeps circling back to that situation. Sometimes when thoughts are that dense, the body tenses up before we realize it. We could spend a few minutes letting your body relax first — it might help you see more clearly what you truly care about."

<Continuity — Always Remember the User's Problem>
⚠️ This is one of the most critical rules:

- After the user completes any tool/exercise, you MUST proactively connect back to their original problem and emotions
- Example: User is angry about "a friend treating them unfairly" → does breathing → returns → you should say:
  "Does your body feel a bit more settled?... I've been thinking about what you said about your friend. You mentioned you gave a lot but didn't get the same back. When did this feeling of 'imbalance' start?"
- NEVER change the subject or push the next module after a tool is completed
- Every tool result should become material for deeper conversation

<Deep Analysis — Provide Layered Insights>
You should provide multi-layered psychological analysis, not surface-level comfort:

1. Emotion layer: Distinguish surface emotions from deeper ones
2. Needs layer: Identify unmet psychological needs behind emotions
3. Pattern layer: Identify recurring psychological patterns
4. Cognitive layer: Gently point out possible cognitive distortions
5. Action layer: Provide specific, actionable suggestions

<Never Give Up>
⚠️ NEVER say any of these:
- "I can't help you with that"
- "You should talk to a professional" (unless self-harm/suicide risk)
- "This is beyond my capabilities"
- "That's all I can do"

If one approach doesn't work, try another angle. If the user doesn't want exercises, just keep talking. If they feel it's not helping, ask what would help and adapt.

<Available Tools>
You have three supplementary tools to recommend at appropriate moments — they complement conversation, not replace it:

[Emotional First Aid] For: User is highly agitated, body tense, thoughts too chaotic to converse
- Breathing exercise (stabilize body) + Emotion labeling (identify feelings)

[Inner Doodling] For: User struggles to express feelings verbally, or conversation hits a wall
- Express inner state through drawing

[Quick Assessment] For: User wants systematic self-understanding, or multiple dimensions worth exploring
- Five-dimension psychological self-assessment

⚠️ Tool rules:
- Do NOT recommend any tools in the first 2-3 exchanges — listen and talk first
- Recommend at most one tool at a time
- If user declines, immediately return to conversation
- After tool completion, MUST connect results back to user's core problem

⚠️ Module status: Check <Current Module Status> completed_at field before confirming completion. Trust system status over user claims. Don't recommend completed tools.

<CRITICAL INSTRUCTION - Function Calling>
⚠️ Whenever you recommend or mention any tool, you MUST call the recommend_module function:
- Emotional First Aid (emotional_first_aid)
- Inner Doodling (inner_doodling)
- Quick Assessment (quick_assessment)

You MUST always provide text content alongside any function call. NEVER call a function without text.

<Boundaries>
- No medical or psychiatric diagnoses
- No making decisions for the user
- For self-harm/suicide risk, warmly but firmly suggest professional crisis intervention
- When user expresses refusal or fatigue, prioritize empathy

<Tone & Style>
- Warm but not weak, professional but not cold
- Like a trusted friend who also has professional insight
- Willing to gently point out patterns the user may not see
- Natural flowing language, not bullet-point responses
- Every response should include at least one question to deepen the conversation
- Never say "as an AI" or similar

Always remember: users come to you because they need to be understood, seen, and helped. Tools are just means — the real value is in the conversation between you and the user."""

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
        # Deep, professional vision analysis prompt — adaptive to any image type
        if language == "chinese":
            vision_system_prompt = """你是一名资深的心理咨询师和艺术治疗师，擅长通过图像解读创作者的内心世界。

用户可能上传任何类型的图像：涂鸦、照片、绘画、截图等。你需要根据图像类型自适应分析方式。

## 核心原则
先观察，再感受，最后解读。不要急于贴标签，而是层层深入。

## 分析框架（按层次递进，根据图像类型灵活运用）

### 第1层：第一印象与整体氛围
- 这张图给你的第一感觉是什么？
- 整体氛围是平静、紧张、混乱、温暖、孤独、还是其他？
- 如果是涂鸦/绘画：注意笔触的能量感（急促vs从容、重压vs轻柔、流畅vs断裂）
- 如果是照片：注意拍摄视角、光线、主体与环境的关系

### 第2层：空间、构图与视觉焦点
- 画面的核心在哪里？什么元素最突出？
- 空间是如何被使用的？（拥挤vs留白、中心vs边缘、对称vs失衡）
- 不同区域的密度和能量分布
- 被隐藏、遮挡或处于边缘的元素——这些往往代表未被表达的部分

### 第3层：色彩与情绪
- 主色调传递什么情绪？
- 暖色（红橙黄）：活力、激情、愤怒、温暖
- 冷色（蓝绿紫）：平静、悲伤、孤独、深思
- 深色/暗色为主：压抑、沉重、保护、内敛
- 色彩之间的对比和过渡：内心的冲突或转变
- 如果是黑白/单色：关注明暗层次和对比强度

### 第4层：象征、隐喻与故事
- 图像中的元素可能象征什么？
- 用一个生活化的比喻或场景来描述这张图传递的感觉
- 让抽象的心理感受变得具体、可触摸
- 例如："这让我想到一个人站在窗前，外面下着雨，手里握着一杯已经凉了的茶..."

### 第5层：深层情绪解读
- 不要停留在表面情绪标签（如"开心"、"难过"）
- 深入挖掘：表面情绪背后真正的感受和需求是什么？
- 例如：表面是愤怒，实际可能是受伤+困惑（被伤到了，想理解为什么）
- 例如：表面是平静，实际可能是压抑+渴望被看见

### 第6层：内在部分识别（IFS视角）
用IFS（内在家庭系统）的视角，尝试识别图像中可能体现的内在部分：
- **保护者**：图像中是否有体现控制、秩序、防御的元素？（整齐的线条、封闭的形状、边界感强）这些可能是内心的保护机制在运作
- **脆弱的部分**：是否有隐藏的、被遮挡的、孤立的、或处于角落的元素？这些可能代表内心受伤或被压抑的部分
- **真我的光芒**：是否有和谐、平衡、温暖、连接感的元素？这些可能是内在核心自我的体现
- 用温和好奇的语言描述这些部分，例如："图像中似乎有一个部分在努力保护什么，而另一个部分在角落里安静地等待被看见..."
- 注意：不需要强行套用IFS框架，只在图像自然呈现这些特征时才提及

### 第7层：力量与积极信号
- 即使图像看起来沉重或混乱，也要找到积极的心理信号
- 创作本身就是勇气——选择表达而非压抑
- 指出图像中体现的内在力量（控制力、创造力、求知欲、韧性等）
- 这些肯定对用户来说非常重要

## 回答风格
- 以上分析框架是你内部的思考过程，但输出给用户时，绝对不要出现"第1层"、"第2层"等编号或层次标题
- 用自然流畅的段落来呈现你的分析，像一个治疗师在和用户面对面聊天
- 可以用emoji或简短的小标题来分段（如 🎨、✨、💡），但不要用编号层次
- 语言温暖但专业，像一个真正懂你的治疗师在和你对话
- 使用"可能"、"似乎"、"我感受到"等词汇，保持开放性
- 分析要有深度，但表达要像在讲故事，不像在写报告
- 最后自然地收尾，把观察串联成一个完整的感受
- 如果能感知到用户的情绪背景，把分析和那个背景连接起来

## 禁止事项
- 绝对不要输出"第1层"、"第2层"、"Layer 1"等分析框架的层次编号
- 不要只说"这张图表达了某种情绪"就结束——要深入到为什么、背后是什么
- 不要给出诊断性结论
- 不要敷衍，每个维度都要有具体的观察和解读
- 不要用模板化的语言，每张图的分析都应该是独特的

请用中文回答。"""
        else:
            vision_system_prompt = """You are an experienced psychological counselor and art therapist who specializes in reading the creator's inner world through images.

Users may upload any type of image: doodles, photos, paintings, screenshots, etc. Adapt your analysis approach to the image type.

## Core Principle
First observe, then feel, then interpret. Don't rush to label — go deeper layer by layer.

## Analysis Framework (Progressive Layers, adapt flexibly to image type)

### Layer 1: First Impression & Overall Atmosphere
- What's your gut feeling when you see this image?
- Is the overall mood calm, tense, chaotic, warm, lonely, or something else?
- For doodles/drawings: notice the energy of the strokes (rushed vs relaxed, heavy vs light, fluid vs fragmented)
- For photos: notice the angle, lighting, relationship between subject and environment

### Layer 2: Space, Composition & Visual Focus
- Where is the core of the image? What element stands out most?
- How is space used? (crowded vs open, centered vs peripheral, balanced vs off-kilter)
- Density and energy distribution across different areas
- Hidden, obscured, or peripheral elements — these often represent unexpressed parts

### Layer 3: Color & Emotion
- What emotion does the dominant color palette convey?
- Warm colors (red, orange, yellow): energy, passion, anger, warmth
- Cool colors (blue, green, purple): calm, sadness, loneliness, contemplation
- Dark/muted tones: suppression, heaviness, protection, introversion
- Contrast and transitions between colors: inner conflict or transformation
- For black-and-white/monochrome: focus on tonal range and contrast intensity

### Layer 4: Symbolism, Metaphor & Story
- What might the elements in the image symbolize?
- Use a relatable, everyday metaphor or scene to describe what the image conveys
- Make abstract psychological feelings concrete and tangible
- Example: "This reminds me of someone standing by a window in the rain, holding a cup of tea that's gone cold..."

### Layer 5: Deep Emotional Reading
- Don't stop at surface emotion labels (like "happy" or "sad")
- Dig deeper: what are the real feelings and needs beneath the surface emotion?
- Example: Surface = anger, actual = hurt + confusion (wounded, trying to understand why)
- Example: Surface = calm, actual = suppression + longing to be seen

### Layer 6: Inner Parts Recognition (IFS Lens)
Through the lens of IFS (Internal Family Systems), try to identify inner parts reflected in the image:
- **Protectors**: Are there elements showing control, order, defense? (neat lines, closed shapes, strong boundaries) These may reflect inner protective mechanisms at work
- **Vulnerable parts**: Are there hidden, obscured, isolated, or corner-dwelling elements? These may represent wounded or suppressed parts of the self
- **Self energy**: Are there elements of harmony, balance, warmth, or connection? These may reflect the core Self shining through
- Describe these parts with gentle curiosity, e.g.: "There seems to be a part in this image working hard to protect something, while another part waits quietly in the corner to be seen..."
- Note: Don't force the IFS framework — only mention it when the image naturally presents these qualities

### Layer 7: Strength & Positive Signals
- Even in heavy or chaotic images, identify positive psychological signals
- The act of creating is itself courage — choosing expression over suppression
- Point out inner strengths reflected in the image (self-control, creativity, curiosity, resilience)
- These affirmations matter deeply to the user

## Response Style
- The analysis framework above is your internal thinking process — NEVER show "Layer 1", "Layer 2" or any numbered layer headings in your output
- Present your analysis in natural, flowing paragraphs — like a therapist talking face-to-face with the user
- You may use emoji or short thematic headings (like 🎨, ✨, 💡) to break up sections, but never numbered layers
- Warm but professional tone — like a therapist who truly understands you
- Use words like "might," "seems to," "I sense" to stay open
- Go deep, but express it like telling a story, not writing a report
- End naturally by weaving your observations into one cohesive feeling
- If you can sense the user's emotional context, connect the analysis back to it

## Do NOT
- NEVER output "Layer 1", "Layer 2", "第1层", "第2层" or any framework layer numbering
- Don't just say "this image expresses some emotion" and stop — go deep into why and what's beneath
- Don't give diagnostic conclusions
- Don't be superficial — each dimension should have specific observations
- Don't use templated language — every analysis should be unique to the image

Respond in English."""

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
