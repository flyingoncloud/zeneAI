# Image Rename - COMPLETED ✅

## Summary

Successfully renamed all image references in the psychology report template from generic names (image1.jpg, image2.png, etc.) to meaningful, descriptive names in Chinese.

## Image Rename Mapping

| Section | Old Name | New Name | Description |
|---------|----------|----------|-------------|
| 1.2 雷达图 | `radar_chart.png` | `radar_chart.png` | ✅ Already meaningful |
| 2.1 情绪觉察 | `image5.png` | `emotional_insight_status.png` | 情绪觉察状态图 |
| 2.2.1 内在系统 | `image1.jpg` | `inner_system_roles.jpg` | 内在系统角色图 |
| 2.2.2 自动思维 | `image2.png` | `automatic_thought_patterns.png` | 自动思维模式图 |
| 2.2.3 视角转换 | `perspective_bar_chart.png` | `perspective_bar_chart.png` | ✅ Already meaningful |
| 2.2.4 叙事结构 | `image6.png` | `narrative_structure_types.png` | 叙事结构类型图 |
| 2.3 关系模式 | `relational_rating_scale.png` | `relational_rating_scale.png` | ✅ Already meaningful |
| 2.3.1 依恋结构 | `image12.png` | `attachment_pattern_types.png` | 依恋结构模式图 |
| 2.3.2 冲突触发点 | `image7.png` | `conflict_triggers_map.png` | 冲突触发点关系图 |
| 2.3.3 共情能力 | `image8.png` | `empathy_dimensions.png` | 共情能力维度图 |
| 2.3.4 内在冲突 | `image13.png` | `inner_conflict_level.png` | 内在冲突度图 |
| 2.4 性格类型 | `image4.jpg` | `personality_style_type.jpg` | 性格类型图 |
| 2.5 成长潜能 | `growth_bar_chart.png` | `growth_bar_chart.png` | ✅ Already meaningful |
| 3.0 发展建议 | `image9.png` | `development_plan_header.png` | 发展建议标题图 |

## Changes Made

### Renamed Images (8 total)

1. **情绪觉察状态图** (Emotional Insight Status)
   - Old: `image5.png`
   - New: `emotional_insight_status.png`
   - Shows emotional recognition, regulation, and risk status

2. **内在系统角色图** (Inner System Roles)
   - Old: `image1.jpg`
   - New: `inner_system_roles.jpg`
   - Shows IFS parts (Managers, Firefighters, Exiles, Self)

3. **自动思维模式图** (Automatic Thought Patterns)
   - Old: `image2.png`
   - New: `automatic_thought_patterns.png`
   - Shows cognitive distortion patterns

4. **叙事结构类型图** (Narrative Structure Types)
   - Old: `image6.png`
   - New: `narrative_structure_types.png`
   - Shows narrative identity types (Hero, Victim, Rebel, Lost, Explorer)

5. **依恋结构模式图** (Attachment Pattern Types)
   - Old: `image12.png`
   - New: `attachment_pattern_types.png`
   - Shows attachment styles (Secure, Anxious, Avoidant, Disorganized)

6. **冲突触发点关系图** (Conflict Triggers Map)
   - Old: `image7.png`
   - New: `conflict_triggers_map.png`
   - Shows relationship conflict trigger network

7. **共情能力维度图** (Empathy Dimensions)
   - Old: `image8.png`
   - New: `empathy_dimensions.png`
   - Shows empathy dimensions (Emotional, Cognitive, Behavioral)

8. **内在冲突度图** (Inner Conflict Level)
   - Old: `image13.png`
   - New: `inner_conflict_level.png`
   - Shows internal conflict intensity

9. **性格类型图** (Personality Style Type)
   - Old: `image4.jpg`
   - New: `personality_style_type.jpg`
   - Shows personality type classification

10. **发展建议标题图** (Development Plan Header)
    - Old: `image9.png`
    - New: `development_plan_header.png`
    - Header image for Part 3

### Already Meaningful (4 total)

These images already had descriptive names and were not changed:
- `radar_chart.png` - Five dimensions radar chart
- `perspective_bar_chart.png` - Perspective shifting bar chart
- `relational_rating_scale.png` - Relational sensitivity rating scale
- `growth_bar_chart.png` - Growth potential bar chart

## Benefits

1. **Better Maintainability**: Developers can easily identify which image corresponds to which section
2. **Clearer Documentation**: Image names now describe their content
3. **Easier Debugging**: When images are missing or broken, the filename indicates what should be there
4. **Bilingual Support**: Alt text in Chinese, filename in English for international compatibility

## Template Updates

All image references in the template now use the format:
```markdown
![中文描述](extracted_images/descriptive_english_name.png)
```

Example:
```markdown
![情绪觉察状态图](extracted_images/emotional_insight_status.png)
```

## Next Steps

When generating reports, the DOCX generator should:
1. Use these new filenames when saving chart images
2. Update the chart generation functions to use the new naming convention
3. Ensure all images are saved with the correct names in the `extracted_images/` directory

## Files Modified

✅ `ai-chat-api/src/resources/ZeneMe - 内视觉察专业报告.md`
- Renamed 10 image references
- Maintained 4 already-meaningful names
- All images now have descriptive names

## Related Files to Update

The following files generate charts and should be updated to use the new naming convention:

📋 `ai-chat-api/src/resources/drawing_utils.py`
- Update `draw_radar_chart()` - already uses `radar_chart.png` ✅
- Update `draw_perspective_bar_chart()` - already uses `perspective_bar_chart.png` ✅
- Update `draw_relational_rating_scale()` - already uses `relational_rating_scale.png` ✅
- Update `draw_growth_bar_chart()` - already uses `growth_bar_chart.png` ✅

📋 Static images (if they exist in the codebase):
- `emotional_insight_status.png` (was image5.png)
- `inner_system_roles.jpg` (was image1.jpg)
- `automatic_thought_patterns.png` (was image2.png)
- `narrative_structure_types.png` (was image6.png)
- `attachment_pattern_types.png` (was image12.png)
- `conflict_triggers_map.png` (was image7.png)
- `empathy_dimensions.png` (was image8.png)
- `inner_conflict_level.png` (was image13.png)
- `personality_style_type.jpg` (was image4.jpg)
- `development_plan_header.png` (was image9.png)

These static images should be renamed in the actual image directory to match the new naming convention.
