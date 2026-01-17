"""
Dominant element identification for psychology assessments

Identifies the most prominent psychological characteristics:
- Dominant IFS part (highest confidence)
- Dominant cognitive pattern (highest detection count)
- Dominant narrative (highest score)
"""

import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from src.database.psychology_models import (
    IFSPartsDetection,
    CognitivePatternsDetection,
    NarrativeIdentity,
    PsychologyAssessment
)

logger = logging.getLogger(__name__)


# IFS Part character mappings
IFS_PART_CHARACTERS = {
    'inner_critic': '小法官',
    'pleaser': '小护士',
    'perfectionist': '小完美',
    'protector': '小卫士',
    'distractor': '小逃兵',
    'controller': '小管家',
    'exile': '小孤儿',
    'wounded_child': '小伤童',
}


def identify_dominant_ifs_part(
    assessment_id: int,
    db_session: Session
) -> Optional[Dict[str, Any]]:
    """
    Identify dominant IFS part based on highest confidence score.

    Args:
        assessment_id: Assessment ID
        db_session: Database session

    Returns:
        Dictionary with dominant IFS part info or None if no parts detected:
        {
            'part_id': str,
            'part_name_zh': str,
            'character': str,
            'confidence': float,
            'category': str,
            'category_score': int
        }
    """
    try:
        # Query IFS parts ordered by confidence (highest first)
        parts = db_session.query(IFSPartsDetection).filter(
            IFSPartsDetection.assessment_id == assessment_id,
            IFSPartsDetection.detected == True
        ).order_by(IFSPartsDetection.confidence_score.desc()).all()

        if not parts:
            logger.info(f"No IFS parts detected for assessment {assessment_id}")
            return None

        # Get the highest confidence part
        dominant = parts[0]

        result = {
            'part_id': dominant.part_id,
            'part_name_zh': dominant.part_name_zh,
            'character': IFS_PART_CHARACTERS.get(dominant.part_id, '未知'),
            'confidence': float(dominant.confidence_score) if dominant.confidence_score else 0.0,
            'category': dominant.ifs_category,
            'category_score': dominant.category_score
        }

        logger.info(f"Identified dominant IFS part for assessment {assessment_id}: {result['part_id']}")
        return result

    except Exception as e:
        logger.error(f"Error identifying dominant IFS part for assessment {assessment_id}: {e}")
        return None


def identify_dominant_cognitive_pattern(
    assessment_id: int,
    db_session: Session
) -> Optional[Dict[str, Any]]:
    """
    Identify dominant cognitive pattern based on highest detection count.

    Args:
        assessment_id: Assessment ID
        db_session: Database session

    Returns:
        Dictionary with dominant cognitive pattern info or None:
        {
            'pattern_id': str,
            'pattern_name_zh': str,
            'confidence': float,
            'detection_count': int
        }
    """
    try:
        # Query cognitive patterns ordered by detection count (highest first)
        patterns = db_session.query(CognitivePatternsDetection).filter(
            CognitivePatternsDetection.assessment_id == assessment_id,
            CognitivePatternsDetection.detected == True
        ).order_by(CognitivePatternsDetection.detection_count.desc()).all()

        if not patterns:
            logger.info(f"No cognitive patterns detected for assessment {assessment_id}")
            return None

        # Get the highest count pattern
        dominant = patterns[0]

        result = {
            'pattern_id': dominant.pattern_id,
            'pattern_name_zh': dominant.pattern_name_zh,
            'confidence': float(dominant.confidence_score) if dominant.confidence_score else 0.0,
            'detection_count': dominant.detection_count
        }

        logger.info(f"Identified dominant cognitive pattern for assessment {assessment_id}: {result['pattern_id']}")
        return result

    except Exception as e:
        logger.error(f"Error identifying dominant cognitive pattern for assessment {assessment_id}: {e}")
        return None


def identify_dominant_narrative(
    assessment_id: int,
    db_session: Session
) -> Optional[Dict[str, Any]]:
    """
    Identify dominant narrative based on highest score.

    Args:
        assessment_id: Assessment ID
        db_session: Database session

    Returns:
        Dictionary with dominant narrative info or None:
        {
            'narrative_id': str,
            'narrative_name_zh': str,
            'score': int,
            'confidence': float
        }
    """
    try:
        # Query narrative identity
        narrative = db_session.query(NarrativeIdentity).filter(
            NarrativeIdentity.assessment_id == assessment_id
        ).first()

        if not narrative:
            logger.info(f"No narrative identity found for assessment {assessment_id}")
            return None

        # Find the narrative type with highest score
        narrative_scores = {
            'hero': narrative.hero_score or 0,
            'victim': narrative.victim_score or 0,
            'rebel': narrative.rebel_score or 0,
            'lost': narrative.lost_score or 0,
            'explorer': narrative.explorer_score or 0
        }

        # Get the narrative with max score
        dominant_id = max(narrative_scores, key=narrative_scores.get)
        dominant_score = narrative_scores[dominant_id]

        # Narrative name mappings
        narrative_names = {
            'hero': '英雄型',
            'victim': '受害者型',
            'rebel': '反叛者型',
            'lost': '迷失者型',
            'explorer': '探索者型'
        }

        result = {
            'narrative_id': dominant_id,
            'narrative_name_zh': narrative_names.get(dominant_id, '未知'),
            'score': dominant_score,
            'confidence': float(narrative.dominant_confidence) if narrative.dominant_confidence else 0.0
        }

        logger.info(f"Identified dominant narrative for assessment {assessment_id}: {result['narrative_id']}")
        return result

    except Exception as e:
        logger.error(f"Error identifying dominant narrative for assessment {assessment_id}: {e}")
        return None


def identify_all_dominant_elements(
    assessment_id: int,
    db_session: Session,
    update_assessment: bool = True
) -> Dict[str, Optional[Dict]]:
    """
    Identify all dominant elements in one call.

    Args:
        assessment_id: Assessment ID
        db_session: Database session
        update_assessment: Whether to update psychology_assessments table

    Returns:
        Dictionary with all dominant elements:
        {
            'ifs_part': {...} or None,
            'cognitive_pattern': {...} or None,
            'narrative': {...} or None
        }
    """
    logger.info(f"Identifying all dominant elements for assessment {assessment_id}")

    result = {
        'ifs_part': identify_dominant_ifs_part(assessment_id, db_session),
        'cognitive_pattern': identify_dominant_cognitive_pattern(assessment_id, db_session),
        'narrative': identify_dominant_narrative(assessment_id, db_session)
    }

    # Update psychology_assessments table if requested
    if update_assessment:
        try:
            assessment = db_session.query(PsychologyAssessment).filter(
                PsychologyAssessment.id == assessment_id
            ).first()

            if assessment:
                if result['ifs_part']:
                    assessment.dominant_ifs_part = result['ifs_part']['part_id']
                if result['cognitive_pattern']:
                    assessment.dominant_cognitive_pattern = result['cognitive_pattern']['pattern_id']
                if result['narrative']:
                    assessment.dominant_narrative = result['narrative']['narrative_id']

                db_session.commit()
                logger.info(f"Updated dominant elements in psychology_assessments for {assessment_id}")
        except Exception as e:
            logger.error(f"Error updating assessment with dominant elements: {e}")
            db_session.rollback()

    return result
