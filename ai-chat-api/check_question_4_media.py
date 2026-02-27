#!/usr/bin/env python3
"""
Check Question 4's media_url in the database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.database.database import SessionLocal
from src.database.questionnaire_models import AssessmentQuestion
from sqlalchemy import or_


def check_question_4():
    """Check all questions with question_number=4 for localhost URLs"""
    db = SessionLocal()
    try:
        # Find all questions with question_number = 4
        questions = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.question_number == 4
        ).all()

        print(f"\n{'='*80}")
        print(f"Found {len(questions)} question(s) with question_number=4")
        print(f"{'='*80}\n")

        for q in questions:
            print(f"Question ID: {q.id}")
            print(f"Questionnaire ID: {q.questionnaire_id}")
            print(f"Question Number: {q.question_number}")
            print(f"Text: {q.text[:100]}..." if len(q.text) > 100 else f"Text: {q.text}")
            print(f"Template: {q.template}")
            print(f"Media URL: {q.media_url}")
            print(f"Media Type: {q.media_type}")
            print(f"Source Type: {q.source_type}")
            print(f"Created At: {q.created_at}")
            print(f"Updated At: {q.updated_at}")

            # Check if media_url contains localhost
            if q.media_url and 'localhost' in q.media_url:
                print(f"\n⚠️  WARNING: This question contains localhost URL!")
                print(f"   Current URL: {q.media_url}")
                print(f"   Should be: /uploads/[filename]")

            print(f"\n{'-'*80}\n")

        # Also check for any questions with localhost in media_url
        print(f"\n{'='*80}")
        print("Checking ALL questions with localhost in media_url...")
        print(f"{'='*80}\n")

        localhost_questions = db.query(AssessmentQuestion).filter(
            or_(
                AssessmentQuestion.media_url.like('%localhost%'),
                AssessmentQuestion.media_url.like('%127.0.0.1%')
            )
        ).all()

        if localhost_questions:
            print(f"Found {len(localhost_questions)} question(s) with localhost URLs:\n")
            for q in localhost_questions:
                print(f"Question ID: {q.id}")
                print(f"Questionnaire ID: {q.questionnaire_id}")
                print(f"Question Number: {q.question_number}")
                print(f"Media URL: {q.media_url}")
                print(f"{'-'*80}\n")
        else:
            print("✅ No questions found with localhost URLs")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    check_question_4()
