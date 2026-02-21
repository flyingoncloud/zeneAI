"""
Pattern Detection for Psychology Assessments

Detects IFS parts, cognitive patterns, and narrative types based on
sub-category scores from questionnaire responses.
"""

import logging
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from src.database.psychology_models import (
    IFSPartsDetection,
    CognitivePatternsDetection,
    NarrativeIdentity,
    PsychologyAssessment
)

logger = logging.getLogger(__name__)


# IFS Parts metadata (2.2.1.x)
IFS_PARTS_METADATA = {
    '2.2.1.1': {
        'part_id': 'manager',
        'part_name_zh': '管理者',
        'part_name_en': 'Managers',
        'ifs_category': 'protector',
        'description': '负责控制、计划和保护的内在部分'
    },
    '2.2.1.2': {
        'part_id': 'firefighter',
        'part_name_zh': '消防员',
        'part_name_en': 'Firefighters',
        'ifs_category': 'protector',
        'description': '通过冲动行为快速缓解痛苦的内在部分'
    },
    '2.2.1.3': {
        'part_id': 'exile',
        'part_name_zh': '流亡者',
        'part_name_en': 'Exiles',
        'ifs_category': 'exile',
        'description': '携带创伤和痛苦记忆的内在部分'
    },
    '2.2.1.4': {
        'part_id': 'self',
        'part_name_zh': '自性',
        'part_name_en': 'Self',
        'ifs_category': 'self',
        'description': '充满慈悲、智慧和领导力的核心自我'
    }
}

# Cognitive Patterns metadata (2.2.2.x)
COGNITIVE_PATTERNS_METADATA = {
    '2.2.2.1': {
        'pattern_id': 'overgeneralization',
        'pattern_name_zh': '过度概括',
        'pattern_name_en': 'Overgeneralization',
        'description': '从单一事件得出普遍结论'
    },
    '2.2.2.2': {
        'pattern_id': 'black_white_thinking',
        'pattern_name_zh': '非黑即白',
        'pattern_name_en': 'Black-and-White Thinking',
        'description': '极端化思维，缺乏灰度'
    },
    '2.2.2.3': {
        'pattern_id': 'catastrophizing',
        'pattern_name_zh': '灾难化',
        'pattern_name_en': 'Catastrophizing',
        'description': '预期最坏结果'
    },
    '2.2.2.4': {
        'pattern_id': 'should_must',
        'pattern_name_zh': '应该/必须',
        'pattern_name_en': 'Should/Must Statements',
        'description': '僵化的规则和期待'
    },
    '2.2.2.5': {
        'pattern_id': 'self_blame',
        'pattern_name_zh': '自我责备',
        'pattern_name_en': 'Self-Blame',
        'description': '过度自我批评'
    }
}

# Narrative Types metadata (2.2.4.x)
NARRATIVE_TYPES_METADATA = {
    '2.2.4.1': {
        'narrative_id': 'hero',
        'narrative_name_zh': '英雄型',
        'narrative_name_en': 'Hero Type'
    },
    '2.2.4.2': {
        'narrative_id': 'victim',
        'narrative_name_zh': '受害者型',
        'narrative_name_en': 'Victim Type'
    },
    '2.2.4.3': {
        'narrative_id': 'rebel',
        'narrative_name_zh': '反抗型',
        'narrative_name_en': 'Rebel Type'
    },
    '2.2.4.4': {
        'narrative_id': 'lost',
        'narrative_name_zh': '迷失型',
        'narrative_name_en': 'Lost Type'
    },
    '2.2.4.5': {
        'narrative_id': 'explorer',
        'narrative_name_zh': '探索者型',
        'narrative_name_en': 'Explorer Type'
    }
}


