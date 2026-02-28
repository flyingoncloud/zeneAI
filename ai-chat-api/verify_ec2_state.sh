#!/bin/bash

echo "=== EC2 State Verification ==="
echo ""

echo "1. Check conversations with guest UUID:"
sudo -u postgres psql -d chat_db -c "SELECT id, session_id, user_id, created_at, (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count FROM conversations WHERE user_id = '9a445158-8c77-4dca-8fbd-3acb2b1e362b' ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "2. Check conversations with email user_id:"
sudo -u postgres psql -d chat_db -c "SELECT id, session_id, user_id, created_at, (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count FROM conversations WHERE user_id = 'email_ad6268c680f1ab5224724afb2dd6469f' ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "3. Check all recent conversations:"
sudo -u postgres psql -d chat_db -c "SELECT id, session_id, user_id, created_at, (SELECT COUNT(*) FROM messages WHERE conversation_id = conversations.id) as message_count FROM conversations ORDER BY created_at DESC LIMIT 10;"

echo ""
echo "=== Next Steps ==="
echo "If you see conversations with guest UUID but not email user_id:"
echo "1. Clear localStorage in browser (localStorage.clear())"
echo "2. Logout and login again"
echo "3. Send a new message"
echo "4. Run this script again to verify user_id is correct"
