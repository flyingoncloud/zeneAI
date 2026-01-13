# 模块推荐系统 (Module Recommendation System)

## 概述

模块推荐系统是一个基于**语境和心理状态分析**的智能推荐引擎，能够自然地引导用户使用ZeneAI的四个心理支持模块：

1. **呼吸训练** (Breathing Exercise) - 情绪急救
2. **情绪命名** (Emotion Labeling) - 情绪急救
3. **内视涂鸦** (Inner Insight Doodling) - 创意表达
4. **内视快测** (Inner Insight Quick Assessment) - 自我评估

## 系统架构

```
用户消息
   ↓
保存到数据库
   ↓
心理状态分析 (Psychological Analyzer)
   ↓
触发检测 (Trigger Detector)
   ↓
模块推荐引擎 (Module Recommender)
   ↓
生成引导语（嵌入AI回复的系统提示）
   ↓
AI回复（自然融入模块推荐）
   ↓
返回用户
```

## 核心组件

### 1. 心理状态分析器 (PsychologicalStateAnalyzer)

**文件**: `ai-chat-api/src/modules/psychological_analyzer.py`

**功能**: 从用户消息和对话历史中分析心理状态指标

**输出指标**:
- **Emotional Intensity** (情绪强度): 0.0-1.0
  - 检测高强度情绪关键词（焦虑、崩溃、失控等）
  - 分析标点符号强度（!!!、???）
  - 检测大写字母或重复字符
  
- **Emotional Clarity** (情绪清晰度): 0.0-1.0
  - 计算具体情绪词汇的数量
  - 检测模糊表达（不舒服、怪怪的、说不上来）
  - 逆向指标：清晰度越低，越需要情绪命名
  
- **Expression Complexity** (表达复杂度): 0.0-1.0
  - 检测象征性语言（像是、感觉像、梦见）
  - 识别隐喻和比喻
  
- **Self-Awareness** (自我觉察): 0.0-1.0
  - 检测自我探索意图（了解自己、为什么我）
  - 识别模式探索（我总是、我一直）
  
- **Conversation Depth** (对话深度): 0.0-1.0
  - 基于对话轮次
  - 考虑消息平均长度

**布尔指标**:
- `high_intensity`: 情绪强度 ≥ 0.7
- `vague_expression`: 存在模糊表达
- `symbolic_language`: 使用象征性语言
- `self_exploration`: 表达自我探索意图
- `low_emotion_vocabulary`: 情绪词汇贫乏

### 2. 触发检测器 (TriggerDetector)

**文件**: `ai-chat-api/src/modules/trigger_detector.py`

**功能**: 根据心理状态分析结果，判断应该推荐哪些模块

**推荐规则**:

| 模块 | 触发条件 | 优先级 |
|------|---------|--------|
| **呼吸训练** | `emotional_intensity` ≥ 0.7 | 1 (最高) |
| **情绪命名** | `emotional_clarity` < 0.4<br>或 `vague_expression`<br>或 `low_emotion_vocabulary` | 2 |
| **内视涂鸦** | `expression_complexity` ≥ 0.6<br>或 `symbolic_language`<br>或（高强度 + 低清晰度 = 内心冲突） | 3 |
| **内视快测** | `conversation_depth` < 0.3 (新用户)<br>或 `self_awareness` ≥ 0.6 | 4 |

**输出**:
```python
{
    "module_id": {
        "triggered": bool,
        "score": float,  # 0.0-1.0
        "reasons": [str],  # 触发原因列表
        "priority": int  # 1-4，数字越小优先级越高
    }
}
```

### 3. 模块推荐引擎 (ModuleRecommender)

**文件**: `ai-chat-api/src/modules/recommender.py`

**功能**: 
1. 协调心理状态分析和触发检测
2. 选择最合适的引导语模板
3. 格式化为AI系统提示

**推荐输出**:
```python
{
    "has_recommendations": bool,
    "recommendations": [
        {
            "module_id": str,
            "name": str,  # 中文/英文名称
            "icon": str,  # emoji图标
            "description": str,  # 模块描述
            "guidance": str,  # 自然引导语
            "score": float,
            "priority": int,
            "reasons": [str]
        }
    ],
    "psychological_state": dict,
    "language": str
}
```

### 4. 模块配置 (Module Config)

**文件**: `ai-chat-api/src/modules/module_config.py`

**包含**:
- 4个模块的完整元数据
- 双语名称、描述、引导语模板
- 优先级、类别、图标

## 集成到聊天流程

### chat_service.py

修改后的 `get_ai_response()` 函数：

