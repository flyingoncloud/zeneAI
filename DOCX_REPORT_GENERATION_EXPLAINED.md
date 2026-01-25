# DOCX Report Generation - Complete Explanation

## Overview

The DOCX (Word document) report is generated using the `python-docx` library, which creates Microsoft Word documents programmatically. The process converts structured report data into a professionally formatted Word document with Chinese text, tables, and embedded chart images.

## Generation Flow

```
Report Data (Python Dict)
    ↓
Markdown Template (Jinja2)
    ↓
Rendered Markdown Text
    ↓
Parse & Convert to DOCX
    ↓
Add Charts (PNG Images)
    ↓
Save DOCX File
```

## Step-by-Step Process

### Step 1: Data Preparation
The report data is assembled from the database and includes:
- Five core dimension scores
- IFS parts analysis
- Cognitive patterns
- Attachment styles
- AI-generated analysis texts
- Personality classification
- Recommendations

### Step 2: Template Rendering (Jinja2)
```python
# Load markdown template
template_path = "resources/ZeneMe - 内视觉察专业报告.md"
with open(template_path, 'r', encoding='utf-8') as f:
    template_content = f.read()

# Render with Jinja2
template = Template(template_content)
rendered_markdown = template.render(report_data)
```

**What Jinja2 does:**
- Replaces variables like `{{ emotional_regulation_score }}` with actual values
- Handles loops: `{% for part in ifs_parts %}`
- Conditional content: `{% if has_dominant_pattern %}`
- Generates complete markdown text with all data filled in

### Step 3: Create DOCX Document
```python
from docx import Document

doc = Document()

# Set Chinese font support
style = doc.styles['Normal']
font = style.font
font.name = 'SimSun'  # Chinese font
font.size = Pt(11)
```

### Step 4: Parse Markdown → DOCX Conversion

The generator reads the markdown line by line and converts each element:

#### A. Headers (# ## ###)
```python
def _add_heading(self, doc: Document, line: str):
    # Count # symbols to determine level
    level = line.count('#', 0, line.index(' '))
    heading_text = line[level:].strip()

    # Add heading
    heading = doc.add_heading(heading_text, level=level)

    # Style for level 1 (main title)
    if level == 1:
        heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run.font.size = Pt(18)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0, 0, 139)  # Dark blue
```

**Example:**
```markdown
# ZeneMe 心理洞察报告
```
→ Centered, 18pt, bold, dark blue heading

#### B. Tables (| col1 | col2 |)
```python
def _add_table(self, doc: Document, table_lines: list):
    # Parse markdown table
    rows = []
    for line in table_lines:
        if not line.startswith('|---'):  # Skip separator
            cells = [cell.strip() for cell in line.split('|')]
            cells = [c for c in cells if c]  # Remove empty
            rows.append(cells)

    # Create DOCX table
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = 'Light Grid Accent 1'

    # Fill cells
    for i, row_data in enumerate(rows):
        for j, cell_text in enumerate(row_data):
            table.rows[i].cells[j].text = cell_text

            # Bold header row
            if i == 0:
                for run in cell.paragraphs[0].runs:
                    run.font.bold = True
```

**Example:**
```markdown
| 维度 | 得分 | 水平 |
|------|------|------|
| 情绪调节 | 75 | 良好 |
| 认知灵活 | 82 | 优秀 |
```
→ Professional table with bold headers

#### C. Images (![alt](path))
```python
def _add_image(self, doc: Document, line: str, charts_dir: str):
    # Extract image path: ![alt](path)
    match = re.match(r'!\[.*?\]\((.*?)\)', line)
    image_path = match.group(1)

    # Resolve full path
    if charts_dir:
        image_path = os.path.join(charts_dir, os.path.basename(image_path))

    # Add image to document
    if os.path.exists(image_path):
        doc.add_picture(image_path, width=Inches(5.5))
        last_paragraph = doc.paragraphs[-1]
        last_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
```

**Example:**
```markdown
![五大核心心智雷达图](charts/report_5/radar_chart.png)
```
→ Centered image, 5.5 inches wide

#### D. Lists (- item or * item)
```python
def _add_list_item(self, doc: Document, line: str):
    # Remove list marker
    if line.startswith('- ') or line.startswith('* '):
        text = line[2:].strip()
        style = 'List Bullet'
    elif re.match(r'^\d+\.', line):
        text = re.sub(r'^\d+\.\s*', '', line)
        style = 'List Number'

    # Add paragraph with list style
    doc.add_paragraph(text, style=style)
```

