# 前端集成指南 - 模块推荐系统

## API响应结构

当用户发送消息时，`/chat/` API现在会返回模块推荐：

```typescript
interface ChatResponse {
  session_id: string;
  conversation_id: number;
  user_message: Message;
  assistant_message: Message;
  module_recommendations: ModuleRecommendation[];  // ← 新增
}

interface ModuleRecommendation {
  module_id: string;              // "breathing_exercise" | "emotion_labeling" | "inner_doodling" | "quick_assessment"
  name: string;                   // "呼吸训练" or "Breathing Exercise"
  icon: string;                   // "🫁", "🏷️", "🎨", "📊"
  description: string;            // 模块描述
  guidance: string;               // AI生成的引导语
  score: number;                  // 0.0-1.0，推荐强度
  priority: number;               // 1-4，优先级（1最高）
  reasons: string[];              // 触发原因
}
```

## 使用示例

### 1. 基础集成

```typescript
// 发送消息
async function sendMessage(message: string, sessionId?: string) {
  const response = await fetch('http://localhost:8000/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      session_id: sessionId
    })
  });

  const data: ChatResponse = await response.json();

  // 显示AI回复
  displayMessage(data.assistant_message.content);

  // 显示模块推荐
  if (data.module_recommendations && data.module_recommendations.length > 0) {
    displayModuleRecommendations(data.module_recommendations);
  }
}
```

### 2. UI展示推荐

#### 方案A: 卡片式推荐

```jsx
function ModuleRecommendationCard({ recommendation }) {
  return (
    <div className="module-card" data-priority={recommendation.priority}>
      <div className="module-header">
        <span className="module-icon">{recommendation.icon}</span>
        <span className="module-name">{recommendation.name}</span>
        {recommendation.priority === 1 && (
          <span className="urgent-badge">紧急</span>
        )}
      </div>
      <p className="module-description">{recommendation.description}</p>
      <button 
        onClick={() => navigateToModule(recommendation.module_id)}
        className="module-button"
      >
        立即体验
      </button>
    </div>
  );
}
```

**CSS示例**:
```css
.module-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
  transition: all 0.3s ease;
}

.module-card[data-priority="1"] {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.module-card[data-priority="2"] {
  border-color: #ffa500;
  background: #fff8f0;
}

.urgent-badge {
  background: #ff6b6b;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
```

#### 方案B: 浮动提示条

```jsx
function ModuleRecommendationBar({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  const topRecommendation = recommendations[0];

  return (
    <div className="recommendation-bar" data-priority={topRecommendation.priority}>
      <span className="icon">{topRecommendation.icon}</span>
      <span className="text">
        {topRecommendation.guidance}
      </span>
      <button onClick={() => navigateToModule(topRecommendation.module_id)}>
        试试看
      </button>
      <button className="dismiss" onClick={onDismiss}>×</button>
    </div>
  );
}
```

#### 方案C: 嵌入聊天气泡

