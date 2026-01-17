"""
Personality style classification based on dimension score patterns

Classifies users into personality types based on their five core dimension scores.
"""

import logging
from typing import Dict, Any, Callable
from sqlalchemy.orm import Session
from src.database.psychology_models import PersonalityStyle

logger = logging.getLogger(__name__)


# Personality classification rules
# Each rule has a condition function, metadata, and description template
PERSONALITY_RULES = [
    {
        'style_type': 'emotion_dominant',
        'name_zh': '感性驱动型人格',
        'name_en': 'Emotion-Dominant Type',
        'condition': lambda scores: (
            scores.get('relationship_sensitivity', 0) > 65 and
            scores.get('emotional_regulation', 0) < 60
        ),
        'confidence': 0.85,
        'description_zh': (
            '你的人格特征显示出较强的情感驱动倾向。你对人际关系高度敏感，'
            '能够敏锐地察觉他人的情绪变化，并倾向于用情感来理解和回应世界。'
            '这使你在建立深层连接和提供情感支持方面具有天然优势。'
            '同时，你可能需要在情绪调节方面多加练习，学会在强烈情感中保持平衡。'
        )
    },
    {
        'style_type': 'logic_dominant',
        'name_zh': '理性驱动型人格',
        'name_en': 'Logic-Dominant Type',
        'condition': lambda scores: (
            scores.get('cognitive_flexibility', 0) > 70 and
            scores.get('emotional_regulation', 0) < 55
        ),
        'confidence': 0.82,
        'description_zh': (
            '你倾向于用理性思维处理问题，具有较强的认知灵活性和分析能力。'
            '你善于从多个角度看待问题，能够快速调整思维框架。'
            '这种特质让你在解决复杂问题和做出理性决策时表现出色。'
            '建议你也关注情感层面的体验，在理性与感性之间找到更好的平衡。'
        )
    },
    {
        'style_type': 'balanced',
        'name_zh': '平衡型人格',
        'name_en': 'Balanced Type',
        'condition': lambda scores: (
            all(55 <= scores.get(dim, 0) <= 70 for dim in [
                'emotional_regulation',
                'cognitive_flexibility',
                'relationship_sensitivity'
            ])
        ),
        'confidence': 0.78,
        'description_zh': (
            '你在情感和理性之间保持着良好的平衡。'
            '你既能够感知和表达情绪，又能够理性地分析和处理问题。'
            '这种平衡的特质使你能够灵活应对各种情境，'
            '在需要情感共鸣时展现温暖，在需要理性判断时保持清醒。'
            '继续保持这种平衡，将帮助你在生活的各个领域都游刃有余。'
        )
    },
    {
        'style_type': 'growth_oriented',
        'name_zh': '成长导向型人格',
        'name_en': 'Growth-Oriented Type',
        'condition': lambda scores: scores.get('growth_potential', 0) > 75,
        'confidence': 0.80,
        'description_zh': (
            '你展现出强烈的自我成长动力和心理可塑性。'
            '你对自我探索充满热情，愿意面对挑战并从中学习。'
            '这种成长导向的特质让你能够持续进步，不断突破自我限制。'
            '你的洞察深度和心理韧性为你的成长之路提供了坚实基础。'
            '保持这份对成长的渴望，你将不断发现新的可能性。'
        )
    },
    {
        'style_type': 'conflict_aware',
        'name_zh': '冲突觉察型人格',
        'name_en': 'Conflict-Aware Type',
        'condition': lambda scores: (
            scores.get('internal_conflict', 0) > 70 and
            scores.get('growth_potential', 0) > 65
        ),
        'confidence': 0.77,
        'description_zh': (
            '你对内在冲突有着较高的觉察能力，能够识别自己内心的矛盾和挣扎。'
            '这种觉察本身就是一种宝贵的能力，它为自我理解和成长提供了起点。'
            '结合你的成长潜力，你有能力将这些冲突转化为自我发展的动力。'
            '建议你在觉察的基础上，学习整合内在的不同部分，'
            '让它们和谐共处，共同支持你的成长。'
        )
    },
    {
        'style_type': 'relationship_focused',
        'name_zh': '关系聚焦型人格',
        'name_en': 'Relationship-Focused Type',
        'condition': lambda scores: (
            scores.get('relationship_sensitivity', 0) > 75 and
            scores.get('internal_conflict', 0) > 60
        ),
        'confidence': 0.79,
        'description_zh': (
            '你对人际关系高度敏感和关注，能够深刻理解关系中的动态和需求。'
            '你可能会在关系中投入大量精力，有时甚至会因此产生内在冲突。'
            '这种特质让你成为优秀的倾听者和支持者，'
            '但也需要注意在关注他人的同时，不要忽视自己的需求。'
            '学会在关系中设定健康的边界，将帮助你更好地平衡自我与他人。'
        )
    },
]

