"""
Script to clean up duplicate questionnaires in the database.

This script:
1. Finds all questionnaires with the same section number
2. Keeps the first one (oldest by ID)
3. Deletes the duplicates
"""

import sys
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from src.database.questionnaire_models import AssessmentQuestionnaire, AssessmentQuestion
from src.config.settings import DATABASE_URL

def cleanup_duplicates():
    """Remove duplicate questionnaires, keeping only the first occurrence of each section."""

    # Create database connection
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        print("🔍 Searching for duplicate questionnaires...")

        # Find all questionnaires grouped by section
        questionnaires = db.query(AssessmentQuestionnaire).order_by(AssessmentQuestionnaire.section, AssessmentQuestionnaire.id).all()

        # Group by section
        sections = {}
        for q in questionnaires:
            if q.section not in sections:
                sections[q.section] = []
            sections[q.section].append(q)

        # Find duplicates
        duplicates_found = 0
        for section, questionnaire_list in sections.items():
            if len(questionnaire_list) > 1:
                print(f"\n📋 Section {section}: Found {len(questionnaire_list)} questionnaires")

                # Keep the first one, delete the rest
                keeper = questionnaire_list[0]
                print(f"  ✓ Keeping: {keeper.id} - {keeper.title}")

                for duplicate in questionnaire_list[1:]:
                    print(f"  ✗ Deleting: {duplicate.id} - {duplicate.title}")

                    # Delete associated questions first (foreign key constraint)
                    questions_deleted = db.query(AssessmentQuestion).filter(
                        AssessmentQuestion.questionnaire_id == duplicate.id
                    ).delete()
                    print(f"    → Deleted {questions_deleted} questions")

                    # Delete the questionnaire
                    db.delete(duplicate)
                    duplicates_found += 1

        if duplicates_found > 0:
            print(f"\n💾 Committing changes...")
            db.commit()
            print(f"✅ Successfully removed {duplicates_found} duplicate questionnaires")
        else:
            print("\n✅ No duplicates found!")

        # Show final count
        final_count = db.query(AssessmentQuestionnaire).count()
        print(f"\n📊 Final questionnaire count: {final_count}")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Duplicate Questionnaire Cleanup Script")
    print("=" * 60)
    cleanup_duplicates()
    print("\n" + "=" * 60)
    print("Cleanup complete!")
    print("=" * 60)
