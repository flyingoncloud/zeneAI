"""
Script to load questionnaire data from JSON files into the database
Run this script once to populate the questionnaire tables
"""
import json
import sys
from pathlib import Path
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.database.database import SessionLocal, init_db
from src.database.questionnaire_models import AssessmentQuestionnaire, AssessmentQuestion
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_questionnaire_from_json(json_file: Path, db: Session):
    """Load a single questionnaire from JSON file into database"""
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        questionnaire_id = json_file.stem  # e.g., "questionnaire_2_1"

        # Check if questionnaire already exists
        existing = db.query(AssessmentQuestionnaire).filter(AssessmentQuestionnaire.id == questionnaire_id).first()
        if existing:
            logger.info(f"Questionnaire {questionnaire_id} already exists, skipping...")
            return

        # Create questionnaire
        questionnaire = AssessmentQuestionnaire(
            id=questionnaire_id,
            section=data.get("section"),
            title=data.get("title"),
            marking_criteria=data.get("marking_criteria")
        )
        db.add(questionnaire)
        db.flush()  # Get the ID without committing

        # Generate standard 5-point Likert scale options if not provided
        marking_criteria = data.get("marking_criteria", {})
        scale_description = marking_criteria.get("scale", "")

        # Default 5-point Likert scale options with scores
        default_options = [
            {"value": 1, "label": "非常不符合", "score": 1},
            {"value": 2, "label": "不太符合", "score": 2},
            {"value": 3, "label": "一般", "score": 3},
            {"value": 4, "label": "比较符合", "score": 4},
            {"value": 5, "label": "非常符合", "score": 5}
        ]

        # Extract and save questions
        questions_added = 0
        global_question_number = 1  # Generate unique sequential question numbers

        # Handle different JSON structures
        if "questions" in data:
            # Flat structure (questionnaire_2_1)
            for q in data["questions"]:
                # Use provided options or default Likert scale
                options = q.get("options") if q.get("options") else default_options

                question = AssessmentQuestion(
                    questionnaire_id=questionnaire_id,
                    question_number=global_question_number,
                    text=q["text"],
                    options=options
                )
                db.add(question)
                questions_added += 1
                global_question_number += 1

        elif "dimensions" in data:
            # Dimensions structure (questionnaire_2_5)
            for dimension in data["dimensions"]:
                dimension_name = dimension.get("name")
                if "questions" in dimension:
                    for q in dimension["questions"]:
                        # Use provided options or default Likert scale
                        options = q.get("options") if q.get("options") else default_options

                        question = AssessmentQuestion(
                            questionnaire_id=questionnaire_id,
                            question_number=global_question_number,
                            text=q["text"],
                            dimension=dimension_name,
                            options=options
                        )
                        db.add(question)
                        questions_added += 1
                        global_question_number += 1

        elif "sub_sections" in data:
            # Sub-sections structure (questionnaire_2_2, questionnaire_2_3)
            for sub_section in data["sub_sections"]:
                sub_section_id = sub_section.get("id")

                # Handle categories within sub_sections
                if "categories" in sub_section:
                    for category in sub_section["categories"]:
                        category_name = category.get("name")
                        if "questions" in category:
                            for q in category["questions"]:
                                # Use provided options or default Likert scale
                                options = q.get("options") if q.get("options") else default_options

                                question = AssessmentQuestion(
                                    questionnaire_id=questionnaire_id,
                                    question_number=global_question_number,
                                    text=q["text"],
                                    category=category_name,
                                    sub_section=sub_section_id,
                                    options=options
                                )
                                db.add(question)
                                questions_added += 1
                                global_question_number += 1

                # Handle direct questions in sub_section
                elif "questions" in sub_section:
                    for q in sub_section["questions"]:
                        # Use provided options or default Likert scale
                        options = q.get("options") if q.get("options") else default_options

                        question = AssessmentQuestion(
                            questionnaire_id=questionnaire_id,
                            question_number=global_question_number,
                            text=q["text"],
                            sub_section=sub_section_id,
                            options=options
                        )
                        db.add(question)
                        questions_added += 1
                        global_question_number += 1

                # Handle options with questions
                elif "options" in sub_section:
                    for option in sub_section["options"]:
                        if "questions" in option:
                            for q in option["questions"]:
                                # Use provided options or default Likert scale
                                question_options = q.get("options") if q.get("options") else default_options

                                question = AssessmentQuestion(
                                    questionnaire_id=questionnaire_id,
                                    question_number=global_question_number,
                                    text=q["text"],
                                    sub_section=sub_section_id,
                                    category=q.get("type"),  # For automatic thought patterns
                                    options=question_options
                                )
                                db.add(question)
                                questions_added += 1
                                global_question_number += 1

        db.commit()
        logger.info(f"✓ Loaded {questionnaire_id}: {questions_added} questions")
        return questionnaire

    except Exception as e:
        logger.error(f"✗ Error loading {json_file}: {e}")
        db.rollback()
        raise


def main():
    """Load all questionnaires from JSON files"""
    logger.info("Starting questionnaire data loading...")

    # Initialize database
    init_db()

    # Get questionnaires directory
    questionnaires_dir = Path(__file__).parent.parent / "resources" / "questionnaire_jsons"

    if not questionnaires_dir.exists():
        logger.error(f"Questionnaires directory not found: {questionnaires_dir}")
        return

    # Load each questionnaire
    db = SessionLocal()
    try:
        json_files = sorted(questionnaires_dir.glob("questionnaire_*.json"))
        logger.info(f"Found {len(json_files)} questionnaire files")

        for json_file in json_files:
            load_questionnaire_from_json(json_file, db)

        logger.info("✓ All questionnaires loaded successfully!")

    except Exception as e:
        logger.error(f"✗ Error during loading: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
