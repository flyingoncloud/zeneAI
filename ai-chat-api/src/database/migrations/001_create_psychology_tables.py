"""
Migration: Create Psychology Assessment Tables

This migration creates all the new tables needed for comprehensive
psychology data tracking.

Run with: python -m src.database.migrations.001_create_psychology_tables
"""

from sqlalchemy import create_engine, text
from src.config.settings import DATABASE_URL
from src.database.psychology_models import Base
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def upgrade():
    """Create all psychology tables"""
    logger.info("Starting migration: Create psychology tables")

    engine = create_engine(DATABASE_URL)

    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✓ All psychology tables created successfully")

        # Verify tables were created
        with engine.connect() as conn:
            # Check if using PostgreSQL or SQLite
            if "postgresql" in DATABASE_URL:
                result = conn.execute(text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
                ))
            else:  # SQLite
                result = conn.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                ))

            tables = [row[0] for row in result]
            logger.info(f"✓ Available tables: {tables}")

            # Check for our new tables
            expected_tables = [
                'user_profiles',
                'psychology_assessments',
                'questionnaires',
                'questionnaire_questions',
                'questionnaire_responses',
                'ifs_parts_detections',
                'cognitive_patterns_detections',
                'attachment_styles',
                'narrative_identities',
                'personality_styles',
                'analysis_texts',
                'psychology_reports'
            ]

            missing_tables = [t for t in expected_tables if t not in tables]
            if missing_tables:
                logger.warning(f"⚠ Missing tables: {missing_tables}")
            else:
                logger.info("✓ All expected tables present")

        logger.info("Migration completed successfully!")
        return True

    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        raise


def downgrade():
    """Drop all psychology tables"""
    logger.info("Starting rollback: Drop psychology tables")

    engine = create_engine(DATABASE_URL)

    try:
        # Drop all tables in reverse order (respecting foreign keys)
        Base.metadata.drop_all(bind=engine)
        logger.info("✓ All psychology tables dropped successfully")
        return True

    except Exception as e:
        logger.error(f"✗ Rollback failed: {e}")
        raise


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        downgrade()
    else:
        upgrade()
