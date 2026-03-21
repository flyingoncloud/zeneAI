"""
Psychology Report Generation API Routes

Provides endpoints for generating psychology reports, checking status,
and generating specific analysis texts.
"""

import logging
import os
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from src.database.database import get_db
from src.database.psychology_models import PsychologyAssessment, PsychologyReport
from src.database.inline_assessment_models import InlineAssessmentSummary
from src.services.psychology.dominant_elements import identify_all_dominant_elements
from src.services.psychology.analysis_generator import generate_all_analysis_texts
from src.services.psychology.personality_classifier import classify_and_save_personality
from src.services.psychology.pattern_detector import detect_all_patterns
from src.services.psychology.report_assembler import assemble_report_data
from src.services.psychology.docx_generator import generate_psychology_report_docx
from src.resources.drawing_utils import (
    draw_radar_chart,
    draw_perspective_bar_chart,
    draw_relational_rating_scale,
    draw_growth_bar_chart,
    draw_emotion_recognition_expression,
    draw_emotion_regulation_recovery,
    draw_emotion_tendency_risk
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/psychology", tags=["Psychology Reports"])


# Pydantic Models for Request/Response
class ReportGenerationRequest(BaseModel):
    assessment_id: int
    language: str = 'zh'
    format: str = 'json'  # 'json' or 'pdf'
    include_analysis: bool = True


class ReportGenerationResponse(BaseModel):
    ok: bool
    report_id: Optional[int] = None
    status: str
    report: Optional[dict] = None
    estimated_completion_time: Optional[int] = None  # seconds
    error: Optional[str] = None


class ReportStatusResponse(BaseModel):
    ok: bool
    report_id: int
    status: str
    progress: Optional[int] = None  # 0-100
    current_step: Optional[str] = None
    estimated_time_remaining: Optional[int] = None  # seconds
    report_data: Optional[dict] = None
    error: Optional[str] = None


class AnalysisGenerationRequest(BaseModel):
    assessment_id: int
    analysis_types: List[str]  # ['ifs_impact', 'cognitive_impact', 'narrative_summary', 'conflict_triggers']
    language: str = 'zh'


class AnalysisItem(BaseModel):
    analysis_type: str
    related_entity_type: str
    related_entity_id: str
    text: str
    confidence: Optional[float] = None


class AnalysisGenerationResponse(BaseModel):
    ok: bool
    analyses: List[AnalysisItem]
    error: Optional[str] = None


def generate_report_background(
    report_id: int,
    assessment_id: int,
    user_id: str,
    language: str
):
    """
    Background task for report generation.

    Steps:
    1. Identify dominant elements
    2. Generate analysis texts
    3. Classify personality style and detect patterns
    4. Assemble report data
    5. Generate charts
    6. Generate DOCX report
    7. Update report status

    Note: Creates its own database session to avoid issues with closed sessions.
    """
    db_session = None

    try:
        # Create a new database session for the background task
        from src.database.database import SessionLocal
        # Import all models to avoid relationship resolution issues
        from src.database import models
        from src.database import progress_models

        db_session = SessionLocal()

        logger.info(f"Starting background report generation for report_id={report_id}")
        logger.info(f"Database session created successfully")

        # Get assessment
        assessment = db_session.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == assessment_id
        ).first()

        logger.info(f"Assessment query completed: found={assessment is not None}")

        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")

        # Step 1: Identify dominant elements
        logger.info("Step 1: Identifying dominant elements")
        dominant_elements = identify_all_dominant_elements(assessment_id, db_session)

        # Step 2: Generate analysis texts
        logger.info("Step 2: Generating AI analysis texts")
        analysis_texts = generate_all_analysis_texts(
            user_id=user_id,
            assessment_id=assessment_id,
            dominant_elements=dominant_elements,
            db_session=db_session,
            language=language
        )

        # Step 3: Classify personality style and detect patterns
        logger.info("Step 3: Classifying personality style and detecting patterns")
        dimension_scores = {
            'emotional_regulation': assessment.emotional_regulation_score or 0,
            'cognitive_flexibility': assessment.cognitive_flexibility_score or 0,
            'relationship_sensitivity': assessment.relationship_sensitivity_score or 0,
            'internal_conflict': assessment.internal_conflict_score or 0,
            'growth_potential': assessment.growth_potential_score or 0
        }
        classify_and_save_personality(
            user_id=user_id,
            assessment_id=assessment_id,
            dimension_scores=dimension_scores,
            db_session=db_session
        )

        # Get category scores from assessment for pattern detection and sub-category analysis
        category_scores = assessment.sub_dimension_scores or {}

        # Detect IFS parts, cognitive patterns, and narrative types
        logger.info("Detecting IFS parts, cognitive patterns, and narrative types")
        pattern_results = detect_all_patterns(
            assessment_id=assessment_id,
            category_scores=category_scores,
            db_session=db_session,
            user_id=user_id
        )
        logger.info(f"Pattern detection complete: {len(pattern_results['ifs_parts'])} IFS parts, "
                   f"{len(pattern_results['cognitive_patterns'])} cognitive patterns")

        # Step 4: Assemble report data
        logger.info("Step 4: Assembling report data")

        report_data = assemble_report_data(
            assessment_id=assessment_id,
            dominant_elements=dominant_elements,
            analysis_texts=analysis_texts,
            db_session=db_session,
            language=language,
            category_scores=category_scores  # Pass category scores for sub-category analysis
        )

        # Step 5: Generate charts
        logger.info("Step 5: Generating charts")

        # Create charts directory
        base_dir = Path(__file__).parent.parent.parent
        charts_dir = base_dir / "reports" / "charts" / f"report_{report_id}"
        charts_dir.mkdir(parents=True, exist_ok=True)

        # Generate all charts
        draw_radar_chart(report_data, str(charts_dir / "radar_chart.png"))
        draw_perspective_bar_chart(report_data, str(charts_dir / "perspective_bar_chart.png"))
        draw_relational_rating_scale(report_data, str(charts_dir / "relational_rating_scale.png"))
        draw_growth_bar_chart(report_data, str(charts_dir / "growth_bar_chart.png"))

        # Generate emotional awareness sub-category charts
        # Get scores from category_scores (2.1.1, 2.1.2, 2.1.3)
        emotion_recognition_score = category_scores.get('2.1.1', 50)  # Default to 50 if not found
        emotion_regulation_score = category_scores.get('2.1.2', 50)
        emotion_tendency_score = category_scores.get('2.1.3', 50)

        draw_emotion_recognition_expression(
            emotion_recognition_score,
            str(charts_dir / "emotion_recognition_expression.png")
        )
        draw_emotion_regulation_recovery(
            emotion_regulation_score,
            str(charts_dir / "emotion_regulation_recovery.png")
        )
        draw_emotion_tendency_risk(
            emotion_tendency_score,
            str(charts_dir / "emotion_tendency_risk.png")
        )

        logger.info(f"Charts generated in {charts_dir}")

        # Step 6: Generate DOCX report
        logger.info("Step 6: Generating DOCX report")

        # Create reports directory
        reports_dir = base_dir / "reports" / "generated"
        reports_dir.mkdir(parents=True, exist_ok=True)

        # Generate DOCX
        docx_path = generate_psychology_report_docx(
            report_data=report_data,
            output_dir=str(reports_dir),
            report_id=report_id,
            charts_dir=str(charts_dir)
        )

        logger.info(f"DOCX report generated: {docx_path}")

        # Step 6b: Save report_data as JSON
        logger.info("Step 6b: Saving report data as JSON")
        import json
        json_path = reports_dir / f"psychology_report_{report_id}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2, default=str)
        logger.info(f"JSON report saved: {json_path}")

        # Step 6c: Generate Markdown report
        logger.info("Step 6c: Generating Markdown report")
        from src.services.psychology.markdown_generator import generate_psychology_report_markdown
        md_path = generate_psychology_report_markdown(
            report_data=report_data,
            output_dir=str(reports_dir),
            report_id=report_id,
            charts_dir=str(charts_dir)
        )
        logger.info(f"Markdown report saved: {md_path}")

        # Step 7: Update report status to completed
        logger.info("Step 7: Updating report status to completed")
        report = db_session.query(PsychologyReport).filter(
            PsychologyReport.id == report_id
        ).first()

        if report:
            report.report_data = report_data
            report.file_path = docx_path  # Save DOCX file path
            report.generation_status = 'completed'
            report.generated_at = datetime.utcnow()
            db_session.commit()

            logger.info(f"Report {report_id} generation completed successfully")
        else:
            logger.error(f"Report {report_id} not found for status update")

    except Exception as e:
        logger.error(f"Error in background report generation: {e}", exc_info=True)
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error details: report_id={report_id}, assessment_id={assessment_id}")

        # Update report status to failed
        try:
            # Create a new session if the previous one failed
            if db_session is None:
                from src.database.database import SessionLocal
                db_session = SessionLocal()
                logger.info("Created new database session for error handling")

            report = db_session.query(PsychologyReport).filter(
                PsychologyReport.id == report_id
            ).first()

            if report:
                report.generation_status = 'failed'
                report.error_message = f"{type(e).__name__}: {str(e)}"
                db_session.commit()
                logger.info(f"Updated report {report_id} status to 'failed'")
            else:
                logger.error(f"Report {report_id} not found in database for error update")
        except Exception as update_error:
            logger.error(f"Failed to update report status to failed: {update_error}", exc_info=True)

        if db_session:
            db_session.rollback()

    finally:
        # Always close the database session
        if db_session:
            try:
                db_session.close()
                logger.info(f"Database session closed for report {report_id}")
            except Exception as close_error:
                logger.error(f"Error closing database session: {close_error}")


