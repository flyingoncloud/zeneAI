#!/usr/bin/env python3
"""
Delete specific test users from the database
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://chat_user:chat_pass@localhost:5432/chat_db')

def delete_users():
    """Delete specific test users"""

    # Parse database URL
    # Format: postgresql://user:password@host:port/database
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

    # Users to delete
    email = 'guangcai.wang@gmail.com'
    phone = '+610435135321'

    print(f"\n🔍 Searching for users to delete...")
    print(f"   Email: {email}")
    print(f"   Phone: {phone}")

    # Find users by email
    cursor.execute("""
        SELECT user_id, username, email, phone_number, auth_provider, created_at
        FROM user_profiles
        WHERE email = %s OR phone_number = %s
    """, (email, phone))

    users = cursor.fetchall()

    if not users:
        print("\n✓ No users found with these credentials")
        cursor.close()
        conn.close()
        return

    print(f"\n📋 Found {len(users)} user(s):")
    for user in users:
        user_id, username, user_email, user_phone, auth_provider, created_at = user
        print(f"\n   User ID: {user_id}")
        print(f"   Username: {username}")
        print(f"   Email: {user_email}")
        print(f"   Phone: {user_phone}")
        print(f"   Auth Provider: {auth_provider}")
        print(f"   Created: {created_at}")

    # Delete users
    print(f"\n🗑️  Deleting users...")
    cursor.execute("""
        DELETE FROM user_profiles
        WHERE email = %s OR phone_number = %s
    """, (email, phone))

    deleted_count = cursor.rowcount
    conn.commit()

    print(f"\n✓ Deleted {deleted_count} user(s)")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        delete_users()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