```jsx
function ChatMessage({ message, recommendations }) {
  return (
    <div className="chat-bubble assistant">
      <p>{message.content}</p>
      
      {recommendations && recommendations.length > 0 && (
        <div className="inline-recommendations">
          {recommendations.map(rec => (
            <button 
              key={rec.module_id}
              className="inline-module-button"
              onClick={() => navigateToModule(rec.module_id)}
            >
              {rec.icon} {rec.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. 模块导航

```typescript
function navigateToModule(moduleId: string) {
  const routes = {
    'breathing_exercise': '/modules/breathing',
    'emotion_labeling': '/modules/emotion-labeling',
    'inner_doodling': '/modules/doodling',
    'quick_assessment': '/modules/assessment'
  };

  const route = routes[moduleId];
  if (route) {
    // 使用你的路由系统
    router.push(route);
    // 或
    window.location.href = route;
  }
}
```

### 4. 优先级处理

```typescript
function displayModuleRecommendations(recommendations: ModuleRecommendation[]) {
  recommendations.forEach(rec => {
    if (rec.priority === 1) {
      // 高优先级：立即显示，可能带动画/声音
      showUrgentRecommendation(rec);
    } else if (rec.priority === 2) {
      // 中优先级：显著但不打断
      showHighlightedRecommendation(rec);
    } else {
      // 低优先级：温和提示
      showGentleRecommendation(rec);
    }
  });
}
```

## 真实场景示例

### 场景1: 用户焦虑 → 呼吸训练

**用户输入**: "我太焦虑了，心跳很快，喘不过气"

**API返回**:
```json
{
  "assistant_message": {
    "content": "我能感受到你现在很不舒服，这种感觉确实很难受。要不要先试试「呼吸训练」？跟着屏幕的节奏，让呼吸慢慢稳下来。"
  },
  "module_recommendations": [
    {
      "module_id": "breathing_exercise",
      "name": "呼吸训练",
      "icon": "🫁",
      "priority": 1,
      "score": 0.85
    }
  ]
}
```

**前端显示**:
```
┌────────────────────────────────────┐
│ 🤖 AI助手                          │
│                                    │
│ 我能感受到你现在很不舒服，这种感   │
│ 觉确实很难受。要不要先试试「呼吸   │
│ 训练」？跟着屏幕的节奏，让呼吸慢   │
│ 慢稳下来。                         │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ 🫁 呼吸训练           [紧急]  │  │
│ │ 通过引导式呼吸练习，快速平复  │  │
│ │ 激烈的情绪波动                │  │
│ │                              │  │
│ │        [立即开始 →]          │  │
│ └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### 场景2: 模糊表达 → 情绪命名

**用户输入**: "我就是感觉不太好，说不上来"

**前端显示**:
```
┌────────────────────────────────────┐
│ 🤖 AI助手                          │
│                                    │
│ 听起来你有些难以名状的感受。有时   │
│ 候，给感受找个准确的名字，就能让   │
│ 心里清楚很多。                     │
│                                    │
│ 💡 推荐尝试：                      │
│ 🏷️ 情绪命名  📊 内视快测          │
└────────────────────────────────────┘
```

## 数据持久化

### 本地存储推荐历史

```typescript
interface RecommendationHistory {
  sessionId: string;
  recommendations: {
    timestamp: string;
    moduleId: string;
    shown: boolean;
    clicked: boolean;
    dismissed: boolean;
  }[];
}

// 记录推荐展示
function trackRecommendationShown(sessionId: string, moduleId: string) {
  const history = getRecommendationHistory(sessionId);
  history.recommendations.push({
    timestamp: new Date().toISOString(),
    moduleId,
    shown: true,
    clicked: false,
    dismissed: false
  });
  saveRecommendationHistory(sessionId, history);
}

// 记录用户点击
function trackRecommendationClicked(sessionId: string, moduleId: string) {
  // 更新历史记录
  // 可以发送analytics事件
}
```

## 分析和优化

### 跟踪推荐效果

```typescript
// 发送analytics事件
function trackModuleRecommendation(event: {
  type: 'shown' | 'clicked' | 'dismissed' | 'completed';
  moduleId: string;
  sessionId: string;
  priority: number;
  score: number;
}) {
  // 发送到你的analytics服务
  analytics.track('module_recommendation', event);
}
```

### A/B测试不同UI

```typescript
const recommendationUIVariant = getABTestVariant('recommendation_ui');

if (recommendationUIVariant === 'A') {
  return <ModuleRecommendationCard recommendations={recommendations} />;
} else if (recommendationUIVariant === 'B') {
  return <ModuleRecommendationBar recommendations={recommendations} />;
}
```

## 错误处理

```typescript
async function sendMessage(message: string, sessionId?: string) {
  try {
    const response = await fetch('http://localhost:8000/chat/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // 容错处理：即使没有推荐也能正常工作
    const recommendations = data.module_recommendations || [];
    
    displayMessage(data.assistant_message.content);
    if (recommendations.length > 0) {
      displayModuleRecommendations(recommendations);
    }

  } catch (error) {
    console.error('Error sending message:', error);
    showErrorMessage('抱歉，发送消息时出错了，请重试');
  }
}
```

