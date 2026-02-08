"""
Migration: Add category field to admin_questions table

This migration adds a category field to admin_questions to support
category-based scoring in the questionnaire progress tracking system.

Categories:
1. 情绪识别能力 (Emotion Recognition)
2. 认知重构能力 (Cognitive Restructuring)
3. 内在对话能力 (Internal Dialogue)
4. 关系互动能力 (Relational Interaction)
5. 情绪调节能力 (Emotion Regulation)
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from sqlalchemy import text
from src.database.database import engine, SessionLocal


def run_migration():
    """Add category column to admin_questions table"""

    print("Starting migration: add_question_category")

    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='admin_questions'
            AND column_name='category'
        """))

        if result.fetchone():
            print("✓ Column 'category' already exists in admin_questions table")
            return

        # Add category column
        print("Adding 'category' column to admin_questions table...")
        conn.execute(text("""
            ALTER TABLE admin_questions
            ADD COLUMN category VARCHAR(100)
        """))
        conn.commit()

        print("✓ Successfully added 'category' column to admin_questions table")
        print("\nMigration completed successfully!")
        print("\nNext steps:")
        print("1. Restart the backend: cd ai-chat-api && python run.py")
        print("2. Update Admin Panel to include category dropdown")
        print("3. Assign categories to existing questions")


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
