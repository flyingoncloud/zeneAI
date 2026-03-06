"""
Update question categories from section codes to dimension names

Maps section codes (2.1, 2.2, etc.) to the 5 psychological dimensions
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.database.database import SessionLocal
from src.database.questionnaire_models import AssessmentQuestion

# Mapping from section codes to dimensions
SECTION_TO_DIMENSION = {
    '2.1': '情绪调节能力',      # Emotional Regulation
    '2.2': '认知重构能力',      # Cognitive Flexibility
    '2.2.1': '认知重构能力',
    '2.2.2': '认知重构能力',
    '2.2.3': '认知重构能力',
    '2.2.4': '认知重构能力',
    '2.3': '关系互动能力',      # Relationship Sensitivity
    '2.3.1': '关系互动能力',
    '2.3.2': '关系互动能力',
    '2.4': '内在对话能力',      # MBTI Personality Type
    '2.4.1': '内在对话能力',       # J-P
    '2.4.2': '内在对话能力',       # T-F
    '2.4.3': '内在对话能力',       # E-I
    '2.4.4': '内在对话能力',       # S-N
    '2.5': '成长潜力',          # Growth Potential
    '2.5.1': '成长潜力',
    '2.5.2': '成长潜力',
    '2.5.3': '成长潜力',
}


def update_categories():
    """Update question categories to dimension names"""

    db = SessionLocal()

    try:
        # Get all admin_created questions
        questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.questionnaire_id == 'admin_created'
        ).all()

        if not questions:
            print("No questions found for admin_created questionnaire")
            return

        print(f"Found {len(questions)} questions to update")
        print("=" * 60)

        updated_count = 0

        for question in questions:
            old_category = question.category

            if old_category in SECTION_TO_DIMENSION:
                new_category = SECTION_TO_DIMENSION[old_category]
                question.category = new_category
                updated_count += 1

                print(f"Question {question.question_number}:")
                print(f"  {old_category} → {new_category}")
            else:
                print(f"Question {question.question_number}:")
                print(f"  ⚠ No mapping for category '{old_category}' - skipping")

        if updated_count > 0:
            db.commit()
            print("=" * 60)
            print(f"✓ Successfully updated {updated_count} questions")
            print("\nCategory distribution:")

            # Show distribution
            from collections import Counter
            categories = [q.category for q in questions]
            for cat, count in Counter(categories).items():
                print(f"  {cat}: {count} questions")
        else:
            print("=" * 60)
            print("No questions needed updating")

    except Exception as e:
        print(f"✗ Error updating categories: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    update_categories()
