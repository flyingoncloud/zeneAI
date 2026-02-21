# Report Enhancement Plan

## Current State

The report generation system exists but needs enhancements for:
1. Better dimension-level descriptions
2. Sub-category analysis and evaluation
3. More detailed scoring breakdowns

## Requirements

Based on the user's request with example scores:
```python
{
    'emotional_regulation': 100,
    'cognitive_flexibility': 80.51,
    'relationship_sensitivity': 80.0,
    'internal_conflict': 80.0,
    'growth_potential': 31.03
}
```

### 1. Radar Chart Generation ✅
**Status**: Already implemented in `drawing_utils.py`

The radar chart is generated with 5 dimensions.

### 2. Dimension-Level Descriptions
**Requirement**: For each dimension, provide a conclusion like:
> "评估情绪识别、表达与调节的稳定性和有效性。分数越高，表示越能在压力下保持情绪平衡。"

**Implementation Needed**:
- Add dimension description templates
- Include score interpretation (low/medium/high ranges)
- Provide actionable insights based on score

### 3. Sub-Category Analysis
**Requirement**: For each sub-category (e.g., 2.2.1 自我内在系统分析), calculate which sub-category is low/high active.

**Example**: In category 2.2.1 (Internal System Analysis):
- 2.2.1.1 管理者 (Managers)
- 2.2.1.2 消防员 (Firefighters)
- 2.2.1.3 流亡者 (Exiles)
- 2.2.1.4 自性 (Self)

Need to identify which is most/least active.

## Implementation Plan

### Phase 1: Enhance Score Storage
**File**: `ai-chat-api/src/services/questionnaire_progress.py`

Store detailed category scores (not just aggregated):
```python
{
    'category_scores': {
        '2.1': 45,           # Emotional Regulation total
        '2.2.1.1': 12,       # Managers
        '2.2.1.2': 8,        # Firefighters
        '2.2.1.3': 15,       # Exiles
        '2.2.1.4': 10,       # Self
        # ... more categories
    }
}
```

### Phase 2: Add Dimension Descriptions
**File**: `ai-chat-api/src/services/psychology/dimension_descriptions.py` (NEW)

Create description templates for each dimension:
```python
DIMENSION_DESCRIPTIONS = {
    'emotional_regulation': {
        'name_zh': '情绪调节能力',
        'description': '评估情绪识别、表达与调节的稳定性和有效性。分数越高，表示越能在压力下保持情绪平衡。',
        'score_ranges': {
            'low': (0, 40, '情绪调节能力较弱，容易被情绪淹没'),
            'medium': (41, 70, '情绪调节能力中等，大多数情况下能够管理情绪'),
            'high': (71, 100, '情绪调节能力强，能够有效识别和调节情绪')
        }
    },
    # ... more dimensions
}
```

### Phase 3: Sub-Category Analysis
**File**: `ai-chat-api/src/services/psychology/subcategory_analyzer.py` (NEW)

Analyze sub-category patterns:
```python
def analyze_subcategories(category_scores: Dict[str, int]) -> Dict[str, Any]:
    """
    Analyze sub-category patterns within each major category.

    Returns:
        {
            '2.2.1': {  # Internal System Analysis
                'highest': {'code': '2.2.1.3', 'name': '流亡者', 'score': 15},
                'lowest': {'code': '2.2.1.2', 'name': '消防员', 'score': 8},
                'analysis': '流亡者部分最为活跃，表明...'
            },
            # ... more categories
        }
    """
```

### Phase 4: Enhanced Report Assembly
**File**: `ai-chat-api/src/services/psychology/report_assembler.py`

Add new sections to report data:
```python
{
    'mind_indices': {
        'emotional_regulation': 100,
        'cognitive_flexibility': 80,
        # ... scores
    },
    'dimension_details': {  # NEW
        'emotional_regulation': {
            'score': 100,
            'description': '评估情绪识别、表达与调节...',
            'interpretation': '情绪调节能力强，能够有效识别和调节情绪',
            'recommendations': ['继续保持...', '可以尝试...']
        },
        # ... more dimensions
    },
    'subcategory_analysis': {  # NEW
        '2.2.1': {
            'name': '自我内在系统分析',
            'highest': {...},
            'lowest': {...},
            'analysis': '...'
        },
        # ... more categories
    }
}
```

### Phase 5: Update DOCX Template
**File**: `ai-chat-api/resources/ZeneMe - 内视觉察专业报告.md`

Add sections for:
- Dimension descriptions
- Sub-category analysis tables
- Detailed interpretations

## Data Structure

### Category Hierarchy (from categoryHierarchy.ts)
```
2.1 情绪觉察 (Emotional Awareness)
2.2 认知模式 (Cognitive Patterns)
  2.2.1 自我内在系统分析 (Internal System Analysis)
    2.2.1.1 管理者 (Managers)
    2.2.1.2 消防员 (Firefighters)
    2.2.1.3 流亡者 (Exiles)
    2.2.1.4 自性 (Self)
  2.2.2 自动思维模式 (Automatic Thought Patterns)
    2.2.2.1 过度概括 (Overgeneralization)
    2.2.2.2 非黑即白 (Black-and-White Thinking)
    2.2.2.3 灾难化 (Catastrophizing)
    2.2.2.4 应该/必须 (Should/Must Statements)
    2.2.2.5 自我责备 (Self-Blame)
  2.2.3 视角转换能力 (Perspective Shifting)
    2.2.3.1 自我 vs 他人视角转换
    2.2.3.2 空间视角转换
    2.2.3.3 认知框架转换
    2.2.3.4 情绪视角转换
  2.2.4 内在叙事结构 (Internal Narrative Structure)
    2.2.4.1 英雄型
    2.2.4.2 受害者型
    2.2.4.3 反抗型
    2.2.4.4 迷失型
    2.2.4.5 探索者型
2.3 关系模式 (Relational Patterns)
  2.3.1 依恋结构 (Attachment Structure)
    2.3.1.1 安全型 (Secure)
    2.3.1.2 焦虑型 (Anxious)
    2.3.1.3 回避型 (Avoidant)
    2.3.1.4 混乱型 (Disorganized)
  2.3.2 冲突触发点
  2.3.3 共情能力
  2.3.4 内在冲突度
2.4 性格类型 (Personality Type)
2.5 成长指数与变化潜能 (Growth Index & Change Potential)
  2.5.1 洞察深度
  2.5.2 内在可塑性
  2.5.3 心灵韧性
```

## Implementation Order

1. ✅ **Radar Chart** - Already done
2. **Dimension Descriptions** - Add description service
3. **Sub-Category Storage** - Enhance progress tracking
4. **Sub-Category Analysis** - Add analyzer service
5. **Report Assembly** - Integrate new data
6. **DOCX Generation** - Update template

## Next Steps

1. Create `dimension_descriptions.py` with all dimension descriptions
2. Create `subcategory_analyzer.py` for sub-category analysis
3. Update `questionnaire_progress.py` to store detailed category scores
4. Update `report_assembler.py` to include new sections
5. Update markdown template with new sections
6. Test with sample data
