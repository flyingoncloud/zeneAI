#!/usr/bin/env python3
"""
Test script to verify chat conversations are created with user_id
"""
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="chat_db",
    user="chat_user",
    password="chat_pass"
)

cursor = conn.cursor(cursor_factory=RealDictCursor)

# Get all conversations with their user_id
print("\n=== All Conversations ===")
cursor.execute("""
    SELECT
        id,
        session_id,
        user_id,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
    FROM conversations
    ORDER BY updated_at DESC
    LIMIT 20
""")

conversations = cursor.fetchall()
print(f"Found {len(conversations)} conversations\n")

for conv in conversations:
    print(f"ID: {conv['id']}")
    print(f"Session ID: {conv['session_id']}")
    print(f"User ID: {conv['user_id']}")
    print(f"Messages: {conv['message_count']}")
    print(f"Created: {conv['created_at']}")
    print(f"Updated: {conv['updated_at']}")
    print("-" * 60)

# Get conversations for specific user
test_user_id = "email_ad6268c680f1ab5224724afb2dd6469f"
print(f"\n=== Conversations for {test_user_id} ===")
cursor.execute("""
    SELECT
        id,
        session_id,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
    FROM conversations
    WHERE user_id = %s
    ORDER BY updated_at DESC
""", (test_user_id,))

user_conversations = cursor.fetchall()
print(f"Found {len(user_conversations)} conversations for this user\n")

for conv in user_conversations:
    print(f"ID: {conv['id']}")
    print(f"Session ID: {conv['session_id']}")
    print(f"Messages: {conv['message_count']}")
    print(f"Created: {conv['created_at']}")
    print(f"Updated: {conv['updated_at']}")

    # Get first message
    cursor.execute("""
        SELECT content, role
        FROM messages
        WHERE conversation_id = %s
        ORDER BY created_at ASC
        LIMIT 1
    """, (conv['id'],))
    first_msg = cursor.fetchone()
    if first_msg:
        print(f"First message: {first_msg['content'][:50]}...")
    print("-" * 60)

cursor.close()
conn.close()