## 最佳实践

### 1. 不要过度打断用户

```typescript
// ✅ 好的做法
function showRecommendation(rec: ModuleRecommendation) {
  if (rec.priority === 1) {
    // 紧急情况：显著但不modal
    showBanner(rec);
  } else {
    // 非紧急：温和提示
    showInlineButton(rec);
  }
}

// ❌ 避免
function showRecommendation(rec: ModuleRecommendation) {
  // 不要每次都弹窗
  showModal(rec);
}
```

### 2. 提供关闭选项

```jsx
function ModuleRecommendation({ rec, onDismiss }) {
  return (
    <div className="recommendation">
      {/* 内容 */}
      <button 
        className="dismiss-button" 
        onClick={() => onDismiss(rec.module_id)}
        aria-label="关闭推荐"
      >
        ×
      </button>
    </div>
  );
}
```

### 3. 记住用户偏好

```typescript
// 用户频繁关闭某个模块推荐
function trackDismissal(moduleId: string) {
  const dismissCount = getDismissCount(moduleId);
  
  if (dismissCount >= 3) {
    // 降低该模块的推荐频率
    setModulePreference(moduleId, 'low_priority');
  }
}
```

### 4. 提供反馈机制

```jsx
function ModuleRecommendation({ rec }) {
  return (
    <div>
      {/* 推荐内容 */}
      <div className="feedback">
        <button onClick={() => trackFeedback(rec.module_id, 'helpful')}>
          👍 有帮助
        </button>
        <button onClick={() => trackFeedback(rec.module_id, 'not_helpful')}>
          👎 不相关
        </button>
      </div>
    </div>
  );
}
```

## TypeScript类型定义

```typescript
// types.ts
export type ModuleId = 
  | 'breathing_exercise'
  | 'emotion_labeling'
  | 'inner_doodling'
  | 'quick_assessment';

export type ModulePriority = 1 | 2 | 3 | 4;

export interface ModuleRecommendation {
  module_id: ModuleId;
  name: string;
  icon: string;
  description: string;
  guidance: string;
  score: number;
  priority: ModulePriority;
  reasons: string[];
}

export interface ChatResponse {
  session_id: string;
  conversation_id: number;
  user_message: Message;
  assistant_message: Message & {
    extra_data: {
      module_recommendations: ModuleRecommendation[];
      psychological_state: PsychologicalState;
    };
  };
  module_recommendations: ModuleRecommendation[];
}

export interface PsychologicalState {
  emotional_intensity: number;
  emotional_clarity: number;
  expression_complexity: number;
  self_awareness: number;
  conversation_depth: number;
  indicators: {
    high_intensity: boolean;
    vague_expression: boolean;
    symbolic_language: boolean;
    self_exploration: boolean;
    low_emotion_vocabulary: boolean;
  };
}
```

## 测试建议

```typescript
// 测试不同场景
describe('Module Recommendations', () => {
  it('displays breathing exercise for high emotional intensity', async () => {
    const response = await sendMessage("我太焦虑了，要崩溃了！");
    
    expect(response.module_recommendations).toHaveLength(1);
    expect(response.module_recommendations[0].module_id).toBe('breathing_exercise');
    expect(response.module_recommendations[0].priority).toBe(1);
  });

  it('displays emotion labeling for vague expression', async () => {
    const response = await sendMessage("我感觉不太好，说不上来");
    
    expect(response.module_recommendations[0].module_id).toBe('emotion_labeling');
  });

  it('handles no recommendations gracefully', async () => {
    const response = await sendMessage("今天天气不错");
    
    expect(response.module_recommendations).toEqual([]);
    // 应该仍然显示AI回复
    expect(response.assistant_message.content).toBeTruthy();
  });
});
```

---

**需要帮助？** 请参考 `MODULE_RECOMMENDATION_SYSTEM.md` 了解后端实现细节。
