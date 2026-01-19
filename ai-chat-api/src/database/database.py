from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.config.settings import DATABASE_URL
from src.database.models import Base
# Import psychology models to register them with Base.metadata
from src.database import psychology_models  # noqa: F401
# Import questionnaire models to register them with Base.metadata
from src.database import questionnaire_models  # noqa: F401
import logging

logger = logging.getLogger(__name__)

# Create engine with appropriate connection arguments
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """
    Initialize database tables.
    Creates all tables defined in models if they don't exist.
    """
    try:
        logger.info("Initializing database...")
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database tables created/verified successfully")

        # Verify tables were created
        with engine.connect() as conn:
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

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
