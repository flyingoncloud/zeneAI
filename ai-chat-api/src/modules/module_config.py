"""
Module configurations for ZeneAI psychology support modules
"""

from typing import Dict, List, Optional

# Module definitions with metadata
MODULES = {
    # PARENT MODULE: Emotional First Aid (never recommended directly)
    "emotional_first_aid": {
        "id": "emotional_first_aid",
        "name_zh": "情绪急救",
        "name_en": "Emotional First Aid",
        "category": "parent",
        "is_parent": True,
        "icon": "🚑",
        "priority": None,  # Parent module is not recommended directly
        "description_zh": "当情绪强烈或模糊时，提供即时支持的工具组合",
        "description_en": "Immediate support tools for intense or unclear emotions",
        "sub_modules": ["breathing_exercise", "emotion_labeling"],
        "tags": ["emergency", "emotional_support"]
    },

    # SUB-MODULE 1: Breathing Exercise
    "breathing_exercise": {
        "id": "breathing_exercise",
        "name_zh": "呼吸训练",
        "name_en": "Breathing Exercise",
        "category": "emotional_first_aid",
        "parent_id": "emotional_first_aid",
        "parent_module": "emotional_first_aid",  # Kept for backward compatibility
        "is_sub_module": True,
        "icon": "🫁",
        "priority": 1,  # 1 = highest (emergency), 4 = lowest (informational)
        "description_zh": "专注画面中的节奏起伏，让呼吸在几次往复间慢慢放缓、趋于平稳",
        "description_en": "Focus on the rhythmic flow on screen, letting your breath slow down and stabilize",
        # 低侵入 · 即时 · 非命令 · 保留"不做也可以"的空间 · 不解释原理 · 不承诺效果
        "guidance_template_zh": [
            # 语境A：明显焦虑/紧绷
            "如果你愿意，我们可以先做一个很短的呼吸训练。它不需要你有任何问题，也不需要改变什么，只是给身体一点缓冲。你随时可以停。",
            # 语境B：情绪即将失控
            "在继续之前，如果你愿意，我们可以先一起呼吸几次。什么都不用想，只是跟着节奏走一下。",
            # 语境C：强烈身体反应
            "不确定你现在身体的感觉如何，但如果有一点紧绷或不舒服，呼吸训练也许能帮身体慢一点。要不要试试？",
            # 语境D：用户卡住、无法继续表达
            "我们可以不用急着说。如果你愿意，先做一个简短的呼吸训练也可以，等感觉合适了再继续。"
        ],
        "guidance_template_en": [
            # Context A: Obvious anxiety/tension
            "If you'd like, we can try a short breathing exercise. It doesn't assume there's a problem or require you to change anything—just offering your body a bit of space. You can stop anytime.",
            # Context B: Emotions about to lose control
            "Before we continue, if you're open to it, we could take a few breaths together. Nothing to think about—just following the rhythm for a moment.",
            # Context C: Strong physical reactions
            "I'm not sure how your body feels right now, but if there's any tightness or discomfort, a breathing exercise might help slow things down a little. Would you like to try?",
            # Context D: User stuck, unable to continue expressing
            "We don't have to rush. If you want, we can do a brief breathing exercise first and continue when it feels right."
        ],
        "tags": ["emergency", "emotion_regulation", "somatic", "anxiety", "panic", "anger"],
        # 回流引导 - 模块完成后如何继续对话
        "followup_template_zh": [
            "刚刚呼吸的时候，有什么感觉吗？",
            "现在身体感觉怎么样？",
            "这半分钟，有哪怕一点点不一样吗？"
        ],
        "followup_template_en": [
            "How did that feel while you were breathing?",
            "How does your body feel now?",
            "Was there even a slight difference in that half minute?"
        ]
    },

    # SUB-MODULE 2: Emotion Labeling
    "emotion_labeling": {
        "id": "emotion_labeling",
        "name_zh": "情绪命名",
        "name_en": "Emotion Labeling",
        "category": "emotional_first_aid",
        "parent_id": "emotional_first_aid",
        "parent_module": "emotional_first_aid",  # Kept for backward compatibility
        "is_sub_module": True,
        "icon": "🏷️",
        "priority": 2,
        "description_zh": "从多个选项中选出最贴近当下的表情与词语，为此刻的感受留下一枚安静的标记",
        "description_en": "Select the expression or word that comes closest to your current feeling, leaving a quiet marker for this moment",
        # 温柔标记 · "不需要解释" · "最接近"而非"最准确" · 把命名当作"标记"，不是定义
        "guidance_template_zh": [
            "有时候，不一定要想清楚发生了什么，只是给当下的感受找个名字，就能多一点清晰感。要不要试试「情绪命名」？",
            '即使现在的感受很模糊，或者像是好几种混在一起，「情绪命名」也可以作为一个起点。选一个"最接近的"就够了。',
            "如果不想多说，「情绪命名」可能是个轻一点的方式。"
        ],
        "guidance_template_en": [
            "Sometimes you don't need to fully understand what's going on—just naming what you're feeling right now can bring some clarity. Want to try Emotion Labeling?",
            "Even if the feeling is vague or mixed, Emotion Labeling can still be a starting point. You don't need the perfect word—just the closest one.",
            "If you don't feel like explaining much, Emotion Labeling might be a lighter option."
        ],
        "tags": ["emotional_awareness", "alexithymia", "self_understanding", "clarity"],
        # 回流引导 - 基于命名结果继续探索（模块不是结束，而是对话的新支点）
        "followup_template_zh": [
            "你选了'{emotion}'，这个词很轻，但很准。它更像是一直都有，还是最近才变重的？",
            "'{emotion}'——这个感觉，是新的，还是老朋友了？",
            "这个'{emotion}'的感觉，你觉得它在你身体的哪个地方？"
        ],
        "followup_template_en": [
            "You chose '{emotion}', that word is subtle but accurate. Has it always been there, or did it get heavier recently?",
            "'{emotion}'—is this feeling new, or an old companion?",
            "This feeling of '{emotion}', where do you sense it in your body?"
        ]
    },

    # STANDALONE MODULE 3: Inner Insight Doodling
    "inner_doodling": {
        "id": "inner_doodling",
        "name_zh": "内视涂鸦",
        "name_en": "Inner Insight Doodling",
        "category": "creative_expression",
        "parent_id": None,
        "parent_module": None,  # Kept for backward compatibility
        "is_sub_module": False,
        "icon": "🎨",
        "priority": 3,
        "description_zh": "绘制或选择一幅能够表达内心世界或当下情绪状态的图像",
        "description_en": "Draw or select an image that expresses your inner world or current emotional state",
        # 探索 · 不提"分析" · 不说"心理" · 强调"代表"而非"解释"
        "guidance_template_zh": [
            "有些东西不一定适合用语言说。「内视涂鸦」提供了一种不用说清楚、也能表达的方式。",
            "如果用词有点卡，或者不太想选情绪标签，「内视涂鸦」也可以作为另一种入口。",
            "不需要知道自己在画什么。「内视涂鸦」更像是一个探索过程，看看画面会带你到哪里。"
        ],
        "guidance_template_en": [
            "Some experiences don't need to be put into words. Inner Insight Doodling offers a way to express without explaining everything.",
            "If words feel limiting, or if emotion labels don't quite fit, Inner Insight Doodling can be another way in.",
            "You don't need to know what you're drawing. Inner Insight Doodling is more about exploration—seeing what shows up."
        ],
        "tags": ["creative", "symbolic", "nonverbal", "jungian", "parts_work", "conflict"],
        # 回流引导 - 基于图像结果继续探索（模块不是结束，而是对话的新支点）
        "followup_template_zh": [
            "你选的这张图，有什么地方特别吸引你？",
            "看着这幅画，你觉得哪个部分最像你现在的感受？",
            "这张图里，如果有一个地方能说话，你觉得它会说什么？"
        ],
        "followup_template_en": [
            "What about this image particularly drew you to it?",
            "Looking at this drawing, which part feels most like what you're experiencing?",
            "If one part of this image could speak, what do you think it would say?"
        ]
    },

    # STANDALONE MODULE 4: Quick Assessment
    "quick_assessment": {
        "id": "quick_assessment",
        "name_zh": "内视快测",
        "name_en": "Inner Insight Quick Assessment",
        "category": "self_assessment",
        "parent_id": None,
        "parent_module": None,  # Kept for backward compatibility
        "is_sub_module": False,
        "icon": "📊",
        "priority": 4,
        "description_zh": "覆盖五大心理维度的自我评估，完成后可对心理特质、情绪模式和行为倾向进行全面分析",
        "description_en": "A self-assessment covering five psychological dimensions, providing comprehensive analysis of traits, emotional patterns, and behavioral tendencies",
        # 认知整合 · 稳定模式 · 整理零散感觉 · 整体轮廓
        "guidance_template_zh": [
            "如果你想用一个更结构化的方式看看自己现在的状态，「内视快测」可以作为一个参考框架。你可以把它当成一次扫描，而不是结论。",
            "想更系统地理解自己一次？「内视快测」提供的是一种多维度的视角，不需要你已经想清楚什么。",
            "如果你愿意，我们也可以用「内视快测」作为接下来的起点，看看哪些方向值得继续聊。"
        ],
        "guidance_template_en": [
            "If you'd like a more structured way to look at where you are right now, the Quick Assessment can serve as a reference frame. Think of it as a scan, not a conclusion.",
            "Would like to take a more systematic look at yourself? The Quick Assessment offers a multi-dimensional view—no need to have things figured out first.",
            "If you want, we can use the Quick Assessment as a starting point for what to explore next."
        ],
        "tags": ["assessment", "comprehensive", "new_user", "multi_dimensional", "baseline"],
        # 回流引导 - 基于评估结果继续探索（模块不是结束，而是对话的新支点）
        "followup_template_zh": [
            "测试结果显示你在{dimension}这个维度比较{characteristic}。这个结果，和你平时对自己的感觉一样吗？",
            "从结果来看，{pattern}似乎是你比较明显的模式。你觉得这个模式，是从什么时候开始的？",
            "看到这个结果，有什么让你意外的地方吗？"
        ],
        "followup_template_en": [
            "The results show you're quite {characteristic} in the {dimension} dimension. Does this match how you usually feel about yourself?",
            "From the results, {pattern} seems to be a notable pattern for you. When do you think this pattern started?",
            "Seeing these results, is there anything that surprises you?"
        ]
    }
}


