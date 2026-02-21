"""
Dimension Descriptions and Interpretations

Provides detailed descriptions, score interpretations, and recommendations
for each of the five core psychological dimensions.
"""

from typing import Dict, Any, List, Tuple


# Dimension metadata and descriptions
DIMENSION_DESCRIPTIONS = {
    'emotional_regulation': {
        'code': '2.1',
        'name_zh': '情绪调节能力',
        'name_en': 'Emotional Regulation',
        'description': '评估情绪识别、表达与调节的稳定性和有效性。分数越高，表示越能在压力下保持情绪平衡，更好地管理情绪波动。',
        'score_ranges': {
            'low': {
                'range': (0, 40),
                'label': '发展阶段',
                'interpretation': '情绪调节能力处于发展阶段。你可能经常感到被情绪淹没，难以在压力下保持平静。情绪波动较大，需要更多练习来识别和管理情绪。',
                'recommendations': [
                    '练习情绪命名：每天花几分钟识别和命名当下的情绪',
                    '学习深呼吸技巧：在情绪激动时使用腹式呼吸来平复心情',
                    '建立情绪日记：记录情绪触发点和应对方式',
                    '寻求专业支持：考虑情绪管理相关的心理咨询'
                ]
            },
            'medium': {
                'range': (41, 70),
                'label': '稳定发展阶段',
                'interpretation': '情绪调节能力中等。大多数情况下你能够管理自己的情绪，但在高压力或强烈情绪时可能仍会感到困难。你正在发展更成熟的情绪调节策略。',
                'recommendations': [
                    '深化情绪觉察：学习识别情绪背后的需求和价值观',
                    '扩展调节工具箱：尝试不同的情绪调节技巧（如正念、运动、艺术表达）',
                    '练习情绪接纳：允许情绪存在而不立即反应',
                    '建立支持系统：与信任的人分享情绪体验'
                ]
            },
            'high': {
                'range': (71, 100),
                'label': '成熟阶段',
                'interpretation': '情绪调节能力强。你能够有效识别、理解和调节自己的情绪，即使在压力下也能保持相对平衡。你拥有多样化的情绪调节策略，能够灵活应对不同情境。',
                'recommendations': [
                    '继续保持：维持现有的情绪调节实践',
                    '深化自我理解：探索情绪模式背后的深层心理动力',
                    '帮助他人：分享你的情绪调节经验，支持他人成长',
                    '应对复杂情境：挑战自己在更复杂的情境中运用情绪调节能力'
                ]
            }
        }
    },

    'cognitive_flexibility': {
        'code': '2.2',
        'name_zh': '认知灵活度',
        'name_en': 'Cognitive Flexibility',
        'description': '评估思维的灵活性和适应性，包括视角转换、认知重构和思维模式的多样性。分数越高，表示越能从多角度看待问题，更容易调整固有思维模式。',
        'score_ranges': {
            'low': {
                'range': (0, 40),
                'label': '固化阶段',
                'interpretation': '认知灵活度较低。你可能倾向于用固定的方式看待问题，难以接受不同观点或调整既有想法。思维模式相对僵化，可能容易陷入认知陷阱。',
                'recommendations': [
                    '挑战自动思维：识别并质疑自己的自动化思维模式',
                    '练习视角转换：尝试从他人角度看待问题',
                    '接触多元观点：主动了解不同的思维方式和文化视角',
                    '学习认知行为技巧：通过CBT等方法重构思维模式'
                ]
            },
            'medium': {
                'range': (41, 70),
                'label': '灵活发展阶段',
                'interpretation': '认知灵活度中等。你能够在一定程度上调整思维方式，接受新观点，但在某些领域可能仍保持固定模式。你正在发展更灵活的认知能力。',
                'recommendations': [
                    '扩展思维工具：学习不同的思维框架和分析方法',
                    '练习创造性思维：通过头脑风暴等方式培养发散思维',
                    '反思思维模式：定期审视自己的思维习惯和盲点',
                    '拥抱不确定性：练习在模糊情境中保持开放心态'
                ]
            },
            'high': {
                'range': (71, 100),
                'label': '高度灵活阶段',
                'interpretation': '认知灵活度高。你能够轻松地从多个角度看待问题，灵活调整思维方式，接纳不同观点。你拥有丰富的认知工具，能够根据情境选择最适合的思维模式。',
                'recommendations': [
                    '继续保持开放：维持对新观点和新方法的好奇心',
                    '深化元认知：提升对自己思维过程的觉察和理解',
                    '应用于复杂问题：在更复杂的情境中运用认知灵活性',
                    '指导他人：帮助他人发展更灵活的思维方式'
                ]
            }
        }
    },

    'relationship_sensitivity': {
        'code': '2.3',
        'name_zh': '关系敏感度',
        'name_en': 'Relationship Sensitivity',
        'description': '评估对人际关系动态的敏感度和共情能力。分数越高，表示越能理解他人情感需求，建立健康的人际关系，但也需要注意边界设定。',
        'score_ranges': {
            'low': {
                'range': (0, 40),
                'label': '低敏感阶段',
                'interpretation': '关系敏感度较低。你可能难以察觉他人的情感需求和关系中的微妙动态。在人际互动中可能显得较为疏离或不够敏感，需要更多练习来提升共情能力。',
                'recommendations': [
                    '练习积极倾听：全神贯注地听他人说话，不急于回应',
                    '观察非语言信号：注意他人的肢体语言和语气变化',
                    '培养共情能力：尝试理解他人的感受和立场',
                    '建立情感连接：主动与他人分享情感体验'
                ]
            },
            'medium': {
                'range': (41, 70),
                'label': '平衡发展阶段',
                'interpretation': '关系敏感度中等。你能够在一定程度上理解他人的情感需求，建立有意义的人际关系。你正在发展更深层的共情能力和关系智慧。',
                'recommendations': [
                    '深化共情理解：不仅理解他人感受，还要理解背后的需求',
                    '练习边界设定：在关注他人的同时保护自己的需求',
                    '提升沟通技巧：学习更有效的情感表达和冲突解决方法',
                    '反思关系模式：识别自己在关系中的习惯性模式'
                ]
            },
            'high': {
                'range': (71, 100),
                'label': '高度敏感阶段',
                'interpretation': '关系敏感度高。你对人际关系高度敏感，能够深刻理解他人的情感需求和关系动态。你是优秀的倾听者和支持者，但需要注意在关注他人的同时不要忽视自己的需求。',
                'recommendations': [
                    '设定健康边界：学会在关系中说"不"，保护自己的能量',
                    '平衡自我与他人：确保在关注他人的同时照顾自己',
                    '处理过度共情：学习在共情时保持适当的情感距离',
                    '运用关系智慧：将你的敏感度转化为建设性的关系贡献'
                ]
            }
        }
    },

    'internal_conflict': {
        'code': '2.4',
        'name_zh': '内在冲突度',
        'name_en': 'Internal Conflict',
        'description': '评估内心不同部分之间的冲突程度和内在对话的质量。分数越高，表示内在冲突越明显，但也可能意味着更高的自我觉察。适度的冲突是成长的契机。',
        'score_ranges': {
            'low': {
                'range': (0, 40),
                'label': '低冲突阶段',
                'interpretation': '内在冲突度较低。你的内心相对和谐，不同部分之间较少冲突。这可能表示良好的内在整合，但也可能意味着对内在冲突的觉察不足。',
                'recommendations': [
                    '提升自我觉察：探索内心是否存在被忽视的声音',
                    '允许多样性：接纳内心不同部分的存在',
                    '深化自我理解：通过日记、冥想等方式探索内在世界',
                    '保持开放：对内在体验保持好奇和接纳'
                ]
            },
            'medium': {
                'range': (41, 70),
                'label': '适度冲突阶段',
                'interpretation': '内在冲突度中等。你能够觉察到内心不同部分之间的张力，这是自我成长的重要信号。适度的内在冲突可以促进自我整合和发展。',
                'recommendations': [
                    '探索冲突根源：理解内在冲突背后的需求和价值观',
                    '练习内在对话：与内心不同部分进行建设性对话',
                    '寻求整合：尝试找到内在不同部分的共同点',
                    '接纳矛盾：允许内在矛盾的存在，不急于解决'
                ]
            },
            'high': {
                'range': (71, 100),
                'label': '高冲突阶段',
                'interpretation': '内在冲突度较高。你的内心存在明显的冲突和矛盾，不同部分之间可能经常"打架"。这虽然带来困扰，但也表明你对内在世界有较高的觉察，这是深度成长的机会。',
                'recommendations': [
                    '寻求专业支持：考虑IFS（内在家庭系统）等心理治疗',
                    '培养自我慈悲：对内在冲突保持温和和接纳的态度',
                    '识别保护机制：理解冲突背后的保护意图',
                    '逐步整合：不急于消除冲突，而是促进内在和谐共处'
                ]
            }
        }
    },

    'growth_potential': {
        'code': '2.5',
        'name_zh': '成长潜能',
        'name_en': 'Growth Potential',
        'description': '评估心理韧性、自我洞察深度和内在可塑性。分数越高，表示越具备持续成长的能力，更能从挑战中学习和发展。',
        'score_ranges': {
            'low': {
                'range': (0, 40),
                'label': '潜能待激活阶段',
                'interpretation': '成长潜能处于待激活状态。你可能对自我探索缺乏动力，或者在面对挑战时容易放弃。心理韧性和可塑性需要进一步培养。',
                'recommendations': [
                    '建立成长心态：相信能力是可以发展的，而非固定不变',
                    '设定小目标：从容易达成的目标开始，建立成就感',
                    '培养好奇心：对自己和世界保持探索的兴趣',
                    '寻找支持：与成长导向的人建立连接，获得鼓励'
                ]
            },
            'medium': {
                'range': (41, 70),
                'label': '稳步成长阶段',
                'interpretation': '成长潜能中等。你对自我成长有一定兴趣，愿意面对挑战并从中学习。你正在发展更强的心理韧性和自我洞察能力。',
                'recommendations': [
                    '深化自我探索：通过阅读、反思、咨询等方式加深自我理解',
                    '拥抱挑战：主动寻找能够促进成长的挑战',
                    '培养韧性：在困难中练习坚持和恢复',
                    '记录成长：追踪自己的成长历程，看到进步'
                ]
            },
            'high': {
                'range': (71, 100),
                'label': '高潜能阶段',
                'interpretation': '成长潜能高。你对自我成长充满热情，具有强大的心理韧性和深刻的自我洞察。你能够将挑战转化为成长机会，持续突破自我限制。',
                'recommendations': [
                    '保持成长动力：继续培养对自我探索的热情',
                    '挑战舒适区：寻找更深层次的成长机会',
                    '分享成长经验：帮助他人激活成长潜能',
                    '整合成长：将成长的不同面向整合为完整的自我'
                ]
            }
        }
    }
}


