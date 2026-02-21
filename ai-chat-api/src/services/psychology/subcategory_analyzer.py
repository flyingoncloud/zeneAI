"""
Sub-Category Analysis

Analyzes sub-category score patterns within major categories to identify
which sub-categories are most/least active and generate interpretive text.
"""

import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)


# Sub-category metadata with Chinese names and interpretations
SUBCATEGORY_METADATA = {
    # 2.1 - Emotional Awareness
    '2.1.1': {
        'name': '情绪识别与表达',
        'name_en': 'Emotion Recognition and Expression',
        'description': '识别和表达情绪的能力',
        'high_activity': '情绪识别与表达能力强，你能够清晰地识别自己的情绪状态，并用恰当的方式表达出来。这是情绪健康的重要基础，有助于自我理解和人际沟通。',
        'low_activity': '情绪识别与表达能力较弱，你可能难以准确识别自己的情绪，或者不知道如何恰当地表达。这可能导致情绪积压或沟通困难。培养情绪词汇和表达练习可能有帮助。'
    },
    '2.1.2': {
        'name': '情绪调节与恢复',
        'name_en': 'Emotion Regulation and Recovery',
        'description': '调节情绪和从负面情绪中恢复的能力',
        'high_activity': '情绪调节与恢复能力强，你能够有效地管理自己的情绪，从负面情绪中较快恢复。你可能拥有多种健康的情绪调节策略，如深呼吸、运动、倾诉等。',
        'low_activity': '情绪调节与恢复能力较弱，你可能在情绪激动时难以平复，或者从负面情绪中恢复较慢。学习情绪调节技巧（如正念、认知重构）可能有帮助。'
    },
    '2.1.3': {
        'name': '情绪倾向与风险',
        'name_en': 'Emotional Tendencies and Risks',
        'description': '情绪模式和潜在的情绪风险',
        'high_activity': '情绪倾向与风险得分较高，表明你可能存在某些需要关注的情绪模式或风险，如情绪波动较大、容易陷入负面情绪、或有情绪失控的倾向。这是一个重要的觉察信号，建议寻求专业支持。',
        'low_activity': '情绪倾向与风险得分较低，表明你的情绪模式相对稳定和健康，较少出现极端的情绪反应或持续的负面情绪。这是情绪健康的良好指标。'
    },

    # 2.2.1 - Internal System Analysis (IFS Parts)
    '2.2.1.1': {
        'name': '管理者',
        'name_en': 'Managers',
        'description': '负责控制、计划和保护的内在部分',
        'high_activity': '管理者部分高度活跃，表明你倾向于通过控制和计划来应对生活。你可能是一个高度自律、追求完美的人，但也可能因过度控制而感到疲惫。',
        'low_activity': '管理者部分活跃度较低，表明你可能较少依赖控制和计划。这可能让你更加灵活自在，但也可能在需要组织和规划时感到困难。'
    },
    '2.2.1.2': {
        'name': '消防员',
        'name_en': 'Firefighters',
        'description': '通过冲动行为快速缓解痛苦的内在部分',
        'high_activity': '消防员部分高度活跃，表明你可能经常通过冲动行为（如暴饮暴食、过度购物、逃避等）来快速缓解内心痛苦。这是一种自我保护机制，但可能带来长期问题。',
        'low_activity': '消防员部分活跃度较低，表明你较少依赖冲动行为来缓解痛苦。你可能拥有更成熟的应对机制，但也要注意是否压抑了需要关注的情绪。'
    },
    '2.2.1.3': {
        'name': '流亡者',
        'name_en': 'Exiles',
        'description': '携带创伤和痛苦记忆的内在部分',
        'high_activity': '流亡者部分高度活跃，表明你内心携带着较多未愈合的创伤和痛苦记忆。这些部分可能经常被触发，带来强烈的情绪反应。疗愈这些流亡者是深度成长的关键。',
        'low_activity': '流亡者部分活跃度较低，可能表明你的创伤较少或已得到较好的疗愈。但也要注意是否有被深度压抑的流亡者尚未被觉察。'
    },
    '2.2.1.4': {
        'name': '自性',
        'name_en': 'Self',
        'description': '充满慈悲、智慧和领导力的核心自我',
        'high_activity': '自性部分高度活跃，表明你能够以慈悲、好奇和平静的态度面对内在各个部分。你拥有较强的内在领导力，能够协调不同部分的需求。',
        'low_activity': '自性部分活跃度较低，表明你可能经常被各个部分"绑架"，难以保持内在的平静和领导力。培养自性能量是内在整合的核心。'
    },

    # 2.2.2 - Automatic Thought Patterns
    '2.2.2.1': {
        'name': '过度概括',
        'name_en': 'Overgeneralization',
        'description': '从单一事件得出普遍结论',
        'high_activity': '过度概括模式活跃，你可能经常从一次失败就认为"我总是失败"，从一次被拒绝就认为"没人喜欢我"。这种思维模式会放大负面体验。',
        'low_activity': '过度概括模式较少出现，你能够将单一事件看作个别情况，而非普遍规律。这有助于保持客观和乐观。'
    },
    '2.2.2.2': {
        'name': '非黑即白',
        'name_en': 'Black-and-White Thinking',
        'description': '极端化思维，缺乏灰度',
        'high_activity': '非黑即白思维模式活跃，你可能倾向于用"完美/失败"、"好人/坏人"等极端方式看待事物。这会导致情绪波动和人际关系困难。',
        'low_activity': '非黑即白思维较少，你能够看到事物的多面性和灰度地带。这种灵活性有助于更现实和平衡的认知。'
    },
    '2.2.2.3': {
        'name': '灾难化',
        'name_en': 'Catastrophizing',
        'description': '预期最坏结果',
        'high_activity': '灾难化思维模式活跃，你可能经常想象最坏的结果，将小问题放大为灾难。这会导致过度焦虑和回避行为。',
        'low_activity': '灾难化思维较少，你能够保持相对现实的预期，不会过度担忧未来。这有助于减少焦虑和增强行动力。'
    },
    '2.2.2.4': {
        'name': '应该/必须',
        'name_en': 'Should/Must Statements',
        'description': '僵化的规则和期待',
        'high_activity': '"应该/必须"思维模式活跃，你可能对自己和他人有很多僵化的规则和期待。这会导致内疚、愤怒和失望。',
        'low_activity': '"应该/必须"思维较少，你能够以更灵活和接纳的态度对待自己和他人。这有助于减少内疚和提升幸福感。'
    },
    '2.2.2.5': {
        'name': '自我责备',
        'name_en': 'Self-Blame',
        'description': '过度自我批评',
        'high_activity': '自我责备模式活跃，你可能经常将问题归咎于自己，即使不是你的责任。这会导致低自尊和抑郁情绪。',
        'low_activity': '自我责备较少，你能够客观看待责任归属，不会过度自责。这有助于保持健康的自尊和情绪稳定。'
    },

    # 2.2.3 - Perspective Shifting
    '2.2.3.1': {
        'name': '自我 vs 他人视角转换',
        'name_en': 'Self vs Others Perspective',
        'description': '在自我和他人视角间切换的能力',
        'high_activity': '自我-他人视角转换能力强，你能够轻松理解他人的想法和感受，同时保持自己的立场。这是良好人际关系的基础。',
        'low_activity': '自我-他人视角转换能力较弱，你可能难以理解他人的观点，或者过度共情而失去自我。需要练习在两者间找到平衡。'
    },
    '2.2.3.2': {
        'name': '空间视角转换',
        'name_en': 'Spatial Perspective',
        'description': '从不同空间位置看待问题的能力',
        'high_activity': '空间视角转换能力强，你能够"跳出"当前情境，从更高或更远的角度看待问题。这有助于获得新的洞察和解决方案。',
        'low_activity': '空间视角转换能力较弱，你可能容易陷入当前视角，难以获得新的观点。练习"从旁观者角度看自己"可能有帮助。'
    },
    '2.2.3.3': {
        'name': '认知框架转换',
        'name_en': 'Cognitive Frame Shifting',
        'description': '改变对事件意义理解的能力',
        'high_activity': '认知框架转换能力强，你能够从不同角度理解同一事件的意义。这种"重新框架"能力是心理韧性的重要组成部分。',
        'low_activity': '认知框架转换能力较弱，你可能倾向于用固定的方式理解事件。学习认知重构技巧可能有帮助。'
    },
    '2.2.3.4': {
        'name': '情绪视角转换',
        'name_en': 'Emotional Perspective',
        'description': '理解不同情绪状态下的不同视角',
        'high_activity': '情绪视角转换能力强，你能够理解情绪如何影响认知，并在不同情绪状态间保持觉察。这有助于情绪调节和决策。',
        'low_activity': '情绪视角转换能力较弱，你可能难以理解情绪对思维的影响。提升情绪觉察可能有帮助。'
    },

    # 2.2.4 - Narrative Structure
    '2.2.4.1': {
        'name': '英雄型',
        'name_en': 'Hero Type',
        'description': '将自己视为克服困难的英雄',
        'high_activity': '英雄型叙事活跃，你倾向于将生活看作一系列需要克服的挑战。这能带来动力和成就感，但也可能导致过度承担和疲惫。',
        'low_activity': '英雄型叙事较少，你可能不太将生活看作"战斗"。这可能让你更加放松，但也可能在面对挑战时缺乏动力。'
    },
    '2.2.4.2': {
        'name': '受害者型',
        'name_en': 'Victim Type',
        'description': '将自己视为环境的受害者',
        'high_activity': '受害者型叙事活跃，你可能经常感到被环境和他人伤害，缺乏掌控感。这种叙事会削弱行动力和自我效能感。',
        'low_activity': '受害者型叙事较少，你能够看到自己在生活中的主动性和选择权。这有助于提升掌控感和幸福感。'
    },
    '2.2.4.3': {
        'name': '反抗型',
        'name_en': 'Rebel Type',
        'description': '将自己视为反抗权威和规则的人',
        'high_activity': '反抗型叙事活跃，你可能经常质疑权威和规则，追求独立和自由。这能带来创新，但也可能导致冲突和孤立。',
        'low_activity': '反抗型叙事较少，你可能更容易接受规则和权威。这可能让你更容易融入，但也要注意是否压抑了真实的自我。'
    },
    '2.2.4.4': {
        'name': '迷失型',
        'name_en': 'Lost Type',
        'description': '感到迷失和缺乏方向',
        'high_activity': '迷失型叙事活跃，你可能经常感到困惑和缺乏方向。这是一个需要关注的信号，可能需要重新探索自我和人生意义。',
        'low_activity': '迷失型叙事较少，你对自己的方向和目标有较清晰的认识。这有助于保持动力和目标感。'
    },
    '2.2.4.5': {
        'name': '探索者型',
        'name_en': 'Explorer Type',
        'description': '将生活视为探索和发现的旅程',
        'high_activity': '探索者型叙事活跃，你将生活看作充满可能性的探索旅程。这能带来好奇心和成长动力，是健康的叙事模式。',
        'low_activity': '探索者型叙事较少，你可能较少将生活看作探索。培养好奇心和开放性可能有助于增强这种叙事。'
    },

    # 2.3.1 - Attachment Structure
    '2.3.1.1': {
        'name': '安全型',
        'name_en': 'Secure',
        'description': '安全型依恋模式',
        'high_activity': '安全型依恋活跃，你在关系中感到安全和舒适，能够平衡亲密和独立。这是最健康的依恋模式。',
        'low_activity': '安全型依恋较弱，你可能在关系中感到不安全或不舒适。探索早期依恋经历可能有助于理解这一模式。'
    },
    '2.3.1.2': {
        'name': '焦虑型',
        'name_en': 'Anxious',
        'description': '焦虑型依恋模式',
        'high_activity': '焦虑型依恋活跃，你可能在关系中过度担心被抛弃，需要大量的确认和保证。这会给关系带来压力。',
        'low_activity': '焦虑型依恋较弱，你在关系中较少感到焦虑和不安全。这有助于建立更稳定的关系。'
    },
    '2.3.1.3': {
        'name': '回避型',
        'name_en': 'Avoidant',
        'description': '回避型依恋模式',
        'high_activity': '回避型依恋活跃，你可能在关系中保持距离，难以建立深度亲密。这可能源于对脆弱的恐惧。',
        'low_activity': '回避型依恋较弱，你能够在关系中保持适度的亲密和开放。这有助于建立深度连接。'
    },
    '2.3.1.4': {
        'name': '混乱型',
        'name_en': 'Disorganized',
        'description': '混乱型依恋模式',
        'high_activity': '混乱型依恋活跃，你可能在关系中既渴望亲密又恐惧亲密，表现出矛盾的行为。这通常源于早期创伤，需要专业支持。',
        'low_activity': '混乱型依恋较弱，你在关系中的行为较为一致和可预测。这有助于建立稳定的关系。'
    },

    # 2.5 - Growth Potential
    '2.5.1': {
        'name': '洞察深度',
        'name_en': 'Insight Depth',
        'description': '自我洞察的深度',
        'high_activity': '洞察深度高，你对自己的内在世界有深刻的理解，能够觉察到细微的心理动态。这是深度成长的基础。',
        'low_activity': '洞察深度较浅，你可能对自己的内在世界了解有限。培养自我觉察和反思习惯可能有帮助。'
    },
    '2.5.2': {
        'name': '内在可塑性',
        'name_en': 'Internal Plasticity',
        'description': '心理的灵活性和可塑性',
        'high_activity': '内在可塑性高，你的心理模式灵活，容易适应和改变。这是持续成长的重要能力。',
        'low_activity': '内在可塑性较低，你的心理模式可能较为固化。这可能限制成长，但通过练习可以提升。'
    },
    '2.5.3': {
        'name': '心灵韧性',
        'name_en': 'Psychological Resilience',
        'description': '从困难中恢复的能力',
        'high_activity': '心灵韧性强，你能够从挫折和困难中快速恢复。这是心理健康的重要指标。',
        'low_activity': '心灵韧性较弱，你可能在面对困难时恢复较慢。培养韧性是提升心理健康的重要途径。'
    }
}


