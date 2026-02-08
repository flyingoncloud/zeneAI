#!/usr/bin/env python3
"""
Add file_hash column to media_files table
This migration adds duplicate detection support
"""

from src.database.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def add_file_hash_column():
    """Add file_hash column to media_files table"""
    try:
        with engine.connect() as conn:
            # Add the column
            logger.info("Adding 'file_hash' column to media_files table...")

            conn.execute(text("""
                ALTER TABLE media_files
                ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_media_files_file_hash
                ON media_files(file_hash)
            """))

            conn.commit()
            logger.info("✓ Column 'file_hash' added successfully")
            logger.info("✓ Index created on file_hash column")

            # Calculate hashes for existing files
            logger.info("\nCalculating hashes for existing files...")
            result = conn.execute(text("""
                SELECT id, filename FROM media_files WHERE file_hash IS NULL
            """))

            files_to_hash = list(result)
            if len(files_to_hash) == 0:
                logger.info("✓ No existing files need hashing")
            else:
                import hashlib
                from pathlib import Path

                for file_id, filename in files_to_hash:
                    file_path = Path("uploads") / filename
                    if file_path.exists():
                        with open(file_path, "rb") as f:
                            file_hash = hashlib.sha256(f.read()).hexdigest()

                        conn.execute(text("""
                            UPDATE media_files
                            SET file_hash = :hash
                            WHERE id = :id
                        """), {"hash": file_hash, "id": file_id})
                        logger.info(f"  ✓ Hashed file {file_id}: {filename}")
                    else:
                        logger.warning(f"  ⚠ File not found: {filename}")

                conn.commit()
                logger.info(f"✓ Hashed {len(files_to_hash)} existing files")

            logger.info("\n✓ Migration complete!")

    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        raise

if __name__ == "__main__":
    add_file_hash_column()