**Example:**
```markdown
- 情绪调节能力良好
- 认知灵活性较高
- 关系敏感度中等
```
→ Bulleted list in Word

#### E. Inline Formatting (**bold**, *italic*)
```python
def _apply_inline_formatting(self, paragraph):
    text = paragraph.text
    paragraph.clear()

    # Handle bold (**text**)
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            run.font.bold = True
        else:
            # Handle italic (*text*)
            # ... similar logic
            paragraph.add_run(part)
```

**Example:**
```markdown
**情绪调节得分:** 75/100
```
→ "情绪调节得分:" is bold, "75/100" is normal

#### F. Horizontal Rules (---)
```python
def _add_horizontal_rule(self, doc: Document):
    # Use Unicode line character
    p = doc.add_paragraph('─' * 80)
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(6)
    for run in p.runs:
        run.font.color.rgb = RGBColor(192, 192, 192)
        run.font.size = Pt(8)
```

**Example:**
```markdown
---
```
→ Gray horizontal line separator

### Step 5: Embed Chart Images

Charts are generated separately as PNG files:

```python
# Generate charts (in psychology_report_routes.py)
charts_dir = base_dir / "reports" / "charts" / f"report_{report_id}"
charts_dir.mkdir(parents=True, exist_ok=True)

draw_radar_chart(report_data, str(charts_dir / "radar_chart.png"))
draw_perspective_bar_chart(report_data, str(charts_dir / "perspective_bar_chart.png"))
draw_relational_rating_scale(report_data, str(charts_dir / "relational_rating_scale.png"))
draw_growth_bar_chart(report_data, str(charts_dir / "growth_bar_chart.png"))
```

Then embedded in DOCX:
```python
# When parsing markdown image syntax
doc.add_picture(image_path, width=Inches(5.5))
```

### Step 6: Save DOCX File

```python
output_path = Path(output_dir) / f"psychology_report_{report_id}.docx"
output_path.parent.mkdir(parents=True, exist_ok=True)
doc.save(str(output_path))
```

## Complete Example

### Input: Report Data
```python
report_data = {
    'mind_indices': {
        'emotional_regulation': 75,
        'cognitive_flexibility': 82,
        'relational_sensitivity': 68,
        'inner_conflict': 45,
        'growth_potential': 78
    },
    'emotional_insight': {
        'regulation_score': 75,
        'ifs_parts': {
            'dominant_part': {
                'name': '保护者',
                'description': '这个部分致力于保护你...'
            }
        },
        'ai_analysis': '你的情绪调节能力整体良好...'
    },
    # ... more data
}
```

### Output: DOCX Document Structure

```
┌─────────────────────────────────────────┐
│   ZeneMe 心理洞察报告                    │  ← Heading 1 (centered, blue)
│                                         │
│   报告编号: 5                            │  ← Paragraph (bold)
│   生成时间: 2026年01月21日               │
│                                         │
│   ─────────────────────────────────     │  ← Horizontal rule
│                                         │
│   执行摘要                               │  ← Heading 2
│                                         │
│   这是一份综合心理评估报告...            │  ← Paragraph
│                                         │
│   核心发现                               │  ← Heading 3
│   • 情绪调节能力良好                     │  ← Bullet list
│   • 认知灵活性较高                       │
│                                         │
│   五大核心心智维度                       │  ← Heading 2
│                                         │
│   [Radar Chart Image]                   │  ← Embedded PNG (centered)
│                                         │
│   ┌──────┬──────┬──────┐               │  ← Table
│   │ 维度 │ 得分 │ 水平 │               │
│   ├──────┼──────┼──────┤               │
│   │情绪调节│ 75  │ 良好 │               │
│   │认知灵活│ 82  │ 优秀 │               │
│   └──────┴──────┴──────┘               │
│                                         │
│   情绪觉察分析                           │  ← Heading 2
│                                         │
│   情绪调节得分: 75/100                   │  ← Paragraph (bold inline)
│                                         │
│   ... (continues)                       │
└─────────────────────────────────────────┘
```

## Key Libraries Used

### 1. python-docx
```python
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
```

**Features:**
- Create Word documents programmatically
- Add headings, paragraphs, tables, images
- Style text (font, size, color, bold, italic)
- Set alignment, spacing, indentation

### 2. Jinja2
```python
from jinja2 import Template

template = Template(markdown_content)
rendered = template.render(report_data)
```

**Features:**
- Template engine for text generation
- Variable substitution: `{{ variable }}`
- Loops: `{% for item in items %}`
- Conditionals: `{% if condition %}`

