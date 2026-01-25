import os
import json
import logging
from sqlalchemy.orm import Session
from ..database.questionnaire_models import AssessmentQuestionnaire, AssessmentQuestion

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_questions(data, parent_category=None, parent_sub_section=None, parent_dimension=None):
    """
    Recursively extract questions from various JSON structures.
    Handles: questions, sub_sections, categories, dimensions
    """
    questions = []

    # Direct questions at current level
    if 'questions' in data:
        for q in data['questions']:
            questions.append({
                'id': q['id'],
                'text': q.get('text', q.get('scenario', '')),
                'category': parent_category or q.get('category'),
                'sub_section': parent_sub_section or q.get('sub_section'),
                'dimension': parent_dimension or q.get('dimension'),
                'options': q.get('options')
            })

    # Handle sub_sections
    if 'sub_sections' in data:
        for sub in data['sub_sections']:
            sub_section_id = sub.get('id') or sub.get('title')
            questions.extend(extract_questions(
                sub,
                parent_category=parent_category,
                parent_sub_section=sub_section_id,
                parent_dimension=parent_dimension
            ))

    # Handle categories
    if 'categories' in data:
        for cat in data['categories']:
            cat_name = cat.get('name')
            questions.extend(extract_questions(
                cat,
                parent_category=cat_name,
                parent_sub_section=parent_sub_section,
                parent_dimension=parent_dimension
            ))

    # Handle dimensions
    if 'dimensions' in data:
        for dim in data['dimensions']:
            dim_name = dim.get('name') or dim.get('id')
            questions.extend(extract_questions(
                dim,
                parent_category=parent_category,
                parent_sub_section=parent_sub_section,
                parent_dimension=dim_name
            ))

    return questions


def seed_questionnaires(db: Session):
    """
    Seeds the database with questionnaires from JSON files.
    This function is idempotent and will not re-seed existing data.

    Defensive checks:
    1. Checks by questionnaire ID (primary key)
    2. Checks by section number (to prevent duplicates with different IDs)
    3. Cleans up any existing duplicates before seeding
    """
    try:
        # Path to the directory containing questionnaire JSONs
        # Use __file__ to get the path relative to this module
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_dir = os.path.join(current_dir, '..', 'resources', 'questionnaire_jsons')

        if not os.path.isdir(json_dir):
            # Fallback path for when running from a different context
            json_dir_alt = 'ai-chat-api/src/resources/questionnaire_jsons'
            if os.path.isdir(json_dir_alt):
                json_dir = json_dir_alt
            else:
                logger.error(f"Questionnaire directory not found at {json_dir} or {json_dir_alt}")
                return False

        logger.info(f"Seeding questionnaires from: {json_dir}")
        json_files = [f for f in os.listdir(json_dir) if f.endswith('.json')]
        logger.info(f"Found {len(json_files)} questionnaire files.")

        if not json_files:
            logger.warning("No questionnaire JSON files found to seed.")
            return False

        # DEFENSIVE: Clean up any existing duplicates before seeding
        logger.info("Checking for duplicate questionnaires...")
        duplicates_removed = _cleanup_duplicates(db)
        if duplicates_removed > 0:
            logger.warning(f"Removed {duplicates_removed} duplicate questionnaires")

        seeded_count = 0
        for file_name in json_files:
            file_path = os.path.join(json_dir, file_name)

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            section = data['section']

            # Use prefixed section as the unique ID (e.g., "questionnaire_2.1")
            # Replace dots with underscores for consistency
            questionnaire_id = f"questionnaire_{section.replace('.', '_')}"

            # DEFENSIVE CHECK 1: Check if questionnaire with this ID already exists
            exists_by_id = db.query(AssessmentQuestionnaire).filter(
                AssessmentQuestionnaire.id == questionnaire_id
            ).first()

            # DEFENSIVE CHECK 2: Check if questionnaire with this section already exists
            # (in case there's an old one with a different ID format)
            exists_by_section = db.query(AssessmentQuestionnaire).filter(
                AssessmentQuestionnaire.section == section
            ).first()

            if exists_by_id or exists_by_section:
                if exists_by_id:
                    logger.info(f"Questionnaire {questionnaire_id} already exists (by ID), skipping.")
                else:
                    logger.info(f"Questionnaire for section {section} already exists (by section), skipping.")
                continue

            # Neither check found existing questionnaire, safe to create
            logger.info(f"Seeding questionnaire: {questionnaire_id} - {data['title']}")

            # Create Questionnaire
            new_questionnaire = AssessmentQuestionnaire(
                id=questionnaire_id,
                section=section,
                title=data['title'],
                marking_criteria=data.get('marking_criteria', {})
            )
            db.add(new_questionnaire)

            # Extract and create Questions from various structures
            all_questions = extract_questions(data)
            question_number = 1
            for q_data in all_questions:
                new_question = AssessmentQuestion(
                    questionnaire_id=questionnaire_id,
                    question_number=question_number,
                    text=q_data['text'],
                    category=q_data.get('category'),
                    sub_section=q_data.get('sub_section'),
                    dimension=q_data.get('dimension'),
                    options=q_data.get('options')
                )
                db.add(new_question)
                question_number += 1

            logger.info(f"  -> Added {question_number - 1} questions")
            seeded_count += 1

        if seeded_count > 0:
            db.commit()
            logger.info(f"Successfully seeded {seeded_count} new questionnaires.")
            return True
        else:
            logger.info("All questionnaires were already seeded.")
            return False

    except Exception as e:
        logger.error(f"Error seeding questionnaires: {e}", exc_info=True)
        db.rollback()
        return False


def _cleanup_duplicates(db: Session) -> int:
    """
    Internal helper to clean up duplicate questionnaires.
    Keeps the first occurrence (by ID) for each section.

    Returns:
        Number of duplicates removed
    """
    try:
        # Find all questionnaires grouped by section
        questionnaires = db.query(AssessmentQuestionnaire).order_by(
            AssessmentQuestionnaire.section,
            AssessmentQuestionnaire.id
        ).all()

        # Group by section
        sections = {}
        for q in questionnaires:
            if q.section not in sections:
                sections[q.section] = []
            sections[q.section].append(q)

        # Find and remove duplicates
        duplicates_removed = 0
        for section, questionnaire_list in sections.items():
            if len(questionnaire_list) > 1:
                # Keep the first one, delete the rest
                keeper = questionnaire_list[0]

                for duplicate in questionnaire_list[1:]:
                    logger.warning(f"Removing duplicate: {duplicate.id} (section {section}), keeping {keeper.id}")

                    # Delete associated questions first (foreign key constraint)
                    db.query(AssessmentQuestion).filter(
                        AssessmentQuestion.questionnaire_id == duplicate.id
                    ).delete()

                    # Delete the questionnaire
                    db.delete(duplicate)
                    duplicates_removed += 1

        if duplicates_removed > 0:
            db.commit()

        return duplicates_removed

    except Exception as e:
        logger.error(f"Error cleaning up duplicates: {e}")
        db.rollback()
        return 0
