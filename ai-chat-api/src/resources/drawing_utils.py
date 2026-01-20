import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for background threads
import matplotlib.pyplot as plt
import numpy as np
import os

# Set font for Chinese characters
plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

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

    fig, ax = plt.subplots(figsize=(6, 6), subplot_kw=dict(polar=True))
    ax.fill(angles, values, color='blue', alpha=0.25)
    ax.plot(angles, values, color='blue', linewidth=2)
    ax.set_yticklabels([])
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(labels)
    plt.title('五大核心心智雷达图', size=15, color='blue', y=1.1)
    plt.savefig(output_path)
    plt.close()

def draw_perspective_bar_chart(data, output_path):
    details = data['cognitive_insight']['perspective_shifting']['details']
    labels = ['自我-他人', '空间视角', '认知框架', '情绪视角']
    values = [details['self_other'], details['spatial'], details['cognitive_frame'], details['emotional']]

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(labels, values, color='skyblue')
    ax.set_ylim(0, 100)
    ax.set_ylabel('得分')
    ax.set_title('视角转换能力细分')

    for i, v in enumerate(values):
        ax.text(i, v + 1, str(v), ha='center')

    plt.tight_layout()
    plt.savefig(output_path)
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

    fig, ax = plt.subplots(figsize=(10, 5))
    y_pos = np.arange(len(labels))

    # Draw background bars (0-100)
    ax.barh(y_pos, [100]*len(labels), color='#f0f0f0', height=0.5, edgecolor='gray', alpha=0.5)
    # Draw actual value bars
    colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']
    bars = ax.barh(y_pos, values, color=colors, height=0.5)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(labels, fontsize=12)
    ax.set_xlim(0, 100)
    ax.set_xlabel('得分 (0-100)', fontsize=10)
    ax.set_title('关系模式维度评分 (Relational Insight Rating Scale)', fontsize=14, pad=20)

    # Add value labels on the bars
    for i, v in enumerate(values):
        ax.text(v + 1, i, f'{v}', va='center', fontweight='bold', fontsize=11)

    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()

def draw_growth_bar_chart(data, output_path):
    labels = ['洞察深度', '内在可塑性', '心灵韧性']
    values = [
        data['growth_potential']['insight_depth'],
        data['growth_potential']['psychological_plasticity'],
        data['growth_potential']['resilience']
    ]

    fig, ax = plt.subplots(figsize=(8, 5))
    colors = ['#4CAF50', '#2196F3', '#FFC107']
    bars = ax.bar(labels, values, color=colors)
    ax.set_ylim(0, 100)
    ax.set_ylabel('得分')
    ax.set_title('成长指数与变化潜能分析')

    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 1, f'{height}', ha='center', va='bottom')

    plt.tight_layout()
    plt.savefig(output_path)
    plt.close()