```python
def get_ai_response(
    messages: List[Dict[str, str]],
    model: str = "gpt-3.5-turbo",
    current_user_message: Optional[str] = None,  # 新参数
    enable_module_recommendations: bool = True   # 新参数
) -> Dict:  # 现在返回字典，不再是字符串
```

**返回值**:
```python
{
    "content": str,  # AI回复内容
    "module_recommendations": [dict],  # 推荐的模块
    "psychological_state": dict  # 心理状态分析（调试用）
}
```

### app.py

在 `/chat/` 端点中：

```python
# 获取AI回复（带模块推荐）
ai_response_data = get_ai_response(
    messages=message_history,
    current_user_message=chat_request.message,  # 传入当前消息
    enable_module_recommendations=True
)

# 提取数据
ai_content = ai_response_data["content"]
module_recommendations = ai_response_data.get("module_recommendations", [])
psychological_state = ai_response_data.get("psychological_state", {})

# 保存到数据库
assistant_message = db_models.Message(
    conversation_id=conversation.id,
    role="assistant",
    content=ai_content,
    extra_data={
        "module_recommendations": module_recommendations,
        "psychological_state": psychological_state
    }
)

# API响应中包含推荐
response = {
    "session_id": conversation.session_id,
    "conversation_id": conversation.id,
    "user_message": user_message,
    "assistant_message": assistant_message,
    "module_recommendations": module_recommendations  # 新增
}
```

## API响应示例

### 场景1: 高情绪强度 → 呼吸训练

**用户消息**: "我真的要崩溃了！太焦虑了，心跳加速，喘不过气，感觉快要失控了！"

**API响应**:
```json
{
  "session_id": "...",
  "conversation_id": 1,
  "user_message": {...},
  "assistant_message": {
    "id": 2,
    "content": "我能感受到你现在的状态很不容易，这种失控的感觉确实很难受。我注意到你现在的情绪很强烈，要不要先试试「呼吸训练」？跟着屏幕的节奏，让呼吸慢慢稳下来，这能帮你快速调节一下状态。",
    "extra_data": {
      "module_recommendations": [
        {
          "module_id": "breathing_exercise",
          "name": "呼吸训练",
          "icon": "🫁",
          "description": "通过引导式呼吸练习，快速平复激烈的情绪波动，让身心回归平静状态",
          "guidance": "我注意到你现在的情绪很强烈。要不要先试试「呼吸训练」？跟着屏幕的节奏，让呼吸慢慢稳下来。",
          "score": 0.8,
          "priority": 1,
          "reasons": ["high_emotional_intensity", "extreme_emotional_state"]
        }
      ],
      "psychological_state": {
        "emotional_intensity": 0.8,
        "emotional_clarity": 0.6,
        "expression_complexity": 0.0,
        "self_awareness": 0.0,
        "conversation_depth": 0.34,
        "indicators": {
          "high_intensity": true,
          "vague_expression": false,
          "symbolic_language": false,
          "self_exploration": false,
          "low_emotion_vocabulary": true
        }
      }
    }
  },
  "module_recommendations": [...]  // 同上
}
```

### 场景2: 模糊表达 → 情绪命名

**用户消息**: "我就是感觉不太好，怪怪的，说不上来是什么感觉，反正就是不舒服。"

**推荐模块**: 情绪命名 (score: 1.0, priority: 2)

**AI自然融入**:
> "听起来你现在有些难以名状的感受。有时候，给感受找个准确的名字，就能让心里清楚很多。要不要试试「情绪命名」？从丰富的情绪词汇中选择最贴合当下的表达，可能会帮你看得更清楚一些。"

### 场景3: 象征性语言 → 内视涂鸦

**用户消息**: "我梦见自己被困在一个黑暗的房间里，感觉像是有什么东西在压着我，像一座大山。"

**推荐模块**: 内视涂鸦 (score: 1.0, priority: 3)

**AI自然融入**:
> "这个梦境很有意象感，黑暗的房间和大山的压迫...你的内心世界很复杂，有时候画出来比说出来更容易。「内视涂鸦」可以让你用图像来表达这些难以言说的感受，或许会有新的发现。"

### 场景4: 新用户 → 内视快测

**用户消息**: "我想了解一下自己为什么总是这样，我到底是什么样的人？"

**推荐模块**: 内视快测 (score: 1.0, priority: 4)

**AI自然融入**:
> "你对自己的好奇很珍贵。要不要先做个「内视快测」？这是一个覆盖五大心理维度的自我评估，能帮你从多个角度更清楚地认识自己，这样我们也可以更有针对性地聊。"

