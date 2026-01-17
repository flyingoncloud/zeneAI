"""
Utility functions for psychology services
"""

import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from src.database.psychology_models import PsychologyAssessment

logger = logging.getLogger(__name__)


def get_assessment_by_id(
    assessment_id: int,
    db_session: Session
) -> Optional[PsychologyAssessment]:
    """
    Get psychology assessment by ID.

    Args:
        assessment_id: Assessment ID
        db_session: Database session

    Returns:
        PsychologyAssessment or None if not found
    """
    try:
        assessment = db_session.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == assessment_id
        ).first()
        return assessment
    except Exception as e:
        logger.error(f"Error retrieving assessment {assessment_id}: {e}")
        return None


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    Safely divide two numbers, returning default if denominator is zero.

    Args:
        numerator: Numerator
        denominator: Denominator
        default: Default value if division by zero

    Returns:
        Result of division or default
    """
    if denominator == 0:
        return default
    return numerator / denominator


def get_nested_value(data: Dict[str, Any], path: str, default: Any = None) -> Any:
    """
    Get nested value from dictionary using dot notation.

    Args:
        data: Dictionary to search
        path: Dot-separated path (e.g., 'user.profile.name')
        default: Default value if path not found

    Returns:
        Value at path or default

    Example:
        >>> data = {'user': {'profile': {'name': 'John'}}}
        >>> get_nested_value(data, 'user.profile.name')
        'John'
    """
    keys = path.split('.')
    value = data

    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return default

    return value


def calculate_average(values: list, default: float = 0.0) -> float:
    """
    Calculate average of a list of numbers.

    Args:
        values: List of numbers
        default: Default value if list is empty

    Returns:
        Average or default
    """
    if not values:
        return default
    return sum(values) / len(values)
