#!/usr/bin/env python3
"""Test database connection and query questionnaires"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from src.database.questionnaire_models import AssessmentQuestionnaire, AssessmentQuestion
from src.config.settings import DATABASE_URL

print(f"DATABASE_URL: {DATABASE_URL}")
print(f"Current working directory: {os.getcwd()}")
print(f"Resolved database path: {os.path.abspath(DATABASE_URL.replace('sqlite:///', ''))}")

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Check tables
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\nAvailable tables: {tables}")

# Query questionnaires
db = SessionLocal()
try:
    questionnaires = db.query(AssessmentQuestionnaire).all()
    print(f"\nFound {len(questionnaires)} questionnaires:")
    for q in questionnaires:
        question_count = db.query(AssessmentQuestion).filter(
            AssessmentQuestion.questionnaire_id == q.id
        ).count()
        print(f"  - {q.id}: {q.title} ({question_count} questions)")
finally:
    db.close()
