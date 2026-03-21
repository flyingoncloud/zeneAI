"""
Inline Assessment Service

Handles question selection and answer recording for inline assessment questions
embedded naturally into AI chat conversations.
"""

import logging
import random
import re
from datetime import datetime
from typing import Dict, Optional, List

from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from src.database.questionnaire_models import AssessmentQuestion
from src.database.inline_assessment_models import InlineAssessmentProgress, InlineAssessmentSummary
from src.database.models import Conversation

logger = logging.getLogger(__name__)

# Valid domain codes for inline assessment
VALID_DOMAINS = ["2.1", "2.2", "2.3", "2.4", "2.5"]

# Distress keywords that indicate the user is in acute emotional crisis
# When detected, assessment questions should NOT be asked
DISTRESS_KEYWORDS_ZH = ["想死", "自杀", "不想活", "活不下去", "崩溃", "受不了了", "太痛苦了"]
DISTRESS_KEYWORDS_EN = ["suicide", "kill myself", "want to die", "can't go on", "end it all"]

# Patterns that indicate an assessment question was asked in an assistant message
_ASSESSMENT_QUESTION_PATTERNS = [
    "request_assessment_question",  # tool call indicator
    re.compile(r'1\.\s*.+\n\s*2\.\s*.+\n\s*3\.\s*.+\n\s*4\.\s*.+\n\s*5\.\s*.+'),  # numbered 1-5 options
    re.compile(r'[1-5]\s*[=\-–—]\s*'),  # scale descriptions like "1=完全不同意"
    re.compile(r'从\s*1\s*到\s*5'),  # "从1到5" scale prompt
    re.compile(r'[1１]\s*[分到至]\s*[5５]\s*分'),  # "1分到5分" scale
    "record_inline_answer",  # answer recording tool call
    re.compile(r'顺便问一下|我好奇|想了解一下你'),  # common lead-in phrases from the prompt
]


def extract_domain_from_questionnaire_id(questionnaire_id: str) -> Optional[str]:
    """
    Parse questionnaire_id format "questionnaire_X_Y" into domain code "X.Y".

    Args:
        questionnaire_id: e.g. "questionnaire_2_1"

    Returns:
        Domain code string e.g. "2.1", or None if format is invalid
    """
    if not questionnaire_id:
        return None

    match = re.match(r'^questionnaire_(\d+)_(\d+)$', questionnaire_id)
    if not match:
        logger.warning(f"Invalid questionnaire_id format: {questionnaire_id}")
        return None

    domain = f"{match.group(1)}.{match.group(2)}"
    if domain not in VALID_DOMAINS:
        logger.warning(f"Extracted domain '{domain}' is not in valid domains list")
        return None

    return domain


def validate_domain(domain: str) -> bool:
    """
    Validate domain against the whitelist.

    Args:
        domain: Domain code to validate (e.g. "2.1")

    Returns:
        True if valid, False otherwise
    """
    return domain in VALID_DOMAINS


def _contains_assessment_question(content: str) -> bool:
    """
    Check if an assistant message contains an assessment question.

    Looks for tool call indicators or numbered 1-5 option patterns.
    """
    if not content:
        return False

    for pattern in _ASSESSMENT_QUESTION_PATTERNS:
        if isinstance(pattern, str):
            if pattern in content:
                return True
        elif pattern.search(content):
            return True
    return False


def _is_distressed(text: str) -> bool:
    """
    Basic keyword detection for acute emotional distress.

    Checks both Chinese and English crisis keywords.
    """
    if not text:
        return False

    text_lower = text.lower()
    for keyword in DISTRESS_KEYWORDS_ZH:
        if keyword in text_lower:
            return True
    for keyword in DISTRESS_KEYWORDS_EN:
        if keyword in text_lower:
            return True
    return False


def should_ask_question(
    conversation_history: List[Dict[str, str]],
    user_message: str,
) -> bool:
    """
    Determine if an assessment question should be asked in this round.

    Applies pacing rules to prevent over-questioning:
    1. Minimum conversation length (8 messages = 4 rounds)
    2. No questions in last 4 rounds (last 8 messages)
    3. Distress detection (skip questions during crisis)
    4. Probabilistic gate (~12% chance when all rules pass)

    Args:
        conversation_history: List of message dicts with 'role' and 'content' keys
        user_message: The current user message

    Returns:
        True if a question can be asked, False otherwise
    """
    try:
        # Rule 1: Don't ask in first 4 rounds (need at least 8 messages)
        if len(conversation_history) < 8:
            logger.info("Pacing: skipping question — conversation too short (%d messages)", len(conversation_history))
            return False

        # Rule 2: Don't ask if a question was asked in the last 4 rounds (last 8 messages)
        recent_messages = conversation_history[-8:]
        for msg in recent_messages:
            if msg.get("role") == "assistant" and _contains_assessment_question(msg.get("content", "")):
                logger.info("Pacing: skipping question — assessment question found in last 4 rounds")
                return False

        # Rule 3: Don't ask if user is in acute emotional distress
        if _is_distressed(user_message):
            logger.info("Pacing: skipping question — user distress detected")
            return False

        # Rule 4: Probabilistic gate — only ask ~12% of the time
        if random.random() < 0.12:
            logger.info("Pacing: allowing question (probabilistic gate passed)")
            return True

        logger.info("Pacing: skipping question (probabilistic gate — not this turn)")
        return False

    except Exception as e:
        logger.error(f"Pacing check error, defaulting to False: {e}", exc_info=True)
        return False


