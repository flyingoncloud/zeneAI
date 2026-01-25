"""
Markdown Report Generator for Psychology Reports

Generates a markdown (.md) version of the psychology report
alongside the DOCX version for easy viewing and version control.
"""

from typing import Dict, Any
from pathlib import Path
from datetime import datetime


def _get_level_label(score: int) -> str:
    """Convert score to level label"""
    if score >= 80:
        return "优秀"
    elif score >= 60:
        return "良好"
    elif score >= 40:
        return "中等"
    elif score >= 20:
        return "较低"
    else:
        return "低"


def generate_psychology_report_markdown(
    report_data: Dict[str, Any],
    output_dir: str,
    report_id: int,
    charts_dir: str = None
) -> str:
    """
    Generate a markdown version of the psychology report.

    Args:
        report_data: Complete report data dictionary
        output_dir: Directory to save the markdown file
        report_id: Report ID for filename
        charts_dir: Optional directory containing chart images

    Returns:
        Path to the generated markdown file
    """

    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Generate filename
    filename = f"psychology_report_{report_id}.md"
    file_path = output_path / filename

    # Build markdown content
    md_content = []

    # Header
    md_content.append("# ZeneMe 心理洞察报告")
    md_content.append("")
    md_content.append(f"**报告编号:** {report_id}")
    md_content.append(f"**生成时间:** {datetime.now().strftime('%Y年%m月%d日 %H:%M')}")
    md_content.append("")
    md_content.append("---")
    md_content.append("")

    # Executive Summary
    md_content.append("## 执行摘要")
    md_content.append("")
    if 'executive_summary' in report_data:
        summary = report_data['executive_summary']
        md_content.append(summary.get('overview', ''))
        md_content.append("")

        if 'key_findings' in summary:
            md_content.append("### 核心发现")
            md_content.append("")
            for finding in summary['key_findings']:
                md_content.append(f"- {finding}")
            md_content.append("")

    # Mind Indices (Five Core Dimensions)
    md_content.append("## 五大核心心智维度")
    md_content.append("")

    if charts_dir:
        md_content.append(f"![五大核心心智雷达图](http://localhost:8000/charts/report_{report_id}/radar_chart.png)")
        md_content.append("")

    if 'mind_indices' in report_data:
        indices = report_data['mind_indices']

        md_content.append("| 维度 | 得分 | 水平 |")
        md_content.append("|------|------|------|")

        dimensions = [
            ('emotional_regulation', '情绪调节'),
            ('cognitive_flexibility', '认知灵活'),
            ('relational_sensitivity', '关系敏感'),
            ('inner_conflict', '内在冲突'),
            ('growth_potential', '成长潜能')
        ]

        for key, name in dimensions:
            score = indices.get(key, 0)
            level = _get_level_label(score)
            md_content.append(f"| {name} | {score} | {level} |")

        md_content.append("")

    # Emotional Insight
    md_content.append("## 情绪觉察分析")
    md_content.append("")

    if 'emotional_insight' in report_data:
        emotional = report_data['emotional_insight']

        md_content.append(f"**情绪调节得分:** {emotional.get('regulation_score', 0)}/100")
        md_content.append("")

        if 'ifs_parts' in emotional:
            md_content.append("### 内在家庭系统 (IFS) 分析")
            md_content.append("")

            parts = emotional['ifs_parts']
            if 'dominant_part' in parts:
                dominant = parts['dominant_part']
                md_content.append(f"**主导部分:** {dominant.get('name', 'N/A')}")
                md_content.append(f"**描述:** {dominant.get('description', 'N/A')}")
                md_content.append("")

            if 'all_parts' in parts:
                md_content.append("**所有识别的部分:**")
                md_content.append("")
                for part in parts['all_parts']:
                    md_content.append(f"- **{part.get('name', 'N/A')}** (强度: {part.get('intensity', 0)})")
                    if 'description' in part:
                        md_content.append(f"  - {part.get('description', '')}")
                md_content.append("")

        if 'ai_analysis' in emotional:
            md_content.append("### AI 深度分析")
            md_content.append("")
            md_content.append(emotional['ai_analysis'])
            md_content.append("")

    # Cognitive Insight
    md_content.append("## 认知模式分析")
    md_content.append("")

    if charts_dir:
        md_content.append(f"![视角转换能力](http://localhost:8000/charts/report_{report_id}/perspective_bar_chart.png)")
        md_content.append("")

    if 'cognitive_insight' in report_data:
        cognitive = report_data['cognitive_insight']

        md_content.append(f"**认知灵活性得分:** {cognitive.get('flexibility_score', 0)}/100")
        md_content.append("")

        if 'perspective_shifting' in cognitive:
            perspective = cognitive['perspective_shifting']
            md_content.append("### 视角转换能力")
            md_content.append("")

            if 'details' in perspective:
                details = perspective['details']
                md_content.append("| 维度 | 得分 |")
                md_content.append("|------|------|")
                md_content.append(f"| 自我-他人视角 | {details.get('self_other', 0)} |")
                md_content.append(f"| 空间视角 | {details.get('spatial', 0)} |")
                md_content.append(f"| 认知框架 | {details.get('cognitive_frame', 0)} |")
                md_content.append(f"| 情绪视角 | {details.get('emotional', 0)} |")
                md_content.append("")

        if 'cognitive_patterns' in cognitive:
            patterns = cognitive['cognitive_patterns']
            if 'dominant_pattern' in patterns:
                dominant = patterns['dominant_pattern']
                md_content.append("### 主导认知模式")
                md_content.append("")
                md_content.append(f"**模式:** {dominant.get('name', 'N/A')}")
                md_content.append(f"**描述:** {dominant.get('description', 'N/A')}")
                md_content.append("")

        if 'ai_analysis' in cognitive:
            md_content.append("### AI 深度分析")
            md_content.append("")
            md_content.append(cognitive['ai_analysis'])
            md_content.append("")

    # Relational Insight
    md_content.append("## 关系模式分析")
    md_content.append("")

    if charts_dir:
        md_content.append(f"![关系模式维度评分](http://localhost:8000/charts/report_{report_id}/relational_rating_scale.png)")
        md_content.append("")

    if 'relational_insight' in report_data:
        relational = report_data['relational_insight']

        md_content.append(f"**关系敏感度得分:** {relational.get('sensitivity_score', 0)}/100")
        md_content.append("")

        if 'attachment_style' in relational:
            attachment = relational['attachment_style']
            md_content.append("### 依恋风格")
            md_content.append("")
            md_content.append(f"**主要风格:** {attachment.get('primary_style', 'N/A')}")
            md_content.append(f"**描述:** {attachment.get('description', 'N/A')}")
            md_content.append("")

        if 'details' in relational:
            details = relational['details']
            md_content.append("### 关系维度详情")
            md_content.append("")
            md_content.append("| 维度 | 得分 |")
            md_content.append("|------|------|")
            md_content.append(f"| 关系触发点 | {details.get('relational_triggers', 0)} |")
            md_content.append(f"| 共情能力 | {details.get('empathy_index', 0)} |")
            md_content.append(f"| 内在冲突水平 | {details.get('inner_conflict_level', 0)} |")
            md_content.append("")

        if 'ai_analysis' in relational:
            md_content.append("### AI 深度分析")
            md_content.append("")
            md_content.append(relational['ai_analysis'])
            md_content.append("")

    # Growth Potential
    md_content.append("## 成长指数与变化潜能")
    md_content.append("")

    if charts_dir:
        md_content.append(f"![成长潜能分析](http://localhost:8000/charts/report_{report_id}/growth_bar_chart.png)")
        md_content.append("")

    if 'growth_potential' in report_data:
        growth = report_data['growth_potential']

        md_content.append(f"**总体成长潜能:** {growth.get('overall_score', 0)}/100")
        md_content.append("")

        md_content.append("### 成长维度")
        md_content.append("")
        md_content.append("| 维度 | 得分 |")
        md_content.append("|------|------|")
        md_content.append(f"| 洞察深度 | {growth.get('insight_depth', 0)} |")
        md_content.append(f"| 内在可塑性 | {growth.get('psychological_plasticity', 0)} |")
        md_content.append(f"| 心灵韧性 | {growth.get('resilience', 0)} |")
        md_content.append("")

        if 'ai_analysis' in growth:
            md_content.append("### AI 深度分析")
            md_content.append("")
            md_content.append(growth['ai_analysis'])
            md_content.append("")

    # Personality Classification
    md_content.append("## 人格分类")
    md_content.append("")

    if 'personality_classification' in report_data:
        personality = report_data['personality_classification']

        md_content.append(f"**主要人格类型:** {personality.get('primary_type', 'N/A')}")
        md_content.append(f"**描述:** {personality.get('description', 'N/A')}")
        md_content.append("")

        if 'characteristics' in personality:
            md_content.append("### 特征")
            md_content.append("")
            for char in personality['characteristics']:
                md_content.append(f"- {char}")
            md_content.append("")

    # Recommendations
    md_content.append("## 建议与行动计划")
    md_content.append("")

    if 'recommendations' in report_data:
        recommendations = report_data['recommendations']

        if 'immediate_actions' in recommendations:
            md_content.append("### 即时行动建议")
            md_content.append("")
            for action in recommendations['immediate_actions']:
                md_content.append(f"- {action}")
            md_content.append("")

        if 'long_term_goals' in recommendations:
            md_content.append("### 长期成长目标")
            md_content.append("")
            for goal in recommendations['long_term_goals']:
                md_content.append(f"- {goal}")
            md_content.append("")

        if 'resources' in recommendations:
            md_content.append("### 推荐资源")
            md_content.append("")
            for resource in recommendations['resources']:
                md_content.append(f"- {resource}")
            md_content.append("")

    # Footer
    md_content.append("---")
    md_content.append("")
    md_content.append("*本报告由 ZeneMe AI 心理分析系统生成*")
    md_content.append("")
    md_content.append("**免责声明:** 本报告仅供参考，不能替代专业心理咨询或治疗。如有严重心理问题，请寻求专业心理健康服务。")
    md_content.append("")

    # Write to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_content))

    return str(file_path)
