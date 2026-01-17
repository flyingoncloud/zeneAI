"""
AI-powered analysis text generation for psychology reports

Generates natural language analysis texts using OpenAI API based on detected
psychological patterns and elements.
"""

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import openai
from src.config.settings import OPENAI_API_KEY, PSYCHOLOGY_LLM_MODEL
from src.database.psychology_models import (
    AnalysisText,
    IFSPartsDetection,
    CognitivePatternsDetection,
    AttachmentStyle
)

logger = logging.getLogger(__name__)

# Configure OpenAI
openai.api_key = OPENAI_API_KEY


# AI Prompt Templates
IFS_IMPACT_PROMPT = """你是一位专业的心理咨询师，擅长内在家庭系统(IFS)分析。

用户的内在家庭系统检测结果：
- 主导部分：{part_name_zh}
- 置信度：{confidence:.2f}
- 类别得分：{category_score}
{evidence_section}

请生成一段150-200字的影响分析，说明：
1. 这个部分如何影响用户的日常生活
2. 这个部分的积极作用
3. 可能带来的挑战
4. 简短的建议

语气要温和、专业、富有同理心。直接输出分析内容，不要包含标题或前缀。
"""

COGNITIVE_PATTERN_PROMPT = """你是一位专业的认知行为治疗师。

用户的自动思维模式检测结果：
- 主导模式：{pattern_name_zh}
- 检测次数：{detection_count}
- 置信度：{confidence:.2f}
{evidence_section}

请生成一段150-200字的影响分析，说明：
1. 这种思维模式如何影响情绪和行为
2. 典型的触发情境
3. 可能的后果
4. 简短的应对建议

语气要温和、专业、富有同理心。直接输出分析内容，不要包含标题或前缀。
"""

NARRATIVE_SUMMARY_PROMPT = """你是一位专业的叙事治疗师。

用户的叙事身份检测结果：
- 主导叙事：{narrative_name_zh}
- 得分：{score}
- 置信度：{confidence:.2f}
{evidence_section}

请生成一段150-200字的叙事总结，说明：
1. 这种叙事如何塑造用户的自我认知
2. 这种叙事的积极意义
3. 可能的局限性
4. 如何丰富和发展这个叙事

语气要温和、专业、富有同理心。直接输出分析内容，不要包含标题或前缀。
"""

CONFLICT_TRIGGER_PROMPT = """你是一位专业的依恋理论专家。

用户的依恋模式检测结果：
- 主导依恋风格：{dominant_style}
- 安全型得分：{secure_score}
- 焦虑型得分：{anxious_score}
- 回避型得分：{avoidant_score}
- 混乱型得分：{disorganized_score}

请生成一段150-200字的冲突触发分析，说明：
1. 在关系中容易被触发的情境
2. 典型的情绪和行为反应
3. 这些反应背后的心理需求
4. 简短的应对建议

语气要温和、专业、富有同理心。直接输出分析内容，不要包含标题或前缀。
"""


# Fallback templates for when AI generation fails
FALLBACK_IFS_IMPACT = """你的内在系统中，{part_name_zh}扮演着重要角色。这个部分以{confidence:.0%}的置信度被识别出来，
在日常生活中可能会影响你的情绪反应和行为模式。建议你在觉察到这个部分活跃时，
尝试理解它想要保护你的意图，并探索更灵活的应对方式。"""

FALLBACK_COGNITIVE_IMPACT = """你的思维模式中，{pattern_name_zh}出现了{detection_count}次。
这种自动思维可能会在特定情境下影响你的情绪和行为。
建议你在觉察到这种思维时，尝试从不同角度看待问题，寻找更平衡的观点。"""

FALLBACK_NARRATIVE_SUMMARY = """你的叙事身份倾向于{narrative_name_zh}，得分为{score}。
这种叙事方式塑造了你对自己和世界的理解。
建议你探索这个叙事的多个面向，发现其中的力量和可能性。"""

FALLBACK_CONFLICT_TRIGGERS = """根据你的依恋模式（{dominant_style}），
在关系中可能会有特定的触发点。理解这些触发背后的需求，
可以帮助你在关系中更好地表达自己，建立更安全的连接。"""


