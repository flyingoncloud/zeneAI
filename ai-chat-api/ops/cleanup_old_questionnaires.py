#!/usr/bin/env python3
"""
Clean up old questionnaire data from JSON-seeded questionnaires.
This removes the old questionnaire system data since we're now using the admin panel.
"""

from src.database.database import SessionLocal
from src.database.questionnaire_models import (
    AssessmentQuestionnaire,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentAnswer
)

def cleanup_old_questionnaires():
    """Delete all old questionnaire data"""
    db = SessionLocal()
    try:
        print("\n" + "="*80)
        print("CLEANING UP OLD QUESTIONNAIRE DATA")
        print("="*80 + "\n")

        # Count existing records
        questionnaire_count = db.query(AssessmentQuestionnaire).count()
        question_count = db.query(AssessmentQuestion).count()
        response_count = db.query(AssessmentResponse).count()
        answer_count = db.query(AssessmentAnswer).count()

        print(f"Current records:")
        print(f"  - Questionnaires: {questionnaire_count}")
        print(f"  - Questions: {question_count}")
        print(f"  - Responses: {response_count}")
        print(f"  - Answers: {answer_count}")
        print()

        if questionnaire_count == 0 and question_count == 0:
            print("✓ No old questionnaire data found. Nothing to clean up.")
            return

        # Confirm deletion
        confirm = input("⚠️  This will DELETE ALL questionnaire data. Continue? (yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ Cleanup cancelled.")
            return

        print("\nDeleting records...")

        # Delete in correct order (due to foreign key constraints)
        # 1. Delete answers first
        if answer_count > 0:
            db.query(AssessmentAnswer).delete()
            print(f"  ✓ Deleted {answer_count} answers")

        # 2. Delete responses
        if response_count > 0:
            db.query(AssessmentResponse).delete()
            print(f"  ✓ Deleted {response_count} responses")

        # 3. Delete questions
        if question_count > 0:
            db.query(AssessmentQuestion).delete()
            print(f"  ✓ Deleted {question_count} questions")

        # 4. Delete questionnaires
        if questionnaire_count > 0:
            db.query(AssessmentQuestionnaire).delete()
            print(f"  ✓ Deleted {questionnaire_count} questionnaires")

        # Commit changes
        db.commit()

        print("\n" + "="*80)
        print("✓ CLEANUP COMPLETE")
        print("="*80)
        print("\nOld questionnaire data has been removed.")
        print("You can now create new questionnaires using the admin panel.")
        print()

    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_old_questionnaires()
