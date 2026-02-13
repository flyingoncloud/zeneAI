"""
Migration: Add admin panel fields to assessment_questions table

This migration adds all the admin panel fields to support rich question templates (F1-F8).

New fields:
- template: F1-F8 template type
- status: draft/published
- internal_title: For admin reference
- subtitle: Optional subtitle/instruction
- media_url: Image/video URL
- media_type: 'image' or 'video'
- template_settings: Template-specific configuration (JSON)
- validation: Validation rules (JSON)
- tags: Array of tag strings (JSON)
- display_order: For custom ordering
- source_type: 'legacy' or 'admin'
- created_at: Timestamp
- updated_at: Timestamp
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from sqlalchemy import text
from src.database.database import engine


def column_exists(conn, table_name, column_name):
    """Check if a column exists in a table"""
    result = conn.execute(text(f"""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='{table_name}'
        AND column_name='{column_name}'
    """))
    return result.fetchone() is not None


def run_migration():
    """Add admin panel fields to assessment_questions table"""

    print("Starting migration: add_admin_panel_fields")
    print("=" * 60)

    with engine.connect() as conn:
        # Define all columns to add
        columns_to_add = [
            ("template", "VARCHAR(10)"),
            ("status", "VARCHAR(20) DEFAULT 'published'"),
            ("internal_title", "VARCHAR(255)"),
            ("subtitle", "VARCHAR(500)"),
            ("media_url", "VARCHAR(500)"),
            ("media_type", "VARCHAR(20)"),
            ("template_settings", "JSON"),
            ("validation", "JSON"),
            ("tags", "JSON"),
            ("display_order", "INTEGER DEFAULT 0"),
            ("source_type", "VARCHAR(20) DEFAULT 'legacy'"),
            ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ]

        added_count = 0
        skipped_count = 0

        for column_name, column_type in columns_to_add:
            if column_exists(conn, 'assessment_questions', column_name):
                print(f"  ✓ Column '{column_name}' already exists - skipping")
                skipped_count += 1
            else:
                print(f"  + Adding column '{column_name}' ({column_type})...")
                conn.execute(text(f"""
                    ALTER TABLE assessment_questions
                    ADD COLUMN {column_name} {column_type}
                """))
                added_count += 1

        conn.commit()

        print("=" * 60)
        print(f"✓ Migration completed successfully!")
        print(f"  - Added: {added_count} columns")
        print(f"  - Skipped: {skipped_count} columns (already exist)")

        if added_count > 0:
            print("\nNext steps:")
            print("1. Restart the backend: cd ai-chat-api && python run.py")
            print("2. Admin panel should now work correctly")
            print("3. Existing questions will have NULL values for new fields")


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
