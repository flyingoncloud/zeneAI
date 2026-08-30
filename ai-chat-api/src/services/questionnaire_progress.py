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

        # Check for existing progress (in_progress OR completed)
        progress = db.query(UserQuestionnaireProgress).filter(
            UserQuestionnaireProgress.user_id == user_id,
            UserQuestionnaireProgress.questionnaire_id == questionnaire_id
        ).order_by(UserQuestionnaireProgress.last_updated_at.desc()).first()

        # Get questions
        questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.questionnaire_id == questionnaire_id,
            AssessmentQuestion.status == 'published'
        ).order_by(AssessmentQuestion.question_number).all()

        if not questions:
            raise ValueError(f"No published questions found for questionnaire {questionnaire_id}")

        # If progress exists and is valid
        if progress:
            # If completed, return it (frontend will show report)
            if progress.status == 'completed':
                logger.info(f"Found completed progress with report_id={progress.report_id}")
                return progress, questions

            # If in_progress, validate it's not stale
            if progress.status == 'in_progress':
                if progress.current_question_index >= len(questions):
                    logger.warning(f"Stale in_progress detected: index={progress.current_question_index}, total={len(questions)}. Creating new.")
                    # Don't return stale progress, create new below
                    progress = None
                else:
                    # Update session_id if it changed (user logged in with new session)
                    if progress.session_id != session_id:
                        logger.info(f"Updating progress session_id from {progress.session_id} to {session_id}")
                        progress.session_id = session_id

                    # Sync total_questions if question count changed (e.g., admin added/removed questions)
                    if progress.total_questions != len(questions):
                        logger.info(f"Syncing total_questions from {progress.total_questions} to {len(questions)}")
                        progress.total_questions = len(questions)

                    db.commit()
                    db.refresh(progress)

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
            # If already completed, return completion info instead of error
            if progress.status == 'completed':
                logger.info(f"Questionnaire already completed, returning existing report_id={progress.report_id}")
                return {
                    'ok': True,
                    'current_question_index': progress.current_question_index,
                    'category_scores': progress.category_scores or {},
                    'is_completed': True,
                    'report_id': progress.report_id
                }
            raise ValueError(f"Cannot save answer: questionnaire status is {progress.status}")

        # Get question to determine category
        question = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == question_id).first()

        if not question:
            raise ValueError(f"Question {question_id} not found")

        # Log question details
        logger.info(f"Question {question_id}: text='{question.text[:50]}...', category={question.category}, template={question.template}")

        # SKIP special templates that send non-score values
        SKIP_TEMPLATES = ['F7']  # F7=direction dial (sends 0-360 degrees)

        # F6 ranking conversion: rank 1→5 points, rank 2→3 points, rank 3→1 point
        F6_RANK_TO_SCORE = {1: 5, 2: 3, 3: 1}

        if question.template in SKIP_TEMPLATES:
            logger.warning(f"⚠️ SKIPPING scoring for template {question.template} question {question_id} - special template sends non-score values")

            # Store the answer for progress tracking (but don't update category scores)
            answers = dict(progress.answers or {})
            answers[str(question.question_number)] = answer_value
            progress.answers = answers

            progress.current_question_index = len(progress.answers)
            progress.last_updated_at = datetime.utcnow()
            db.commit()
            db.refresh(progress)

            # Check if completed
            is_completed = len(progress.answers) >= progress.total_questions
            if is_completed:
                progress.status = 'completed'
                progress.completed_at = datetime.utcnow()
                report_id = QuestionnaireProgressService._generate_report(progress, db)
                progress.report_id = report_id
                db.commit()
                db.refresh(progress)

                return {
                    'ok': True,
                    'current_question_index': progress.current_question_index,
                    'category_scores': progress.category_scores,
                    'is_completed': True,
                    'report_id': report_id
                }

            return {
                'ok': True,
                'current_question_index': progress.current_question_index,
                'category_scores': progress.category_scores,
                'is_completed': False
            }

        # Convert F6 ranking to score (rank 1→5, rank 2→3, rank 3→1)
        if question.template == 'F6':
            converted_score = F6_RANK_TO_SCORE.get(answer_value, 0)
            logger.info(f"F6 ranking conversion: rank {answer_value} → score {converted_score}")
            answer_value = converted_score

        # Update answers - Store by question_number for consistency with scoring
        # Create new dict to ensure SQLAlchemy detects change
        answers = dict(progress.answers or {})
        answers[str(question.question_number)] = answer_value  # Use question_number, not question_id
        progress.answers = answers

        logger.info(f"Answer stored: question_number={question.question_number}, answer_value={answer_value}")

        # Update category scores
        # Use sub_category if provided, otherwise use question category
        scoring_category = sub_category or question.category

        if scoring_category:
            # Get current scores (create new dict to ensure SQLAlchemy detects change)
            category_scores = dict(progress.category_scores or {})
            current_score = category_scores.get(scoring_category, 0)
            new_score = current_score + answer_value
            category_scores[scoring_category] = new_score

            # Assign back to trigger SQLAlchemy change detection
            progress.category_scores = category_scores

            logger.info(f"✅ Category '{scoring_category}' score updated: {current_score} + {answer_value} = {new_score}")
        else:
            logger.warning(f"⚠️ No category found for question {question_id} - score not tracked by category")

        # Update progress - track by answer count, not sequential index
        # When jumping between domains, current_question_index may not be sequential
        progress.current_question_index = len(progress.answers)
        progress.last_updated_at = datetime.utcnow()

        # Commit immediately to persist JSON changes
        db.commit()
        db.refresh(progress)

        # Check if completed - based on total answers collected, not sequential index
        is_completed = len(progress.answers) >= progress.total_questions

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
        logger.info(f"📋 Generating report for progress {progress.id}")
        logger.info(f"   Total answers: {len(progress.answers or {})}")
        logger.info(f"   Category scores count: {len(progress.category_scores or {})}")

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
            '2.1.1': 'emotional_regulation',    # Emotion Recognition and Expression
            '2.1.2': 'emotional_regulation',    # Emotion Regulation and Recovery
            '2.1.3': 'emotional_regulation',    # Emotional Tendencies and Risks
            '2.2': 'cognitive_flexibility',     # 认知重构能力
            '2.2.1': 'cognitive_flexibility',
            '2.2.1.1': 'cognitive_flexibility',  # Managers
            '2.2.1.2': 'cognitive_flexibility',  # Firefighters
            '2.2.1.3': 'cognitive_flexibility',  # Exiles
            '2.2.1.4': 'cognitive_flexibility',  # Self
            '2.2.2': 'cognitive_flexibility',
            '2.2.2.1': 'cognitive_flexibility',  # Overgeneralization
            '2.2.2.2': 'cognitive_flexibility',  # All-or-Nothing
            '2.2.2.3': 'cognitive_flexibility',  # Catastrophizing
            '2.2.2.4': 'cognitive_flexibility',  # Should/Must
            '2.2.2.5': 'cognitive_flexibility',  # Self-Blame
            '2.2.2.6': 'cognitive_flexibility',  # Functional/Flexible Thinking
            '2.2.3': 'cognitive_flexibility',
            '2.2.3.1': 'cognitive_flexibility',  # Self-Other Perspective
            '2.2.3.1.1': 'cognitive_flexibility',  # Self Perspective
            '2.2.3.1.2': 'cognitive_flexibility',  # Others Perspective
            '2.2.3.2': 'cognitive_flexibility',  # Spatial Perspective
            '2.2.3.3': 'cognitive_flexibility',  # Cognitive Frame
            '2.2.3.4': 'cognitive_flexibility',  # Emotional Perspective
            '2.2.4': 'cognitive_flexibility',
            '2.2.4.1': 'cognitive_flexibility',  # Hero Type
            '2.2.4.2': 'cognitive_flexibility',  # Victim Type
            '2.2.4.3': 'cognitive_flexibility',  # Rebel Type
            '2.2.4.4': 'cognitive_flexibility',  # Lost Type
            '2.2.4.5': 'cognitive_flexibility',  # Explorer Type
            '2.3': 'relationship_sensitivity',  # 关系互动能力
            '2.3.1': 'relationship_sensitivity',
            '2.3.1.1': 'relationship_sensitivity',  # Secure
            '2.3.1.2': 'relationship_sensitivity',  # Anxious
            '2.3.1.3': 'relationship_sensitivity',  # Avoidant
            '2.3.1.4': 'relationship_sensitivity',  # Disorganized
            '2.3.2': 'relationship_sensitivity',
            '2.3.2.1': 'relationship_sensitivity',  # Existential Crisis
            '2.3.2.2': 'relationship_sensitivity',  # Worth Crisis
            '2.3.2.3': 'relationship_sensitivity',  # Security Crisis
            '2.3.2.4': 'relationship_sensitivity',  # Autonomy Crisis
            '2.3.3': 'relationship_sensitivity',
            '2.3.3.1': 'relationship_sensitivity',  # Emotional Empathy
            '2.3.3.2': 'relationship_sensitivity',  # Cognitive Empathy
            '2.3.3.3': 'relationship_sensitivity',  # Behavioral Empathy
            '2.3.4': 'relationship_sensitivity',
            '2.4': 'internal_conflict',         # 内在对话能力 / MBTI性格类型测试
            '2.4.1': 'internal_conflict',       # J-P 判断-感知
            '2.4.2': 'internal_conflict',       # T-F 思考-情感
            '2.4.3': 'internal_conflict',       # E-I 外向-内向
            '2.4.4': 'internal_conflict',       # S-N 感觉-直觉
            '2.5': 'growth_potential',          # 成长潜力
            '2.5.1': 'growth_potential',
            '2.5.2': 'growth_potential',
            '2.5.3': 'growth_potential',
        }

        # Aggregate scores by dimension
        # IMPORTANT: We aggregate by the question's category field, NOT sub_category
        # This ensures numerator and denominator use the same categorization
        dimension_scores = {
            'emotional_regulation': 0,
            'cognitive_flexibility': 0,
            'relationship_sensitivity': 0,
            'internal_conflict': 0,
            'growth_potential': 0
        }

        logger.info(f"📊 Aggregating category scores to dimensions:")
        logger.info(f"   Category scores from progress: {category_scores}")
        logger.info(f"   Total score across all categories: {sum(category_scores.values())}")

        # Re-aggregate scores by looking at actual questions answered
        # This ensures we use question.category, not sub_category overrides
        for question_number_str, score in (progress.answers or {}).items():
            question_number = int(question_number_str)
            # We'll fetch questions later, for now just note we need to re-aggregate

        logger.info(f"   ⚠️ Note: Scores will be re-aggregated by question category to ensure consistency")

        for category_id, score in category_scores.items():
            # Try category code mapping first (current system)
            if category_id in CATEGORY_TO_DIMENSION:
                dimension = CATEGORY_TO_DIMENSION[category_id]
                dimension_scores[dimension] += score
                logger.info(f"   ✅ '{category_id}' ({score}) → {dimension}")
            # Fallback to dimension name match (for backward compatibility with old data)
            elif category_id == '情绪调节能力':
                dimension_scores['emotional_regulation'] += score
                logger.info(f"   ✅ [Legacy] '{category_id}' ({score}) → emotional_regulation")
            elif category_id == '认知重构能力':
                dimension_scores['cognitive_flexibility'] += score
                logger.info(f"   ✅ [Legacy] '{category_id}' ({score}) → cognitive_flexibility")
            elif category_id == '关系互动能力':
                dimension_scores['relationship_sensitivity'] += score
                logger.info(f"   ✅ [Legacy] '{category_id}' ({score}) → relationship_sensitivity")
            elif category_id == '内在对话能力':
                dimension_scores['internal_conflict'] += score
                logger.info(f"   ✅ [Legacy] '{category_id}' ({score}) → internal_conflict")
            elif category_id == '成长潜力':
                dimension_scores['growth_potential'] += score
                logger.info(f"   ✅ [Legacy] '{category_id}' ({score}) → growth_potential")
            else:
                logger.warning(f"   ⚠️ Unknown category '{category_id}' ({score}) - score not mapped to any dimension")

        logger.info(f"📈 Raw dimension scores (from category_scores): {dimension_scores}")

        # Calculate total possible scores using category_scores as source of truth
        # We ignore progress.answers because it may contain corrupted data (e.g., Direction Dial 0-360)
        from src.database.questionnaire_models import AssessmentQuestion

        dimension_total_possible_scores = {
            'emotional_regulation': 0,
            'cognitive_flexibility': 0,
            'relationship_sensitivity': 0,
            'internal_conflict': 0,
            'growth_potential': 0
        }

        logger.info(f"📊 Calculating total possible scores for ALL dimensions:")

        # Templates to skip (they send non-score values)
        SKIP_TEMPLATES = ['F7']  # F7=direction dial (sends 0-360 degrees)

        # Get ALL published questions in the questionnaire (not just answered ones)
        all_questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.questionnaire_id == progress.questionnaire_id,
            AssessmentQuestion.status == 'published'
        ).all()

        # Calculate total possible for each dimension from ALL questions
        for q in all_questions:
            # Skip special templates
            if q.template in SKIP_TEMPLATES:
                logger.info(f"   Q{q.question_number} (cat {q.category}): SKIPPED (template {q.template})")
                continue

            # Map category to dimension
            dimension = CATEGORY_TO_DIMENSION.get(q.category)
            if not dimension:
                logger.warning(f"   Q{q.question_number} (cat {q.category}): No dimension mapping")
                continue

            # Get maximum score for this question (not sum of all options)
            if q.options and isinstance(q.options, list) and len(q.options) > 0:
                # Try 'score' first, fall back to 'value' for legacy questions
                option_scores = [opt.get('score', opt.get('value', 0)) for opt in q.options if isinstance(opt, dict)]
                max_score = max(option_scores) if option_scores else 0
                dimension_total_possible_scores[dimension] += max_score
                logger.info(f"   Q{q.question_number} (cat {q.category}): options={option_scores}, max={max_score} → {dimension}")
            elif q.template == 'F1':
                # F1 template with empty options - assume standard 1-5 scale
                # Maximum possible = 5
                dimension_total_possible_scores[dimension] += 5
                logger.info(f"   Q{q.question_number} (cat {q.category}): F1 default [1,2,3,4,5], max=5 → {dimension}")
            elif q.template == 'F6':
                # F6 ranking template - max score is 5 (rank 1 converts to 5 points)
                dimension_total_possible_scores[dimension] += 5
                logger.info(f"   Q{q.question_number} (cat {q.category}): F6 ranking, max=5 → {dimension}")

        logger.info(f"📊 Total possible scores per dimension (ALL questions): {dimension_total_possible_scores}")

        # Normalize each dimension to 0-100 scale
        normalized_scores = {}
        for dimension, actual_score in dimension_scores.items():
            total_possible = dimension_total_possible_scores.get(dimension, 0)

            if total_possible > 0:
                # Normalize to 0-100 scale as integer
                normalized_score = (actual_score / total_possible) * 100
                # Cap at 100% (in case of data issues)
                normalized_score = min(normalized_score, 100)
                # Round to integer
                normalized_scores[dimension] = round(normalized_score)
                logger.info(f"   {dimension}: {actual_score}/{total_possible} = {normalized_score:.2f}/100 → {normalized_scores[dimension]}")
            else:
                normalized_scores[dimension] = 0
                logger.info(f"   {dimension}: No questions in database → 0/100")

        logger.info(f"📈 Normalized dimension scores (0-100): {normalized_scores}")

        emotional_regulation = normalized_scores['emotional_regulation']
        cognitive_flexibility = normalized_scores['cognitive_flexibility']
        relationship_sensitivity = normalized_scores['relationship_sensitivity']
        internal_conflict = normalized_scores['internal_conflict']
        growth_potential = normalized_scores['growth_potential']

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
                sub_dimension_scores=category_scores,  # Store category scores for sub-category analysis
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
            assessment.sub_dimension_scores = category_scores  # Store category scores for sub-category analysis

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