def get_question_for_domain(
    db: Session,
    user_id: str,
    conversation_id: int,
    domain: str,
    subcategory: Optional[str] = None
) -> Dict:
    """
    Select an unasked assessment question for the given domain.

    Queries AssessmentQuestion table filtered by domain via questionnaire_id
    pattern matching, excludes already-answered questions, and returns a
    random selection.

    Args:
        db: SQLAlchemy database session
        user_id: The user's ID
        conversation_id: Current conversation ID
        domain: Domain code (e.g. "2.1")
        subcategory: Optional subcategory code (e.g. "2.1.2")

    Returns:
        Dict with question data on success, or status dict on failure/empty
    """
    # Validate domain
    if not validate_domain(domain):
        logger.warning(f"Invalid domain requested: {domain}")
        return {
            "status": "error",
            "reason": "invalid_domain",
            "message": f"Domain '{domain}' is not valid. Must be one of {VALID_DOMAINS}"
        }

    try:
        # Build questionnaire_id pattern for domain matching
        # Domain "2.1" → questionnaire_id like "questionnaire_2_1%"
        domain_parts = domain.split(".")
        questionnaire_pattern = f"questionnaire_{domain_parts[0]}_{domain_parts[1]}%"

        # Query questions for this domain
        query = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.questionnaire_id.like(questionnaire_pattern)
        )

        # When subcategory provided, additionally filter by sub_section or category
        if subcategory:
            query = query.filter(
                or_(
                    AssessmentQuestion.sub_section == subcategory,
                    AssessmentQuestion.category == subcategory
                )
            )

        all_questions = query.all()

        if not all_questions:
            logger.info(f"No questions found for domain={domain}, subcategory={subcategory}")
            return {
                "status": "no_questions_available",
                "reason": "no_questions_in_domain"
            }

        # Get IDs of questions already answered by this user
        answered_ids = db.query(InlineAssessmentProgress.question_id).filter(
            InlineAssessmentProgress.user_id == user_id
        ).all()
        answered_id_set = {row[0] for row in answered_ids}

        # Filter out already-answered questions
        available_questions = [q for q in all_questions if q.id not in answered_id_set]

        if not available_questions:
            logger.info(f"All questions already asked for user={user_id}, domain={domain}")
            return {
                "status": "no_questions_available",
                "reason": "all_asked"
            }

        # Random selection from available questions
        selected = random.choice(available_questions)

        # Extract domain from the selected question's questionnaire_id
        question_domain = extract_domain_from_questionnaire_id(selected.questionnaire_id) or domain

        logger.info(
            f"Selected question {selected.id} for user={user_id}, "
            f"domain={domain}, subcategory={subcategory}"
        )

        return {
            "status": "success",
            "question": {
                "id": selected.id,
                "text": selected.text,
                "options": selected.options,
                "domain": question_domain,
                "subcategory": selected.sub_section or selected.category
            }
        }

    except SQLAlchemyError as e:
        logger.error(f"Database error during question selection: {e}", exc_info=True)
        return {
            "status": "error",
            "reason": "database_error",
            "message": "Failed to retrieve assessment question"
        }
    except Exception as e:
        logger.error(f"Unexpected error during question selection: {e}", exc_info=True)
        return {
            "status": "error",
            "reason": "unexpected_error",
            "message": "An unexpected error occurred"
        }


