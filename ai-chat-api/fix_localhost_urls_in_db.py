#!/usr/bin/env python3
"""
Fix localhost URLs in assessment_questions table
Converts http://localhost:8000/uploads/... to /uploads/...
"""
import sqlite3
import os
import re

# Database path
db_path = os.path.join(os.path.dirname(__file__), 'chat.db')

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
    exit(1)

# Connect to database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print(f"\n{'='*80}")
print(f"Fixing localhost URLs in database: {db_path}")
print(f"{'='*80}\n")

# Find all questions with localhost URLs in media_url
cursor.execute("""
    SELECT id, questionnaire_id, question_number, media_url
    FROM assessment_questions
    WHERE media_url LIKE '%localhost%' OR media_url LIKE '%127.0.0.1%'
""")

questions_to_fix = cursor.fetchall()

if not questions_to_fix:
    print("✅ No questions found with localhost URLs")
    conn.close()
    exit(0)

print(f"Found {len(questions_to_fix)} question(s) with localhost URLs:\n")

# Show what will be changed
for q in questions_to_fix:
    id, questionnaire_id, question_number, media_url = q

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

# Ask for confirmation
print(f"{'='*80}")
response = input(f"Update {len(questions_to_fix)} question(s)? (yes/no): ")
print(f"{'='*80}\n")

if response.lower() not in ['yes', 'y']:
    print("Cancelled. No changes made.")
    conn.close()
    exit(0)

# Perform the updates
updated_count = 0
for q in questions_to_fix:
    id, questionnaire_id, question_number, media_url = q

    # Extract the relative path
    new_url = re.sub(r'https?://localhost:8000', '', media_url)
    new_url = re.sub(r'https?://127\.0\.0\.1:8000', '', new_url)

    try:
        cursor.execute("""
            UPDATE assessment_questions
            SET media_url = ?
            WHERE id = ?
        """, (new_url, id))

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

cursor.execute("""
    SELECT id, questionnaire_id, question_number, media_url
    FROM assessment_questions
    WHERE media_url LIKE '%localhost%' OR media_url LIKE '%127.0.0.1%'
""")

remaining = cursor.fetchall()

if remaining:
    print(f"⚠ WARNING: {len(remaining)} question(s) still have localhost URLs:")
    for q in remaining:
        print(f"  Question {q[0]}: {q[3]}")
else:
    print("✅ All localhost URLs have been fixed!")

print(f"\n{'='*80}")
print("Summary:")
print(f"{'='*80}")
print(f"Questions updated: {updated_count}")
print(f"Remaining issues: {len(remaining)}")
print(f"\nDatabase changes have been committed.")
print(f"{'='*80}\n")

conn.close()
