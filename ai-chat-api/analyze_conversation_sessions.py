#!/usr/bin/env python3
"""
Analyze conversation sessions to understand the relationship with users
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

print("\n=== Analyzing Conversations Without user_id ===\n")

# Get conversations without user_id and their messages
cursor.execute("""
    SELECT
        c.id,
        c.session_id,
        c.created_at,
        c.updated_at,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count,
        (SELECT content FROM messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) as first_message
    FROM conversations c
    WHERE c.user_id IS NULL
    ORDER BY c.updated_at DESC
    LIMIT 10
""")

conversations = cursor.fetchall()
print(f"Recent conversations without user_id: {len(conversations)}\n")

for conv in conversations:
    print(f"ID: {conv['id']}")
    print(f"Session: {conv['session_id']}")
    print(f"Messages: {conv['message_count']}")
    print(f"Created: {conv['created_at']}")
    print(f"Updated: {conv['updated_at']}")
    if conv['first_message']:
        print(f"First message: {conv['first_message'][:60]}...")
    print("-" * 80)

# Check questionnaire progress sessions
print("\n=== Questionnaire Progress Sessions ===\n")
cursor.execute("""
    SELECT
        user_id,
        session_id,
        status,
        current_question_index,
        total_questions,
        started_at,
        completed_at
    FROM user_questionnaire_progress
    WHERE user_id = 'email_ad6268c680f1ab5224724afb2dd6469f'
    ORDER BY started_at DESC
    LIMIT 5
""")

progress = cursor.fetchall()
print(f"Questionnaire progress for email_ad6268c680f1ab5224724afb2dd6469f: {len(progress)}\n")

for p in progress:
    print(f"Session: {p['session_id']}")
    print(f"Status: {p['status']}")
    print(f"Progress: {p['current_question_index']}/{p['total_questions']}")
    print(f"Started: {p['started_at']}")
    print(f"Completed: {p['completed_at']}")
    print("-" * 80)

# Check if there are any conversations with this user's session_ids
print("\n=== Checking for Session Matches ===\n")
for p in progress:
    cursor.execute("""
        SELECT id, session_id, user_id, created_at
        FROM conversations
        WHERE session_id = %s
    """, (p['session_id'],))

    conv = cursor.fetchone()
    if conv:
        print(f"✓ Found conversation for session {p['session_id']}")
        print(f"  Conversation ID: {conv['id']}")
        print(f"  Current user_id: {conv['user_id']}")
        print(f"  Created: {conv['created_at']}")
    else:
        print(f"✗ No conversation found for session {p['session_id']}")

cursor.close()
conn.close()
