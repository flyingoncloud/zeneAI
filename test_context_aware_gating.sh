#!/bin/bash
# Test the new context-aware gating system

echo "======================================================================"
echo "  测试上下文感知推荐系统 - 智能门控"
echo "======================================================================"
echo ""

# Test 1: Greeting - Should NOT recommend
echo "🧪 测试 1: 问候语（不应推荐任何模块）"
echo "消息: 你好"
echo "----------------------------------------------------------------------"

RESPONSE1=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}')

SESSION_ID1=$(echo "$RESPONSE1" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")

echo ""
echo "🤖 AI回应:"
echo "$RESPONSE1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐结果:"
echo "$RESPONSE1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    print('  ❌ 错误：推荐了模块（不应该）')
    for rec in recs:
        print(f\"     {rec['icon']} {rec['name']}\")
else:
    print('  ✅ 正确：没有推荐（门控生效）')
"

echo ""
echo ""
sleep 2

# Test 2: Casual chat - Should NOT recommend
echo "🧪 测试 2: 普通闲聊（不应推荐）"
echo "消息: 今天天气不错"
echo "----------------------------------------------------------------------"

RESPONSE2=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"今天天气不错\", \"session_id\": \"$SESSION_ID1\"}")

echo ""
echo "🤖 AI回应:"
echo "$RESPONSE2" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐结果:"
echo "$RESPONSE2" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    print('  ❌ 错误：推荐了模块（不应该）')
else:
    print('  ✅ 正确：没有推荐（无情绪困扰关键词）')
"

echo ""
echo ""
sleep 2

# Test 3: Emotional distress - SHOULD recommend
echo "🧪 测试 3: 情绪困扰（应该推荐）"
echo "消息: 我真的好焦虑，心跳很快，受不了了"
echo "----------------------------------------------------------------------"

RESPONSE3=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"我真的好焦虑，心跳很快，受不了了\", \"session_id\": \"$SESSION_ID1\"}")

echo ""
echo "🤖 AI回应:"
echo "$RESPONSE3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐结果:"
echo "$RESPONSE3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    print('  ✅ 正确：推荐了模块（有明确情绪困扰）')
    for rec in recs:
        print(f\"     {rec['icon']} {rec['name']} (评分: {rec['score']:.2f})\")
else:
    print('  ❌ 错误：没有推荐（应该推荐）')
"

echo ""
echo ""
sleep 2

# Test 4: First message with distress - Should NOT recommend (need 2+ messages)
echo "🧪 测试 4: 新会话第一条情绪困扰消息（不应推荐，需要更多上下文）"
echo "消息: 我好痛苦啊"
echo "----------------------------------------------------------------------"

RESPONSE4=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "我好痛苦啊"}')

echo ""
echo "🤖 AI回应:"
echo "$RESPONSE4" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐结果:"
echo "$RESPONSE4" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    print('  ❌ 可能过早：第一条消息就推荐了')
    for rec in recs:
        print(f\"     {rec['icon']} {rec['name']}\")
else:
    print('  ✅ 正确：没有推荐（需要更多对话建立上下文）')
"

echo ""
echo "======================================================================"
echo "  测试完成 - 检查要点"
echo "======================================================================"
echo ""
echo "✅ 门控规则:"
echo "   1. 至少2条用户消息才考虑推荐"
echo "   2. 必须包含情绪困扰关键词"
echo "   3. 心理状态指标显示真实需求"
echo ""
echo "✅ 预期结果:"
echo "   - 问候语/闲聊: 不推荐 ✓"
echo "   - 有上下文的情绪困扰: 推荐 ✓"
echo "   - 第一条消息: 不推荐（即使有困扰词）✓"
echo ""
