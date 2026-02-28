#!/usr/bin/env python3
"""
Check user conversations in the database
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/chat_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_conversations(user_id=None):
    """Check conversations in database"""
    db = SessionLocal()
    try:
        if user_id:
            print(f"\n=== Conversations for user_id: {user_id} ===")
            result = db.execute(text("""
                SELECT id, session_id, user_id, created_at, updated_at,
                       (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
                FROM conversations
                WHERE user_id = :user_id
                ORDER BY updated_at DESC
                LIMIT 10
            """), {"user_id": user_id})
        else:
            print("\n=== All Conversations (last 20) ===")
            result = db.execute(text("""
                SELECT id, session_id, user_id, created_at, updated_at,
                       (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
                FROM conversations
                ORDER BY updated_at DESC
                LIMIT 20
            """))

        rows = result.fetchall()
        if not rows:
            print("No conversations found")
            return

        print(f"\nFound {len(rows)} conversations:")
        print("-" * 120)
        print(f"{'ID':<6} {'Session ID':<25} {'User ID':<30} {'Messages':<10} {'Updated At':<20}")
        print("-" * 120)

        for row in rows:
            print(f"{row[0]:<6} {row[1]:<25} {str(row[2] or 'NULL'):<30} {row[5]:<10} {str(row[4]):<20}")

        # Show unique user_ids
        print("\n=== Unique User IDs ===")
        result = db.execute(text("""
            SELECT DISTINCT user_id, COUNT(*) as conv_count
            FROM conversations
            WHERE user_id IS NOT NULL
            GROUP BY user_id
            ORDER BY conv_count DESC
        """))

        user_rows = result.fetchall()
        if user_rows:
            print(f"\nFound {len(user_rows)} unique users:")
            for row in user_rows:
                print(f"  {row[0]}: {row[1]} conversations")
        else:
            print("No users with conversations found")

    finally:
        db.close()

if __name__ == "__main__":
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    check_conversations(user_id)