### 3. Regular Expressions (re)
```python
import re

# Parse markdown syntax
match = re.match(r'!\[.*?\]\((.*?)\)', line)  # Images
parts = re.split(r'(\*\*.*?\*\*)', text)      # Bold text
```

## Font Handling for Chinese

### Problem:
Default fonts in python-docx don't support Chinese characters.

### Solution:
```python
# Set Chinese font
style = doc.styles['Normal']
font = style.font
font.name = 'SimSun'  # 宋体 - supports Chinese

# For East Asian text
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
```

**Supported Chinese Fonts:**
- SimSun (宋体) - Default
- SimHei (黑体) - Bold
- Microsoft YaHei (微软雅黑) - Modern
- KaiTi (楷体) - Calligraphic

## Chart Generation

Charts are created using matplotlib with Chinese font support:

```python
# In drawing_utils.py
import matplotlib.pyplot as plt
import matplotlib

# Set Chinese font
matplotlib.rcParams['font.sans-serif'] = ['PingFang SC', 'Heiti TC', ...]
matplotlib.rcParams['axes.unicode_minus'] = False

# Create chart
fig, ax = plt.subplots(figsize=(8, 6))
ax.plot(data)
plt.savefig('chart.png', dpi=300, bbox_inches='tight')
```

## File Structure

```
ai-chat-api/
├── src/
│   ├── services/
│   │   └── psychology/
│   │       ├── docx_generator.py          ← DOCX generation logic
│   │       ├── markdown_generator.py      ← Markdown generation
│   │       └── report_assembler.py        ← Data assembly
│   ├── resources/
│   │   ├── ZeneMe - 内视觉察专业报告.md    ← Markdown template
│   │   └── drawing_utils.py               ← Chart generation
│   └── api/
│       └── psychology_report_routes.py    ← API endpoints
└── reports/
    ├── generated/
    │   ├── psychology_report_5.docx       ← Generated DOCX
    │   └── psychology_report_5.md         ← Generated Markdown
    └── charts/
        └── report_5/
            ├── radar_chart.png            ← Chart images
            ├── perspective_bar_chart.png
            ├── relational_rating_scale.png
            └── growth_bar_chart.png
```

## Advantages of This Approach

### 1. Template-Based
- Easy to modify report structure
- Separate content from formatting
- Reusable templates

### 2. Markdown as Intermediate Format
- Human-readable
- Version control friendly
- Easy to debug
- Can generate multiple formats (DOCX, PDF, HTML)

### 3. Modular Design
- Data assembly separate from rendering
- Chart generation independent
- Easy to test each component

### 4. Chinese Language Support
- Proper font handling
- UTF-8 encoding throughout
- Chart labels in Chinese

## Common Issues & Solutions

### Issue 1: Chinese Characters Not Displaying
**Solution:** Set proper font in document styles
```python
font.name = 'SimSun'
style.element.rPr.rFonts.set(qn('w:eastAsia'), 'SimSun')
```

### Issue 2: Images Not Embedding
**Solution:** Check file paths and existence
```python
if os.path.exists(image_path):
    doc.add_picture(image_path, width=Inches(5.5))
else:
    doc.add_paragraph(f"[图片: {os.path.basename(image_path)}]")
```

### Issue 3: Table Formatting Issues
**Solution:** Use built-in table styles
```python
table.style = 'Light Grid Accent 1'
```

### Issue 4: Horizontal Rule Not Supported
**Solution:** Use Unicode line character instead
```python
p = doc.add_paragraph('─' * 80)
```

## Testing the Generator

```python
# Test with sample data
from src.services.psychology.docx_generator import generate_psychology_report_docx

report_data = {
    'mind_indices': {...},
    'emotional_insight': {...},
    # ... complete data
}

docx_path = generate_psychology_report_docx(
    report_data=report_data,
    output_dir="reports/test",
    report_id=999,
    charts_dir="reports/charts/report_999"
)

print(f"DOCX generated: {docx_path}")
```

## Summary

The DOCX report generation is a multi-step process:

1. **Assemble Data** → Structured Python dictionary
2. **Render Template** → Jinja2 fills markdown template
3. **Parse Markdown** → Line-by-line conversion
4. **Convert to DOCX** → python-docx creates Word elements
5. **Embed Charts** → PNG images inserted
6. **Save File** → Final DOCX document

The result is a professional, formatted Word document with Chinese text, tables, charts, and proper styling that can be opened in Microsoft Word, Google Docs, or any DOCX-compatible application.
