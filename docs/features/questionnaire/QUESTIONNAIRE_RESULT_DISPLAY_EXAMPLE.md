# Questionnaire Result Display Example

## What the User Will See

### Result View Layout

```
┌─────────────────────────────────────────────────────────────┐
│  评估结果                          [重新测试] [保存报告]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  综合评估                                                    │
│  您已完成 4 个心理评估问卷，共 89 道题目。                   │
│  以下是您的详细评估结果：                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  情绪智力评估 (Emotional Intelligence)                       │
│  问卷 2.1                                            85      │
│                                                     总分     │
│  分类得分：                                                  │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 情绪觉察      │  │ 情绪调节      │                        │
│  │    42        │  │    43        │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
│  评估解读：                                                  │
│  您的情绪智力处于良好水平。您能够较好地识别和理解自己       │
│  的情绪，并且具备一定的情绪调节能力...                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  压力应对能力 (Stress Management)                            │
│  问卷 2.2                                            72      │
│                                                     总分     │
│  分类得分：                                                  │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 压力感知      │  │ 应对策略      │                        │
│  │    35        │  │    37        │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
│  评估解读：                                                  │
│  您的压力应对能力处于中等水平。在面对压力时，您能够采用     │
│  一些有效的应对策略...                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  人际关系质量 (Interpersonal Relationships)                  │
│  问卷 2.3                                            78      │
│                                                     总分     │
│  分类得分：                                                  │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 社交能力      │  │ 关系满意度    │                        │
│  │    38        │  │    40        │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
│  评估解读：                                                  │
│  您的人际关系质量较好。您具备良好的社交技能，能够与他人     │
│  建立和维持积极的关系...                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  成长指数与变化潜能 (Growth & Transformation Potential)      │
│  问卷 2.5                                            18      │
│                                                     总分     │
│  分类得分：                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 洞察深度      │  │ 内在可塑性    │  │ 心灵韧性      │     │
│  │     6        │  │     6        │  │     6        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  评估解读：                                                  │
│  您展现出良好的成长潜能。您具备一定的自我洞察能力，能够     │
│  从经验中学习和成长...                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  下一步建议                                                  │
│  • 您可以保存此报告以便日后查看和对比                       │
│  • 建议与心理咨询师分享您的评估结果，获得专业指导           │
│  • 定期进行评估可以帮助您追踪心理健康状态的变化             │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Real Data Display
- Shows actual scores calculated by backend
- No mock/hardcoded data
- Scores come from database-backed calculations

### 2. Comprehensive Breakdown
- Total score for each questionnaire
- Category scores (if available)
- Interpretation text from backend

### 3. Professional Presentation
- Clean card-based layout
- Color-coded sections
- Easy to read and understand
- Responsive design

### 4. User Actions
- **重新测试 (Retake)**: Start over with new test
- **保存报告 (Save Report)**: Save results for future reference

## Technical Implementation

### Data Source
All data comes from backend API responses:
```typescript
{
  ok: true,
  scoring: {
    total_score: 85,
    category_scores: {
      "情绪觉察": 42,
      "情绪调节": 43
    },
    interpretation: "您的情绪智力处于良好水平..."
  }
}
```

### State Management
```typescript
const [scoringResults, setScoringResults] = useState<Array<{
  questionnaire_id: string;
  title: string;
  section: string;
  total_score: number;
  category_scores?: Record<string, number>;
  interpretation?: string;
}>>([]);
```

### Rendering Logic
- Maps over `scoringResults` array
- Creates a card for each questionnaire
- Displays scores and interpretation
- Handles missing data gracefully

## Comparison: Before vs After

### Before (Mock Data)
- Hardcoded radar chart
- Fake scores (120, 98, 86, etc.)
- Generic text
- No connection to actual answers

### After (Real Data)
- Actual scores from backend
- Real category breakdowns
- Personalized interpretation
- Direct connection to user's answers

## Testing Checklist

- [ ] All 89 questions can be answered
- [ ] Submission happens after last question
- [ ] Loading state shows during submission
- [ ] Result view displays after submission
- [ ] All 4 questionnaires show results
- [ ] Scores match backend calculations
- [ ] Category scores display correctly
- [ ] Interpretation text shows
- [ ] Reset button works
- [ ] Data persists in database
