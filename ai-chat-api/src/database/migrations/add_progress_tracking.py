"""
Database migration: Add user questionnaire progress tracking

This migration adds the user_questionnaire_progress table for tracking
questionnaire completion state and enabling resume functionality.

Run with: python -m src.database.migrations.add_progress_tracking
"""

import sys
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlalchemy import create_engine, text
from src.config.settings import DATABASE_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migration():
    """Run the migration to add progress tracking table"""
    logger.info("Starting migration: add_progress_tracking")

    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Check if table already exists
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'user_questionnaire_progress'
            );
        """))

        if result.scalar():
            logger.info("Table user_questionnaire_progress already exists, skipping creation")
        else:
            logger.info("Creating user_questionnaire_progress table...")

            conn.execute(text("""
                CREATE TABLE user_questionnaire_progress (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255),
                    conversation_id INTEGER REFERENCES conversations(id),
                    questionnaire_id VARCHAR(50) DEFAULT 'admin_created',

                    -- Progress tracking
                    current_question_index INTEGER DEFAULT 0,
                    total_questions INTEGER NOT NULL,
                    answers JSONB DEFAULT '{}',
                    category_scores JSONB DEFAULT '{}',

                    -- Status
                    status VARCHAR(20) DEFAULT 'in_progress',
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,

                    -- Report reference
                    report_id INTEGER REFERENCES psychology_reports(id),

                    -- Ensure one progress record per user per questionnaire
                    UNIQUE(user_id, questionnaire_id)
                );

                -- Create indexes for common queries
                CREATE INDEX idx_progress_user_id ON user_questionnaire_progress(user_id);
                CREATE INDEX idx_progress_status ON user_questionnaire_progress(status);
                CREATE INDEX idx_progress_conversation_id ON user_questionnaire_progress(conversation_id);
            """))

            conn.commit()
            logger.info("✅ Table user_questionnaire_progress created successfully")

        # Check if simple_report_data column exists in psychology_reports
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns
                WHERE table_name = 'psychology_reports'
                AND column_name = 'simple_report_data'
            );
        """))

        if result.scalar():
            logger.info("Column simple_report_data already exists in psychology_reports")
        else:
            logger.info("Adding simple_report_data column to psychology_reports...")

            conn.execute(text("""
                ALTER TABLE psychology_reports
                ADD COLUMN simple_report_data JSONB;
            """))

            conn.commit()
            logger.info("✅ Column simple_report_data added successfully")

    logger.info("Migration completed successfully!")


def rollback_migration():
    """Rollback the migration (drop table and column)"""
    logger.info("Rolling back migration: add_progress_tracking")

    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        logger.info("Dropping user_questionnaire_progress table...")
        conn.execute(text("DROP TABLE IF EXISTS user_questionnaire_progress CASCADE;"))

        logger.info("Removing simple_report_data column from psychology_reports...")
        conn.execute(text("""
            ALTER TABLE psychology_reports
            DROP COLUMN IF EXISTS simple_report_data;
        """))

        conn.commit()
        logger.info("✅ Rollback completed successfully")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run progress tracking migration")
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Rollback the migration"
    )

    args = parser.parse_args()

    if args.rollback:
        rollback_migration()
    else:
        run_migration()

