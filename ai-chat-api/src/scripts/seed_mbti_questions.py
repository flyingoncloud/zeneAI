"""
Seed MBTI questions from OpenJung API into assessment_questions table.

Run once from ai-chat-api root:
  python -m src.scripts.seed_mbti_questions
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.services.openjung_api import fetch_mbti_questions_sync
from src.database.database import SessionLocal
from src.database.questionnaire_models import AssessmentQuestion

QUESTIONNAIRE_ID = 'admin_created'
MBTI_CATEGORY = '性格类型'
MBTI_QUESTION_NUMBER_OFFSET = 200


def seed_mbti_questions():
    db = SessionLocal()
    try:
        existing = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.template == 'F9',
            AssessmentQuestion.questionnaire_id == QUESTIONNAIRE_ID
        ).count()

        if existing > 0:
            print(f"⚠️  Already have {existing} MBTI (F9) questions. Skipping.")
            return

        questions = fetch_mbti_questions_sync(locale='zh')
        if not questions:
            print("❌ Failed to fetch MBTI questions from OpenJung API")
            return

        print(f"✅ Fetched {len(questions)} MBTI questions")

        for mq in questions:
            db.add(AssessmentQuestion(
                questionnaire_id=QUESTIONNAIRE_ID,
                question_number=MBTI_QUESTION_NUMBER_OFFSET + mq.id,
                text=f'MBTI Q{mq.id}',
                template='F9',
                status='published',
                internal_title=f'MBTI {mq.dimension}: {mq.left_trait} vs {mq.right_trait}',
                category=MBTI_CATEGORY,
                source_type='admin',
                template_settings={
                    'mbtiQuestionId': mq.id,
                    'leftTrait': mq.left_trait,
                    'rightTrait': mq.right_trait,
                    'dimension': mq.dimension
                },
                options=[]
            ))

        db.commit()
        print(f"✅ Seeded {len(questions)} MBTI questions (question_numbers {MBTI_QUESTION_NUMBER_OFFSET + 1}–{MBTI_QUESTION_NUMBER_OFFSET + len(questions)})")
    finally:
        db.close()


if __name__ == '__main__':
    seed_mbti_questions()
