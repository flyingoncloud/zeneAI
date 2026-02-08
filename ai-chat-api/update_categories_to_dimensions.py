#!/usr/bin/env python3
"""
Update question categories to match report dimensions (1:1 mapping)

Old categories → New categories:
- 情绪识别能力 → 情绪调节能力
- 情绪调节能力 → 情绪调节能力 (no change)
- 认知重构能力 → 认知重构能力 (no change)
- 内在对话能力 → 内在对话能力 (no change)
- 关系互动能力 → 关系互动能力 (no change)
- (none) → 成长潜力 (new category)
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.config.settings import DATABASE_URL

def update_categories():
    """Update question categories to match report dimensions"""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Update 情绪识别能力 → 情绪调节能力
        result = session.execute(
            text("""
                UPDATE assessment_questions
                SET category = '情绪调节能力'
                WHERE category = '情绪识别能力'
                AND questionnaire_id = 'admin_created'
            """)
        )

        print(f"✓ Updated {result.rowcount} questions from 情绪识别能力 → 情绪调节能力")

        # Show current distribution
        result = session.execute(
            text("""
                SELECT category, COUNT(*) as count
                FROM assessment_questions
                WHERE questionnaire_id = 'admin_created'
                AND status = 'published'
                GROUP BY category
                ORDER BY category
            """)
        )

        print("\nCurrent category distribution:")
        for row in result:
            category = row[0] or "(no category)"
            count = row[1]
            print(f"  {category}: {count} questions")

        session.commit()
        print("\n✓ Categories updated successfully!")
        print("\nNew categories match report dimensions 1:1:")
        print("  1. 情绪调节能力 (Emotional Regulation)")
        print("  2. 认知重构能力 (Cognitive Flexibility)")
        print("  3. 关系互动能力 (Relational Sensitivity)")
        print("  4. 内在对话能力 (Internal Conflict)")
        print("  5. 成长潜力 (Growth Potential)")

    except Exception as e:
        session.rollback()
        print(f"✗ Error updating categories: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("Updating question categories to match report dimensions...")
    print("=" * 60)
    update_categories()
