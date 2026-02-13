#!/usr/bin/env python3
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = "postgresql://chat_user:chat_pass@localhost:5432/chat_db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

try:
    # Query all admin questions with their categories
    query = text("""
        SELECT
            question_number,
            internal_title,
            text as stem,
            category,
            template,
            status,
            options::text as options_json
        FROM assessment_questions
        WHERE questionnaire_id = 'admin_created'
        ORDER BY question_number
    """)

    result = session.execute(query)
    questions = result.fetchall()

    print(f"\n{'='*80}")
    print(f"ADMIN QUESTIONS - CATEGORY DATA")
    print(f"{'='*80}\n")
    print(f"Total Questions: {len(questions)}\n")

    if len(questions) == 0:
        print("⚠️  No admin questions found in database!")
    else:
        for q in questions:
            print(f"Q{q.question_number}: {q.internal_title or q.stem[:50]}")
            print(f"  Template: {q.template}")
            print(f"  Status: {q.status}")
            print(f"  Category: {q.category or '(not set)'}")

            # Parse options to show sub_category if present
            if q.options_json:
                import json
                try:
                    options = json.loads(q.options_json)
                    has_subcategory = any('sub_category' in opt for opt in options)
                    if has_subcategory:
                        print(f"  Options with sub_category:")
                        for opt in options:
                            if 'sub_category' in opt:
                                print(f"    - {opt.get('label', '?')}: {opt.get('text', '')} → {opt['sub_category']}")
                except:
                    pass

            print()

    # Show category distribution
    print(f"\n{'='*80}")
    print(f"CATEGORY DISTRIBUTION")
    print(f"{'='*80}\n")

    category_query = text("""
        SELECT
            category,
            COUNT(*) as count
        FROM assessment_questions
        WHERE questionnaire_id = 'admin_created'
        GROUP BY category
        ORDER BY count DESC
    """)

    result = session.execute(category_query)
    categories = result.fetchall()

    for cat in categories:
        cat_name = cat.category or '(not set)'
        print(f"{cat_name}: {cat.count} questions")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    session.close()
