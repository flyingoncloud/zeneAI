#!/usr/bin/env python3
"""
Delete phone user from the database
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://chat_user:chat_pass@localhost:5432/chat_db')

def delete_phone_user():
    """Delete phone user"""

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

    phone = '0435135321'

    print(f"\n🔍 Searching for phone user: {phone}")

    # Find user by phone
    cursor.execute("""
        SELECT user_id, username, phone_number, auth_provider, created_at
        FROM user_profiles
        WHERE phone_number = %s
    """, (phone,))

    user = cursor.fetchone()

    if not user:
        print("\n✓ No user found with this phone number")
        cursor.close()
        conn.close()
        return

    user_id, username, user_phone, auth_provider, created_at = user
    print(f"\n📋 Found user:")
    print(f"   User ID: {user_id}")
    print(f"   Username: {username}")
    print(f"   Phone: {user_phone}")
    print(f"   Auth Provider: {auth_provider}")
    print(f"   Created: {created_at}")

    # Delete user
    print(f"\n🗑️  Deleting user...")
    cursor.execute("""
        DELETE FROM user_profiles
        WHERE phone_number = %s
    """, (phone,))

    deleted_count = cursor.rowcount
    conn.commit()

    print(f"\n✓ Deleted {deleted_count} user(s)")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        delete_phone_user()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
