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

        seeded_count = 0
        for file_name in json_files:
            file_path = os.path.join(json_dir, file_name)

            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Use section as the unique ID
            questionnaire_id = data['section']

            # Check if questionnaire already exists
            exists = db.query(AssessmentQuestionnaire).filter(AssessmentQuestionnaire.id == questionnaire_id).first()

            if not exists:
                logger.info(f"Seeding questionnaire: {questionnaire_id} - {data['title']}")

                # Create Questionnaire
                new_questionnaire = AssessmentQuestionnaire(
                    id=questionnaire_id,
                    section=data['section'],
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
            else:
                logger.info(f"Questionnaire {questionnaire_id} already exists, skipping.")

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
