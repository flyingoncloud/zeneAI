#!/bin/bash
# Test the fixes for tone and module recommendation issues

echo "======================================================================"
echo "  测试修复：语气 + 模块推荐"
echo "======================================================================"
echo ""

# Test 1: Anger keyword "非常非常生气"
echo "🧪 测试 1: '非常非常生气'（应该推荐模块）"
echo "----------------------------------------------------------------------"

# Start conversation
RESPONSE1=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}')
SESSION_ID=$(echo "$RESPONSE1" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")

# Continue with casual message
RESPONSE2=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"最近工作压力挺大的\", \"session_id\": \"$SESSION_ID\"}")

# Now express strong anger
RESPONSE3=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"我非常非常生气！真的气死了！\", \"session_id\": \"$SESSION_ID\"}")

echo "💬 用户: 我非常非常生气！真的气死了！"
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
    print(f'  ✅ 推荐了 {len(recs)} 个模块:')
    for rec in recs:
        print(f\"     {rec['icon']} {rec['name']} (评分: {rec['score']:.2f})\")
else:
    print('  ❌ 错误：没有推荐（应该推荐呼吸训练）')
"

echo ""
echo "🔍 检查语气:"
echo "$RESPONSE3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
content = data['assistant_message']['content']

# Check for bad patterns
bad_patterns = ['加油', '明天会更好', '💪', '🌈', '💕', '🌟', '试着接受', '不要太过']
issues = [p for p in bad_patterns if p in content]

if issues:
    print(f\"  ❌ 发现不当用语: {', '.join(issues)}\")
else:
    print('  ✅ 语气正常（无鸡汤/打气）')

# Check for good patterns (curiosity)
good_patterns = ['？', '是什么', '怎么', '为什么', '能说说']
has_curiosity = any(p in content for p in good_patterns)
if has_curiosity:
    print('  ✅ 有好奇/探索性问题')
else:
    print('  ⚠️  缺少探索性问题（建议增加）')
"

echo ""
echo ""
sleep 2

# Test 2: Breathing symptom "喘不过气来"
echo "🧪 测试 2: '简直喘不过气来'（应该推荐呼吸训练）"
echo "----------------------------------------------------------------------"

# New session
RESPONSE4=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}')
SESSION_ID2=$(echo "$RESPONSE4" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")

RESPONSE5=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"最近有点焦虑\", \"session_id\": \"$SESSION_ID2\"}")

RESPONSE6=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"现在简直喘不过气来，心跳好快\", \"session_id\": \"$SESSION_ID2\"}")

echo "💬 用户: 现在简直喘不过气来，心跳好快"
echo ""
echo "🤖 AI回应:"
echo "$RESPONSE6" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐模块:"
echo "$RESPONSE6" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])

if recs:
    print(f'  ✅ 推荐了 {len(recs)} 个模块:')
    for rec in recs:
        print(f\"     {rec['icon']} {rec['name']} (评分: {rec['score']:.2f})\")

    # Check if breathing is included
    has_breathing = any(rec['module_id'] == 'breathing_exercise' for rec in recs)
    if has_breathing:
        print('  ✅ 正确：包含呼吸训练')
    else:
        print('  ❌ 错误：没有推荐呼吸训练（只有emotion_labeling）')
else:
    print('  ❌ 错误：没有推荐任何模块')
"

echo ""
echo ""
sleep 2

# Test 3: Two modules together
echo "🧪 测试 3: 两个模块同时推荐（喘不过气 + 说不清感受）"
echo "----------------------------------------------------------------------"

RESPONSE7=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}')
SESSION_ID3=$(echo "$RESPONSE7" | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")

RESPONSE8=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"最近状态不太好\", \"session_id\": \"$SESSION_ID3\"}")

RESPONSE9=$(curl -s -X POST "http://localhost:8000/chat/" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"我喘不过气，心里很乱，说不清楚是什么感觉\", \"session_id\": \"$SESSION_ID3\"}")

echo "💬 用户: 我喘不过气，心里很乱，说不清楚是什么感觉"
echo ""
echo "🤖 AI回应:"
echo "$RESPONSE9" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['assistant_message']['content'])
"

echo ""
echo "📊 推荐模块:"
echo "$RESPONSE9" | python3 -c "
import sys, json
data = json.load(sys.stdin)
recs = data['assistant_message']['extra_data'].get('module_recommendations', [])

if recs:
    print(f'  推荐了 {len(recs)} 个模块:')
    for rec in recs:
        print(f\"     {rec['icon']} {rec['name']} (评分: {rec['score']:.2f})\")

    has_breathing = any(rec['module_id'] == 'breathing_exercise' for rec in recs)
    has_labeling = any(rec['module_id'] == 'emotion_labeling' for rec in recs)

    if has_breathing and has_labeling:
        print('  ✅ 理想：同时推荐呼吸训练 + 情绪命名')
    elif has_breathing:
        print('  ✓ 可接受：只推荐呼吸训练（高优先级）')
    elif has_labeling:
        print('  ⚠️  次优：只推荐情绪命名（应该包括呼吸）')
else:
    print('  ❌ 错误：没有推荐')
"

echo ""
echo "======================================================================"
echo "  测试完成 - 检查要点"
echo "======================================================================"
echo ""
echo "✅ 修复内容:"
echo "   1. 添加生气相关关键词（生气、很生气、非常生气）"
echo "   2. 改进呼吸相关关键词（喘不过气来、喘不上气）"
echo "   3. 更新系统提示词（好奇探索，不给建议/鸡汤）"
echo "   4. 允许推荐2个模块（当两者评分都>=0.7时）"
echo ""
echo "✅ 期望结果:"
echo "   - '非常生气' → 推荐呼吸训练 ✓"
echo "   - '喘不过气来' → 推荐呼吸训练（不是情绪命名）✓"
echo "   - AI语气 → 好奇探索，无鸡汤/加油/emoji ✓"
echo "   - 两个强需求 → 可以推荐2个模块 ✓"
echo ""
