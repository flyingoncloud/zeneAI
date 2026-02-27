#!/usr/bin/env python3
"""
Fix localhost URLs in assessment_questions table (PostgreSQL version)
Converts http://localhost:8000/uploads/... to /uploads/...
Uses raw SQL to avoid SQLAlchemy model loading issues
"""
import sys
import os
import re
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def fix_localhost_urls():
    """Fix localhost URLs in assessment_questions"""

    # Get database URL from environment
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not found in environment")
        print("Please set DATABASE_URL in .env file")
        sys.exit(1)

    # Create engine
    engine = create_engine(db_url)

    try:
        print(f"\n{'='*80}")
        print(f"Fixing localhost URLs in PostgreSQL database")
        print(f"{'='*80}\n")

        with engine.connect() as conn:
            # Find all questions with localhost URLs in media_url
            result = conn.execute(text("""
                SELECT id, questionnaire_id, question_number, media_url
                FROM assessment_questions
                WHERE media_url LIKE '%localhost%' OR media_url LIKE '%127.0.0.1%'
            """))

            questions_to_fix = result.fetchall()

            if not questions_to_fix:
                print("✅ No questions found with localhost URLs")
                return

            print(f"Found {len(questions_to_fix)} question(s) with localhost URLs:\n")

            # Show what will be changed
            updates = []
            for row in questions_to_fix:
                id, questionnaire_id, question_number, media_url = row

                # Extract the relative path
                # Pattern: http://localhost:8000/uploads/... -> /uploads/...
                new_url = re.sub(r'https?://localhost:8000', '', media_url)
                new_url = re.sub(r'https?://127\.0\.0\.1:8000', '', new_url)

                print(f"Question ID: {id}")
                print(f"Questionnaire: {questionnaire_id}")
                print(f"Question Number: {question_number}")
                print(f"Old URL: {media_url}")
                print(f"New URL: {new_url}")
                print(f"{'-'*80}\n")

                updates.append((new_url, id))

            # Ask for confirmation
            print(f"{'='*80}")
            response = input(f"Update {len(questions_to_fix)} question(s)? (yes/no): ")
            print(f"{'='*80}\n")

            if response.lower() not in ['yes', 'y']:
                print("Cancelled. No changes made.")
                return

            # Perform the updates
            updated_count = 0
            for new_url, id in updates:
                try:
                    conn.execute(
                        text("UPDATE assessment_questions SET media_url = :new_url WHERE id = :id"),
                        {"new_url": new_url, "id": id}
                    )
                    print(f"✓ Updated question {id}: {new_url}")
                    updated_count += 1
                except Exception as e:
                    print(f"✗ Failed to update question {id}: {e}")

            # Commit changes
            conn.commit()

            print(f"\n{'='*80}")
            print(f"✓ Successfully updated {updated_count} question(s)")
            print(f"{'='*80}\n")

            # Verify the changes
            print("Verifying changes...\n")

            result = conn.execute(text("""
                SELECT id, media_url
                FROM assessment_questions
                WHERE media_url LIKE '%localhost%' OR media_url LIKE '%127.0.0.1%'
            """))

            remaining = result.fetchall()

            if remaining:
                print(f"⚠ WARNING: {len(remaining)} question(s) still have localhost URLs:")
                for row in remaining:
                    print(f"  Question {row[0]}: {row[1]}")
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
    finally:
        engine.dispose()


if __name__ == "__main__":
    fix_localhost_urls()