@router.post("/report/generate", response_model=ReportGenerationResponse)
async def generate_report(
    request: ReportGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate psychology report.

    Creates a report generation request and processes it in the background.
    Returns immediately with report_id and status.
    """
    try:
        logger.info(f"Received report generation request for assessment {request.assessment_id}")

        # Validate assessment exists
        assessment = db.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == request.assessment_id
        ).first()

        if not assessment:
            return ReportGenerationResponse(
                ok=False,
                status='error',
                error=f"Assessment {request.assessment_id} not found"
            )

        # Check assessment completeness (>= 70%)
        completion_percentage = assessment.completion_percentage or 0
        if completion_percentage < 70:
            return ReportGenerationResponse(
                ok=False,
                status='error',
                error=f"Assessment must be at least 70% complete (current: {completion_percentage}%)"
            )

        # Check if there's already a pending or processing report for this assessment
        existing_report = db.query(PsychologyReport).filter(
            PsychologyReport.assessment_id == request.assessment_id,
            PsychologyReport.generation_status.in_(['pending', 'processing'])
        ).first()

        if existing_report:
            logger.info(f"Found existing {existing_report.generation_status} report {existing_report.id} for assessment {request.assessment_id}")
            return ReportGenerationResponse(
                ok=True,
                report_id=existing_report.id,
                status=existing_report.generation_status,
                estimated_completion_time=30
            )

        # Create psychology_reports record with status "pending"
        report = PsychologyReport(
            user_id=assessment.user_id,
            assessment_id=request.assessment_id,
            report_type='comprehensive',
            language=request.language,
            format=request.format,
            report_data={},  # Will be filled by background task
            generation_status='pending'
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        logger.info(f"Created report record with id={report.id}")

        # Trigger async report generation
        background_tasks.add_task(
            generate_report_background,
            report_id=report.id,
            assessment_id=request.assessment_id,
            user_id=assessment.user_id,
            language=request.language
        )

        return ReportGenerationResponse(
            ok=True,
            report_id=report.id,
            status='pending',
            estimated_completion_time=30  # Estimate 30 seconds
        )

    except Exception as e:
        logger.error(f"Error in generate_report: {e}", exc_info=True)
        return ReportGenerationResponse(
            ok=False,
            status='error',
            error=str(e)
        )


@router.get("/report/{report_id}/status", response_model=ReportStatusResponse)
async def get_report_status(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Get report generation status.

    Returns current status, progress, and report data if completed.
    """
    try:
        logger.info(f"Checking status for report {report_id}")

        # Query psychology_reports table
        report = db.query(PsychologyReport).filter(
            PsychologyReport.id == report_id
        ).first()

        if not report:
            return ReportStatusResponse(
                ok=False,
                report_id=report_id,
                status='not_found',
                error=f"Report {report_id} not found"
            )

        # Calculate progress based on status
        progress_map = {
            'pending': 10,
            'processing': 50,
            'completed': 100,
            'failed': 0
        }
        progress = progress_map.get(report.generation_status, 0)

        # Estimate time remaining
        estimated_time_remaining = None
        if report.generation_status == 'pending':
            estimated_time_remaining = 30
        elif report.generation_status == 'processing':
            estimated_time_remaining = 15

        response = ReportStatusResponse(
            ok=True,
            report_id=report_id,
            status=report.generation_status,
            progress=progress,
            current_step=report.generation_status,
            estimated_time_remaining=estimated_time_remaining
        )

        # Include report data if completed
        if report.generation_status == 'completed':
            response.report_data = report.report_data

        # Include error message if failed
        if report.generation_status == 'failed':
            response.error = report.error_message

        return response

    except Exception as e:
        logger.error(f"Error in get_report_status: {e}", exc_info=True)
        return ReportStatusResponse(
            ok=False,
            report_id=report_id,
            status='error',
            error=str(e)
        )


@router.post("/analysis/generate", response_model=AnalysisGenerationResponse)
async def generate_analysis_texts(
    request: AnalysisGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    Generate specific analysis texts.

    Allows generating individual analysis texts without full report generation.
    """
    try:
        logger.info(f"Received analysis generation request for assessment {request.assessment_id}")

        # Validate assessment exists
        assessment = db.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == request.assessment_id
        ).first()

        if not assessment:
            return AnalysisGenerationResponse(
                ok=False,
                analyses=[],
                error=f"Assessment {request.assessment_id} not found"
            )

        # Identify dominant elements
        dominant_elements = identify_all_dominant_elements(request.assessment_id, db)

        # Generate requested analysis types
        analysis_texts = generate_all_analysis_texts(
            user_id=assessment.user_id,
            assessment_id=request.assessment_id,
            dominant_elements=dominant_elements,
            db_session=db,
            language=request.language
        )

        # Build response
        analyses = []

        for analysis_type in request.analysis_types:
            text = analysis_texts.get(analysis_type)
            if text:
                # Determine related entity
                related_entity_type = 'unknown'
                related_entity_id = 'unknown'

                if analysis_type == 'ifs_impact' and dominant_elements.get('ifs_part'):
                    related_entity_type = 'ifs_part'
                    related_entity_id = dominant_elements['ifs_part']['part_id']
                elif analysis_type == 'cognitive_impact' and dominant_elements.get('cognitive_pattern'):
                    related_entity_type = 'cognitive_pattern'
                    related_entity_id = dominant_elements['cognitive_pattern']['pattern_id']
                elif analysis_type == 'narrative_summary' and dominant_elements.get('narrative'):
                    related_entity_type = 'narrative'
                    related_entity_id = dominant_elements['narrative']['narrative_id']
                elif analysis_type == 'conflict_triggers':
                    related_entity_type = 'attachment_style'
                    related_entity_id = 'attachment'

                analyses.append(AnalysisItem(
                    analysis_type=analysis_type,
                    related_entity_type=related_entity_type,
                    related_entity_id=related_entity_id,
                    text=text
                ))

        return AnalysisGenerationResponse(
            ok=True,
            analyses=analyses
        )

    except Exception as e:
        logger.error(f"Error in generate_analysis_texts: {e}", exc_info=True)
        return AnalysisGenerationResponse(
            ok=False,
            analyses=[],
            error=str(e)
        )


@router.get("/report/{report_id}/download")
async def download_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Download psychology report as DOCX file.

    Returns the generated DOCX file for download.
    """
    try:
        logger.info(f"Download request for report {report_id}")

        # Query report
        report = db.query(PsychologyReport).filter(
            PsychologyReport.id == report_id
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail=f"报告 {report_id} 未找到")

        # Check if report is completed
        if report.generation_status != 'completed':
            raise HTTPException(
                status_code=400,
                detail=f"报告尚未生成完成，当前状态: {report.generation_status}"
            )

        # Check if file exists
        if not report.file_path or not os.path.exists(report.file_path):
            raise HTTPException(status_code=404, detail="报告文件未找到")

        # Get user info for filename
        assessment = db.query(PsychologyAssessment).filter(
            PsychologyAssessment.id == report.assessment_id
        ).first()

        # Generate friendly filename
        user_name = "用户"
        if assessment and assessment.user_id:
            user_name = assessment.user_id

        filename = f"ZeneMe心理报告_{user_name}_{report_id}.docx"

        # Return file
        return FileResponse(
            path=report.file_path,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename=filename
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"下载报告时出错: {str(e)}")


@router.get("/reports/user/{user_id}")
async def list_user_reports(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    List all completed psychology reports AND sketch records for a user.
    Returns items sorted by most recent first.
    """
    try:
        logger.info(f"Listing reports for user {user_id}")

        # 1) Psychology reports
        reports = db.query(PsychologyReport).filter(
            PsychologyReport.user_id == user_id,
            PsychologyReport.generation_status == 'completed'
        ).order_by(PsychologyReport.generated_at.desc()).all()

        result = []
        for report in reports:
            mind_indices = {}
            if report.report_data and isinstance(report.report_data, dict):
                mind_indices = report.report_data.get('mind_indices', {})

            preview_parts = []
            dim_labels = {
                'emotional_regulation': '情绪调节',
                'cognitive_flexibility': '认知灵活',
                'relational_sensitivity': '关系敏感',
                'inner_conflict': '内在冲突',
                'growth_potential': '成长潜能',
            }
            for key, label in dim_labels.items():
                score = mind_indices.get(key)
                if score is not None:
                    preview_parts.append(f"{label} {score}")
            preview = ' · '.join(preview_parts) if preview_parts else '心理洞察报告'

            result.append({
                'id': report.id,
                'type': report.report_type or 'comprehensive',
                'date': report.generated_at.strftime('%Y-%m-%d') if report.generated_at else '',
                'title': f'心理洞察报告 #{report.id}',
                'preview': preview,
                'mind_indices': mind_indices,
                'has_file': bool(report.file_path),
            })

        # 2) Sketch records
        try:
            from src.database.psychology_models import SketchRecord
            sketches = db.query(SketchRecord).filter(
                SketchRecord.user_id == user_id
            ).order_by(SketchRecord.created_at.desc()).all()

            for sketch in sketches:
                preview_text = sketch.analysis_text[:60] + '...' if len(sketch.analysis_text) > 60 else sketch.analysis_text
                result.append({
                    'id': sketch.id,
                    'type': 'sketch',
                    'date': sketch.created_at.strftime('%Y-%m-%d') if sketch.created_at else '',
                    'title': '内视涂鸦分析',
                    'preview': preview_text,
                    'full_analysis': sketch.analysis_text,
                    'image_url': sketch.image_url,
                    'has_file': False,
                    '_sort_dt': sketch.created_at,
                })
        except Exception as e:
            logger.warning(f"Failed to load sketch records (table may not exist yet): {e}")

        # Add sort key to report items too, then sort everything by date desc
        for item in result:
            if '_sort_dt' not in item:
                # Use the date string to create a comparable key
                from datetime import datetime as _dt
                try:
                    item['_sort_dt'] = _dt.strptime(item['date'], '%Y-%m-%d') if item['date'] else _dt.min
                except Exception:
                    item['_sort_dt'] = _dt.min

        result.sort(key=lambda x: x.get('_sort_dt') or __import__('datetime').datetime.min, reverse=True)

        # Remove internal sort key before returning
        for item in result:
            item.pop('_sort_dt', None)

        return {'ok': True, 'reports': result}

    except Exception as e:
        logger.error(f"Error listing reports for user {user_id}: {e}", exc_info=True)
        return {'ok': False, 'reports': [], 'error': str(e)}


@router.get("/inline-assessment/progress/{user_id}")
async def get_inline_assessment_progress(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a user's inline assessment progress.

    Returns the InlineAssessmentSummary data including total answered,
    completion percentage, domains covered, and report generation eligibility.
    """
    try:
        logger.info(f"Fetching inline assessment progress for user {user_id}")

        summary = db.query(InlineAssessmentSummary).filter(
            InlineAssessmentSummary.user_id == user_id
        ).first()

        if not summary:
            return {
                "ok": True,
                "progress": {
                    "total_answered": 0,
                    "total_questions": 83,
                    "completion_percentage": 0.0,
                    "domains_covered": [],
                    "domain_question_counts": {},
                    "can_generate_report": False,
                    "report_generated": False,
                    "started_at": None,
                    "last_updated_at": None
                }
            }

        return {
            "ok": True,
            "progress": {
                "total_answered": summary.total_answered,
                "total_questions": summary.total_questions,
                "completion_percentage": summary.completion_percentage,
                "domains_covered": summary.domains_covered or [],
                "domain_question_counts": summary.domain_question_counts or {},
                "can_generate_report": summary.can_generate_report,
                "report_generated": summary.report_generated,
                "started_at": summary.started_at.isoformat() if summary.started_at else None,
                "last_updated_at": summary.last_updated_at.isoformat() if summary.last_updated_at else None
            }
        }

    except Exception as e:
        logger.error(f"Error fetching inline assessment progress for user {user_id}: {e}", exc_info=True)
        return {"ok": False, "error": str(e)}
