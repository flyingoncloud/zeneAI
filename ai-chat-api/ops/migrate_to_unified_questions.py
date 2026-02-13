"""
Migration script to extend assessment_questions table to support admin panel features

This adds columns to support:
- 8 template types (F1-F8)
- Rich media (images, videos)
- Draft/published workflow
- Template-specific settings
- Admin-created questions
"""
import sys
from sqlalchemy import text
from src.database.database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add new columns to assessment_questions table"""

    db = SessionLocal()

    try:
        logger.info("Starting migration to unified questions table...")

        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'assessment_questions'
            AND column_name IN ('template', 'status', 'media_url', 'internal_title')
        """))
        existing_columns = [row[0] for row in result]

        if existing_columns:
            logger.warning(f"Some columns already exist: {existing_columns}")
            logger.warning("Migration may have already been run. Proceeding with caution...")

        # Add new columns to assessment_questions
        migrations = [
            # Template type (F1-F8, or NULL for legacy questions)
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS template VARCHAR(10)
            """,

            # Status (draft/published, default published for legacy questions)
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published'
            """,

            # Internal title for admin reference
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS internal_title VARCHAR(255)
            """,

            # Subtitle/instruction
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS subtitle VARCHAR(500)
            """,

            # Media support
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS media_url VARCHAR(500)
            """,

            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS media_type VARCHAR(20)
            """,

            # Template-specific settings (JSON)
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS template_settings JSON
            """,

            # Validation rules (JSON)
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS validation JSON DEFAULT '{"required": true}'::json
            """,

            # Tags (JSON array)
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS tags JSON DEFAULT '[]'::json
            """,

            # Display order
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
            """,

            # Updated timestamp
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """,

            # Source type to distinguish between legacy and admin-created
            """
            ALTER TABLE assessment_questions
            ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'legacy'
            """,
        ]

        for i, migration_sql in enumerate(migrations, 1):
            try:
                logger.info(f"Running migration {i}/{len(migrations)}...")
                db.execute(text(migration_sql))
                db.commit()
                logger.info(f"✓ Migration {i} completed")
            except Exception as e:
                logger.error(f"✗ Migration {i} failed: {e}")
                db.rollback()
                # Continue with other migrations

        # Update existing questions to have proper defaults
        logger.info("Setting defaults for existing questions...")

        # Set internal_title from text for existing questions
        db.execute(text("""
            UPDATE assessment_questions
            SET internal_title = SUBSTRING(text, 1, 100)
            WHERE internal_title IS NULL AND text IS NOT NULL
        """))

        # Set source_type to 'legacy' for existing questions
        db.execute(text("""
            UPDATE assessment_questions
            SET source_type = 'legacy'
            WHERE source_type IS NULL
        """))

        # Set status to 'published' for existing questions
        db.execute(text("""
            UPDATE assessment_questions
            SET status = 'published'
            WHERE status IS NULL
        """))

        db.commit()
        logger.info("✓ Defaults set for existing questions")

        # Verify migration
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'assessment_questions'
            ORDER BY ordinal_position
        """))

        logger.info("\n=== Current assessment_questions schema ===")
        for row in result:
            logger.info(f"  {row[0]}: {row[1]} (nullable={row[2]}, default={row[3]})")

        # Count questions by source type
        result = db.execute(text("""
            SELECT source_type, COUNT(*)
            FROM assessment_questions
            GROUP BY source_type
        """))

        logger.info("\n=== Question counts by source ===")
        for row in result:
            logger.info(f"  {row[0]}: {row[1]} questions")

        logger.info("\n✓ Migration completed successfully!")
        logger.info("You can now use assessment_questions for both legacy and admin-created questions")

    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
