#!/usr/bin/env python3
"""Check questions for growth potential category 2.5"""

from src.database import models
from src.database import progress_models
from src.database.database import SessionLocal
from src.database.questionnaire_models import AssessmentQuestion

db = SessionLocal()
questions = db.query(AssessmentQuestion).filter(
    AssessmentQuestion.category.like('2.5.%')
).all()

print(f'Questions for category 2.5.x: {len(questions)}')
for q in questions:
    print(f'  Q{q.question_number}: {q.category} - {q.text[:60]}')

# Also check if there are any questions with category exactly '2.5'
questions_25 = db.query(AssessmentQuestion).filter(
    AssessmentQuestion.category == '2.5'
).all()
print(f'\nQuestions for category 2.5 (exact): {len(questions_25)}')
for q in questions_25:
    print(f'  Q{q.question_number}: {q.category} - {q.text[:60]}')

db.close()
