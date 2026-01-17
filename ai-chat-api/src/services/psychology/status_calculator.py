"""
Status label calculation for psychology assessments

Converts numeric scores to categorical labels for better user understanding.
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


def calculate_emotional_status_labels(
    sub_dimension_scores: Dict[str, int]
) -> Dict[str, str]:
    """
    Calculate categorical status labels for emotional dimensions.

    Args:
        sub_dimension_scores: Dictionary with sub-dimension scores:
            {
                'identification': int (0-100),
                'expression': int (0-100),
                'reasoning': int (0-100),
                'physical_awareness': int (0-100)
            }

    Returns:
        Dictionary with status labels:
        {
            'recognition_expression': str,  # '基础', '清晰', '准确', '初步'
            'regulation_recovery': str,     # '迅速', '较快', '一般', '需要多些时间'
            'tendency_risk': str            # '稳定', '适度', '敏感', '焦虑'
        }
    """
    # Recognition & Expression (average of identification and expression)
    identification = sub_dimension_scores.get('identification', 0)
    expression = sub_dimension_scores.get('expression', 0)
    re_score = (identification + expression) / 2

    if re_score >= 75:
        recognition_expression = '准确'
    elif re_score >= 60:
        recognition_expression = '清晰'
    elif re_score >= 45:
        recognition_expression = '基础'
    else:
        recognition_expression = '初步'

    # Regulation & Recovery (based on reasoning)
    rr_score = sub_dimension_scores.get('reasoning', 0)

    if rr_score >= 75:
        regulation_recovery = '迅速'
    elif rr_score >= 60:
        regulation_recovery = '较快'
    elif rr_score >= 45:
        regulation_recovery = '一般'
    else:
        regulation_recovery = '需要多些时间'

    # Tendency & Risk (inverse of physical_awareness)
    physical_awareness = sub_dimension_scores.get('physical_awareness', 50)
    risk_score = 100 - physical_awareness

    if risk_score <= 30:
        tendency_risk = '稳定'
    elif risk_score <= 50:
        tendency_risk = '适度'
    elif risk_score <= 70:
        tendency_risk = '敏感'
    else:
        tendency_risk = '焦虑'

    result = {
        'recognition_expression': recognition_expression,
        'regulation_recovery': regulation_recovery,
        'tendency_risk': tendency_risk
    }

    logger.debug(f"Calculated emotional status labels: {result}")
    return result


def calculate_perspective_shifting_summary(
    questionnaire_responses: Dict
) -> Dict[str, Any]:
    """
    Calculate perspective shifting summary and star rating.

    Args:
        questionnaire_responses: Dictionary with questionnaire response data

    Returns:
        Dictionary with perspective shifting info:
        {
            'summary': str,        # '低', '中等', '高'
            'stars': str,          # '⭐⭐⭐'
            'stars_count': int,    # 3
            'details': {
                'self_other': int,
                'spatial': int,
                'cognitive_frame': int,
                'emotional': int
            }
        }
    """
    # Extract perspective shifting sub-scores from questionnaire responses
    # This is a simplified version - actual implementation would parse specific questions

    # For now, use placeholder logic
    # TODO: Implement actual question parsing based on questionnaire structure
    details = {
        'self_other': questionnaire_responses.get('self_other', 50),
        'spatial': questionnaire_responses.get('spatial', 50),
        'cognitive_frame': questionnaire_responses.get('cognitive_frame', 50),
        'emotional': questionnaire_responses.get('emotional', 50)
    }

    # Calculate average
    avg_score = sum(details.values()) / len(details)

    # Map to summary label
    if avg_score >= 70:
        summary = '高'
        stars_count = 5
    elif avg_score >= 50:
        summary = '中等'
        stars_count = 3
    else:
        summary = '低'
        stars_count = 1

    stars = '⭐' * stars_count

    result = {
        'summary': summary,
        'stars': stars,
        'stars_count': stars_count,
        'details': details
    }

    logger.debug(f"Calculated perspective shifting summary: {result}")
    return result


def calculate_attachment_boolean_flags(
    attachment_scores: Dict[str, int]
) -> Dict[str, bool]:
    """
    Calculate boolean detection flags for attachment styles.

    Threshold logic: score >= 12 = detected (true)

    Args:
        attachment_scores: Dictionary with attachment scores (3-15 range):
            {
                'secure': int,
                'anxious': int,
                'avoidant': int,
                'disorganized': int
            }

    Returns:
        Dictionary with boolean flags:
        {
            'secure_detected': bool,
            'anxious_detected': bool,
            'avoidant_detected': bool,
            'disorganized_detected': bool
        }
    """
    THRESHOLD = 12

    result = {
        'secure_detected': attachment_scores.get('secure', 0) >= THRESHOLD,
        'anxious_detected': attachment_scores.get('anxious', 0) >= THRESHOLD,
        'avoidant_detected': attachment_scores.get('avoidant', 0) >= THRESHOLD,
        'disorganized_detected': attachment_scores.get('disorganized', 0) >= THRESHOLD
    }

    logger.debug(f"Calculated attachment boolean flags: {result}")
    return result


def calculate_growth_breakdown(
    questionnaire_responses: Dict
) -> Dict[str, int]:
    """
    Calculate growth potential breakdown scores.

    Args:
        questionnaire_responses: Dictionary with questionnaire response data

    Returns:
        Dictionary with breakdown scores:
        {
            'total_score': int,
            'insight_depth': int,
            'psychological_plasticity': int,
            'resilience': int
        }
    """
    # This is a simplified version - actual implementation would parse specific questions
    # TODO: Implement actual question parsing based on questionnaire structure

    result = {
        'total_score': questionnaire_responses.get('growth_potential_total', 0),
        'insight_depth': questionnaire_responses.get('insight_depth', 0),
        'psychological_plasticity': questionnaire_responses.get('psychological_plasticity', 0),
        'resilience': questionnaire_responses.get('resilience', 0)
    }

    logger.debug(f"Calculated growth breakdown: {result}")
    return result
