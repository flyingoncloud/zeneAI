#!/usr/bin/env python3
"""
Delete all users registered by phone
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models.database import UserProfile
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/chat_db')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def delete_phone_users():
    """Delete all users registered by phone"""
    db = SessionLocal()
    try:
        # Find all phone users
        phone_users = db.query(UserProfile).filter(
            UserProfile.auth_provider == 'phone'
        ).all()

        if not phone_users:
            print("No phone users found.")
            return

        print(f"Found {len(phone_users)} phone users:")
        for user in phone_users:
            print(f"  - {user.username} (ID: {user.user_id}, Phone: {user.phone_country_code}{user.phone_number})")

        # Confirm deletion
        confirm = input(f"\nAre you sure you want to delete {len(phone_users)} phone users? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Deletion cancelled.")
            return

        # Delete users
        deleted_count = 0
        for user in phone_users:
            db.delete(user)
            deleted_count += 1

        db.commit()
        print(f"\n✅ Successfully deleted {deleted_count} phone users.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting phone users: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    delete_phone_users()
