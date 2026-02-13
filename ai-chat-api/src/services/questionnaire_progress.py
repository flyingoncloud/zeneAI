"""
Questionnaire Progress Service

Handles questionnaire progress tracking, state persistence, and resume functionality.
Enables users to save progress and continue later.
"""

import logging
from typing import Dict, Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.database.progress_models import UserQuestionnaireProgress
from src.database.questionnaire_models import AssessmentQuestion
from src.database.psychology_models import PsychologyReport, PsychologyAssessment, UserProfile

logger = logging.getLogger(__name__)


class QuestionnaireProgressService:
    """Service for managing questionnaire progress"""

    @staticmethod
    def start_or_resume(
        user_id: str,
        session_id: str,
        conversation_id: Optional[int],  # Optional - can be None
        questionnaire_id: str,
        db: Session
    ) -> Tuple[UserQuestionnaireProgress, List[AssessmentQuestion]]:
        """
        Start new questionnaire or resume existing progress.

        Args:
            user_id: User ID
            session_id: Session ID
            conversation_id: Conversation ID
            questionnaire_id: Questionnaire ID (default: 'admin_created')
            db: Database session

        Returns:
            Tuple of (progress_record, questions_list)
        """
        logger.info(f"Starting/resuming questionnaire for user {user_id}, questionnaire {questionnaire_id}")

        # Check for existing in-progress questionnaire
        progress = db.query(UserQuestionnaireProgress).filter(
            UserQuestionnaireProgress.user_id == user_id,
            UserQuestionnaireProgress.questionnaire_id == questionnaire_id,
            UserQuestionnaireProgress.status == 'in_progress'
        ).first()

        # Get questions
        questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.questionnaire_id == questionnaire_id,
            AssessmentQuestion.status == 'published'
        ).order_by(AssessmentQuestion.question_number).all()

        if not questions:
            raise ValueError(f"No published questions found for questionnaire {questionnaire_id}")

        if progress:
            logger.info(f"Resuming existing progress: {progress.current_question_index}/{progress.total_questions}")
            return progress, questions

        # Create new progress record
        try:
            progress = UserQuestionnaireProgress(
                user_id=user_id,
                session_id=session_id,
                conversation_id=conversation_id,
                questionnaire_id=questionnaire_id,
                total_questions=len(questions),
                current_question_index=0,
                answers={},
                category_scores={},
                status='in_progress'
            )
            db.add(progress)
            db.commit()
            db.refresh(progress)

            logger.info(f"Created new progress record: id={progress.id}, total_questions={len(questions)}")
            return progress, questions

        except IntegrityError:
            # Handle race condition: another request created the record
            db.rollback()
            progress = db.query(UserQuestionnaireProgress).filter(
                UserQuestionnaireProgress.user_id == user_id,
                UserQuestionnaireProgress.questionnaire_id == questionnaire_id
            ).first()

            if not progress:
                raise ValueError("Failed to create or retrieve progress record")

            return progress, questions

    @staticmethod
    def save_answer(
        progress_id: int,
        question_id: int,
        answer_value: int,
        sub_category: Optional[str] = None,  # NEW: Optional sub-category from selected option
        db: Session = None
    ) -> Dict:
        """
        Save answer and update progress.

        Args:
            progress_id: Progress record ID
            question_id: Question ID
            answer_value: Answer value (score)
            sub_category: Optional sub-category from selected option (overrides question category)
            db: Database session

        Returns:
            {
                'ok': bool,
                'current_question_index': int,
                'category_scores': dict,
                'is_completed': bool,
                'report_id': int (if completed)
            }
        """
        logger.info(f"Saving answer for progress {progress_id}, question {question_id}, value {answer_value}, sub_category {sub_category}")

        # Get progress record
        progress = db.query(UserQuestionnaireProgress).filter(
            UserQuestionnaireProgress.id == progress_id
        ).first()

        if not progress:
            raise ValueError(f"Progress record {progress_id} not found")

        if progress.status != 'in_progress':
            raise ValueError(f"Cannot save answer: questionnaire status is {progress.status}")

        # Get question to determine category
        question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()

        if not question:
            raise ValueError(f"Question {question_id} not found")

        # Update answers - Store by question_number for consistency with scoring
        answers = progress.answers or {}
        answers[str(question.question_number)] = answer_value  # Use question_number, not question_id
        progress.answers = answers

        # Update category scores
        # Use sub_category if provided, otherwise use question category
        scoring_category = sub_category or question.category

        if scoring_category:
            category_scores = progress.category_scores or {}
            current_score = category_scores.get(scoring_category, 0)
            category_scores[scoring_category] = current_score + answer_value
            progress.category_scores = category_scores
            logger.info(f"Updated category '{scoring_category}' score: {current_score} + {answer_value} = {current_score + answer_value}")

        # Update progress
        progress.current_question_index += 1
        progress.last_updated_at = datetime.utcnow()

        # Check if completed
        is_completed = progress.current_question_index >= progress.total_questions

        if is_completed:
            progress.status = 'completed'
            progress.completed_at = datetime.utcnow()

            # Generate report
            report_id = QuestionnaireProgressService._generate_report(progress, db)
            progress.report_id = report_id

            db.commit()
            db.refresh(progress)

            logger.info(f"Questionnaire completed! Report ID: {report_id}")

            return {
                'ok': True,
                'current_question_index': progress.current_question_index,
                'category_scores': progress.category_scores,
                'is_completed': True,
                'report_id': report_id
            }

        db.commit()
        db.refresh(progress)

        return {
            'ok': True,
            'current_question_index': progress.current_question_index,
            'category_scores': progress.category_scores,
            'is_completed': False
        }

    @staticmethod
    def _generate_report(progress: UserQuestionnaireProgress, db: Session) -> int:
        """
        Generate simple report for completed questionnaire.

        Args:
            progress: Completed progress record
            db: Database session

        Returns:
            Report ID
        """
        logger.info(f"Generating report for progress {progress.id}")

        # Ensure user profile exists
        user_profile = db.query(UserProfile).filter(
            UserProfile.user_id == progress.user_id
        ).first()

        if not user_profile:
            user_profile = UserProfile(
                user_id=progress.user_id,
                username=f"User_{progress.user_id[:8]}",
                language_preference='zh'
            )
            db.add(user_profile)
            db.commit()
            db.refresh(user_profile)

        # Create or update assessment
        assessment = db.query(PsychologyAssessment).filter(
            PsychologyAssessment.user_id == progress.user_id,
            PsychologyAssessment.assessment_type == 'questionnaire'
        ).order_by(PsychologyAssessment.created_at.desc()).first()

        category_scores = progress.category_scores or {}

        # Mapping from category IDs to dimension names
        CATEGORY_TO_DIMENSION = {
            '2.1': 'emotional_regulation',      # 情绪调节能力
            '2.2': 'cognitive_flexibility',     # 认知重构能力
            '2.2.1': 'cognitive_flexibility',
            '2.2.2': 'cognitive_flexibility',
            '2.2.3': 'cognitive_flexibility',
            '2.2.4': 'cognitive_flexibility',
            '2.3': 'relationship_sensitivity',  # 关系互动能力
            '2.3.1': 'relationship_sensitivity',
            '2.3.2': 'relationship_sensitivity',
            '2.4': 'internal_conflict',         # 内在对话能力
            '2.4.1': 'internal_conflict',
            '2.4.2': 'internal_conflict',
            '2.5': 'growth_potential',          # 成长潜力
            '2.5.1': 'growth_potential',
            '2.5.2': 'growth_potential',
            '2.5.3': 'growth_potential',
        }

        # Aggregate scores by dimension
        dimension_scores = {
            'emotional_regulation': 0,
            'cognitive_flexibility': 0,
            'relationship_sensitivity': 0,
            'internal_conflict': 0,
            'growth_potential': 0
        }

        for category_id, score in category_scores.items():
            # Try direct dimension name match first (for backward compatibility)
            if category_id == '情绪调节能力':
                dimension_scores['emotional_regulation'] += score
            elif category_id == '认知重构能力':
                dimension_scores['cognitive_flexibility'] += score
            elif category_id == '关系互动能力':
                dimension_scores['relationship_sensitivity'] += score
            elif category_id == '内在对话能力':
                dimension_scores['internal_conflict'] += score
            elif category_id == '成长潜力':
                dimension_scores['growth_potential'] += score
            # Try category ID mapping
            elif category_id in CATEGORY_TO_DIMENSION:
                dimension = CATEGORY_TO_DIMENSION[category_id]
                dimension_scores[dimension] += score
            else:
                logger.warning(f"Unknown category '{category_id}' - score not mapped to any dimension")

        emotional_regulation = dimension_scores['emotional_regulation']
        cognitive_flexibility = dimension_scores['cognitive_flexibility']
        relationship_sensitivity = dimension_scores['relationship_sensitivity']
        internal_conflict = dimension_scores['internal_conflict']
        growth_potential = dimension_scores['growth_potential']

        if not assessment:
            assessment = PsychologyAssessment(
                user_id=progress.user_id,
                assessment_type='questionnaire',
                completion_percentage=100,
                is_complete=True,
                completed_at=datetime.utcnow(),
                emotional_regulation_score=emotional_regulation,
                cognitive_flexibility_score=cognitive_flexibility,
                relationship_sensitivity_score=relationship_sensitivity,
                internal_conflict_score=internal_conflict,
                growth_potential_score=growth_potential,
                extra_data={'conversation_id': progress.conversation_id}
            )
            db.add(assessment)
        else:
            assessment.completion_percentage = 100
            assessment.is_complete = True
            assessment.completed_at = datetime.utcnow()
            assessment.emotional_regulation_score = emotional_regulation
            assessment.cognitive_flexibility_score = cognitive_flexibility
            assessment.relationship_sensitivity_score = relationship_sensitivity
            assessment.internal_conflict_score = internal_conflict
            assessment.growth_potential_score = growth_potential

        db.commit()
        db.refresh(assessment)

        # Create report
        report = PsychologyReport(
            user_id=progress.user_id,
            assessment_id=assessment.id,
            report_type='comprehensive',
            language='zh',
            format='docx',
            report_data={},
            generation_status='pending'
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        logger.info(f"Created report with id={report.id}")

        return report.id

    @staticmethod
    def get_progress(
        user_id: str,
        questionnaire_id: str,
        db: Session
    ) -> Optional[UserQuestionnaireProgress]:
        """
        Get current progress for user and questionnaire.

        Args:
            user_id: User ID
            questionnaire_id: Questionnaire ID
            db: Database session

        Returns:
            Progress record or None
        """
        return db.query(UserQuestionnaireProgress).filter(
            UserQuestionnaireProgress.user_id == user_id,
            UserQuestionnaireProgress.questionnaire_id == questionnaire_id
        ).first()

    @staticmethod
    def abandon_progress(
        progress_id: int,
        db: Session
    ) -> bool:
        """
        Mark progress as abandoned.

        Args:
            progress_id: Progress record ID
            db: Database session

        Returns:
            True if successful
        """
        progress = db.query(UserQuestionnaireProgress).filter(
            UserQuestionnaireProgress.id == progress_id
        ).first()

        if not progress:
            return False

        progress.status = 'abandoned'
        progress.last_updated_at = datetime.utcnow()
        db.commit()

        logger.info(f"Progress {progress_id} marked as abandoned")
        return True

