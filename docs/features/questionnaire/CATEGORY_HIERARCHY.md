# Psychology Assessment Category Hierarchy

## Structure Overview

This document defines the hierarchical category structure for the psychology assessment questionnaire.

## 5 Main Dimensions

### 2.1 - 情绪觉察 (Emotional Awareness)
**Code**: `2.1`
**Description**: Ability to recognize and understand emotions

**Sub-categories**: None (direct scoring)

---

### 2.2 - 认知模式 (Cognitive Patterns)
**Code**: `2.2`
**Description**: Thinking patterns and cognitive frameworks

#### 2.2.1 自我内在系统分析 (Internal System Analysis)
**Code**: `2.2.1`
**Description**: Understanding of internal psychological systems

#### 2.2.2 自动思维模式 (Automatic Thought Patterns)
**Code**: `2.2.2`
**Description**: Automatic cognitive distortions

**Sub-categories:**
- `2.2.2.1` 过度概括 (Overgeneralization)
- `2.2.2.2` 非黑即白 (Black-and-White Thinking)
- `2.2.2.3` 灾难化 (Catastrophizing)
- `2.2.2.4` 应该/必须 (Should/Must Statements)
- `2.2.2.5` 自我责备 (Self-Blame)

#### 2.2.3 视角转换能力 (Perspective Shifting)
**Code**: `2.2.3`
**Description**: Ability to shift perspectives

**Sub-categories:**
- `2.2.3.1` 自我 vs 他人视角转换 (Self vs Others Perspective)
- `2.2.3.2` 空间视角转换 (Spatial Perspective)
- `2.2.3.3` 认知框架转换 (Cognitive Frame Shifting)
- `2.2.3.4` 情绪视角转换 (Emotional Perspective)

#### 2.2.4 内在叙事结构 (Internal Narrative Structure)
**Code**: `2.2.4`
**Description**: Personal narrative patterns

**Sub-categories:**
- `2.2.4.1` 英雄型 (Hero Type)
- `2.2.4.2` 受害者型 (Victim Type)
- `2.2.4.3` 反抗型 (Rebel Type)
- `2.2.4.4` 迷失型 (Lost Type)
- `2.2.4.5` 探索者型 (Explorer Type)

---

### 2.3 - 关系模式 (Relational Patterns)
**Code**: `2.3`
**Description**: Interpersonal relationship patterns

#### 2.3.1 依恋结构 (Attachment Structure)
**Code**: `2.3.1`
**Description**: Attachment style patterns

**Sub-categories:**
- `2.3.1.1` 安全型 (Secure)
- `2.3.1.2` 焦虑型 (Anxious)
- `2.3.1.3` 回避型 (Avoidant)
- `2.3.1.4` 混乱型 (Disorganized)

#### 2.3.2 冲突触发点 (Conflict Triggers)
**Code**: `2.3.2`
**Description**: Relationship conflict triggers

#### 2.3.3 共情能力 (Empathy)
**Code**: `2.3.3`
**Description**: Ability to empathize with others

#### 2.3.4 内在冲突度 (Internal Conflict Level)
**Code**: `2.3.4`
**Description**: Level of internal psychological conflict

---

### 2.4 - 性格类型 (Personality Type)
**Code**: `2.4`
**Description**: Personality type classification

**Sub-categories**: None (direct scoring)

---

### 2.5 - 成长指数与变化潜能 (Growth Index & Change Potential)
**Code**: `2.5`
**Description**: Capacity for growth and change

#### 2.5.1 洞察深度 (Insight Depth)
**Code**: `2.5.1`
**Description**: Depth of self-insight

#### 2.5.2 内在可塑性 (Internal Plasticity)
**Code**: `2.5.2`
**Description**: Psychological flexibility and adaptability

#### 2.5.3 心灵韧性 (Psychological Resilience)
**Code**: `2.5.3`
**Description**: Mental resilience and recovery capacity

---

## Usage in Questionnaire

### Question Level (Required)
Every question MUST have a main category assigned:
- Use top-level codes: `2.1`, `2.2`, `2.3`, `2.4`, `2.5`
- Or use sub-category codes: `2.2.1`, `2.2.2`, `2.3.1`, etc.

### Answer Option Level (Optional)
Each answer option CAN have a sub-category:
- If set: Score goes to that specific sub-category
- If not set: Score goes to question's main category

### Examples

**Example 1: Simple Question (No Sub-categories)**
```
Question: "How well do you recognize your emotions?"
Category: 2.1 (情绪觉察)

Answer A: "Very well" → value: 5 → scores to 2.1
Answer B: "Somewhat" → value: 3 → scores to 2.1
Answer C: "Not well" → value: 1 → scores to 2.1
```

**Example 2: Complex Question (With Sub-categories)**
```
Question: "When facing a setback, what's your first thought?"
Category: 2.2.2 (自动思维模式)

Answer A: "This always happens to me"
  → sub_category: 2.2.2.1 (过度概括)
  → value: 3
  → scores to 2.2.2.1

Answer B: "Everything is ruined now"
  → sub_category: 2.2.2.3 (灾难化)
  → value: 4
  → scores to 2.2.2.3

Answer C: "I'll learn from this"
  → sub_category: (none - uses question category)
  → value: 1
  → scores to 2.2.2
```

**Example 3: Cross-Category Question**
```
Question: "How do you handle relationship conflicts?"
Category: 2.3 (关系模式)

Answer A: "I avoid them completely"
  → sub_category: 2.3.1.3 (回避型依恋)
  → value: 4
  → scores to 2.3.1.3

Answer B: "I get very anxious"
  → sub_category: 2.1 (情绪觉察)
  → value: 3
  → scores to 2.1 (cross-category!)

Answer C: "I try to understand both sides"
  → sub_category: 2.3.3 (共情能力)
  → value: 5
  → scores to 2.3.3
```

---

## Report Generation

### Aggregation Strategy

**Level 1: Collect all scores**
```python
category_scores = {
    "2.1": 15,
    "2.2.2.1": 8,
    "2.2.2.3": 12,
    "2.3.1.3": 6,
    "2.3.3": 10,
    # ... etc
}
```

**Level 2: Roll up to main dimensions**
```python
dimension_scores = {
    "2.1": 15,  # Direct
    "2.2": 8 + 12 = 20,  # Sum of 2.2.x sub-categories
    "2.3": 6 + 10 = 16,  # Sum of 2.3.x sub-categories
    "2.4": 0,
    "2.5": 0
}
```

**Level 3: Generate detailed insights**
- Show main dimension scores
- Show sub-category breakdown
- Identify dominant patterns (e.g., "主要表现为灾难化思维")

---

## Implementation Notes

### Database Schema
```python
# Question
category: str  # e.g., "2.2.2" or "2.3"

# Answer Option
sub_category: Optional[str]  # e.g., "2.2.2.1" or None
value: int  # Score value
```

### Validation Rules
1. Question category MUST be valid code from hierarchy
2. Answer sub_category (if set) SHOULD be under question's category tree
3. Answer sub_category CAN be from different dimension (cross-category scoring)

### UI Considerations
1. Category dropdown: Show hierarchical structure
2. Sub-category dropdown: Filter by question's category (but allow "Other")
3. Visual indicator when answer has different sub-category than question

---

**Last Updated**: February 8, 2026
**Version**: 1.0
