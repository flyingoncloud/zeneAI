# Psychology Report UI Flow Guide

## What Users Will See

### Step 1: Completing Questionnaires (Questions 1-4)
```
┌─────────────────────────────────────────┐
│  问题 1 / 80                             │
│  [Question text here]                    │
│                                          │
│  [Answer options]                        │
│                                          │
│  Progress bar: ████░░░░░░░ 10%          │
└─────────────────────────────────────────┘
```

### Step 2: After Completing Last Question
**Message appears**: "所有问卷已完成！正在生成您的心理报告..."

### Step 3: Results View - Report Generating
```
┌─────────────────────────────────────────┐
│  评估结果                                 │
│  [Scoring results for each questionnaire]│
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ ⏳ 正在生成专业报告...            │   │
│  │                                  │   │
│  │ 我们正在为您生成详细的心理报告，  │   │
│  │ 包含专业分析和可视化图表。        │   │
│  │ 这可能需要30-60秒。               │   │
│  │                                  │   │
│  │ Progress: ████████░░ 80%         │   │
│  │ 进度: 80%                        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Step 4: Report Completed
```
┌─────────────────────────────────────────┐
│  评估结果                                 │
│  [Scoring results for each questionnaire]│
│                                          │
│  ┌─────────────────────────────────┐   │
│  │ ✅ 报告已生成                    │   │
│  │                                  │   │
│  │ 您的专业心理报告已经生成完成！    │   │
│  │ 报告包含详细的分析、可视化图表    │   │
│  │ 和个性化建议。                   │   │
│  │                                  │   │
│  │ ┌─────────────────────────────┐ │   │
│  │ │ 📥 下载心理报告 (DOCX)       │ │   │
│  │ └─────────────────────────────┘ │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Step 5: Download Complete
- DOCX file downloads to user's computer
- Filename: `ZeneMe心理报告_用户_123.docx`
- User can open in Microsoft Word or LibreOffice

## Report Contents

The downloaded DOCX report includes:

1. **Cover Page**
   - Title: ZeneMe - 内视觉察专业报告
   - User information
   - Generation date

2. **Executive Summary**
   - Overall assessment overview
   - Key findings

3. **Core Dimensions Analysis**
   - Emotional Regulation
   - Cognitive Flexibility
   - Relationship Sensitivity
   - Internal Conflict
   - Growth Potential
   - **Includes radar chart visualization**

4. **Detailed Analysis**
   - IFS Parts Analysis (with AI-generated text)
   - Cognitive Patterns (with AI-generated text)
   - Relational Patterns (with AI-generated text)
   - Conflict Triggers (with AI-generated text)
   - **Includes bar charts and rating scales**

5. **Personality Classification**
   - Personality type
   - Characteristics
   - Recommendations

6. **Growth Recommendations**
   - Personalized suggestions
   - Action items
   - Resources

## Color Scheme

- **Pending**: Blue theme (loading, in-progress)
- **Completed**: Green theme (success, ready)
- **Failed**: Red theme (error, retry)

## Timing

- **Questionnaire completion**: 10-15 minutes
- **Report generation**: 30-60 seconds
- **Download**: Instant

## Next Steps for User

After downloading:
1. Open DOCX file in Word/LibreOffice
2. Review detailed analysis
3. Share with therapist/counselor if desired
4. Save for future reference
5. Retake assessment periodically to track progress
