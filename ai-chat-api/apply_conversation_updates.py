#!/usr/bin/env python3
"""
Apply user_id updates to conversations by matching with questionnaire progress
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

print("\n=== Applying user_id updates to conversations ===\n")

# Find conversations without user_id that have matching questionnaire progress
cursor.execute("""
    SELECT
        c.id as conversation_id,
        c.session_id,
        qp.user_id as progress_user_id
    FROM conversations c
    LEFT JOIN user_questionnaire_progress qp ON c.session_id = qp.session_id
    WHERE c.user_id IS NULL
    AND qp.user_id IS NOT NULL
    ORDER BY c.id DESC
""")

matches = cursor.fetchall()
print(f"Found {len(matches)} conversations to update\n")

if len(matches) == 0:
    print("✓ No conversations need updating.")
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
    print(f"✓ Updated conversation {match['conversation_id']} → user_id: {match['progress_user_id']}")

conn.commit()
print(f"\n✅ Successfully updated {updated_count} conversations")

# Verify updates
print("\n=== Verification ===")
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

# Check specific user
test_user_id = "email_ad6268c680f1ab5224724afb2dd6469f"
cursor.execute("""
    SELECT COUNT(*) as count
    FROM conversations
    WHERE user_id = %s
""", (test_user_id,))
result = cursor.fetchone()
print(f"\n✓ User {test_user_id} now has {result['count']} conversations")

cursor.close()
conn.close()
