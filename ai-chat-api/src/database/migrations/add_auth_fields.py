"""
Migration: Add authentication fields to user_profiles table

Adds:
- phone_number: Store phone number for phone authentication
- phone_country_code: Store country code (e.g., +61)
- password_hash: Store hashed password for email authentication
- auth_provider: Store authentication method (phone, email, google, wechat)
- provider_id: Store external provider user ID
- is_active: Account status flag
- last_login_at: Track last login timestamp
- extra_data: JSON field for additional flexible data (already exists, but documented here)

Run this migration after the database is initialized.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import JSON as JSONB
from datetime import datetime
import sys
import os

# Add parent directory to path to import database modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from src.database.database import engine, SessionLocal
from src.database.psychology_models import Base, UserProfile


def upgrade():
    """Add authentication fields to user_profiles table"""
    print("Starting migration: add_auth_fields")

    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
            AND column_name IN ('phone_number', 'password_hash', 'auth_provider')
        """)
        existing_columns = [row[0] for row in result]

        if existing_columns:
            print(f"⚠️  Some columns already exist: {existing_columns}")
            print("Skipping migration to avoid conflicts")
            return

        print("Adding authentication fields...")

        # Add phone authentication fields
        conn.execute("""
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
            ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10) DEFAULT '+61'
        """)
        print("✓ Added phone_number and phone_country_code")

        # Add password field
        conn.execute("""
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
        """)
        print("✓ Added password_hash")

        # Add authentication provider fields
        conn.execute("""
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50),
            ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255)
        """)
        print("✓ Added auth_provider and provider_id")

        # Add account status and tracking fields
        conn.execute("""
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP
        """)
        print("✓ Added is_active and last_login_at")

        # Add extra_data if it doesn't exist (for backward compatibility)
        conn.execute("""
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb
        """)
        print("✓ Added extra_data (if not exists)")

        # Create indexes for better query performance
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
            ON user_profiles(phone_number, phone_country_code)
        """)
        print("✓ Created index on phone_number")

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_profiles_email
            ON user_profiles(email)
        """)
        print("✓ Created index on email")

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_provider
            ON user_profiles(auth_provider, provider_id)
        """)
        print("✓ Created index on auth_provider")

        conn.commit()
        print("✅ Migration completed successfully!")


def downgrade():
    """Remove authentication fields from user_profiles table"""
    print("Starting rollback: add_auth_fields")

    with engine.connect() as conn:
        print("Removing authentication fields...")

        conn.execute("""
            ALTER TABLE user_profiles
            DROP COLUMN IF EXISTS phone_number,
            DROP COLUMN IF EXISTS phone_country_code,
            DROP COLUMN IF EXISTS password_hash,
            DROP COLUMN IF EXISTS auth_provider,
            DROP COLUMN IF EXISTS provider_id,
            DROP COLUMN IF EXISTS is_active,
            DROP COLUMN IF EXISTS last_login_at
        """)

        # Drop indexes
        conn.execute("""
            DROP INDEX IF EXISTS idx_user_profiles_phone,
            DROP INDEX IF EXISTS idx_user_profiles_email,
            DROP INDEX IF EXISTS idx_user_profiles_auth_provider
        """)

        conn.commit()
        print("✅ Rollback completed successfully!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "downgrade":
        downgrade()
    else:
        upgrade()
