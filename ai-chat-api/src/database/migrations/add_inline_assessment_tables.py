"""
Database migration: Add inline assessment tracking tables

This migration adds the inline_assessment_progress and inline_assessment_summary
tables for tracking assessment questions asked naturally during chat conversations.

Run with: python -m src.database.migrations.add_inline_assessment_tables
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
    """Run the migration to add inline assessment tables"""
    logger.info("Starting migration: add_inline_assessment_tables")

    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # --- inline_assessment_progress ---
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'inline_assessment_progress'
            );
        """))

        if result.scalar():
            logger.info("Table inline_assessment_progress already exists, skipping creation")
        else:
            logger.info("Creating inline_assessment_progress table...")

            conn.execute(text("""
                CREATE TABLE inline_assessment_progress (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
                    question_id INTEGER NOT NULL REFERENCES assessment_questions(id),
                    answer_value INTEGER NOT NULL,

                    -- Domain classification
                    domain VARCHAR(10) NOT NULL,
                    subcategory VARCHAR(20),

                    -- Context
                    asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    conversation_context JSONB DEFAULT '{}',

                    -- Constraints
                    CONSTRAINT uq_user_question_inline UNIQUE (user_id, question_id),
                    CONSTRAINT ck_answer_value_range CHECK (answer_value >= 1 AND answer_value <= 5),
                    CONSTRAINT ck_domain_valid CHECK (domain IN ('2.1', '2.2', '2.3', '2.4', '2.5'))
                );

                -- Indexes for query performance
                CREATE INDEX idx_inline_progress_user_id ON inline_assessment_progress(user_id);
                CREATE INDEX idx_inline_progress_domain ON inline_assessment_progress(domain);
                CREATE INDEX idx_user_domain ON inline_assessment_progress(user_id, domain);
                CREATE INDEX idx_user_question ON inline_assessment_progress(user_id, question_id);
            """))

            conn.commit()
            logger.info("✅ Table inline_assessment_progress created successfully")

        # --- inline_assessment_summary ---
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'inline_assessment_summary'
            );
        """))

        if result.scalar():
            logger.info("Table inline_assessment_summary already exists, skipping creation")
        else:
            logger.info("Creating inline_assessment_summary table...")

            conn.execute(text("""
                CREATE TABLE inline_assessment_summary (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,

                    -- Progress metrics
                    total_answered INTEGER DEFAULT 0,
                    total_questions INTEGER DEFAULT 83,
                    completion_percentage FLOAT DEFAULT 0.0,

                    -- Domain coverage
                    domains_covered JSONB DEFAULT '[]',
                    domain_question_counts JSONB DEFAULT '{}',

                    -- Report generation
                    can_generate_report BOOLEAN DEFAULT FALSE,
                    report_generated BOOLEAN DEFAULT FALSE,
                    report_id INTEGER REFERENCES psychology_reports(id),

                    -- Timestamps
                    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                    -- Constraints
                    CONSTRAINT uq_user_inline_summary UNIQUE (user_id)
                );

                -- Indexes for query performance
                CREATE INDEX idx_inline_summary_user_id ON inline_assessment_summary(user_id);
            """))

            conn.commit()
            logger.info("✅ Table inline_assessment_summary created successfully")

    logger.info("Migration completed successfully!")


def rollback_migration():
    """Rollback the migration (drop both tables)"""
    logger.info("Rolling back migration: add_inline_assessment_tables")

    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        logger.info("Dropping inline_assessment_progress table...")
        conn.execute(text("DROP TABLE IF EXISTS inline_assessment_progress CASCADE;"))

        logger.info("Dropping inline_assessment_summary table...")
        conn.execute(text("DROP TABLE IF EXISTS inline_assessment_summary CASCADE;"))

        conn.commit()
        logger.info("✅ Rollback completed successfully")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run inline assessment tables migration")
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