## 测试

运行测试脚本：

```bash
cd zeneAI
python3 test_module_recommendations.py
```

测试场景包括：
1. ✅ 高情绪强度 → 呼吸训练
2. ✅ 模糊表达 → 情绪命名
3. ✅ 象征性语言 → 内视涂鸦
4. ✅ 新用户 + 自我探索 → 内视快测

## 配置选项

### 环境变量

在 `.env` 中可以配置：

```env
# AI配置
AI_RESPONSE_LANGUAGE=chinese  # 推荐语言：chinese/english
AI_FORCE_LANGUAGE=true

# 模块推荐配置（可选，将来可以添加）
MODULE_RECOMMENDATION_ENABLED=true
MODULE_MAX_RECOMMENDATIONS=2
```

### 推荐频率

当前：**每条消息都进行分析和推荐**

优点：
- 实时响应用户状态变化
- 能够在紧急情况下立即推荐呼吸训练

缺点：
- 可能推荐过于频繁

**未来优化**：可以添加推荐间隔控制，例如：
- 优先级1（呼吸训练）：立即推荐
- 优先级2-4：每N条消息推荐一次

## 关键特性

### ✅ 自然融入

AI不会生硬地列举模块，而是：
- 先共情和理解用户状态
- 自然过渡到推荐
- 用友好、支持性的语气
- 简短说明（2-3句话）

### ✅ 优先级排序

- 紧急情况（高情绪强度）优先推荐呼吸训练
- 同时触发多个模块时，按优先级排序
- 最多推荐2个模块，避免信息过载

### ✅ 双语支持

- 完整的中英文支持
- 心理状态分析适配不同语言特点
- 引导语模板双语配置

### ✅ 可扩展性

- 新模块只需在 `module_config.py` 添加配置
- 新触发规则在 `trigger_detector.py` 中添加方法
- 语境分析可以持续优化关键词库

## 数据流示例

```
用户: "我真的要崩溃了！太焦虑了！"
  ↓
[PsychologicalStateAnalyzer]
  - emotional_intensity: 0.8
  - high_intensity: true
  ↓
[TriggerDetector]
  - breathing_exercise: triggered (score: 0.8, priority: 1)
  - emotion_labeling: triggered (score: 0.4, priority: 2)
  ↓
[ModuleRecommender]
  - 选择top 2推荐
  - 选择合适的引导语模板
  - 格式化为AI系统提示
  ↓
[OpenAI API]
  - System prompt包含模块推荐指引
  - AI自然地融入推荐到回复中
  ↓
[API Response]
  - content: "我能感受到你现在的状态很不容易...要不要先试试「呼吸训练」？"
  - module_recommendations: [breathing_exercise, emotion_labeling]
  ↓
[Frontend]
  - 显示AI回复
  - 显示模块卡片/按钮
  - 用户点击直接进入模块
```

## 未来增强

1. **推荐历史追踪**
   - 记录用户已使用的模块
   - 避免重复推荐
   - 个性化推荐策略

2. **推荐效果反馈**
   - 用户是否使用了推荐的模块
   - 使用后效果如何
   - 基于反馈优化推荐算法

3. **时间敏感推荐**
   - 考虑时间因素（深夜焦虑 → 呼吸训练）
   - 考虑对话时长（长时间倾诉 → 内视涂鸦）

4. **多模块组合路径**
   - 先呼吸训练稳定情绪
   - 再情绪命名明确感受
   - 最后内视涂鸦深入探索

5. **A/B测试框架**
   - 测试不同推荐策略
   - 优化触发阈值
   - 改进引导语模板

## 文件清单

```
zeneAI/
├── ai-chat-api/src/
│   ├── modules/
│   │   ├── __init__.py                    # 模块入口
│   │   ├── module_config.py               # 模块配置和元数据
│   │   ├── psychological_analyzer.py      # 心理状态分析器
│   │   ├── trigger_detector.py            # 触发检测器
│   │   └── recommender.py                 # 推荐引擎协调器
│   │
│   ├── api/
│   │   ├── app.py                         # FastAPI应用（已更新）
│   │   └── chat_service.py                # 聊天服务（已更新）
│   │
│   └── ...
│
├── test_module_recommendations.py         # 测试脚本
└── MODULE_RECOMMENDATION_SYSTEM.md        # 本文档
```

## 支持

如有问题或建议，请联系开发团队。

---

**版本**: 1.0.0  
**更新日期**: 2026-01-11  
**作者**: ZeneAI Team
