#!/usr/bin/env python
"""
Initialize database tables for the chat application.
Run this script to create all necessary tables.
"""

import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

try:
    from src.database.database import init_db

    logger.info("Starting database initialization...")
    init_db()
    logger.info("✅ Database initialization completed successfully!")

except Exception as e:
    logger.error(f"❌ Failed to initialize database: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
