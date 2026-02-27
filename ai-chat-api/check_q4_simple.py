#!/usr/bin/env python3
"""
Simple script to check Question 4's media_url using raw SQL
"""
import sqlite3
import os

# Database path
db_path = os.path.join(os.path.dirname(__file__), 'chat.db')

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
    exit(1)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print(f"\n{'='*80}")
print(f"Checking Question 4 in database: {db_path}")
print(f"{'='*80}\n")

# Query all questions with question_number = 4
cursor.execute("""
    SELECT
        id,
        questionnaire_id,
        question_number,
        text,
        template,
        media_url,
        media_type,
        source_type,
        created_at,
        updated_at
    FROM assessment_questions
    WHERE question_number = 4
""")

questions = cursor.fetchall()

if not questions:
    print("No questions found with question_number = 4")
else:
    print(f"Found {len(questions)} question(s) with question_number = 4:\n")

    for q in questions:
        id, questionnaire_id, question_number, text, template, media_url, media_type, source_type, created_at, updated_at = q

        print(f"Question ID: {id}")
        print(f"Questionnaire ID: {questionnaire_id}")
        print(f"Question Number: {question_number}")
        print(f"Text: {text[:100]}..." if text and len(text) > 100 else f"Text: {text}")
        print(f"Template: {template}")
        print(f"Media URL: {media_url}")
        print(f"Media Type: {media_type}")
        print(f"Source Type: {source_type}")
        print(f"Created At: {created_at}")
        print(f"Updated At: {updated_at}")

        # Check if media_url contains localhost
        if media_url and 'localhost' in media_url:
            print(f"\n⚠️  WARNING: This question contains localhost URL!")
            print(f"   Current URL: {media_url}")
            print(f"   Should be: /uploads/[filename]")

        print(f"\n{'-'*80}\n")

# Also check for any questions with localhost in media_url
print(f"\n{'='*80}")
print("Checking ALL questions with localhost in media_url...")
print(f"{'='*80}\n")

cursor.execute("""
    SELECT
        id,
        questionnaire_id,
        question_number,
        media_url
    FROM assessment_questions
    WHERE media_url LIKE '%localhost%' OR media_url LIKE '%127.0.0.1%'
""")

localhost_questions = cursor.fetchall()

if localhost_questions:
    print(f"Found {len(localhost_questions)} question(s) with localhost URLs:\n")
    for q in localhost_questions:
        id, questionnaire_id, question_number, media_url = q
        print(f"Question ID: {id}")
        print(f"Questionnaire ID: {questionnaire_id}")
        print(f"Question Number: {question_number}")
        print(f"Media URL: {media_url}")
        print(f"{'-'*80}\n")
else:
    print("✅ No questions found with localhost URLs")

conn.close()
