# Emotional Awareness Sub-Categories Enhancement

## Date: 2026-02-21

## Overview
Added sub-category analysis for 2.1 情绪觉察 (Emotional Awareness) dimension to provide more detailed insights into emotional capabilities.

## Changes Made

### 1. Category Hierarchy Update
**File**: `zeneme-next/src/data/categoryHierarchy.ts`

Added three sub-categories under 2.1:

```typescript
"2.1": {
  code: "2.1",
  name: "情绪觉察",
  nameEn: "Emotional Awareness",
  description: "Ability to recognize and understand emotions",
  children: {
    "2.1.1": {
      code: "2.1.1",
      name: "情绪识别与表达",
      nameEn: "Emotion Recognition and Expression",
      description: "Ability to identify and express emotions"
    },
    "2.1.2": {
      code: "2.1.2",
      name: "情绪调节与恢复",
      nameEn: "Emotion Regulation and Recovery",
      description: "Ability to regulate emotions and recover from distress"
    },
    "2.1.3": {
      code: "2.1.3",
      name: "情绪倾向与风险",
      nameEn: "Emotional Tendencies and Risks",
      description: "Emotional patterns and potential risks"
    }
  }
}
```

### 2. Sub-Category Analyzer Update
**File**: `ai-chat-api/src/services/psychology/subcategory_analyzer.py`

#### Added Metadata for 2.1 Sub-Categories

**2.1.1 - 情绪识别与表达 (Emotion Recognition and Expression)**
- High Activity: Strong ability to identify and express emotions clearly, foundation for emotional health
- Low Activity: Difficulty recognizing or expressing emotions, may lead to emotional buildup

**2.1.2 - 情绪调节与恢复 (Emotion Regulation and Recovery)**
- High Activity: Effective emotional management and quick recovery from negative emotions
- Low Activity: Difficulty calming down or slow recovery from negative emotions

**2.1.3 - 情绪倾向与风险 (Emotional Tendencies and Risks)**
- High Activity: Presence of concerning emotional patterns or risks (mood swings, negative spirals)
- Low Activity: Stable and healthy emotional patterns with minimal extreme reactions

#### Updated Analysis Function
Added '2.1' to `CATEGORIES_WITH_SUBCATEGORIES` list to enable analysis:

```python
CATEGORIES_WITH_SUBCATEGORIES = [
    '2.1',    # Emotional Awareness (NEW)
    '2.2.1',  # Internal System Analysis
    '2.2.2',  # Automatic Thought Patterns
    '2.2.3',  # Perspective Shifting
    '2.2.4',  # Narrative Structure
    '2.3.1',  # Attachment Structure
    '2.5',    # Growth Potential
]
```

### 3. Report Template Update
**File**: `ai-chat-api/src/resources/ZeneMe - 内视觉察专业报告.md`

Added sub-category analysis section in 2.1:

```markdown
{% if subcategory_analysis['2.1'] %}
**子类别活跃度分析**：

在情绪觉察维度中，你的**{{subcategory_analysis['2.1'].highest_subcategory.name}}**能力最为突出（{{subcategory_analysis['2.1'].highest_subcategory.score}}分），{{subcategory_analysis['2.1'].highest_subcategory.interpretation}}

而**{{subcategory_analysis['2.1'].lowest_subcategory.name}}**相对较弱（{{subcategory_analysis['2.1'].lowest_subcategory.score}}分），{{subcategory_analysis['2.1'].lowest_subcategory.interpretation}}
{% endif %}
```

## Sub-Category Descriptions

### 2.1.1 情绪识别与表达
**Purpose**: Measures ability to identify and articulate emotions

**High Score Interpretation**:
- Clear emotional awareness
- Effective emotional expression
- Strong foundation for emotional health
- Good self-understanding and communication

**Low Score Interpretation**:
- Difficulty identifying emotions
- Challenges expressing feelings appropriately
- May lead to emotional buildup
- Communication difficulties

**Recommendations**:
- Build emotional vocabulary
- Practice naming emotions
- Journaling exercises
- Emotional expression practice

