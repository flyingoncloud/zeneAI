"""
Module configurations for ZeneAI psychology support modules

There are exactly 3 modules that can be recommended and tracked:
1. emotional_first_aid - Contains two sequential steps: breathing exercise (呼吸训练) and emotion labeling (情绪命名)
2. inner_doodling - Draw an image expressing inner world
3. quick_assessment - Self-assessment covering five psychological dimensions
"""

from typing import Dict, List, Optional

# Module definitions with metadata
# Only 3 modules exist - emotional_first_aid contains two STEPS (not sub-modules)
MODULES = {
    # MODULE 1: Emotional First Aid (recommended when user has strong emotions)
    # Contains two sequential steps: breathing exercise followed by emotion labeling
    "emotional_first_aid": {
        "id": "emotional_first_aid",
        "name_zh": "情绪急救",
        "name_en": "Emotional First Aid",
        "category": "emotional_support",
        "icon": "🚑",
        "priority": 1,  # Highest priority - for emergency emotional support
        "description_zh": "帮助你快速稳定身心状态，包含呼吸训练和情绪命名两个连续的练习",
        "description_en": "Help you quickly stabilize your physical and emotional state, includes breathing exercise followed by emotion labeling",
        # Internal steps (not separate modules, just for reference)
        "steps": ["breathing_exercise", "emotion_labeling"],
        "tags": ["emergency", "emotional_support", "emotion_regulation", "somatic"],
        # 低侵入 · 即时 · 非命令 · 保留"不做也可以"的空间 · 不解释原理 · 不承诺效果
        "guidance_template_zh": [
            # 语境A：明显焦虑/紧绷
            "如果你愿意，我们可以先做一个情绪急救练习。它包含呼吸训练和情绪命名两个部分，可以帮助你稳定当下的状态。你随时可以停。",
            # 语境B：情绪即将失控
            "在继续之前，如果你愿意，我们可以先做一个情绪急救练习。先通过呼吸让身体慢下来，然后给此刻的感受找个名字。",
            # 语境C：强烈身体反应
            "不确定你现在身体的感觉如何，但如果有一点紧绷或不舒服，情绪急救也许能帮到你。它包含呼吸训练和情绪命名，要不要试试？",
            # 语境D：用户卡住、无法继续表达
            "我们可以不用急着说。如果你愿意，先做一个情绪急救练习也可以，等感觉合适了再继续。"
        ],
        "guidance_template_en": [
            # Context A: Obvious anxiety/tension
            "If you'd like, we can try an Emotional First Aid exercise. It includes breathing practice and emotion labeling to help stabilize your current state. You can stop anytime.",
            # Context B: Emotions about to lose control
            "Before we continue, if you're open to it, we could try an Emotional First Aid exercise. First let your body slow down through breathing, then find a name for what you're feeling.",
            # Context C: Strong physical reactions
            "I'm not sure how your body feels right now, but if there's any tightness or discomfort, Emotional First Aid might help. It includes breathing exercise and emotion labeling. Would you like to try?",
            # Context D: User stuck, unable to continue expressing
            "We don't have to rush. If you want, we can do an Emotional First Aid exercise first and continue when it feels right."
        ],
        # 回流引导 - 模块完成后如何继续对话
        "followup_template_zh": [
            "刚刚做完情绪急救，感觉怎么样？",
            "你选了'{emotion}'，这个词很轻，但很准。它更像是一直都有，还是最近才变重的？",
            "现在身体感觉怎么样？有哪怕一点点不一样吗？"
        ],
        "followup_template_en": [
            "How do you feel after the Emotional First Aid exercise?",
            "You chose '{emotion}', that word is subtle but accurate. Has it always been there, or did it get heavier recently?",
            "How does your body feel now? Was there even a slight difference?"
        ]
    },

    # MODULE 2: Inner Insight Doodling
    "inner_doodling": {
        "id": "inner_doodling",
        "name_zh": "内视涂鸦",
        "name_en": "Inner Insight Doodling",
        "category": "creative_expression",
        "icon": "🎨",
        "priority": 3,
        "description_zh": "绘制一幅能够表达内心世界或当下情绪状态的图像",
        "description_en": "Draw an image that expresses your inner world or current emotional state",
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
            "你画的这幅图，有什么地方特别想让我注意的吗？",
            "看着这幅画，你觉得哪个部分最像你现在的感受？",
            "这幅画里，如果有一个地方能说话，你觉得它会说什么？"
        ],
        "followup_template_en": [
            "Looking at what you drew, is there anything you'd particularly like me to notice?",
            "Looking at this drawing, which part feels most like what you're experiencing?",
            "If one part of this drawing could speak, what do you think it would say?"
        ]
    },

    # MODULE 3: Quick Assessment
    "quick_assessment": {
        "id": "quick_assessment",
        "name_zh": "内视快测",
        "name_en": "Inner Insight Quick Assessment",
        "category": "self_assessment",
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


def get_all_module_ids() -> List[str]:
    """Get list of all valid module IDs"""
    return list(MODULES.keys())
