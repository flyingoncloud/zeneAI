import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for background threads
import matplotlib.pyplot as plt
import numpy as np
import os
from matplotlib.font_manager import FontProperties, findfont, FontManager
import logging

logger = logging.getLogger(__name__)

# Set font for Chinese characters
def setup_chinese_font():
    """Setup Chinese font for matplotlib with better detection"""
    # Try multiple Chinese fonts in order of preference
    chinese_fonts = [
        'SimHei',           # 黑体 (Windows)
        'Microsoft YaHei',  # 微软雅黑 (Windows)
        'PingFang SC',      # 苹方 (macOS)
        'Heiti SC',         # 黑体-简 (macOS)
        'STHeiti',          # 华文黑体 (macOS)
        'WenQuanYi Micro Hei',  # 文泉驿微米黑 (Linux)
        'Noto Sans CJK SC', # 思源黑体 (Linux)
        'Arial Unicode MS'  # Fallback
    ]

    # Get available fonts
    fm = FontManager()
    available_fonts = set([f.name for f in fm.ttflist])

    # Try to find a Chinese font
    font_found = None
    for font in chinese_fonts:
        if font in available_fonts:
            font_found = font
            logger.info(f"Using Chinese font: {font}")
            break

    if font_found:
        plt.rcParams['font.sans-serif'] = [font_found]
        plt.rcParams['axes.unicode_minus'] = False
        return True
    else:
        # Log warning but continue with default
        logger.warning("No Chinese font found. Chinese characters may display as boxes. Available fonts: " + str(list(available_fonts)[:10]))
        plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False
        return False

# Setup font on module import
setup_chinese_font()

def draw_radar_chart(data, output_path):
    labels = ['情绪调节', '认知灵活', '关系敏感', '内在冲突', '成长潜能']
    values = [
        data['mind_indices']['emotional_regulation'],
        data['mind_indices']['cognitive_flexibility'],
        data['mind_indices']['relational_sensitivity'],
        data['mind_indices']['inner_conflict'],
        data['mind_indices']['growth_potential']
    ]

    num_vars = len(labels)
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    values += values[:1]
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(5, 5), subplot_kw=dict(polar=True), dpi=100)
    ax.fill(angles, values, color='blue', alpha=0.25)
    ax.plot(angles, values, color='blue', linewidth=2)
    ax.set_yticklabels([])
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels, fontsize=10)
    plt.title('五大核心心智雷达图', size=13, color='blue', y=1.08)
    plt.tight_layout()
    plt.savefig(output_path, dpi=100, bbox_inches='tight')
    plt.close()

def draw_perspective_bar_chart(data, output_path):
    details = data['cognitive_insight']['perspective_shifting']['details']
    labels = ['自我-他人', '空间视角', '认知框架', '情绪视角']
    values = [details['self_other'], details['spatial'], details['cognitive_frame'], details['emotional']]

    fig, ax = plt.subplots(figsize=(5, 3.5), dpi=100)
    ax.bar(labels, values, color='skyblue')
    ax.set_ylim(0, 100)
    ax.set_ylabel('得分', fontsize=10)
    ax.set_title('视角转换能力细分', fontsize=12)

    for i, v in enumerate(values):
        ax.text(i, v + 1, str(v), ha='center', fontsize=9)

    plt.tight_layout()
    plt.savefig(output_path, dpi=100, bbox_inches='tight')
    plt.close()

