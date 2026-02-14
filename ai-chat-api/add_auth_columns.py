"""
Simple script to add authentication columns to user_profiles table
Run this from the ai-chat-api directory: python add_auth_columns.py
"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

# Parse PostgreSQL URL
# Format: postgresql://user:password@host:port/database
url_parts = DATABASE_URL.replace("postgresql://", "").split("@")
user_pass = url_parts[0].split(":")
host_db = url_parts[1].split("/")
host_port = host_db[0].split(":")

db_config = {
    'user': user_pass[0],
    'password': user_pass[1],
    'host': host_port[0],
    'port': host_port[1] if len(host_port) > 1 else '5432',
    'database': host_db[1]
}

print(f"🔌 Connecting to database: {db_config['host']}:{db_config['port']}/{db_config['database']}")

try:
    # Connect to database
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()

    print("✓ Connected to database")

    # Check if columns already exist
    cur.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name IN ('phone_number', 'password_hash', 'auth_provider')
    """)
    existing_columns = [row[0] for row in cur.fetchall()]

    if existing_columns:
        print(f"⚠️  Some columns already exist: {existing_columns}")
        print("Skipping migration to avoid conflicts")
        conn.close()
        exit(0)

    print("\n📝 Adding authentication fields to user_profiles table...")

    # Add phone authentication fields
    print("  → Adding phone_number and phone_country_code...")
    cur.execute("""
        ALTER TABLE user_profiles
        ADD COLUMN phone_number VARCHAR(20),
        ADD COLUMN phone_country_code VARCHAR(10) DEFAULT '+61'
    """)

    # Add password field
    print("  → Adding password_hash...")
    cur.execute("""
        ALTER TABLE user_profiles
        ADD COLUMN password_hash VARCHAR(255)
    """)

    # Add authentication provider fields
    print("  → Adding auth_provider and provider_id...")
    cur.execute("""
        ALTER TABLE user_profiles
        ADD COLUMN auth_provider VARCHAR(50),
        ADD COLUMN provider_id VARCHAR(255)
    """)

    # Add account status and tracking fields
    print("  → Adding is_active and last_login_at...")
    cur.execute("""
        ALTER TABLE user_profiles
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
        ADD COLUMN last_login_at TIMESTAMP
    """)

    # Add extra_data if it doesn't exist
    print("  → Adding extra_data (if not exists)...")
    cur.execute("""
        ALTER TABLE user_profiles
        ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb
    """)

    # Create indexes for better query performance
    print("\n📊 Creating indexes...")
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_profiles_phone
        ON user_profiles(phone_number, phone_country_code)
    """)
    print("  → Created index on phone_number")

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_profiles_email
        ON user_profiles(email)
    """)
    print("  → Created index on email")

    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_provider
        ON user_profiles(auth_provider, provider_id)
    """)
    print("  → Created index on auth_provider")

    # Commit changes
    conn.commit()
    print("\n✅ Migration completed successfully!")
    print("\n📋 New columns added:")
    print("   - phone_number (VARCHAR 20)")
    print("   - phone_country_code (VARCHAR 10, default '+61')")
    print("   - password_hash (VARCHAR 255)")
    print("   - auth_provider (VARCHAR 50)")
    print("   - provider_id (VARCHAR 255)")
    print("   - is_active (BOOLEAN, default TRUE)")
    print("   - last_login_at (TIMESTAMP)")
    print("   - extra_data (JSONB)")

    # Close connection
    cur.close()
    conn.close()

    print("\n🎉 Database is ready for authentication!")

except Exception as e:
    print(f"\n❌ Error: {e}")
    if conn:
        conn.rollback()
        conn.close()
    exit(1)