def generate_ifs_impact_analysis(
    part_id: str,
    part_name_zh: str,
    confidence: float,
    category_score: int,
    evidence_text: Optional[str] = None,
    language: str = 'zh'
) -> str:
    """
    Generate AI-powered impact analysis for IFS part.

    Args:
        part_id: IFS part identifier
        part_name_zh: Chinese name of the part
        confidence: Detection confidence (0.0-1.0)
        category_score: Category score
        evidence_text: Optional evidence text
        language: Output language (default 'zh')

    Returns:
        Generated analysis text (150-200 characters)
    """
    logger.info(f"Generating IFS impact analysis for part: {part_name_zh}")

    try:
        # Format evidence section
        evidence_section = ""
        if evidence_text:
            evidence_section = f"- 证据：{evidence_text[:200]}"

        # Format prompt
        prompt = IFS_IMPACT_PROMPT.format(
            part_name_zh=part_name_zh,
            confidence=confidence,
            category_score=category_score,
            evidence_section=evidence_section
        )

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model=PSYCHOLOGY_LLM_MODEL,
            messages=[
                {"role": "system", "content": "你是一位专业、温和、富有同理心的心理咨询师。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        analysis_text = response.choices[0].message.content.strip()

        logger.info(f"Successfully generated IFS impact analysis ({len(analysis_text)} chars)")
        return analysis_text

    except Exception as e:
        logger.error(f"Error generating IFS impact analysis: {e}")
        # Return fallback text
        fallback = FALLBACK_IFS_IMPACT.format(
            part_name_zh=part_name_zh,
            confidence=confidence
        )
        logger.info("Using fallback IFS impact text")
        return fallback


def generate_cognitive_pattern_impact(
    pattern_id: str,
    pattern_name_zh: str,
    confidence: float,
    detection_count: int,
    evidence_examples: Optional[List[Dict]] = None,
    language: str = 'zh'
) -> str:
    """
    Generate AI-powered impact analysis for cognitive pattern.

    Args:
        pattern_id: Pattern identifier
        pattern_name_zh: Chinese name of the pattern
        confidence: Detection confidence (0.0-1.0)
        detection_count: Number of times detected
        evidence_examples: Optional list of evidence examples
        language: Output language (default 'zh')

    Returns:
        Generated analysis text (150-200 characters)
    """
    logger.info(f"Generating cognitive pattern impact for: {pattern_name_zh}")

    try:
        # Format evidence section
        evidence_section = ""
        if evidence_examples and len(evidence_examples) > 0:
            examples_text = "\n".join([
                f"  - {ex.get('text', '')[:100]}"
                for ex in evidence_examples[:3]
            ])
            evidence_section = f"- 证据示例：\n{examples_text}"

        # Format prompt
        prompt = COGNITIVE_PATTERN_PROMPT.format(
            pattern_name_zh=pattern_name_zh,
            detection_count=detection_count,
            confidence=confidence,
            evidence_section=evidence_section
        )

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model=PSYCHOLOGY_LLM_MODEL,
            messages=[
                {"role": "system", "content": "你是一位专业、温和、富有同理心的认知行为治疗师。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        analysis_text = response.choices[0].message.content.strip()

        logger.info(f"Successfully generated cognitive pattern impact ({len(analysis_text)} chars)")
        return analysis_text

    except Exception as e:
        logger.error(f"Error generating cognitive pattern impact: {e}")
        # Return fallback text
        fallback = FALLBACK_COGNITIVE_IMPACT.format(
            pattern_name_zh=pattern_name_zh,
            detection_count=detection_count
        )
        logger.info("Using fallback cognitive pattern text")
        return fallback


def generate_narrative_summary(
    narrative_id: str,
    narrative_name_zh: str,
    score: int,
    confidence: float,
    evidence_data: Optional[Dict] = None,
    language: str = 'zh'
) -> str:
    """
    Generate AI-powered narrative summary.

    Args:
        narrative_id: Narrative identifier
        narrative_name_zh: Chinese name of the narrative
        score: Narrative score
        confidence: Detection confidence (0.0-1.0)
        evidence_data: Optional evidence data
        language: Output language (default 'zh')

    Returns:
        Generated analysis text (150-200 characters)
    """
    logger.info(f"Generating narrative summary for: {narrative_name_zh}")

    try:
        # Format evidence section
        evidence_section = ""
        if evidence_data:
            evidence_section = f"- 相关数据：{str(evidence_data)[:200]}"

        # Format prompt
        prompt = NARRATIVE_SUMMARY_PROMPT.format(
            narrative_name_zh=narrative_name_zh,
            score=score,
            confidence=confidence,
            evidence_section=evidence_section
        )

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model=PSYCHOLOGY_LLM_MODEL,
            messages=[
                {"role": "system", "content": "你是一位专业、温和、富有同理心的叙事治疗师。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        analysis_text = response.choices[0].message.content.strip()

        logger.info(f"Successfully generated narrative summary ({len(analysis_text)} chars)")
        return analysis_text

    except Exception as e:
        logger.error(f"Error generating narrative summary: {e}")
        # Return fallback text
        fallback = FALLBACK_NARRATIVE_SUMMARY.format(
            narrative_name_zh=narrative_name_zh,
            score=score
        )
        logger.info("Using fallback narrative text")
        return fallback


def generate_conflict_trigger_analysis(
    attachment_scores: Dict[str, int],
    dominant_style: str,
    language: str = 'zh'
) -> str:
    """
    Generate AI-powered conflict trigger analysis based on attachment.

    Args:
        attachment_scores: Dictionary with attachment scores
            {
                'secure': int,
                'anxious': int,
                'avoidant': int,
                'disorganized': int
            }
        dominant_style: Dominant attachment style name
        language: Output language (default 'zh')

    Returns:
        Generated analysis text (150-200 characters)
    """
    logger.info(f"Generating conflict trigger analysis for: {dominant_style}")

    try:
        # Format prompt
        prompt = CONFLICT_TRIGGER_PROMPT.format(
            dominant_style=dominant_style,
            secure_score=attachment_scores.get('secure', 0),
            anxious_score=attachment_scores.get('anxious', 0),
            avoidant_score=attachment_scores.get('avoidant', 0),
            disorganized_score=attachment_scores.get('disorganized', 0)
        )

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model=PSYCHOLOGY_LLM_MODEL,
            messages=[
                {"role": "system", "content": "你是一位专业、温和、富有同理心的依恋理论专家。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        analysis_text = response.choices[0].message.content.strip()

        logger.info(f"Successfully generated conflict trigger analysis ({len(analysis_text)} chars)")
        return analysis_text

    except Exception as e:
        logger.error(f"Error generating conflict trigger analysis: {e}")
        # Return fallback text
        fallback = FALLBACK_CONFLICT_TRIGGERS.format(
            dominant_style=dominant_style
        )
        logger.info("Using fallback conflict trigger text")
        return fallback


def generate_all_analysis_texts(
    user_id: str,
    assessment_id: int,
    dominant_elements: Dict[str, Optional[Dict]],
    db_session: Session,
    language: str = 'zh'
) -> Dict[str, Optional[str]]:
    """
    Generate all analysis texts for an assessment and store in database.

    Args:
        user_id: User ID
        assessment_id: Assessment ID
        dominant_elements: Dictionary with dominant elements from identify_all_dominant_elements()
        db_session: Database session
        language: Output language (default 'zh')

    Returns:
        Dictionary with generated texts:
        {
            'ifs_impact': str or None,
            'cognitive_impact': str or None,
            'narrative_summary': str or None,
            'conflict_triggers': str or None
        }
    """
    logger.info(f"Generating all analysis texts for assessment {assessment_id}")

    result = {
        'ifs_impact': None,
        'cognitive_impact': None,
        'narrative_summary': None,
        'conflict_triggers': None
    }

    try:
        # 1. Generate IFS impact analysis
        ifs_part = dominant_elements.get('ifs_part')
        if ifs_part:
            ifs_impact_text = generate_ifs_impact_analysis(
                part_id=ifs_part['part_id'],
                part_name_zh=ifs_part['part_name_zh'],
                confidence=ifs_part['confidence'],
                category_score=ifs_part.get('category_score', 0),
                evidence_text=ifs_part.get('evidence_text'),
                language=language
            )
            result['ifs_impact'] = ifs_impact_text

            # Store in database
            _save_analysis_text(
                user_id=user_id,
                assessment_id=assessment_id,
                analysis_type='ifs_impact',
                analysis_category='inner_system',
                related_entity_type='ifs_part',
                related_entity_id=ifs_part['part_id'],
                text_zh=ifs_impact_text,
                db_session=db_session
            )

        # 2. Generate cognitive pattern impact
        cognitive_pattern = dominant_elements.get('cognitive_pattern')
        if cognitive_pattern:
            cognitive_impact_text = generate_cognitive_pattern_impact(
                pattern_id=cognitive_pattern['pattern_id'],
                pattern_name_zh=cognitive_pattern['pattern_name_zh'],
                confidence=cognitive_pattern['confidence'],
                detection_count=cognitive_pattern['detection_count'],
                evidence_examples=cognitive_pattern.get('evidence_examples'),
                language=language
            )
            result['cognitive_impact'] = cognitive_impact_text

            # Store in database
            _save_analysis_text(
                user_id=user_id,
                assessment_id=assessment_id,
                analysis_type='cognitive_pattern_impact',
                analysis_category='automatic_thought',
                related_entity_type='cognitive_pattern',
                related_entity_id=cognitive_pattern['pattern_id'],
                text_zh=cognitive_impact_text,
                db_session=db_session
            )

        # 3. Generate narrative summary
        narrative = dominant_elements.get('narrative')
        if narrative:
            narrative_summary_text = generate_narrative_summary(
                narrative_id=narrative['narrative_id'],
                narrative_name_zh=narrative['narrative_name_zh'],
                score=narrative['score'],
                confidence=narrative['confidence'],
                evidence_data=narrative.get('evidence_data'),
                language=language
            )
            result['narrative_summary'] = narrative_summary_text

            # Store in database
            _save_analysis_text(
                user_id=user_id,
                assessment_id=assessment_id,
                analysis_type='narrative_summary',
                analysis_category='narrative_structure',
                related_entity_type='narrative',
                related_entity_id=narrative['narrative_id'],
                text_zh=narrative_summary_text,
                db_session=db_session
            )

        # 4. Generate conflict trigger analysis (from attachment data)
        # Query attachment style from database
        attachment_style = db_session.query(AttachmentStyle).filter(
            AttachmentStyle.assessment_id == assessment_id
        ).first()

        if attachment_style:
            attachment_scores = {
                'secure': attachment_style.secure_score or 0,
                'anxious': attachment_style.anxious_score or 0,
                'avoidant': attachment_style.avoidant_score or 0,
                'disorganized': attachment_style.disorganized_score or 0
            }

            conflict_trigger_text = generate_conflict_trigger_analysis(
                attachment_scores=attachment_scores,
                dominant_style=attachment_style.dominant_style or '未知',
                language=language
            )
            result['conflict_triggers'] = conflict_trigger_text

            # Store in database
            _save_analysis_text(
                user_id=user_id,
                assessment_id=assessment_id,
                analysis_type='conflict_triggers',
                analysis_category='relational_insight',
                related_entity_type='attachment_style',
                related_entity_id=str(attachment_style.id),
                text_zh=conflict_trigger_text,
                db_session=db_session
            )

        logger.info(f"Successfully generated all analysis texts for assessment {assessment_id}")
        return result

    except Exception as e:
        logger.error(f"Error generating all analysis texts: {e}")
        db_session.rollback()
        raise


def _save_analysis_text(
    user_id: str,
    assessment_id: int,
    analysis_type: str,
    analysis_category: str,
    related_entity_type: str,
    related_entity_id: str,
    text_zh: str,
    db_session: Session
) -> AnalysisText:
    """
    Save analysis text to database (internal helper).

    Args:
        user_id: User ID
        assessment_id: Assessment ID
        analysis_type: Type of analysis
        analysis_category: Category of analysis
        related_entity_type: Type of related entity
        related_entity_id: ID of related entity
        text_zh: Chinese text
        db_session: Database session

    Returns:
        AnalysisText record
    """
    try:
        # Check if analysis text already exists
        existing = db_session.query(AnalysisText).filter(
            AnalysisText.assessment_id == assessment_id,
            AnalysisText.analysis_type == analysis_type,
            AnalysisText.related_entity_id == related_entity_id
        ).first()

        if existing:
            # Update existing record
            existing.text_zh = text_zh
            existing.analysis_category = analysis_category
            existing.related_entity_type = related_entity_type
            logger.info(f"Updated analysis text: {analysis_type}")
            analysis_text = existing
        else:
            # Create new record
            analysis_text = AnalysisText(
                user_id=user_id,
                assessment_id=assessment_id,
                analysis_type=analysis_type,
                analysis_category=analysis_category,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
                text_zh=text_zh,
                generated_by='openai',
                model_version=PSYCHOLOGY_LLM_MODEL
            )
            db_session.add(analysis_text)
            logger.info(f"Created analysis text: {analysis_type}")

        db_session.commit()
        db_session.refresh(analysis_text)

        return analysis_text

    except Exception as e:
        logger.error(f"Error saving analysis text: {e}")
        db_session.rollback()
        raise