def record_answer(
    db: Session,
    user_id: str,
    conversation_id: int,
    question_id: int,
    answer_value: int,
    context: Optional[Dict] = None
) -> Dict:
    """
    Record a user's answer to an inline assessment question and update progress.

    Validates inputs, creates an InlineAssessmentProgress record, and atomically
    updates the InlineAssessmentSummary for the user.

    Args:
        db: SQLAlchemy database session
        user_id: The user's ID
        conversation_id: Current conversation ID
        question_id: The assessment question ID being answered
        answer_value: The user's answer (integer 1-5)
        context: Optional conversation context dict

    Returns:
        Dict with status and progress info on success, or error details on failure
    """
    # Validate answer_value is integer between 1 and 5
    if not isinstance(answer_value, int) or isinstance(answer_value, bool):
        return {
            "status": "error",
            "reason": "invalid_answer_value",
            "message": "answer_value must be an integer between 1 and 5"
        }

    if answer_value < 1 or answer_value > 5:
        return {
            "status": "error",
            "reason": "invalid_answer_value",
            "message": "answer_value must be between 1 and 5"
        }

    try:
        # Check for duplicate (user_id, question_id)
        existing = db.query(InlineAssessmentProgress).filter(
            InlineAssessmentProgress.user_id == user_id,
            InlineAssessmentProgress.question_id == question_id
        ).first()

        if existing is not None:
            return {
                "status": "error",
                "reason": "duplicate_answer",
                "message": "Question already answered"
            }

        # Validate question_id exists
        question = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.id == question_id
        ).first()

        if question is None:
            return {
                "status": "error",
                "reason": "question_not_found",
                "message": f"Question with id {question_id} not found"
            }

        # Validate conversation_id exists
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id
        ).first()

        if conversation is None:
            return {
                "status": "error",
                "reason": "conversation_not_found",
                "message": f"Conversation with id {conversation_id} not found"
            }

        # Extract domain from question's questionnaire_id
        domain = extract_domain_from_questionnaire_id(question.questionnaire_id)
        if domain is None:
            logger.error(
                f"Could not extract valid domain from questionnaire_id={question.questionnaire_id} "
                f"for question_id={question_id}"
            )
            return {
                "status": "error",
                "reason": "invalid_domain",
                "message": "Could not determine domain for this question"
            }

        subcategory = question.sub_section or question.category

        # Atomic transaction: insert progress + update summary
        nested = db.begin_nested()
        try:
            # Create InlineAssessmentProgress record
            now = datetime.utcnow()
            progress_record = InlineAssessmentProgress(
                user_id=user_id,
                conversation_id=conversation_id,
                question_id=question_id,
                answer_value=answer_value,
                domain=domain,
                subcategory=subcategory,
                asked_at=now,
                answered_at=now,
                conversation_context=context or {}
            )
            db.add(progress_record)

            # Get or create InlineAssessmentSummary
            summary = db.query(InlineAssessmentSummary).filter(
                InlineAssessmentSummary.user_id == user_id
            ).first()

            if summary is None:
                summary = InlineAssessmentSummary(
                    user_id=user_id,
                    total_answered=0,
                    total_questions=83,
                    completion_percentage=0.0,
                    domains_covered=[],
                    domain_question_counts={},
                    can_generate_report=False,
                    report_generated=False,
                    started_at=now,
                    last_updated_at=now
                )
                db.add(summary)
                db.flush()

            # Update summary fields
            summary.total_answered = summary.total_answered + 1
            summary.completion_percentage = (summary.total_answered / 83) * 100

            # Update domains_covered - use copy() so SQLAlchemy detects mutation
            domains_covered = list(summary.domains_covered or [])
            if domain not in domains_covered:
                domains_covered.append(domain)
            summary.domains_covered = domains_covered

            # Update domain_question_counts - use copy() so SQLAlchemy detects mutation
            domain_counts = dict(summary.domain_question_counts or {})
            domain_counts[domain] = domain_counts.get(domain, 0) + 1
            summary.domain_question_counts = domain_counts

            # Set can_generate_report when threshold reached
            summary.can_generate_report = summary.total_answered >= 40

            summary.last_updated_at = now

            nested.commit()

        except Exception:
            nested.rollback()
            raise

        db.flush()

        logger.info(
            f"Recorded answer for user={user_id}, question={question_id}, "
            f"domain={domain}, total_answered={summary.total_answered}"
        )

        return {
            "status": "success",
            "progress": {
                "total_answered": summary.total_answered,
                "total_questions": 83,
                "completion_percentage": summary.completion_percentage,
                "domains_covered": summary.domains_covered,
                "domain_question_counts": summary.domain_question_counts,
                "can_generate_report": summary.can_generate_report
            }
        }

    except SQLAlchemyError as e:
        logger.error(f"Database error during answer recording: {e}", exc_info=True)
        return {
            "status": "error",
            "reason": "database_error",
            "message": "Failed to record answer"
        }
    except Exception as e:
        logger.error(f"Unexpected error during answer recording: {e}", exc_info=True)
        return {
            "status": "error",
            "reason": "unexpected_error",
            "message": "An unexpected error occurred"
        }
