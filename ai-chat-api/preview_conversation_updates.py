#!/usr/bin/env python3
"""
Preview which conversations can be updated with user_id
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

print("\n=== Preview: Conversations that can be updated ===\n")

# Find conversations without user_id that have matching questionnaire progress
cursor.execute("""
    SELECT
        c.id as conversation_id,
        c.session_id,
        c.user_id as current_user_id,
        c.created_at,
        qp.user_id as progress_user_id,
        qp.id as progress_id,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
    FROM conversations c
    LEFT JOIN user_questionnaire_progress qp ON c.session_id = qp.session_id
    WHERE c.user_id IS NULL
    AND qp.user_id IS NOT NULL
    ORDER BY c.created_at DESC
""")

matches = cursor.fetchall()
print(f"Found {len(matches)} conversations that can be updated\n")

if len(matches) == 0:
    print("✓ No conversations need updating. All conversations either:")
    print("  - Already have user_id")
    print("  - Don't have matching questionnaire progress")
else:
    print("Conversations that will be updated:")
    print("=" * 80)
    for match in matches:
        print(f"Conversation ID: {match['conversation_id']}")
        print(f"Session ID: {match['session_id']}")
        print(f"Messages: {match['message_count']}")
        print(f"Created: {match['created_at']}")
        print(f"Current user_id: {match['current_user_id']}")
        print(f"Will set user_id to: {match['progress_user_id']}")
        print(f"(from questionnaire progress ID: {match['progress_id']})")
        print("-" * 80)

    print(f"\n📊 Summary: {len(matches)} conversations will be updated")
    print("\nTo apply these updates, run:")
    print("  python ai-chat-api/apply_conversation_updates.py")

# Show current stats
print("\n=== Current Statistics ===")
cursor.execute("""
    SELECT
        CASE
            WHEN user_id IS NULL THEN 'NULL (no user_id)'
            ELSE user_id
        END as user_label,
        COUNT(*) as count
    FROM conversations
    GROUP BY user_id
    ORDER BY count DESC
    LIMIT 10
""")

stats = cursor.fetchall()
print("\nConversations by user_id (top 10):")
for stat in stats:
    print(f"  {stat['user_label']}: {stat['count']} conversations")

cursor.close()
conn.close()
