import os
import json
import logging
from sqlalchemy.orm import Session
from ..database.questionnaire_models import AssessmentQuestionnaire, AssessmentQuestion

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_questionnaires(db: Session):
    """
    Seeds the database with questionnaires from JSON files.
    This function is idempotent and will not re-seed existing data.
    """
    try:
        # Path to the directory containing questionnaire JSONs
        # The path is relative to the `run.py` script at the root of `ai-chat-api`
        json_dir = os.path.join(os.path.dirname(__name__), 'src/resources/questionnaire_jsons')
        
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

                # Create Questions
                for q_data in data['questions']:
                    new_question = AssessmentQuestion(
                        questionnaire_id=questionnaire_id,
                        question_number=q_data['id'],
                        text=q_data['text'],
                        category=q_data.get('category'),
                        sub_section=q_data.get('sub_section'),
                        dimension=q_data.get('dimension'),
                        options=q_data.get('options')
                    )
                    db.add(new_question)
                
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
