#!/usr/bin/env python3
"""
Update existing conversations with user_id by matching session_id with questionnaire progress
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

print("\n=== Updating Conversations with user_id ===\n")

# Find conversations without user_id that have matching questionnaire progress
cursor.execute("""
    SELECT
        c.id as conversation_id,
        c.session_id,
        c.user_id as current_user_id,
        qp.user_id as progress_user_id,
        qp.id as progress_id
    FROM conversations c
    LEFT JOIN user_questionnaire_progress qp ON c.session_id = qp.session_id
    WHERE c.user_id IS NULL
    AND qp.user_id IS NOT NULL
    ORDER BY c.id DESC
""")

matches = cursor.fetchall()
print(f"Found {len(matches)} conversations that can be updated\n")

if len(matches) == 0:
    print("No conversations to update. All conversations either:")
    print("- Already have user_id")
    print("- Don't have matching questionnaire progress")
    cursor.close()
    conn.close()
    exit(0)

# Show what will be updated
print("Conversations to update:")
print("-" * 80)
for match in matches:
    print(f"Conversation ID: {match['conversation_id']}")
    print(f"Session ID: {match['session_id']}")
    print(f"Will set user_id to: {match['progress_user_id']}")
    print(f"(from questionnaire progress ID: {match['progress_id']})")
    print("-" * 80)

# Ask for confirmation
response = input(f"\nUpdate {len(matches)} conversations? (yes/no): ")
if response.lower() != 'yes':
    print("Cancelled.")
    cursor.close()
    conn.close()
    exit(0)

# Perform updates
updated_count = 0
for match in matches:
    cursor.execute("""
        UPDATE conversations
        SET user_id = %s
        WHERE id = %s
    """, (match['progress_user_id'], match['conversation_id']))
    updated_count += 1
    print(f"✓ Updated conversation {match['conversation_id']} with user_id: {match['progress_user_id']}")

conn.commit()
print(f"\n✅ Successfully updated {updated_count} conversations")

# Verify updates
print("\n=== Verification ===")
cursor.execute("""
    SELECT
        user_id,
        COUNT(*) as count
    FROM conversations
    GROUP BY user_id
    ORDER BY count DESC
""")

stats = cursor.fetchall()
print("\nConversations by user_id:")
for stat in stats:
    user_label = stat['user_id'] if stat['user_id'] else "NULL (no user_id)"
    print(f"  {user_label}: {stat['count']} conversations")

cursor.close()
conn.close()