def detect_ifs_parts(
    assessment_id: int,
    category_scores: Dict[str, int],
    db_session: Session,
    user_id: str = None
) -> List[IFSPartsDetection]:
    """
    Detect IFS parts based on sub-category scores (2.2.1.x).

    Args:
        assessment_id: Assessment ID
        category_scores: Dictionary of category scores
        db_session: Database session
        user_id: User ID (optional, will be fetched from assessment if not provided)

    Returns:
        List of IFSPartsDetection records created
    """
    logger.info(f"Detecting IFS parts for assessment {assessment_id}")

    # Get user_id from assessment if not provided
    if not user_id:
        from src.database.psychology_models import PsychologyAssessment
        assessment = db_session.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == assessment_id
        ).first()
        if assessment:
            user_id = assessment.user_id

    # Get all IFS part scores
    ifs_scores = {
        cat_code: score
        for cat_code, score in category_scores.items()
        if cat_code.startswith('2.2.1.') and len(cat_code.split('.')) == 4
    }

    if not ifs_scores:
        logger.info("No IFS part scores found")
        return []

    # Calculate total score for normalization
    total_score = sum(ifs_scores.values())

    # Delete existing detections for this assessment
    db_session.query(IFSPartsDetection).filter(
        IFSPartsDetection.assessment_id == assessment_id
    ).delete()

    # Create detection records
    detections = []
    for cat_code, score in ifs_scores.items():
        metadata = IFS_PARTS_METADATA.get(cat_code)
        if not metadata:
            continue

        # Calculate confidence as ratio (0.0-1.0), not percentage
        confidence = (score / total_score) if total_score > 0 else 0

        # Consider detected if score > 0
        detected = score > 0

        detection = IFSPartsDetection(
            user_id=user_id,
            assessment_id=assessment_id,
            source_type='questionnaire',  # Detection source
            part_id=metadata['part_id'],
            part_name_zh=metadata['part_name_zh'],
            part_name_en=metadata['part_name_en'],
            ifs_category=metadata['ifs_category'],
            detected=detected,
            confidence_score=round(confidence, 2),
            category_score=score
        )

        db_session.add(detection)
        detections.append(detection)

        logger.info(f"  {metadata['part_name_zh']}: score={score}, confidence={confidence:.2f}, detected={detected}")

    db_session.commit()
    logger.info(f"Created {len(detections)} IFS part detections")

    return detections


def detect_cognitive_patterns(
    assessment_id: int,
    category_scores: Dict[str, int],
    db_session: Session,
    user_id: str = None
) -> List[CognitivePatternsDetection]:
    """
    Detect cognitive patterns based on sub-category scores (2.2.2.x).

    Args:
        assessment_id: Assessment ID
        category_scores: Dictionary of category scores
        db_session: Database session
        user_id: User ID (optional, will be fetched from assessment if not provided)

    Returns:
        List of CognitivePatternsDetection records created
    """
    logger.info(f"Detecting cognitive patterns for assessment {assessment_id}")

    # Get user_id from assessment if not provided
    if not user_id:
        from src.database.psychology_models import PsychologyAssessment
        assessment = db_session.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == assessment_id
        ).first()
        if assessment:
            user_id = assessment.user_id

    # Get all cognitive pattern scores
    pattern_scores = {
        cat_code: score
        for cat_code, score in category_scores.items()
        if cat_code.startswith('2.2.2.') and len(cat_code.split('.')) == 4
    }

    if not pattern_scores:
        logger.info("No cognitive pattern scores found")
        return []

    # Calculate total score for normalization
    total_score = sum(pattern_scores.values())

    # Delete existing detections for this assessment
    db_session.query(CognitivePatternsDetection).filter(
        CognitivePatternsDetection.assessment_id == assessment_id
    ).delete()

    # Create detection records
    detections = []
    for cat_code, score in pattern_scores.items():
        metadata = COGNITIVE_PATTERNS_METADATA.get(cat_code)
        if not metadata:
            continue

        # Calculate confidence as ratio (0.0-1.0), not percentage
        confidence = (score / total_score) if total_score > 0 else 0

        # Consider detected if score > 0
        detected = score > 0

        # Detection count represents how many times this pattern was selected
        # For now, we use the score as a proxy
        detection_count = score

        detection = CognitivePatternsDetection(
            user_id=user_id,
            assessment_id=assessment_id,
            source_type='questionnaire',  # Detection source
            pattern_id=metadata['pattern_id'],
            pattern_name_zh=metadata['pattern_name_zh'],
            pattern_name_en=metadata['pattern_name_en'],
            detected=detected,
            confidence_score=round(confidence, 2),
            detection_count=detection_count
        )

        db_session.add(detection)
        detections.append(detection)

        logger.info(f"  {metadata['pattern_name_zh']}: score={score}, confidence={confidence:.2f}, detected={detected}")

    db_session.commit()
    logger.info(f"Created {len(detections)} cognitive pattern detections")

    return detections