# Default classification for cases that don't match any specific rule
DEFAULT_CLASSIFICATION = {
    'style_type': 'complex',
    'name_zh': '复合型人格',
    'name_en': 'Complex Type',
    'confidence': 0.70,
    'description_zh': (
        '你的人格特征呈现多元化特点，不完全符合单一类型的模式。'
        '这种复杂性反映了你内在的丰富性和独特性。'
        '你可能在不同情境下展现出不同的特质，'
        '这种灵活性既是优势，也可能带来一些内在的不确定感。'
        '建议你继续探索自己，理解这些不同面向如何共同构成完整的你。'
    )
}


def classify_personality_style(
    dimension_scores: Dict[str, int]
) -> Dict[str, Any]:
    """
    Classify personality style based on dimension score patterns.

    Args:
        dimension_scores: Dictionary with five core dimension scores:
            {
                'emotional_regulation': int (0-100),
                'cognitive_flexibility': int (0-100),
                'relationship_sensitivity': int (0-100),
                'internal_conflict': int (0-100),
                'growth_potential': int (0-100)
            }

    Returns:
        Dictionary with classification result:
        {
            'style_type': str,
            'style_name_en': str,
            'style_name_zh': str,
            'confidence': float,
            'classification_basis': dict,
            'description_zh': str
        }
    """
    logger.info(f"Classifying personality style with scores: {dimension_scores}")

    # Iterate through rules and find first match
    for rule in PERSONALITY_RULES:
        try:
            if rule['condition'](dimension_scores):
                result = {
                    'style_type': rule['style_type'],
                    'style_name_en': rule['name_en'],
                    'style_name_zh': rule['name_zh'],
                    'confidence': rule['confidence'],
                    'classification_basis': {
                        'dimension_scores': dimension_scores,
                        'matched_rule': rule['style_type'],
                        'reasoning': f"Matched {rule['name_zh']} pattern"
                    },
                    'description_zh': rule['description_zh']
                }

                logger.info(f"Classified as: {result['style_type']}")
                return result
        except Exception as e:
            logger.warning(f"Error evaluating rule {rule['style_type']}: {e}")
            continue

    # No rule matched, use default classification
    logger.info("No specific rule matched, using default complex type")
    result = {
        'style_type': DEFAULT_CLASSIFICATION['style_type'],
        'style_name_en': DEFAULT_CLASSIFICATION['name_en'],
        'style_name_zh': DEFAULT_CLASSIFICATION['name_zh'],
        'confidence': DEFAULT_CLASSIFICATION['confidence'],
        'classification_basis': {
            'dimension_scores': dimension_scores,
            'matched_rule': 'default',
            'reasoning': 'No specific pattern matched'
        },
        'description_zh': DEFAULT_CLASSIFICATION['description_zh']
    }

    return result


def save_personality_classification(
    user_id: str,
    assessment_id: int,
    classification: Dict[str, Any],
    db_session: Session
) -> PersonalityStyle:
    """
    Save personality classification to database.

    Args:
        user_id: User ID
        assessment_id: Assessment ID
        classification: Classification result from classify_personality_style()
        db_session: Database session

    Returns:
        PersonalityStyle record
    """
    try:
        # Check if personality style already exists
        existing = db_session.query(PersonalityStyle).filter(
            PersonalityStyle.assessment_id == assessment_id
        ).first()

        if existing:
            # Update existing record
            existing.style_type = classification['style_type']
            existing.style_name_en = classification['style_name_en']
            existing.style_name_zh = classification['style_name_zh']
            existing.confidence = classification['confidence']
            existing.classification_basis = classification['classification_basis']
            existing.description_zh = classification['description_zh']

            logger.info(f"Updated personality style for assessment {assessment_id}")
            personality_style = existing
        else:
            # Create new record
            personality_style = PersonalityStyle(
                user_id=user_id,
                assessment_id=assessment_id,
                style_type=classification['style_type'],
                style_name_en=classification['style_name_en'],
                style_name_zh=classification['style_name_zh'],
                confidence=classification['confidence'],
                classification_basis=classification['classification_basis'],
                description_zh=classification['description_zh']
            )
            db_session.add(personality_style)
            logger.info(f"Created personality style for assessment {assessment_id}")

        db_session.commit()
        db_session.refresh(personality_style)

        return personality_style

    except Exception as e:
        logger.error(f"Error saving personality classification: {e}")
        db_session.rollback()
        raise


def classify_and_save_personality(
    user_id: str,
    assessment_id: int,
    dimension_scores: Dict[str, int],
    db_session: Session
) -> Dict[str, Any]:
    """
    Classify personality style and save to database in one call.

    Args:
        user_id: User ID
        assessment_id: Assessment ID
        dimension_scores: Five core dimension scores
        db_session: Database session

    Returns:
        Classification result dictionary
    """
    # Classify
    classification = classify_personality_style(dimension_scores)

    # Save to database
    save_personality_classification(
        user_id=user_id,
        assessment_id=assessment_id,
        classification=classification,
        db_session=db_session
    )

    return classification
