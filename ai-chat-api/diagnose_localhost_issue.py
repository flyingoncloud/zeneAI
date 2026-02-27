#!/usr/bin/env python3
"""
Comprehensive diagnostic script to investigate localhost URL issue
"""
import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def diagnose():
    """Run comprehensive diagnostics"""

    print(f"\n{'='*80}")
    print("LOCALHOST URL ISSUE DIAGNOSTIC")
    print(f"{'='*80}\n")

    # 1. Check environment configuration
    print("1. ENVIRONMENT CONFIGURATION")
    print(f"{'-'*80}")
    db_url = os.getenv('DATABASE_URL')
    api_base_url = os.getenv('API_BASE_URL')

    print(f"DATABASE_URL: {db_url}")
    print(f"API_BASE_URL: {api_base_url or '(not set)'}")
    print()

    if not db_url:
        print("ERROR: DATABASE_URL not found in environment")
        sys.exit(1)

    # 2. Connect to database
    print("2. DATABASE CONNECTION")
    print(f"{'-'*80}")
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✓ Connected to database")
            print(f"  Database: {version.split(',')[0]}")
            print()
    except Exception as e:
        print(f"✗ Failed to connect: {e}")
        sys.exit(1)

    # 3. Check total questions
    print("3. QUESTION COUNTS")
    print(f"{'-'*80}")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM assessment_questions"))
        total = result.fetchone()[0]
        print(f"Total questions: {total}")

        result = conn.execute(text("""
            SELECT COUNT(*) FROM assessment_questions
            WHERE media_url IS NOT NULL
        """))
        with_media = result.fetchone()[0]
        print(f"Questions with media: {with_media}")
        print()

    # 4. Check for localhost URLs
    print("4. LOCALHOST URL CHECK")
    print(f"{'-'*80}")
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, questionnaire_id, question_number, text, media_url
            FROM assessment_questions
            WHERE media_url LIKE '%localhost%' OR media_url LIKE '%127.0.0.1%'
            ORDER BY id
        """))

        localhost_questions = result.fetchall()

        if localhost_questions:
            print(f"⚠ FOUND {len(localhost_questions)} question(s) with localhost URLs:\n")
            for row in localhost_questions:
                id, questionnaire_id, question_number, text, media_url = row
                print(f"Question ID: {id}")
                print(f"Questionnaire: {questionnaire_id}")
                print(f"Question Number: {question_number}")
                print(f"Text: {text[:50]}...")
                print(f"Media URL: {media_url}")
                print(f"{'-'*40}\n")
        else:
            print("✓ No questions with localhost URLs found")
            print()

    # 5. Check all media URLs
    print("5. ALL MEDIA URLs (first 10)")
    print(f"{'-'*80}")
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT id, question_number, media_url
            FROM assessment_questions
            WHERE media_url IS NOT NULL
            ORDER BY id
            LIMIT 10
        """))

        media_questions = result.fetchall()

        if media_questions:
            for row in media_questions:
                id, question_number, media_url = row
                print(f"Q{id} (#{question_number}): {media_url}")
        else:
            print("No questions with media URLs")
        print()

    # 6. Check backend API response
    print("6. BACKEND API CHECK")
    print(f"{'-'*80}")
    try:
        import httpx

        # Try to get questions from API
        api_url = "http://localhost:8000/api/admin/questions"
        print(f"Testing: {api_url}")

        with httpx.Client() as client:
            response = client.get(api_url, timeout=5.0)

            if response.status_code == 200:
                data = response.json()
                if data.get('ok') and data.get('questions'):
                    questions = data['questions']
                    print(f"✓ API returned {len(questions)} questions")

                    # Check first question with media
                    for q in questions[:10]:
                        if q.get('media_url'):
                            print(f"\nSample question from API:")
                            print(f"  ID: {q.get('id')}")
                            print(f"  Media URL: {q.get('media_url')}")
                            break
                else:
                    print(f"⚠ API response format unexpected: {data}")
            else:
                print(f"⚠ API returned status {response.status_code}")
    except ImportError:
        print("⚠ httpx not installed, skipping API check")
        print("  Install with: pip install httpx")
    except Exception as e:
        print(f"⚠ Could not connect to API: {e}")
        print("  Make sure backend is running on http://localhost:8000")
    print()

    # 7. Summary
    print(f"{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")

    if localhost_questions:
        print(f"⚠ ISSUE FOUND: {len(localhost_questions)} questions have localhost URLs")
        print(f"\nRECOMMENDED ACTION:")
        print(f"  Run: python fix_localhost_urls_postgres.py")
    else:
        print("✓ Database looks good - no localhost URLs found")
        print("\nIf you're still seeing localhost URLs in the UI:")
        print("  1. Check browser cache (hard refresh: Ctrl+Shift+R)")
        print("  2. Check if frontend is using correct NEXT_PUBLIC_API_URL")
        print("  3. Rebuild frontend: npm run build")
        print("  4. Check backend API response (see section 6 above)")

    print(f"{'='*80}\n")

    engine.dispose()


if __name__ == "__main__":
    diagnose()
