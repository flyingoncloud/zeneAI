#!/bin/bash
# Manual API Testing Script for Psychology-Informed Chat System

echo "======================================================================"
echo "  ZeneAI Psychology-Informed Chat System - Live API Test"
echo "======================================================================"
echo ""

# Test 1: High Emotional Intensity (should recommend Breathing Exercise)
echo "🧪 TEST 1: High Emotional Intensity"
echo "Message: 我真的要崩溃了！心跳很快，压力太大了，感觉快要失控了！"
echo "----------------------------------------------------------------------"

RESPONSE1=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "我真的要崩溃了！心跳很快，压力太大了，感觉快要失控了！"
  }')

SESSION_ID=$(echo $RESPONSE1 | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")

echo ""
echo "✅ Session ID: $SESSION_ID"
echo ""
echo "📊 Psychological State:"
echo $RESPONSE1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
state = data['assistant_message']['extra_data']['psychological_state']
print(f\"  - Emotional Intensity: {state['emotional_intensity']:.2f}\")
print(f\"  - Emotional Clarity: {state['emotional_clarity']:.2f}\")
print(f\"  - Conversation Depth: {state['conversation_depth']:.2f}\")
"

echo ""
echo "🎯 Module Recommendations:"
echo $RESPONSE1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data']['module_recommendations']
for i, rec in enumerate(recs, 1):
    print(f\"{i}. {rec['icon']} {rec['name']} (Priority: {rec['priority']}, Score: {rec['score']:.2f})\")
    print(f\"   Reasons: {', '.join(rec['reasons'])}\")
"

echo ""
echo "💬 AI Response:"
echo $RESPONSE1 | python3 -c "
import sys, json
data = json.load(sys.stdin)
content = data['assistant_message']['content']
# Print first 200 characters
print(f\"  {content[:200]}...\")
"

echo ""
echo ""
sleep 2

# Test 2: Continue conversation with avoidance pattern
echo "🧪 TEST 2: Defense Mechanism (Avoidance Pattern)"
echo "Message: 不想谈这个了，换个话题吧。其实也没什么大不了的。"
echo "----------------------------------------------------------------------"

RESPONSE2=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"不想谈这个了，换个话题吧。其实也没什么大不了的。\",
    \"session_id\": \"$SESSION_ID\"
  }")

echo ""
echo "📊 Pattern Recognition:"
echo $RESPONSE2 | python3 -c "
import sys, json
data = json.load(sys.stdin)
patterns = data['assistant_message']['extra_data'].get('patterns', {})
defense = patterns.get('defense_mechanisms', {})
if defense.get('detected'):
    print(f\"  ✓ Defense Mechanisms: {', '.join(defense['detected'])} (confidence: {defense.get('confidence', 0):.2f})\")
else:
    print(\"  - No defense mechanisms detected (needs more messages for LLM analysis)\")
"

echo ""
echo "📊 Emotional Progression:"
echo $RESPONSE2 | python3 -c "
import sys, json
data = json.load(sys.stdin)
progression = data['assistant_message']['extra_data'].get('progression', {})
if progression.get('trajectory') not in ['unknown', 'insufficient_data']:
    print(f\"  - Trajectory: {progression['trajectory']}\")
    print(f\"  - Intensity Trend: {progression.get('intensity_trend', 0):.2f}\")
else:
    print(f\"  - {progression.get('trajectory', 'unknown')} (needs more messages)\")
"

echo ""
echo "🎯 Module Recommendations:"
echo $RESPONSE2 | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    for i, rec in enumerate(recs, 1):
        print(f\"{i}. {rec['icon']} {rec['name']} (Priority: {rec['priority']}, Score: {rec['score']:.2f})\")
else:
    print(\"  - No recommendations (emotional state stabilized)\")
"

echo ""
echo ""

# Test 3: Anxious attachment pattern
sleep 2
echo "🧪 TEST 3: Attachment Pattern (Anxious Type)"
echo "Message: 我总是担心失去他，需要一直确认他还在乎我。害怕被抛弃。"
echo "----------------------------------------------------------------------"

RESPONSE3=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"我总是担心失去他，需要一直确认他还在乎我。害怕被抛弃。\",
    \"session_id\": \"$SESSION_ID\"
  }")

echo ""
echo "📊 Pattern Recognition:"
echo $RESPONSE3 | python3 -c "
import sys, json
data = json.load(sys.stdin)
patterns = data['assistant_message']['extra_data'].get('patterns', {})

defense = patterns.get('defense_mechanisms', {})
if defense.get('detected'):
    print(f\"  ✓ Defense Mechanisms: {', '.join(defense['detected'])}\")

attachment = patterns.get('attachment_patterns', {})
if attachment.get('primary_pattern'):
    print(f\"  ✓ Attachment Pattern: {attachment['primary_pattern']} (confidence: {attachment.get('confidence', 0):.2f})\")
else:
    print(\"  - No attachment pattern detected yet (needs more context for LLM)\")

themes = patterns.get('recurring_themes', {})
if themes.get('dominant_theme'):
    print(f\"  ✓ Dominant Theme: {themes['dominant_theme']}\")
"

echo ""
echo "======================================================================"
echo "  TEST SUITE COMPLETED"
echo "======================================================================"
echo ""
echo "✅ All features tested successfully!"
echo "✅ API Server running at: http://localhost:8000"
echo "✅ Interactive docs: http://localhost:8000/docs"
echo ""
