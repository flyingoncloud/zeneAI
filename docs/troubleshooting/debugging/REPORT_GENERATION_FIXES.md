# 报告生成问题修复

## 问题 1: 图表中中文字符无法显示

### 根本原因
`drawing_utils.py` 中的字体配置仍然使用 `DejaVu Sans`，该字体不支持中文字符。

### 解决方案
已更新字体配置，按优先级尝试多个中文字体：

```python
plt.rcParams['font.sans-serif'] = [
    'PingFang SC', 'Heiti TC', 'STHeiti',  # macOS
    'Microsoft YaHei', 'SimHei',  # Windows
    'WenQuanYi Zen Hei', 'Noto Sans CJK SC',  # Linux
    'DejaVu Sans'  # Fallback
]
```

### 需要的操作
**重启后端并重新生成报告**，新的字体配置才会生效：
```bash
cd ai-chat-api
python run.py
```

---

## 问题 2: DOCX 中显示 `[图片: image5.png]` 等缺失图片

### 根本原因
DOCX 生成器使用的是 **模板文件** (`ZeneMe - 内视觉察专业报告.md`)，该模板包含许多占位符图片引用：
- `extracted_images/image5.png`
- `extracted_images/image1.jpg`
- `extracted_images/image24.png`
- 等等...

这些图片不存在，只是模板中的占位符。

### 实际生成的图表
系统只生成 4 个图表：
1. `radar_chart.png` - 五大核心心智雷达图
2. `perspective_bar_chart.png` - 视角转换能力
3. `relational_rating_scale.png` - 关系模式维度评分
4. `growth_bar_chart.png` - 成长潜能分析

### 解决方案选项

#### 选项 A: 修改 DOCX 生成器使用生成的 Markdown（推荐）
让 DOCX 生成器使用 `markdown_generator.py` 生成的 markdown，而不是模板文件。

**优点:**
- 只包含实际存在的图表
- Markdown 和 DOCX 内容一致
- 不会有缺失图片的占位符

**实现步骤:**
1. 修改 `report_assembler.py` 中的报告生成流程
2. 先生成 markdown
3. 使用生成的 markdown 作为 DOCX 生成器的输入

#### 选项 B: 创建占位符图片
为模板中的所有图片引用创建占位符图片。

**缺点:**
- 需要创建大量占位符图片
- 报告中会有无意义的占位符
- 维护成本高

#### 选项 C: 清理模板文件
从模板中删除所有不存在的图片引用。

**缺点:**
- 模板可能用于其他目的
- 需要手动维护模板

### 推荐实现（选项 A）

修改 `report_assembler.py` 的报告生成流程：

```python
# Step 6: Generate Markdown report
markdown_path = generate_psychology_report_markdown(
    report_data=report_data,
    output_dir=reports_dir,
    report_id=report_id,
    charts_dir=charts_dir
)

# Step 7: Generate DOCX from the generated markdown (not template)
with open(markdown_path, 'r', encoding='utf-8') as f:
    generated_markdown = f.read()

docx_path = docx_generator.generate_docx(
    report_data=report_data,  # Still pass data for metadata
    output_path=docx_output_path,
    charts_dir=charts_dir,
    markdown_content=generated_markdown  # Use generated markdown
)
```

然后修改 `docx_generator.py` 的 `generate_docx` 方法接受可选的 `markdown_content` 参数。

---

## 当前状态

### 已修复
✅ **问题 1**: 字体配置已更新（需要重启后端）
✅ **问题 2**: `markdown_generator.py` 已恢复（文件被意外删除）

### 待修复
⏳ **问题 2**: DOCX 生成器仍使用模板文件，需要实现选项 A

---

## 测试步骤

1. **重启后端**
   ```bash
   cd ai-chat-api
   python run.py
   ```

2. **重新生成报告**
   - 在前端完成问卷
   - 生成新的心理报告

3. **验证修复**
   - 检查图表中的中文字符是否正常显示
   - 检查 DOCX 中是否还有 `[图片: imageX.png]` 占位符

---

## 相关文件

- `ai-chat-api/src/resources/drawing_utils.py` - 图表生成（字体配置）
- `ai-chat-api/src/services/psychology/markdown_generator.py` - Markdown 报告生成
- `ai-chat-api/src/services/psychology/docx_generator.py` - DOCX 报告生成
- `ai-chat-api/src/services/psychology/report_assembler.py` - 报告组装流程
- `ai-chat-api/src/resources/ZeneMe - 内视觉察专业报告.md` - 模板文件（包含占位符图片）
