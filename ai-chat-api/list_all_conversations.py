#!/usr/bin/env python3
"""List all conversations in database"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://chat_user:chat_pass@localhost:5432/chat_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

db = SessionLocal()
try:
    result = db.execute(text("""
        SELECT
            c.id,
            c.session_id,
            c.user_id,
            c.created_at,
            c.updated_at,
            COUNT(m.id) as message_count
        FROM conversations c
        LEFT JOIN messages m ON m.conversation_id = c.id
        GROUP BY c.id, c.session_id, c.user_id, c.created_at, c.updated_at
        ORDER BY c.updated_at DESC
        LIMIT 20
    """))

    rows = result.fetchall()
    print(f"\nTotal conversations found: {len(rows)}\n")

    if rows:
        print(f"{'ID':<6} {'Session ID':<30} {'User ID':<45} {'Msgs':<6} {'Updated':<20}")
        print("-" * 130)
        for row in rows:
            print(f"{row[0]:<6} {row[1]:<30} {str(row[2] or 'NULL'):<45} {row[5]:<6} {str(row[4]):<20}")
    else:
        print("No conversations in database")

finally:
    db.close()
