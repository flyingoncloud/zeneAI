"""
Assign categories to questions for scoring
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from src.config import settings

def assign_categories():
    """Assign categories to questions based on question number"""
    engine = create_engine(settings.DATABASE_URL)
    
    # Map question numbers to categories
    # For 6 questions, distribute across 5 categories
    category_mapping = {
        1: '情绪识别能力',  # Emotion Recognition
        2: '情绪调节能力',  # Emotion Regulation
        3: '认知重构能力',  # Cognitive Restructuring
        4: '内在对话能力',  # Internal Dialogue
        5: '关系互动能力',  # Relational Interaction
        6: '情绪识别能力',  # Emotion Recognition (repeat for 6th question)
    }
    
    with engine.connect() as conn:
        for question_num, category in category_mapping.items():
            result = conn.execute(
                text("""
                    UPDATE assessment_questions 
                    SET category = :category 
                    WHERE questionnaire_id = 'admin_created' 
                    AND question_number = :question_num
                """),
                {"category": category, "question_num": question_num}
            )
            print(f"✅ Question {question_num} → {category}")
        
        conn.commit()
        print("\n🎉 Categories assigned successfully!")
        print("\nVerifying...")
        
        result = conn.execute(
            text("""
                SELECT question_number, category 
                FROM assessment_questions 
                WHERE questionnaire_id = 'admin_created' 
                ORDER BY question_number
            """)
        )
        
        for row in result:
            print(f"  Q{row[0]}: {row[1]}")

if __name__ == "__main__":
    assign_categories()