def detect_narrative_identity(
    assessment_id: int,
    category_scores: Dict[str, int],
    db_session: Session,
    user_id: str = None
) -> NarrativeIdentity:
    """
    Detect narrative identity based on sub-category scores (2.2.4.x).

    Args:
        assessment_id: Assessment ID
        category_scores: Dictionary of category scores
        db_session: Database session
        user_id: User ID (optional, will be fetched from assessment if not provided)

    Returns:
        NarrativeIdentity record created or updated
    """
    logger.info(f"Detecting narrative identity for assessment {assessment_id}")

    # Get user_id from assessment if not provided
    if not user_id:
        from src.database.psychology_models import PsychologyAssessment
        assessment = db_session.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == assessment_id
        ).first()
        if assessment:
            user_id = assessment.user_id

    # Get all narrative type scores
    narrative_scores = {
        cat_code: score
        for cat_code, score in category_scores.items()
        if cat_code.startswith('2.2.4.') and len(cat_code.split('.')) == 4
    }

    if not narrative_scores:
        logger.info("No narrative type scores found")
        return None

    # Map to narrative fields
    narrative_data = {
        '2.2.4.1': 'hero_score',
        '2.2.4.2': 'victim_score',
        '2.2.4.3': 'rebel_score',
        '2.2.4.4': 'lost_score',
        '2.2.4.5': 'explorer_score'
    }

    # Build score dictionary
    scores = {}
    for cat_code, score in narrative_scores.items():
        field_name = narrative_data.get(cat_code)
        if field_name:
            scores[field_name] = score

    # Find dominant narrative
    if scores:
        dominant_field = max(scores, key=scores.get)
        dominant_score = scores[dominant_field]
        total_score = sum(scores.values())
        # Calculate confidence as ratio (0.0-1.0), not percentage
        dominant_confidence = (dominant_score / total_score) if total_score > 0 else 0

        # Map field name back to narrative ID
        field_to_id = {
            'hero_score': 'hero',
            'victim_score': 'victim',
            'rebel_score': 'rebel',
            'lost_score': 'lost',
            'explorer_score': 'explorer'
        }
        dominant_narrative = field_to_id.get(dominant_field, 'unknown')
    else:
        dominant_narrative = 'unknown'
        dominant_confidence = 0

    # Check if narrative identity already exists
    narrative = db_session.query(NarrativeIdentity).filter(
        NarrativeIdentity.assessment_id == assessment_id
    ).first()

    if narrative:
        # Update existing
        for field_name, score in scores.items():
            setattr(narrative, field_name, score)
        narrative.dominant_narrative = dominant_narrative
        narrative.dominant_confidence = round(dominant_confidence, 2)
        logger.info(f"Updated narrative identity for assessment {assessment_id}")
    else:
        # Create new
        narrative = NarrativeIdentity(
            user_id=user_id,
            assessment_id=assessment_id,
            source_type='questionnaire',  # Detection source
            **scores,
            dominant_narrative=dominant_narrative,
            dominant_confidence=round(dominant_confidence, 2)
        )
        db_session.add(narrative)
        logger.info(f"Created narrative identity for assessment {assessment_id}")

    db_session.commit()
    db_session.refresh(narrative)

    logger.info(f"  Dominant narrative: {dominant_narrative} ({dominant_confidence:.2f})")
    logger.info(f"  Scores: {scores}")

    return narrative


def detect_all_patterns(
    assessment_id: int,
    category_scores: Dict[str, int],
    db_session: Session,
    user_id: str = None
) -> Dict[str, Any]:
    """
    Detect all patterns (IFS parts, cognitive patterns, narrative) in one call.

    Args:
        assessment_id: Assessment ID
        category_scores: Dictionary of category scores
        db_session: Database session
        user_id: User ID (optional, will be fetched from assessment if not provided)

    Returns:
        Dictionary with detection results:
        {
            'ifs_parts': List[IFSPartsDetection],
            'cognitive_patterns': List[CognitivePatternsDetection],
            'narrative': NarrativeIdentity
        }
    """
    logger.info(f"Detecting all patterns for assessment {assessment_id}")

    results = {
        'ifs_parts': detect_ifs_parts(assessment_id, category_scores, db_session, user_id),
        'cognitive_patterns': detect_cognitive_patterns(assessment_id, category_scores, db_session, user_id),
        'narrative': detect_narrative_identity(assessment_id, category_scores, db_session, user_id)
    }

    logger.info(f"Pattern detection complete: {len(results['ifs_parts'])} IFS parts, "
                f"{len(results['cognitive_patterns'])} cognitive patterns, "
                f"narrative={'detected' if results['narrative'] else 'none'}")

    return results
