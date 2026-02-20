"""Check for duplicate question numbers in relationship_sensitivity"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database.database import SessionLocal
from src.database.questionnaire_models import AssessmentQuestion

db = SessionLocal()

# Check for duplicate question numbers in relationship_sensitivity categories
questions = db.query(AssessmentQuestion).filter(
    AssessmentQuestion.category.like('2.3%'),
    AssessmentQuestion.status == 'published'
).order_by(AssessmentQuestion.question_number).all()

print(f"Total relationship_sensitivity questions: {len(questions)}")

question_numbers = {}
for q in questions:
    qnum = q.question_number
    if qnum not in question_numbers:
        question_numbers[qnum] = []
    question_numbers[qnum].append((q.id, q.category, q.text[:30]))

# Find duplicates
duplicates = {k: v for k, v in question_numbers.items() if len(v) > 1}
if duplicates:
    print(f"\n⚠️ Found {len(duplicates)} duplicate question numbers:")
    for qnum, ids in sorted(duplicates.items()):
        print(f"  Q{qnum}:")
        for id, cat, text in ids:
            print(f"    ID {id}, cat {cat}: {text}...")
else:
    print("\n✅ No duplicate question numbers found")

# Calculate total possible for relationship_sensitivity
total_possible = 0
for q in questions:
    if q.options and isinstance(q.options, list):
        option_scores = [opt.get('score', 0) for opt in q.options if isinstance(opt, dict)]
        total_possible += sum(option_scores)

print(f"\nTotal possible score for all 2.3% questions: {total_possible}")

db.close()
