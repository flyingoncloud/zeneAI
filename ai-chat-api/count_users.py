#!/usr/bin/env python3
"""
Count total users in the database
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://chat_user:chat_pass@localhost:5432/chat_db')

def count_users():
    """Count and display all users"""

    # Parse database URL
    db_parts = DATABASE_URL.replace('postgresql://', '').split('@')
    user_pass = db_parts[0].split(':')
    host_port_db = db_parts[1].split('/')
    host_port = host_port_db[0].split(':')

    conn = psycopg2.connect(
        host=host_port[0],
        port=host_port[1] if len(host_port) > 1 else '5432',
        database=host_port_db[1],
        user=user_pass[0],
        password=user_pass[1]
    )

    cursor = conn.cursor()

    # Count total users
    cursor.execute("SELECT COUNT(*) FROM user_profiles")
    total_count = cursor.fetchone()[0]

    print(f"\n📊 Total users in database: {total_count}")

    if total_count > 0:
        # Get user details
        cursor.execute("""
            SELECT user_id, username, email, phone_number, auth_provider, created_at
            FROM user_profiles
            ORDER BY created_at DESC
        """)

        users = cursor.fetchall()

        print(f"\n📋 User list:")
        for i, user in enumerate(users, 1):
            user_id, username, email, phone, auth_provider, created_at = user
            print(f"\n{i}. User ID: {user_id}")
            print(f"   Username: {username}")
            print(f"   Email: {email}")
            print(f"   Phone: {phone}")
            print(f"   Auth Provider: {auth_provider}")
            print(f"   Created: {created_at}")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        count_users()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
