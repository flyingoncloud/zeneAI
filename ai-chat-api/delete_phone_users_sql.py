#!/usr/bin/env python3
"""
Delete all users registered by phone using direct SQL
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/chat_db')
engine = create_engine(DATABASE_URL)

def delete_phone_users():
    """Delete all users registered by phone using direct SQL"""
    with engine.connect() as conn:
        try:
            # First, check how many phone users exist
            result = conn.execute(text(
                "SELECT COUNT(*) FROM user_profiles WHERE auth_provider = 'phone'"
            ))
            count = result.scalar()

            if count == 0:
                print("No phone users found.")
                return

            # Show phone users
            result = conn.execute(text(
                "SELECT user_id, username, phone_country_code, phone_number FROM user_profiles WHERE auth_provider = 'phone'"
            ))
            phone_users = result.fetchall()

            print(f"Found {count} phone users:")
            for user in phone_users:
                print(f"  - {user.username} (ID: {user.user_id}, Phone: {user.phone_country_code}{user.phone_number})")

            # Confirm deletion
            confirm = input(f"\nAre you sure you want to delete {count} phone users? (yes/no): ")
            if confirm.lower() != 'yes':
                print("Deletion cancelled.")
                return

            # Delete users using direct SQL
            result = conn.execute(text(
                "DELETE FROM user_profiles WHERE auth_provider = 'phone'"
            ))
            conn.commit()

            deleted_count = result.rowcount
            print(f"\n✅ Successfully deleted {deleted_count} phone users.")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error deleting phone users: {e}")

if __name__ == '__main__':
    delete_phone_users()