def get_dimension_description(dimension_key: str) -> Dict[str, Any]:
    """
    Get description for a specific dimension.

    Args:
        dimension_key: Dimension key (e.g., 'emotional_regulation')

    Returns:
        Dimension description dictionary
    """
    return DIMENSION_DESCRIPTIONS.get(dimension_key, {})


def interpret_dimension_score(dimension_key: str, score: int) -> Dict[str, Any]:
    """
    Interpret a dimension score and provide recommendations.

    Args:
        dimension_key: Dimension key (e.g., 'emotional_regulation')
        score: Score value (0-100)

    Returns:
        {
            'dimension': str,
            'score': int,
            'range_label': str,
            'interpretation': str,
            'recommendations': List[str]
        }
    """
    dimension_info = DIMENSION_DESCRIPTIONS.get(dimension_key)

    if not dimension_info:
        return {
            'dimension': dimension_key,
            'score': score,
            'range_label': '未知',
            'interpretation': '暂无解释',
            'recommendations': []
        }

    # Determine which range the score falls into
    range_info = None
    for range_key, range_data in dimension_info['score_ranges'].items():
        min_score, max_score = range_data['range']
        if min_score <= score <= max_score:
            range_info = range_data
            break

    if not range_info:
        # Default to medium if score doesn't fit any range
        range_info = dimension_info['score_ranges']['medium']

    return {
        'dimension': dimension_info['name_zh'],
        'dimension_en': dimension_info['name_en'],
        'code': dimension_info['code'],
        'score': score,
        'description': dimension_info['description'],
        'range_label': range_info['label'],
        'interpretation': range_info['interpretation'],
        'recommendations': range_info['recommendations']
    }


def interpret_all_dimensions(dimension_scores: Dict[str, int]) -> Dict[str, Dict[str, Any]]:
    """
    Interpret all five dimension scores.

    Args:
        dimension_scores: Dictionary with five dimension scores
            {
                'emotional_regulation': int,
                'cognitive_flexibility': int,
                'relationship_sensitivity': int,
                'internal_conflict': int,
                'growth_potential': int
            }

    Returns:
        Dictionary with interpretations for each dimension
    """
    interpretations = {}

    for dimension_key, score in dimension_scores.items():
        interpretations[dimension_key] = interpret_dimension_score(dimension_key, score)

    return interpretations
