#!/bin/bash
# Quick script to check conversations in EC2 database
# Run this on EC2: bash check_ec2_conversations.sh

echo "=== Checking EC2 Database Conversations ==="
echo ""

# Check total conversations
echo "1. Total conversations:"
sudo -u postgres psql -d chat_db -c "SELECT COUNT(*) as total FROM conversations;"
echo ""

# Check recent conversations with user_id
echo "2. Recent conversations (last 10):"
sudo -u postgres psql -d chat_db -c "
SELECT
    id,
    session_id,
    user_id,
    created_at,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
FROM conversations
ORDER BY created_at DESC
LIMIT 10;
"
echo ""

# Check conversations for specific user
echo "3. Conversations for guangcai.wang@gmail.com:"
sudo -u postgres psql -d chat_db -c "
SELECT
    id,
    session_id,
    user_id,
    created_at,
    (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count
FROM conversations
WHERE user_id = 'email_ad6268c680f1ab5224724afb2dd6469f'
ORDER BY created_at DESC;
"
echo ""

# Check conversations without user_id
echo "4. Conversations without user_id:"
sudo -u postgres psql -d chat_db -c "
SELECT COUNT(*) as count_without_user_id
FROM conversations
WHERE user_id IS NULL;
"
echo ""

echo "=== Check Complete ==="