def analyze_subcategory_pattern(
    category_code: str,
    category_scores: Dict[str, int]
) -> Optional[Dict[str, Any]]:
    """
    Analyze sub-category pattern within a major category.

    Args:
        category_code: Major category code (e.g., '2.2.1', '2.2.2', '2.3.1', '2.5')
        category_scores: All category scores from questionnaire_progress

    Returns:
        {
            'category_code': str,
            'category_name': str,
            'highest_subcategory': {
                'code': str,
                'name': str,
                'score': int,
                'interpretation': str
            },
            'lowest_subcategory': {
                'code': str,
                'name': str,
                'score': int,
                'interpretation': str
            },
            'summary': str
        }
        or None if no sub-categories found
    """
    logger.info(f"Analyzing sub-category pattern for {category_code}")

    # Find all sub-categories under this category
    subcategory_scores = {}

    for cat_code, score in category_scores.items():
        # Check if this is a sub-category of the target category
        # e.g., '2.2.1.1' is sub-category of '2.2.1'
        if cat_code.startswith(category_code + '.') and cat_code != category_code:
            subcategory_scores[cat_code] = score

    if not subcategory_scores:
        logger.info(f"No sub-categories found for {category_code}")
        return None

    logger.info(f"Found {len(subcategory_scores)} sub-categories: {subcategory_scores}")

    # Find highest and lowest scoring sub-categories
    highest_code = max(subcategory_scores, key=subcategory_scores.get)
    lowest_code = min(subcategory_scores, key=subcategory_scores.get)

    highest_score = subcategory_scores[highest_code]
    lowest_score = subcategory_scores[lowest_code]

    # Get metadata
    highest_meta = SUBCATEGORY_METADATA.get(highest_code, {})
    lowest_meta = SUBCATEGORY_METADATA.get(lowest_code, {})

    # Build result
    result = {
        'category_code': category_code,
        'highest_subcategory': {
            'code': highest_code,
            'name': highest_meta.get('name', highest_code),
            'name_en': highest_meta.get('name_en', ''),
            'score': highest_score,
            'interpretation': highest_meta.get('high_activity', '该子类别活跃度较高。')
        },
        'lowest_subcategory': {
            'code': lowest_code,
            'name': lowest_meta.get('name', lowest_code),
            'name_en': lowest_meta.get('name_en', ''),
            'score': lowest_score,
            'interpretation': lowest_meta.get('low_activity', '该子类别活跃度较低。')
        }
    }

    # Generate summary
    summary_parts = []

    # Highest
    summary_parts.append(
        f"在{category_code}类别中，{result['highest_subcategory']['name']}（{highest_code}）"
        f"得分最高（{highest_score}分），{result['highest_subcategory']['interpretation']}"
    )

    # Lowest
    summary_parts.append(
        f"{result['lowest_subcategory']['name']}（{lowest_code}）"
        f"得分最低（{lowest_score}分），{result['lowest_subcategory']['interpretation']}"
    )

    result['summary'] = ' '.join(summary_parts)

    logger.info(f"Analysis complete for {category_code}")
    return result


