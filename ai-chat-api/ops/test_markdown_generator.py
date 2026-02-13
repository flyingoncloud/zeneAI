"""
Test script for markdown report generator

This script tests the markdown generator with sample data to verify it works correctly.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.services.psychology.markdown_generator import generate_psychology_report_markdown

# Sample report data
sample_report_data = {
    'executive_summary': {
        'overview': '这是一份综合心理评估报告，基于问卷调查和AI分析生成。',
        'key_findings': [
            '情绪调节能力良好，能够有效管理日常情绪',
            '认知灵活性较高，善于从多角度思考问题',
            '关系敏感度中等，在人际互动中表现稳定'
        ]
    },
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
                'description': '这个部分致力于保护你免受伤害，通过谨慎和警觉来维护安全感。'
            },
            'all_parts': [
                {'name': '保护者', 'intensity': 8, 'description': '保护性部分'},
                {'name': '批评者', 'intensity': 5, 'description': '内在批评声音'}
            ]
        },
        'ai_analysis': '你的情绪调节能力整体良好，能够在大多数情况下保持情绪稳定。'
    },
    'cognitive_insight': {
        'flexibility_score': 82,
        'perspective_shifting': {
            'details': {
                'self_other': 85,
                'spatial': 78,
                'cognitive_frame': 80,
                'emotional': 75
            }
        },
        'cognitive_patterns': {
            'dominant_pattern': {
                'name': '分析型思维',
                'description': '倾向于理性分析和逻辑推理'
            }
        },
        'ai_analysis': '你展现出较强的认知灵活性，能够从多个角度看待问题。'
    },
    'relational_insight': {
        'sensitivity_score': 68,
        'attachment_style': {
            'primary_style': '安全型',
            'description': '在关系中感到安全和舒适'
        },
        'details': {
            'relational_triggers': 60,
            'empathy_index': 72,
            'inner_conflict_level': 45
        },
        'ai_analysis': '你在人际关系中表现出稳定的依恋模式。'
    },
    'growth_potential': {
        'overall_score': 78,
        'insight_depth': 75,
        'psychological_plasticity': 80,
        'resilience': 76,
        'ai_analysis': '你具有良好的成长潜能和心理韧性。'
    },
    'personality_classification': {
        'primary_type': '理性探索者',
        'description': '善于思考和分析，对新知识充满好奇',
        'characteristics': [
            '逻辑思维能力强',
            '喜欢探索新事物',
            '注重理性分析'
        ]
    },
    'recommendations': {
        'immediate_actions': [
            '每天进行10分钟的正念冥想练习',
            '记录情绪日记，提高自我觉察'
        ],
        'long_term_goals': [
            '发展更深层的情绪智能',
            '建立更稳定的人际关系模式'
        ],
        'resources': [
            '推荐书籍：《情绪智能》',
            '推荐应用：Headspace冥想应用'
        ]
    }
}

def test_markdown_generator():
    """Test the markdown generator with sample data"""
    print("Testing markdown report generator...")
    print("-" * 60)

    try:
        # Generate markdown report
        output_dir = "reports/test"
        report_id = 999

        markdown_path = generate_psychology_report_markdown(
            report_data=sample_report_data,
            output_dir=output_dir,
            report_id=report_id,
            charts_dir=None  # No charts for test
        )

        print(f"✅ Markdown report generated successfully!")
        print(f"📄 File location: {markdown_path}")
        print("-" * 60)

        # Read and display first 30 lines
        with open(markdown_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            print("\n📋 First 30 lines of generated markdown:\n")
            print(''.join(lines[:30]))
            print(f"\n... (total {len(lines)} lines)")

        print("-" * 60)
        print("✅ Test completed successfully!")
        print(f"\nYou can view the full report at: {markdown_path}")

    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_markdown_generator()
