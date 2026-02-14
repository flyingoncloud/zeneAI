"""
Check user registrations in the database

This script displays all registered users with their authentication details.
"""

import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

# Parse PostgreSQL URL
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

print(f"🔌 Connecting to database: {db_config['host']}:{db_config['port']}/{db_config['database']}\n")

try:
    # Connect to database
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()

    # Get total user count
    cur.execute("SELECT COUNT(*) FROM user_profiles")
    total_users = cur.fetchone()[0]

    print(f"👥 Total Users: {total_users}\n")

    if total_users == 0:
        print("📭 No users registered yet.\n")
        conn.close()
        exit(0)

    # Get all users with authentication details
    cur.execute("""
        SELECT
            id,
            user_id,
            username,
            email,
            phone_number,
            phone_country_code,
            auth_provider,
            is_active,
            created_at,
            last_login_at
        FROM user_profiles
        ORDER BY created_at DESC
    """)

    users = cur.fetchall()

    print("=" * 100)
    print("REGISTERED USERS")
    print("=" * 100)

    for user in users:
        (id, user_id, username, email, phone_number, phone_country_code,
         auth_provider, is_active, created_at, last_login_at) = user

        print(f"\n📋 User #{id}")
        print(f"   User ID: {user_id}")
        print(f"   Username: {username}")
        print(f"   Auth Method: {auth_provider or 'N/A'}")

        if email:
            print(f"   Email: {email}")

        if phone_number:
            full_phone = f"{phone_country_code or ''}{phone_number}"
            print(f"   Phone: {full_phone}")

        print(f"   Status: {'✅ Active' if is_active else '❌ Inactive'}")
        print(f"   Registered: {created_at.strftime('%Y-%m-%d %H:%M:%S') if created_at else 'N/A'}")

        if last_login_at:
            print(f"   Last Login: {last_login_at.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print(f"   Last Login: Never")

        print("-" * 100)

    # Get statistics by auth provider
    print("\n📊 STATISTICS BY AUTH METHOD")
    print("=" * 100)

    cur.execute("""
        SELECT
            COALESCE(auth_provider, 'unknown') as provider,
            COUNT(*) as count
        FROM user_profiles
        GROUP BY auth_provider
        ORDER BY count DESC
    """)

    stats = cur.fetchall()

    for provider, count in stats:
        print(f"   {provider.upper()}: {count} users")

    # Get recent registrations
    print("\n🕐 RECENT ACTIVITY (Last 10)")
    print("=" * 100)

    cur.execute("""
        SELECT
            username,
            auth_provider,
            created_at
        FROM user_profiles
        ORDER BY created_at DESC
        LIMIT 10
    """)

    recent = cur.fetchall()

    for username, provider, created_at in recent:
        time_str = created_at.strftime('%Y-%m-%d %H:%M:%S') if created_at else 'N/A'
        print(f"   {time_str} - {username} ({provider or 'unknown'})")

    print("\n" + "=" * 100)
    print(f"✅ Found {total_users} registered user(s)")
    print("=" * 100 + "\n")

    # Close connection
    cur.close()
    conn.close()

except Exception as e:
    print(f"\n❌ Error: {e}")
    if conn:
        conn.close()
    exit(1)