def analyze_all_subcategories(
    category_scores: Dict[str, int]
) -> Dict[str, Dict[str, Any]]:
    """
    Analyze sub-category patterns for all major categories.

    Args:
        category_scores: All category scores from questionnaire_progress

    Returns:
        Dictionary mapping category codes to analysis results:
        {
            '2.2.1': {...},
            '2.2.2': {...},
            '2.2.3': {...},
            '2.2.4': {...},
            '2.3.1': {...},
            '2.5': {...}  # Includes 2.5.1, 2.5.2, 2.5.3
        }
    """
    logger.info("Analyzing all sub-category patterns")

    # Categories with sub-categories
    CATEGORIES_WITH_SUBCATEGORIES = [
        '2.1',    # Emotional Awareness
        '2.2.1',  # Internal System Analysis
        '2.2.2',  # Automatic Thought Patterns
        '2.2.3',  # Perspective Shifting
        '2.2.4',  # Narrative Structure
        '2.3.1',  # Attachment Structure
        '2.5',    # Growth Potential (includes 2.5.1, 2.5.2, 2.5.3)
    ]

    results = {}

    for category_code in CATEGORIES_WITH_SUBCATEGORIES:
        analysis = analyze_subcategory_pattern(category_code, category_scores)
        if analysis:
            results[category_code] = analysis

    logger.info(f"Completed analysis for {len(results)} categories")
    return results
