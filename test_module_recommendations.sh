#!/bin/bash
# Test script for module recommendations

echo "=========================================="
echo "Testing Emotional First Aid Recommendation"
echo "=========================================="

# Message 1
echo ""
echo "📤 Message 1: 'I feel so anxious and stressed'"
RESPONSE1=$(curl -s -X POST http://localhost:8000/chat/ -H "Content-Type: application/json" -d '{"message": "I feel so anxious and stressed"}')
SESSION_ID=$(echo "$RESPONSE1" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
echo "✅ Session: $SESSION_ID"
echo "$RESPONSE1" | python3 -c "import sys, json; data=json.load(sys.stdin); print('🤖 AI:', data['assistant_message']['content'][:150], '...')"

# Message 2
echo ""
echo "📤 Message 2: 'I cannot control my emotions anymore'"
RESPONSE2=$(curl -s -X POST http://localhost:8000/chat/ -H "Content-Type: application/json" -d "{\"message\": \"I cannot control my emotions anymore\", \"session_id\": \"$SESSION_ID\"}")
echo "$RESPONSE2" | python3 -c "import sys, json; data=json.load(sys.stdin); print('🤖 AI:', data['assistant_message']['content'][:150], '...')"

# Message 3
echo ""
echo "📤 Message 3: 'Everything feels overwhelming and scary'"
RESPONSE3=$(curl -s -X POST http://localhost:8000/chat/ -H "Content-Type: application/json" -d "{\"message\": \"Everything feels overwhelming and scary\", \"session_id\": \"$SESSION_ID\"}")

echo ""
echo "=========================================="
echo "FULL AI RESPONSE (Message 3):"
echo "=========================================="
echo "$RESPONSE3" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['assistant_message']['content'])"

echo ""
echo "=========================================="
echo "MODULE RECOMMENDATIONS:"
echo "=========================================="
echo "$RESPONSE3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data.get('module_recommendations', [])
print(f'Count: {len(recs)}')
if recs:
    for rec in recs:
        print(f\"  • {rec.get('icon', '')} {rec.get('name', 'Unknown')}\")
        print(f\"    Reason: {rec.get('reason', '')}\")
else:
    print('  ⚠️  No recommendations generated')
"

echo ""
echo "=========================================="
echo "CHECK IF EMBEDDED IN AI RESPONSE:"
echo "=========================================="
echo "$RESPONSE3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ai_response = data['assistant_message']['content']
keywords = ['情绪急救', '内视涂鸦', '内视快测', 'Emotional First Aid', 'Inner Insight', '模块', 'module']
found = [kw for kw in keywords if kw in ai_response]
if found:
    print(f'✅ Module keywords found: {found}')
else:
    print('❌ No module keywords found in AI response')
"