def draw_relational_rating_scale(data, output_path):
    # For Relational Insight
    labels = ['关系敏感度', '冲突触发点', '共情能力', '内在冲突度']
    values = [
        data['relational_insight']['sensitivity_score'],
        data['relational_insight']['details']['relational_triggers'],
        data['relational_insight']['details']['empathy_index'],
        data['relational_insight']['details']['inner_conflict_level']
    ]

    fig, ax = plt.subplots(figsize=(6, 3.5), dpi=100)
    y_pos = np.arange(len(labels))

    # Draw background bars (0-100)
    ax.barh(y_pos, [100]*len(labels), color='#f0f0f0', height=0.5, edgecolor='gray', alpha=0.5)
    # Draw actual value bars
    colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']
    bars = ax.barh(y_pos, values, color=colors, height=0.5)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=10)
    ax.set_xlim(0, 100)
    ax.set_xlabel('得分 (0-100)', fontsize=9)
    ax.set_title('关系模式维度评分', fontsize=11, pad=15)

    # Add value labels on the bars
    for i, v in enumerate(values):
        ax.text(v + 1, i, f'{v}', va='center', fontweight='bold', fontsize=9)

    plt.tight_layout()
    plt.savefig(output_path, dpi=100, bbox_inches='tight')
    plt.close()

def draw_growth_bar_chart(data, output_path):
    labels = ['洞察深度', '内在可塑性', '心灵韧性']
    values = [
        data['growth_potential']['insight_depth'],
        data['growth_potential']['psychological_plasticity'],
        data['growth_potential']['resilience']
    ]

    fig, ax = plt.subplots(figsize=(5, 3.5), dpi=100)
    colors = ['#4CAF50', '#2196F3', '#FFC107']
    bars = ax.bar(labels, values, color=colors)
    ax.set_ylim(0, 100)
    ax.set_ylabel('得分', fontsize=10)
    ax.set_title('成长指数与变化潜能分析', fontsize=12)

    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 1, f'{height}', ha='center', va='bottom', fontsize=9)

    plt.tight_layout()
    plt.savefig(output_path, dpi=100, bbox_inches='tight')
    plt.close()

def draw_emotional_awareness_bar(score, labels, output_path, title=''):
    """
    Draw a horizontal bar chart for emotional awareness sub-categories.
    Creates a gradient bar from green to light green with a red dot indicator.

    Args:
        score: Score value (0-100)
        labels: List of 4 labels for the scale (e.g., ['准确', '清晰', '基础', '初步'])
        output_path: Path to save the image
        title: Optional title for the chart
    """
    fig, ax = plt.subplots(figsize=(6, 1.5), dpi=100)

    # Create gradient background (4 sections)
    colors = ['#6B8E23', '#8FBC8F', '#90EE90', '#E0F0E0']  # Dark green to light green
    section_width = 25  # Each section is 25 points (100/4)

    for i in range(4):
        ax.barh(0, section_width, left=i*section_width, height=0.3,
                color=colors[i], edgecolor='gray', linewidth=0.5)

    # Add red dot indicator at score position
    ax.plot(score, 0, 'ro', markersize=12, zorder=10)

    # Set labels at section boundaries
    label_positions = [12.5, 37.5, 62.5, 87.5]  # Middle of each section
    ax.set_xticks(label_positions)
    ax.set_xticklabels(labels, fontsize=9)

    # Remove y-axis
    ax.set_yticks([])
    ax.set_ylim(-0.5, 0.5)
    ax.set_xlim(0, 100)

    # Add title if provided
    if title:
        ax.set_title(title, fontsize=10, pad=10)

    # Remove spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_visible(True)

    plt.tight_layout()
    plt.savefig(output_path, dpi=100, bbox_inches='tight')
    plt.close()

def draw_emotion_recognition_expression(score, output_path):
    """Draw chart for 情绪识别与表达能力"""
    labels = ['准确', '清晰', '基础', '初步']
    draw_emotional_awareness_bar(score, labels, output_path, '情绪识别、表达能力')

def draw_emotion_regulation_recovery(score, output_path):
    """Draw chart for 情绪调节与恢复能力"""
    labels = ['迅速', '较快', '一般', '需要多些时间']
    draw_emotional_awareness_bar(score, labels, output_path, '情绪调节和恢复能力')

def draw_emotion_tendency_risk(score, output_path):
    """Draw chart for 情绪倾向与风险指数"""
    labels = ['稳定', '适度', '敏感', '焦虑']
    draw_emotional_awareness_bar(score, labels, output_path, '情绪倾向与风险指数')
