#!/usr/bin/env python3
"""
Delete specific phone user: 0435135321
"""
import sys
import os
import hashlib

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/chat_db')
engine = create_engine(DATABASE_URL)

def delete_phone_user(phone: str, country_code: str = '+61'):
    """Delete specific phone user"""
    with engine.connect() as conn:
        try:
            phone_key = f"{country_code}{phone}"
            user_id = f"phone_{hashlib.md5(phone_key.encode()).hexdigest()}"

            print(f"Looking for user with phone: {phone_key}")
            print(f"User ID: {user_id}")

            # Check if user exists
            result = conn.execute(text(
                "SELECT user_id, username, phone_country_code, phone_number FROM user_profiles WHERE user_id = :user_id"
            ), {"user_id": user_id})

            user = result.fetchone()

            if not user:
                print(f"❌ User not found with phone {phone_key}")
                return

            print(f"\nFound user:")
            print(f"  - Username: {user.username}")
            print(f"  - User ID: {user.user_id}")
            print(f"  - Phone: {user.phone_country_code}{user.phone_number}")

            # Confirm deletion
            confirm = input(f"\nAre you sure you want to delete this user? (yes/no): ")
            if confirm.lower() != 'yes':
                print("Deletion cancelled.")
                return

            # Delete user
            result = conn.execute(text(
                "DELETE FROM user_profiles WHERE user_id = :user_id"
            ), {"user_id": user_id})
            conn.commit()

            if result.rowcount > 0:
                print(f"\n✅ Successfully deleted user {phone_key}")
            else:
                print(f"\n❌ Failed to delete user")

        except Exception as e:
            conn.rollback()
            print(f"❌ Error deleting user: {e}")

if __name__ == '__main__':
    delete_phone_user('0435135321')
