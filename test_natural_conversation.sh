#!/bin/bash
# Test the new natural conversation style with "知心大姐姐" personality

echo "======================================================================"
echo "  测试新的对话风格 - 知心大姐姐"
echo "======================================================================"
echo ""

# Test 1: Regular conversation
echo "🧪 测试 1: 普通对话（不应触发模块推荐）"
echo "消息: 我今天工作上遇到了一些麻烦，感觉有点沮丧..."
echo "----------------------------------------------------------------------"

RESPONSE1=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "我今天工作上遇到了一些麻烦，感觉有点沮丧..."}')

echo ""
echo "🤖 AI回应:"
echo "$RESPONSE1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐模块:"
echo "$RESPONSE1" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    for rec in recs:
        print(f\"  {rec['icon']} {rec['name']} (评分: {rec['score']:.2f})\")
        print(f\"  引导语: {rec['guidance'][:80]}...\")
else:
    print('  ✅ 无推荐（情绪状态稳定，继续倾听）')
"

SESSION_ID=$(echo "$RESPONSE1" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")

echo ""
echo ""
sleep 2

# Test 2: High emotional intensity (should trigger breathing)
echo "🧪 测试 2: 高情绪强度（应该自然推荐呼吸训练）"
echo "消息: 我真的受不了了！心跳加速，整个人都要炸了！"
echo "----------------------------------------------------------------------"

RESPONSE2=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"我真的受不了了！心跳加速，整个人都要炸了！\", \"session_id\": \"$SESSION_ID\"}")

echo ""
echo "🤖 AI回应:"
echo "$RESPONSE2" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐模块:"
echo "$RESPONSE2" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    for rec in recs:
        print(f\"  {rec['icon']} {rec['name']} (优先级: {rec['priority']}, 评分: {rec['score']:.2f})\")
        print(f\"  引导语: {rec['guidance']}\")
else:
    print('  无推荐')
"

echo ""
echo ""
sleep 2

# Test 3: Vague expression (should trigger emotion labeling)
echo "🧪 测试 3: 模糊表达（应该自然推荐情绪命名）"
echo "消息: 我就是感觉怪怪的，说不上来..."
echo "----------------------------------------------------------------------"

# Start new session
RESPONSE3=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "我就是感觉怪怪的，说不上来..."}')

echo ""
echo "🤖 AI回应:"
echo "$RESPONSE3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐模块:"
echo "$RESPONSE3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])
if recs:
    for rec in recs:
        print(f\"  {rec['icon']} {rec['name']} (优先级: {rec['priority']}, 评分: {rec['score']:.2f})\")
        print(f\"  引导语: {rec['guidance']}\")
else:
    print('  无推荐')
"

echo ""
echo "======================================================================"
echo "  测试完成"
echo "======================================================================"
echo ""
echo "✅ 检查要点:"
echo "   1. AI回应是否像知心大姐姐（温暖、直接、不啰嗦）"
echo "   2. 模块推荐是否自然（不生硬）"
echo "   3. 只推荐1个模块"
echo "   4. 引导语轻松自然，有选择空间"
echo ""
