"""
Questionnaire scoring service
Calculates scores based on marking criteria for each questionnaire
"""
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class QuestionnaireScorer:
    """Calculate scores for questionnaire responses"""

    @staticmethod
    def calculate_score(
        questionnaire_id: str,
        marking_criteria: Dict[str, Any],
        answers: Dict[int, int],
        questions: List[Any]
    ) -> Dict[str, Any]:
        """
        Calculate scores based on questionnaire type and marking criteria

        Args:
            questionnaire_id: ID of the questionnaire
            marking_criteria: Scoring rules from questionnaire
            answers: Dict mapping question_number -> answer_value
            questions: List of Question objects

        Returns:
            Dict containing scores, interpretation, and category breakdowns
        """
        try:
            if questionnaire_id == "questionnaire_2_1":
                return QuestionnaireScorer._score_2_1(marking_criteria, answers)
            elif questionnaire_id == "questionnaire_2_2":
                return QuestionnaireScorer._score_2_2(marking_criteria, answers, questions)
            elif questionnaire_id == "questionnaire_2_3":
                return QuestionnaireScorer._score_2_3(marking_criteria, answers, questions)
            elif questionnaire_id == "questionnaire_2_5":
                return QuestionnaireScorer._score_2_5(marking_criteria, answers)
            else:
                logger.warning(f"No scoring logic for {questionnaire_id}")
                return {"total_score": sum(answers.values()), "interpretation": None}

        except Exception as e:
            logger.error(f"Error calculating score for {questionnaire_id}: {e}")
            raise

    @staticmethod
    def _score_2_1(criteria: Dict[str, Any], answers: Dict[int, int]) -> Dict[str, Any]:
        """
        Score questionnaire 2.1 - Emotional Insight Analysis
        Simple sum of all answers (1-5 scale)
        """
        total_score = sum(answers.values())

        # Find interpretation level
        interpretation = None
        if criteria and "interpretation" in criteria:
            for level in criteria["interpretation"]:
                min_score, max_score = level["range"]
                if min_score <= total_score <= max_score:
                    interpretation = {
                        "level": level["level"],
                        "description": level["description"],
                        "score_range": level["range"]
                    }
                    break

        return {
            "total_score": total_score,
            "interpretation": interpretation,
            "category_scores": None
        }

    @staticmethod
    def _score_2_2(criteria: Dict[str, Any], answers: Dict[int, int], questions: List[Any]) -> Dict[str, Any]:
        """
        Score questionnaire 2.2 - Cognitive Insight Analysis
        Complex scoring with multiple sub-sections and categories
        """
        category_scores = {}

        # Group questions by sub_section and category
        for question in questions:
            if question.question_number not in answers:
                continue

            answer_value = answers[question.question_number]
            sub_section = question.sub_section or "general"
            category = question.category or "general"

            key = f"{sub_section}_{category}"
            if key not in category_scores:
                category_scores[key] = {
                    "sub_section": sub_section,
                    "category": category,
                    "score": 0,
                    "count": 0
                }

            category_scores[key]["score"] += answer_value
            category_scores[key]["count"] += 1

        # Calculate total score
        total_score = sum(answers.values())

        return {
            "total_score": total_score,
            "interpretation": None,  # Complex interpretation would go here
            "category_scores": category_scores
        }

    @staticmethod
    def _score_2_3(criteria: Dict[str, Any], answers: Dict[int, int], questions: List[Any]) -> Dict[str, Any]:
        """
        Score questionnaire 2.3 - Relational Insight
        Scores by attachment patterns and dimensions
        """
        category_scores = {}

        # Group by category (attachment patterns)
        for question in questions:
            if question.question_number not in answers:
                continue

            answer_value = answers[question.question_number]
            category = question.category or "general"
            sub_section = question.sub_section or "general"

            key = f"{sub_section}_{category}"
            if key not in category_scores:
                category_scores[key] = {
                    "sub_section": sub_section,
                    "category": category,
                    "score": 0,
                    "count": 0
                }

            category_scores[key]["score"] += answer_value
            category_scores[key]["count"] += 1

        # Calculate total score
        total_score = sum(answers.values())

        # Determine dominant attachment pattern (highest score in 2.3.1)
        attachment_scores = {k: v for k, v in category_scores.items() if "2.3.1" in k}
        dominant_pattern = None
        if attachment_scores:
            dominant_key = max(attachment_scores, key=lambda k: attachment_scores[k]["score"])
            dominant_pattern = attachment_scores[dominant_key]["category"]

        return {
            "total_score": total_score,
            "interpretation": {"dominant_attachment_pattern": dominant_pattern} if dominant_pattern else None,
            "category_scores": category_scores
        }

    @staticmethod
    def _score_2_5(criteria: Dict[str, Any], answers: Dict[int, int]) -> Dict[str, Any]:
        """
        Score questionnaire 2.5 - Growth & Transformation Potential
        Uses option scores (A=1, B=3, C=5) and standardization formula
        """
        # For questionnaire 2.5, answers are already numeric (1, 3, or 5)
        # based on option selection (A, B, C)
        total_score = sum(answers.values())

        # Apply standardization formula if specified
        standardized_score = None
        if criteria and "standardization_formula" in criteria:
            # Formula: (Q1 + Q2) / 10 * 100
            # Assuming we have at least 2 questions
            if len(answers) >= 2:
                q_values = list(answers.values())
                standardized_score = (q_values[0] + q_values[1]) / 10 * 100

        return {
            "total_score": total_score,
            "standardized_score": standardized_score,
            "interpretation": None,
            "category_scores": None
        }
