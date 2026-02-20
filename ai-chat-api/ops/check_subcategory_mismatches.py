"""Check for questions where answer options have different sub_category than question category"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database.database import SessionLocal
from src.database.questionnaire_models import AssessmentQuestion

db = SessionLocal()

# Get all published questions
questions = db.query(AssessmentQuestion).filter(
    AssessmentQuestion.status == 'published'
).order_by(AssessmentQuestion.question_number).all()

print(f"Total published questions: {len(questions)}\n")

mismatches = []
questions_with_subcategory = []

for q in questions:
    if not q.options or not isinstance(q.options, list):
        continue

    question_category = q.category
    has_subcategory = False

    for opt in q.options:
        if not isinstance(opt, dict):
            continue

        if 'sub_category' in opt and opt['sub_category']:
            has_subcategory = True
            sub_cat = opt['sub_category']

            # Check if sub_category is different from question category
            if sub_cat != question_category:
                mismatches.append({
                    'question_number': q.question_number,
                    'question_id': q.id,
                    'question_category': question_category,
                    'sub_category': sub_cat,
                    'option_text': opt.get('text', '')[:50]
                })

    if has_subcategory:
        questions_with_subcategory.append(q.question_number)

print(f"Questions with sub_category in options: {len(questions_with_subcategory)}")
print(f"Questions: {questions_with_subcategory}\n")

if mismatches:
    print(f"⚠️ Found {len(mismatches)} answer options with sub_category different from question category:\n")

    # Group by question
    by_question = {}
    for m in mismatches:
        qnum = m['question_number']
        if qnum not in by_question:
            by_question[qnum] = []
        by_question[qnum].append(m)

    for qnum in sorted(by_question.keys()):
        items = by_question[qnum]
        print(f"Question {qnum} (ID {items[0]['question_id']}):")
        print(f"  Question category: {items[0]['question_category']}")
        print(f"  Answer options with different sub_category:")
        for item in items:
            print(f"    - sub_category='{item['sub_category']}': {item['option_text']}...")
        print()
else:
    print("✅ No mismatches found - all sub_categories match their question's category")

db.close()
