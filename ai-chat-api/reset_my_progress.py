"""
Reset questionnaire progress for specific user
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from src.config import settings

def reset_progress(user_id: str):
    """Clear questionnaire progress for specific user"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Delete progress for this user
        result = conn.execute(
            text("DELETE FROM user_questionnaire_progress WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        conn.commit()
        print(f"✅ Deleted {result.rowcount} progress records for user {user_id}")
        
        print("\n🎉 Your questionnaire progress has been reset!")
        print("Refresh your browser to start fresh testing")

if __name__ == "__main__":
    # The user_id from your logs
    user_id = "3ac47b0c-2430-4271-a806-36dd7d3e0e2d"
    reset_progress(user_id)
