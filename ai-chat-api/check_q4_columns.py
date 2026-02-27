#!/usr/bin/env python3
"""
Check the actual columns in assessment_questions table
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
print(f"Checking table structure in: {db_path}")
print(f"{'='*80}\n")

# Get table info
cursor.execute("PRAGMA table_info(assessment_questions)")
columns = cursor.fetchall()

print("Columns in assessment_questions table:\n")
for col in columns:
    cid, name, type, notnull, default, pk = col
    print(f"  {name} ({type})")

print(f"\n{'='*80}")
print("Querying Question 4 with available columns...")
print(f"{'='*80}\n")

# Query all questions with question_number = 4
cursor.execute("""
    SELECT *
    FROM assessment_questions
    WHERE question_number = 4
""")

questions = cursor.fetchall()

if not questions:
    print("No questions found with question_number = 4")
else:
    print(f"Found {len(questions)} question(s) with question_number = 4:\n")

    # Get column names
    column_names = [description[0] for description in cursor.description]

    for q in questions:
        for i, col_name in enumerate(column_names):
            value = q[i]
            if col_name == 'text' and value and len(str(value)) > 100:
                print(f"{col_name}: {str(value)[:100]}...")
            else:
                print(f"{col_name}: {value}")

        # Check if any column contains localhost
        for i, col_name in enumerate(column_names):
            value = q[i]
            if value and isinstance(value, str) and 'localhost' in value:
                print(f"\n⚠️  WARNING: Column '{col_name}' contains localhost URL!")
                print(f"   Value: {value}")

        print(f"\n{'-'*80}\n")

# Check for any questions with localhost in any text field
print(f"\n{'='*80}")
print("Checking ALL questions with localhost in any field...")
print(f"{'='*80}\n")

cursor.execute("SELECT * FROM assessment_questions")
all_questions = cursor.fetchall()
column_names = [description[0] for description in cursor.description]

localhost_found = []
for q in all_questions:
    for i, value in enumerate(q):
        if value and isinstance(value, str) and 'localhost' in value:
            localhost_found.append({
                'id': q[0],
                'question_number': q[column_names.index('question_number')] if 'question_number' in column_names else 'N/A',
                'column': column_names[i],
                'value': value
            })

if localhost_found:
    print(f"Found {len(localhost_found)} field(s) with localhost URLs:\n")
    for item in localhost_found:
        print(f"Question ID: {item['id']}")
        print(f"Question Number: {item['question_number']}")
        print(f"Column: {item['column']}")
        print(f"Value: {item['value']}")
        print(f"{'-'*80}\n")
else:
    print("✅ No fields found with localhost URLs")

conn.close()
