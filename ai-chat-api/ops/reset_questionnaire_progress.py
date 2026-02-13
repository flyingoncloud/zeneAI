"""
Reset questionnaire progress for testing
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from src.config import settings

def reset_progress():
    """Clear all questionnaire progress for fresh testing"""
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # Delete all progress records
        result = conn.execute(text("DELETE FROM user_questionnaire_progress"))
        conn.commit()
        print(f"✅ Deleted {result.rowcount} progress records")

        # Delete all answers
        result = conn.execute(text("DELETE FROM user_questionnaire_answers"))
        conn.commit()
        print(f"✅ Deleted {result.rowcount} answer records")

        print("\n🎉 Questionnaire progress reset complete!")
        print("You can now start fresh testing from question 1")

if __name__ == "__main__":
    reset_progress()
