#!/usr/bin/env python3
"""
Fix localhost URLs in assessment_questions table (PostgreSQL version)
Converts http://localhost:8000/uploads/... to /uploads/...
"""
import sys
import os
import re
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.database.database import SessionLocal
from src.database.questionnaire_models import AssessmentQuestion

def fix_localhost_urls():
    """Fix localhost URLs in assessment_questions"""
    db = SessionLocal()

    try:
        print(f"\n{'='*80}")
        print(f"Fixing localhost URLs in PostgreSQL database")
        print(f"{'='*80}\n")

        # Find all questions with localhost URLs in media_url
        questions_to_fix = db.query(AssessmentQuestion).filter(
            (AssessmentQuestion.media_url.like('%localhost%')) |
            (AssessmentQuestion.media_url.like('%127.0.0.1%'))
        ).all()

        if not questions_to_fix:
            print("✅ No questions found with localhost URLs")
            return

        print(f"Found {len(questions_to_fix)} question(s) with localhost URLs:\n")

        # Show what will be changed
        for q in questions_to_fix:
            # Extract the relative path
            # Pattern: http://localhost:8000/uploads/... -> /uploads/...
            new_url = re.sub(r'https?://localhost:8000', '', q.media_url)
            new_url = re.sub(r'https?://127\.0\.0\.1:8000', '', new_url)

            print(f"Question ID: {q.id}")
            print(f"Questionnaire: {q.questionnaire_id}")
            print(f"Question Number: {q.question_number}")
            print(f"Old URL: {q.media_url}")
            print(f"New URL: {new_url}")
            print(f"{'-'*80}\n")

        # Ask for confirmation
        print(f"{'='*80}")
        response = input(f"Update {len(questions_to_fix)} question(s)? (yes/no): ")
        print(f"{'='*80}\n")

        if response.lower() not in ['yes', 'y']:
            print("Cancelled. No changes made.")
            return

        # Perform the updates
        updated_count = 0
        for q in questions_to_fix:
            # Extract the relative path
            new_url = re.sub(r'https?://localhost:8000', '', q.media_url)
            new_url = re.sub(r'https?://127\.0\.0\.1:8000', '', new_url)

            try:
                q.media_url = new_url
                print(f"✓ Updated question {q.id}: {new_url}")
                updated_count += 1
            except Exception as e:
                print(f"✗ Failed to update question {q.id}: {e}")

        # Commit changes
        db.commit()

        print(f"\n{'='*80}")
        print(f"✓ Successfully updated {updated_count} question(s)")
        print(f"{'='*80}\n")

        # Verify the changes
        print("Verifying changes...\n")

        remaining = db.query(AssessmentQuestion).filter(
            (AssessmentQuestion.media_url.like('%localhost%')) |
            (AssessmentQuestion.media_url.like('%127.0.0.1%'))
        ).all()

        if remaining:
            print(f"⚠ WARNING: {len(remaining)} question(s) still have localhost URLs:")
            for q in remaining:
                print(f"  Question {q.id}: {q.media_url}")
        else:
            print("✅ All localhost URLs have been fixed!")

        print(f"\n{'='*80}")
        print("Summary:")
        print(f"{'='*80}")
        print(f"Questions updated: {updated_count}")
        print(f"Remaining issues: {len(remaining)}")
        print(f"\nDatabase changes have been committed.")
        print(f"{'='*80}\n")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    fix_localhost_urls()