def get_module_by_id(module_id: str) -> Optional[Dict]:
    """Get module configuration by ID"""
    return MODULES.get(module_id)


def get_modules_by_category(category: str) -> List[Dict]:
    """Get all modules in a category"""
    return [m for m in MODULES.values() if m['category'] == category]


def get_parent_module(module_id: str) -> Optional[str]:
    """Get parent module name if this is a sub-module"""
    module = MODULES.get(module_id)
    if module and module.get('parent_module'):
        return module['parent_module']
    return None


def get_sub_modules(parent_id: str) -> List[Dict]:
    """
    Get all sub-modules of a parent module

    Args:
        parent_id: Parent module ID (e.g., "emotional_first_aid")

    Returns:
        List of sub-module configurations
    """
    parent = MODULES.get(parent_id)
    if not parent or not parent.get('is_parent'):
        return []

    sub_module_ids = parent.get('sub_modules', [])
    return [MODULES[sid] for sid in sub_module_ids if sid in MODULES]


def is_sub_module(module_id: str) -> bool:
    """
    Check if a module is a sub-module

    Args:
        module_id: Module ID to check

    Returns:
        True if module is a sub-module, False otherwise
    """
    module = MODULES.get(module_id)
    return module.get('is_sub_module', False) if module else False


def get_parent_module_info(module_id: str) -> Optional[Dict]:
    """
    Get parent module configuration for a sub-module

    Args:
        module_id: Sub-module ID

    Returns:
        Parent module configuration, or None if not a sub-module
    """
    module = MODULES.get(module_id)
    if not module or not module.get('is_sub_module'):
        return None

    parent_id = module.get('parent_id')
    return MODULES.get(parent_id) if parent_id else None