### 2.1.2 情绪调节与恢复
**Purpose**: Measures ability to manage and recover from emotional distress

**High Score Interpretation**:
- Effective emotional management
- Quick recovery from negative emotions
- Multiple healthy regulation strategies
- Good stress resilience

**Low Score Interpretation**:
- Difficulty calming down when upset
- Slow recovery from negative emotions
- Limited regulation strategies
- May need skill development

**Recommendations**:
- Learn emotion regulation techniques
- Practice mindfulness
- Cognitive reframing exercises
- Develop healthy coping strategies

### 2.1.3 情绪倾向与风险
**Purpose**: Identifies emotional patterns and potential risks

**High Score Interpretation** (Risk Indicator):
- Concerning emotional patterns present
- Mood instability or volatility
- Tendency toward negative spirals
- May benefit from professional support

**Low Score Interpretation** (Healthy):
- Stable emotional patterns
- Minimal extreme reactions
- Healthy emotional baseline
- Good emotional health indicator

**Recommendations for High Scores**:
- Seek professional support if needed
- Monitor emotional patterns
- Develop crisis management strategies
- Build support network

## Integration with Existing System

### Data Flow
1. Questions are assigned to sub-categories (2.1.1, 2.1.2, 2.1.3)
2. Scoring system calculates scores for each sub-category
3. `subcategory_analyzer.py` analyzes patterns and identifies highest/lowest
4. `report_assembler.py` includes analysis in report data
5. Template renders sub-category insights in section 2.1

### Consistency with Other Dimensions
This follows the same pattern as:
- 2.2.1 (IFS Parts)
- 2.2.2 (Automatic Thoughts)
- 2.2.3 (Perspective Shifting)
- 2.2.4 (Narrative Types)
- 2.3.1 (Attachment Styles)
- 2.5 (Growth Dimensions)

## Testing Recommendations

1. **Data Validation**:
   - Verify questions are properly assigned to 2.1.1, 2.1.2, 2.1.3
   - Check that scores are calculated correctly for each sub-category
   - Ensure sub-category scores roll up to 2.1 main score

2. **Analysis Testing**:
   - Test with various score patterns
   - Verify highest/lowest identification works correctly
   - Check interpretation text is appropriate

3. **Template Rendering**:
   - Generate reports with 2.1 sub-category data
   - Verify conditional rendering works ({% if subcategory_analysis['2.1'] %})
   - Check formatting and readability

4. **Integration Testing**:
   - Test complete flow from questionnaire to report
   - Verify all 7 sub-category analyses render correctly
   - Check DOCX generation includes new section

## Files Modified

1. `zeneme-next/src/data/categoryHierarchy.ts` - Added 2.1 sub-categories
2. `ai-chat-api/src/services/psychology/subcategory_analyzer.py` - Added metadata and enabled analysis
3. `ai-chat-api/src/resources/ZeneMe - 内视觉察专业报告.md` - Added template section

## Related Documentation

- `docs/features/inner-quick-test/PART2_ENHANCEMENT_COMPLETE.md` - Previous enhancement work
- `docs/features/inner-quick-test/CHART_FIXES_COMPLETE.md` - Chart display fixes
- `CATEGORY_TO_DIMENSION_MAPPING.md` - Category structure reference
- `CATEGORY_HIERARCHY.md` - Full hierarchy documentation

## Next Steps

1. Assign existing questions to appropriate 2.1 sub-categories
2. Test scoring with real questionnaire data
3. Verify report generation includes 2.1 sub-category analysis
4. Review interpretations with psychology experts
5. Consider adding visualization for 2.1 sub-categories (similar to other dimensions)

## Notes

- The 2.1.3 (Emotional Tendencies and Risks) sub-category is designed as a risk indicator
- High scores on 2.1.3 suggest areas of concern, unlike other sub-categories where high is positive
- This aligns with clinical assessment practices where risk factors are tracked separately
- Interpretations should be reviewed by psychology professionals before production use
