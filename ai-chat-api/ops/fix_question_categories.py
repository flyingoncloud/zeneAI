"""
Fix question categories to use hierarchical codes instead of names

This script updates questions to have proper category codes like:
- "2.2.1.1" for Managers
- "2.2.1.2" for Firefighters
- "2.2.2.1" for Overgeneralization
etc.

Run with: python -m ai-chat-api.ops.fix_question_categories
"""

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.database.questionnaire_models import AssessmentQuestion
from src.config.settings import DATABASE_URL
# Import all models to avoid relationship errors
from src.database import models, progress_models, psychology_models, admin_questionnaire_models

# Category name to code mapping
CATEGORY_MAPPING = {
    # 2.2.1 - IFS Parts
    "Managers (管理者)": "2.2.1.1",
    "Managers": "2.2.1.1",
    "管理者": "2.2.1.1",

    "Firefighters (消防员)": "2.2.1.2",
    "Firefighters": "2.2.1.2",
    "消防员": "2.2.1.2",

    "Exiles (流亡者)": "2.2.1.3",
    "Exiles": "2.2.1.3",
    "流亡者": "2.2.1.3",

    "Self Energy (自性)": "2.2.1.4",
    "Self Energy": "2.2.1.4",
    "Self": "2.2.1.4",
    "自性": "2.2.1.4",

    # 2.2.2 - Cognitive Distortions
    "灾难化": "2.2.2.3",
    "Catastrophizing": "2.2.2.3",

    "非黑即白": "2.2.2.2",
    "All-or-Nothing": "2.2.2.2",
    "Black-and-White": "2.2.2.2",

    "以偏概全": "2.2.2.1",
    "过度概括": "2.2.2.1",
    "Overgeneralization": "2.2.2.1",

    "应该语句": "2.2.2.4",
    "应该/必须": "2.2.2.4",
    "Should/Must": "2.2.2.4",

    "心理过滤": "2.2.2.1",  # Mental filter is a form of overgeneralization
    "否定积极": "2.2.2.1",  # Discounting positives is overgeneralization
    "读心术": "2.2.2.1",    # Mind reading is overgeneralization
    "预言家": "2.2.2.3",    # Fortune telling is catastrophizing
    "情绪化推理": "2.2.2.5", # Emotional reasoning relates to self-blame
    "放大/缩小": "2.2.2.3",  # Magnification is catastrophizing

    # 2.3.1 - Attachment Styles
    "Secure (安全型)": "2.3.1.1",
    "安全型": "2.3.1.1",
    "Secure": "2.3.1.1",

    "Anxious (焦虑型)": "2.3.1.2",
    "焦虑型": "2.3.1.2",
    "Anxious": "2.3.1.2",

    "Avoidant (回避型)": "2.3.1.3",
    "回避型": "2.3.1.3",
    "Avoidant": "2.3.1.3",

    "Disorganized (混乱型)": "2.3.1.4",
    "混乱型": "2.3.1.4",
    "Disorganized": "2.3.1.4",

    # 2.2.3 - Perspective Shifting
    "Self–Other": "2.2.3.1",
    "Self-Other": "2.2.3.1",
    "Emotional": "2.2.3.4",
}


def fix_categories():
    """Fix question categories in database"""

    # Create database connection
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Get all questions
        questions = db.query(AssessmentQuestion).all()

        updated_count = 0
        skipped_count = 0

        for question in questions:
            # Skip if already has proper category code (starts with number)
            if question.category and question.category[0].isdigit():
                print(f"Question {question.id}: Already has proper category '{question.category}', skipping")
                skipped_count += 1
                continue

            # Try to map category name to code
            if question.category and question.category in CATEGORY_MAPPING:
                old_category = question.category
                new_category = CATEGORY_MAPPING[old_category]
                question.category = new_category
                print(f"Question {question.id}: Updated category '{old_category}' -> '{new_category}'")
                updated_count += 1

            # If no category but has sub_section, use sub_section as category
            elif not question.category and question.sub_section:
                question.category = question.sub_section
                print(f"Question {question.id}: Set category to sub_section '{question.sub_section}'")
                updated_count += 1

            else:
                print(f"Question {question.id}: No mapping found for category '{question.category}', sub_section '{question.sub_section}'")
                skipped_count += 1

        # Commit changes
        db.commit()

        print(f"\n✅ Updated {updated_count} questions")
        print(f"⏭️  Skipped {skipped_count} questions")

        # Show summary by category
        print("\n📊 Category distribution:")
        categories = {}
        for question in db.query(AssessmentQuestion).all():
            cat = question.category or "None"
            categories[cat] = categories.get(cat, 0) + 1

        for cat, count in sorted(categories.items()):
            print(f"  {cat}: {count} questions")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    print("🔧 Fixing question categories...\n")
    fix_categories()
    print("\n✅ Done!")
