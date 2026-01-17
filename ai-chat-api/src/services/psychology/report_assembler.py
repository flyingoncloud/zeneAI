"""
Report data assembly for psychology reports

Assembles complete report data from all sources including assessments,
dominant elements, analysis texts, and personality classifications.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from src.database.psychology_models import (
    UserProfile,
    PsychologyAssessment,
    PersonalityStyle,
    AnalysisText,
    AttachmentStyle,
    NarrativeIdentity
)
from src.services.psychology.status_calculator import (
    calculate_emotional_status_labels,
    calculate_perspective_shifting_summary,
    calculate_attachment_boolean_flags
)

logger = logging.getLogger(__name__)


def get_user_info_section(
    user_id: str,
    db_session: Session
) -> Dict[str, Any]:
    """
    Get user info section for report.

    Args:
        user_id: User ID
        db_session: Database session

    Returns:
        {
            'name': str,
            'gender': str,
            'age': int,
            'report_date': str  # e.g., "2025 年 12 月"
        }
    """
    logger.info(f"Getting user info for user {user_id}")

    user = db_session.query(UserProfile).filter(
        UserProfile.user_id == user_id
    ).first()

    if not user:
        logger.warning(f"User {user_id} not found, using defaults")
        return {
            'name': '用户',
            'gender': '未知',
            'age': 0,
            'report_date': datetime.now().strftime('%Y 年 %m 月')
        }

    return {
        'name': user.username or '用户',
        'gender': user.gender or '未知',
        'age': user.age or 0,
        'report_date': datetime.now().strftime('%Y 年 %m 月')
    }


def get_mind_indices_section(
    assessment: PsychologyAssessment
) -> Dict[str, int]:
    """
    Get five core dimension scores (mind indices).

    Args:
        assessment: PsychologyAssessment record

    Returns:
        {
            'emotional_regulation': int,
            'cognitive_flexibility': int,
            'relational_sensitivity': int,
            'inner_conflict': int,
            'growth_potential': int
        }
    """
    logger.info(f"Getting mind indices for assessment {assessment.id}")

    return {
        'emotional_regulation': assessment.emotional_regulation_score or 0,
        'cognitive_flexibility': assessment.cognitive_flexibility_score or 0,
        'relational_sensitivity': assessment.relationship_sensitivity_score or 0,
        'inner_conflict': assessment.internal_conflict_score or 0,
        'growth_potential': assessment.growth_potential_score or 0
    }


def get_emotional_insight_section(
    assessment: PsychologyAssessment,
    db_session: Session
) -> Dict[str, Any]:
    """
    Get emotional insight section with status labels.

    Args:
        assessment: PsychologyAssessment record
        db_session: Database session

    Returns:
        {
            'score': int,
            'status': {
                'recognition_expression': str,
                'regulation_recovery': str,
                'tendency_risk': str
            }
        }
    """
    logger.info(f"Getting emotional insight for assessment {assessment.id}")

    # Get sub-dimension scores from assessment
    sub_scores = assessment.sub_dimension_scores or {}
    emotional_sub_scores = sub_scores.get('emotional_regulation', {})

    # Calculate status labels
    status_labels = calculate_emotional_status_labels(emotional_sub_scores)

    return {
        'score': assessment.emotional_regulation_score or 0,
        'status': status_labels
    }


def get_cognitive_insight_section(
    assessment: PsychologyAssessment,
    dominant_elements: Dict[str, Optional[Dict]],
    analysis_texts: Dict[str, Optional[str]],
    db_session: Session
) -> Dict[str, Any]:
    """
    Get cognitive insight section with all sub-sections.

    Args:
        assessment: PsychologyAssessment record
        dominant_elements: Dominant elements from identify_all_dominant_elements()
        analysis_texts: Analysis texts from generate_all_analysis_texts()
        db_session: Database session

    Returns:
        {
            'flexibility_score': int,
            'inner_system': {
                'current_status': str,
                'impact_analysis': str
            },
            'automatic_thought': {
                'pattern': str,
                'impact': str
            },
            'perspective_shifting': {
                'summary': str,
                'stars': str,
                'details': {...}
            },
            'narrative_structure': {
                'type': str,
                'summary': str
            }
        }
    """
    logger.info(f"Getting cognitive insight for assessment {assessment.id}")

    # 1. Inner system (IFS)
    ifs_part = dominant_elements.get('ifs_part')
    inner_system = {
        'current_status': '未检测到',
        'impact_analysis': '暂无分析'
    }
    if ifs_part:
        character = ifs_part.get('character', '')
        part_name = ifs_part.get('part_name_zh', '')
        inner_system['current_status'] = f"{character} ({part_name})" if character else part_name
        inner_system['impact_analysis'] = analysis_texts.get('ifs_impact') or '暂无分析'

    # 2. Automatic thought (cognitive pattern)
    cognitive_pattern = dominant_elements.get('cognitive_pattern')
    automatic_thought = {
        'pattern': '未检测到',
        'impact': '暂无分析'
    }
    if cognitive_pattern:
        automatic_thought['pattern'] = cognitive_pattern.get('pattern_name_zh', '未知模式')
        automatic_thought['impact'] = analysis_texts.get('cognitive_impact') or '暂无分析'

    # 3. Perspective shifting
    # Get questionnaire responses from assessment
    sub_scores = assessment.sub_dimension_scores or {}
    perspective_shifting = calculate_perspective_shifting_summary(sub_scores)

    # 4. Narrative structure
    narrative = dominant_elements.get('narrative')
    narrative_structure = {
        'type': '未检测到',
        'summary': '暂无分析'
    }
    if narrative:
        narrative_structure['type'] = narrative.get('narrative_name_zh', '未知叙事')
        narrative_structure['summary'] = analysis_texts.get('narrative_summary') or '暂无分析'

    return {
        'flexibility_score': assessment.cognitive_flexibility_score or 0,
        'inner_system': inner_system,
        'automatic_thought': automatic_thought,
        'perspective_shifting': perspective_shifting,
        'narrative_structure': narrative_structure
    }


def get_relational_insight_section(
    assessment: PsychologyAssessment,
    analysis_texts: Dict[str, Optional[str]],
    db_session: Session
) -> Dict[str, Any]:
    """
    Get relational insight section with attachment and triggers.

    Args:
        assessment: PsychologyAssessment record
        analysis_texts: Analysis texts from generate_all_analysis_texts()
        db_session: Database session

    Returns:
        {
            'sensitivity_score': int,
            'details': {
                'relational_triggers': int,
                'empathy_index': int,
                'inner_conflict_level': int
            },
            'attachment_pattern': {
                'anxious': bool,
                'disorganized': bool,
                'secure': bool,
                'avoidant': bool
            },
            'conflict_triggers': {
                'status': str
            }
        }
    """
    logger.info(f"Getting relational insight for assessment {assessment.id}")

    # Get sub-dimension scores
    sub_scores = assessment.sub_dimension_scores or {}
    relational_sub_scores = sub_scores.get('relationship_sensitivity', {})

    # Get attachment style
    attachment_style = db_session.query(AttachmentStyle).filter(
        AttachmentStyle.assessment_id == assessment.id
    ).first()

    # Calculate attachment boolean flags
    attachment_pattern = {
        'anxious': False,
        'disorganized': False,
        'secure': False,
        'avoidant': False
    }
    if attachment_style:
        attachment_scores = {
            'secure': attachment_style.secure_score or 0,
            'anxious': attachment_style.anxious_score or 0,
            'avoidant': attachment_style.avoidant_score or 0,
            'disorganized': attachment_style.disorganized_score or 0
        }
        attachment_pattern = calculate_attachment_boolean_flags(attachment_scores)

    # Get conflict triggers analysis
    conflict_triggers_text = analysis_texts.get('conflict_triggers') or '暂无分析'

    return {
        'sensitivity_score': assessment.relationship_sensitivity_score or 0,
        'details': {
            'relational_triggers': relational_sub_scores.get('triggers', 0),
            'empathy_index': relational_sub_scores.get('empathy', 0),
            'inner_conflict_level': assessment.internal_conflict_score or 0
        },
        'attachment_pattern': attachment_pattern,
        'conflict_triggers': {
            'status': conflict_triggers_text
        }
    }


def get_personality_style_section(
    assessment_id: int,
    db_session: Session
) -> Dict[str, str]:
    """
    Get personality style classification.

    Args:
        assessment_id: Assessment ID
        db_session: Database session

    Returns:
        {
            'type': str  # e.g., "感性驱动型人格（Emotion-Dominant Type）"
        }
    """
    logger.info(f"Getting personality style for assessment {assessment_id}")

    personality_style = db_session.query(PersonalityStyle).filter(
        PersonalityStyle.assessment_id == assessment_id
    ).first()

    if not personality_style:
        logger.warning(f"No personality style found for assessment {assessment_id}")
        return {
            'type': '未分类'
        }

    # Format: "中文名（English Name）"
    type_str = f"{personality_style.style_name_zh}（{personality_style.style_name_en}）"

    return {
        'type': type_str
    }


def get_growth_potential_section(
    assessment: PsychologyAssessment
) -> Dict[str, int]:
    """
    Get growth potential breakdown.

    Args:
        assessment: PsychologyAssessment record

    Returns:
        {
            'total_score': int,
            'insight_depth': int,
            'psychological_plasticity': int,
            'resilience': int
        }
    """
    logger.info(f"Getting growth potential for assessment {assessment.id}")

    # Get sub-dimension scores
    sub_scores = assessment.sub_dimension_scores or {}
    growth_sub_scores = sub_scores.get('growth_potential', {})

    return {
        'total_score': assessment.growth_potential_score or 0,
        'insight_depth': growth_sub_scores.get('insight_depth', 0),
        'psychological_plasticity': growth_sub_scores.get('plasticity', 0),
        'resilience': growth_sub_scores.get('resilience', 0)
    }


def assemble_report_data(
    assessment_id: int,
    dominant_elements: Dict[str, Optional[Dict]],
    analysis_texts: Dict[str, Optional[str]],
    db_session: Session,
    language: str = 'zh'
) -> Dict[str, Any]:
    """
    Assemble complete report data from all sources.

    Args:
        assessment_id: Assessment ID
        dominant_elements: Dominant elements from identify_all_dominant_elements()
        analysis_texts: Analysis texts from generate_all_analysis_texts()
        db_session: Database session
        language: Output language (default 'zh')

    Returns:
        Complete report data matching report_data.json structure:
        {
            'user_info': {...},
            'mind_indices': {...},
            'emotional_insight': {...},
            'cognitive_insight': {...},
            'relational_insight': {...},
            'personality_style': {...},
            'growth_potential': {...}
        }
    """
    logger.info(f"Assembling report data for assessment {assessment_id}")

    # Get assessment
    assessment = db_session.query(PsychologyAssessment).filter(
        PsychologyAssessment.id == assessment_id
    ).first()

    if not assessment:
        raise ValueError(f"Assessment {assessment_id} not found")

    # Assemble all sections
    report_data = {
        'user_info': get_user_info_section(assessment.user_id, db_session),
        'mind_indices': get_mind_indices_section(assessment),
        'emotional_insight': get_emotional_insight_section(assessment, db_session),
        'cognitive_insight': get_cognitive_insight_section(
            assessment, dominant_elements, analysis_texts, db_session
        ),
        'relational_insight': get_relational_insight_section(
            assessment, analysis_texts, db_session
        ),
        'personality_style': get_personality_style_section(assessment_id, db_session),
        'growth_potential': get_growth_potential_section(assessment)
    }

    # Validate all required sections present
    required_sections = [
        'user_info', 'mind_indices', 'emotional_insight',
        'cognitive_insight', 'relational_insight',
        'personality_style', 'growth_potential'
    ]

    missing_sections = [s for s in required_sections if s not in report_data]
    if missing_sections:
        logger.error(f"Missing required sections: {missing_sections}")
        raise ValueError(f"Report data incomplete: missing {missing_sections}")

    logger.info(f"Successfully assembled report data for assessment {assessment_id}")
    return report_data
