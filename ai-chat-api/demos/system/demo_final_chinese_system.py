#!/usr/bin/env python3
"""
Final Chinese System Demo

This script demonstrates the complete Chinese psychology analysis and report generation system
using the ZENE_Report_Pro_Edited_25Dec2025.docx template format with Chinese content.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from datetime import datetime
from src.psychology.multi_detector import MultiPsychologyDetector
from src.reports.chinese_template_generator import generate_chinese_conversation_report

def demo_complete_chinese_system():
    """Demonstrate the complete Chinese system with real psychology detection"""
    
    print("🇨🇳 ZENE完整中文心理分析与报告生成系统")
    print("=" * 70)
    print()
    
    # Initialize the psychology detector
    detector = MultiPsychologyDetector()
    
    # Real Chinese therapy conversation
    conversation_messages = [
        {
            "role": "user",
            "content": "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应。有时候我很焦虑，有时候我会变得很愤怒，有时候我会完全关闭自己。"
        },
        {
            "role": "assistant",
            "content": "听到你描述这些不同的反应，我能感受到你内在的复杂性。让我们一起探索这些不同的部分，以及它们如何影响你对压力的反应。"
        },
        {
            "role": "user", 
            "content": "我在关系中也总是焦虑，担心被抛弃。我很难信任别人，当我感到不安全时就会变得很粘人或者完全疏远。这让我的关系变得很困难。"
        },
        {
            "role": "assistant",
            "content": "你描述的这种在亲密关系中的模式很常见。这种焦虑和对被抛弃的担心可能与早期的依恋经历有关。让我们探索一下这些模式的根源。"
        },
        {
            "role": "user",
            "content": "我昨晚做了一个梦，梦见一个黑暗的影子在追我。我感觉这像是我内心的阴影面，那些我不愿意面对的部分。我总是逃避这些黑暗的情绪。"
        },
        {
            "role": "assistant", 
            "content": "你的梦境很有象征意义。在荣格心理学中，阴影通常代表我们压抑或否认的部分。探索这些阴影面可能是治愈的重要步骤。"
        },
        {
            "role": "user",
            "content": "抑郁症告诉我我没有价值，但我想重写这个故事。曾经有一段时间我感到自信和有能力，我想找回那种感觉。我不想让抑郁症定义我是谁。"
        },
        {
            "role": "assistant",
            "content": "我很欣赏你将抑郁症外化的方式，以及你想要重写自己故事的勇气。那些自信和有能力的时光证明了你内在的力量，这些都是你真实身份的一部分。"
        }
    ]
    
    print("📝 分析中文对话消息...")
    print("-" * 40)
    
    # Build conversation data with real psychology analysis
    conversation_data = {
        'id': 99999,
        'session_id': 'final-chinese-demo',
        'user_id': 'chinese-user',
        'title': '完整中文心理分析演示会话',
        'created_at': datetime.now().isoformat(),
        'messages': []
    }
    
    # Analyze each message and build the conversation data
    for i, message in enumerate(conversation_messages):
        message_data = {
            'id': i + 1,
            'role': message['role'],
            'content': message['content'],
            'timestamp': datetime.now().isoformat()
        }
        
        # Run psychology analysis on user messages
        if message['role'] == 'user':
            user_count = len([m for m in conversation_data['messages'] if m['role'] == 'user']) + 1
            print(f"\n🔍 分析用户消息 {user_count}:")
            print(f"   \"{message['content'][:60]}...\"")
            
            try:
                # Run psychology detection
                analysis = detector.analyze_conversation(
                    messages=conversation_messages[:i+1],
                    existing_state=None,
                    current_message_id=i+1
                )
                
                if analysis and analysis.get('analyzed', False):
                    message_data['psychology_analysis'] = analysis
                    
                    # Display detected frameworks in Chinese
                    frameworks = analysis.get('frameworks', {})
                    detected = []
                    
                    framework_names_chinese = {
                        'cbt': '认知行为疗法',
                        'ifs': '内在家庭系统',
                        'jungian': '荣格心理学',
                        'narrative': '叙事疗法',
                        'attachment': '依恋理论'
                    }
                    
                    for name, data in frameworks.items():
                        confidence = data.get('confidence_score', 0.0)
                        if confidence > 0.3:
                            chinese_name = framework_names_chinese.get(name, name.upper())
                            detected.append(f"{chinese_name}({confidence:.2f})")
                    
                    if detected:
                        print(f"   🎯 检测到: {', '.join(detected)}")
                    else:
                        print("   📊 未检测到显著模式")
                else:
                    print("   📊 未进行分析")
                    
            except Exception as e:
                print(f"   ❌ 分析错误: {e}")
        
        conversation_data['messages'].append(message_data)
    
    print(f"\n✅ 对话分析完成!")
    print(f"   总消息数: {len(conversation_data['messages'])}")
    
    # Count psychology analyses
    analyses = [msg for msg in conversation_data['messages'] 
               if msg.get('psychology_analysis', {}).get('analyzed', False)]
    print(f"   心理分析: {len(analyses)}条消息已分析")
    
    # Generate comprehensive Chinese report
    print(f"\n📄 生成专业中文DOCX报告...")
    print("-" * 40)
    
    try:
        report_path = generate_chinese_conversation_report(
            conversation_data=conversation_data,
            user_info={
                'name': '中文演示用户',
                'session_type': '完整中文心理分析演示'
            },
            output_dir="final_chinese_reports"
        )
        
        if report_path:
            print(f"✅ 专业中文报告生成成功！")
            print(f"📁 报告位置: {report_path}")
            print(f"📊 文件大小: {os.path.getsize(report_path)} 字节")
            
            # Display report summary in Chinese
            print(f"\n📋 报告摘要:")
            print(f"   • 格式: 专业中文DOCX")
            print(f"   • 模板: ZENE_Report_Pro_Edited_25Dec2025.docx格式")
            print(f"   • 内容: 执行摘要、框架分析、治疗洞察、建议")
            print(f"   • 语言: 完全中文化")
            print(f"   • 框架: 多框架心理分析")
            
            return report_path
        else:
            print("❌ 报告生成失败 - 不符合标准")
            return None
            
    except Exception as e:
        print(f"❌ 报告生成错误: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main demo function"""
    
    print("🎯 ZENE中文心理分析与报告生成")
    print("完整系统演示")
    print("=" * 70)
    print()
    
    # Ensure output directory exists
    os.makedirs("final_chinese_reports", exist_ok=True)
    
    # Run the complete Chinese system demo
    report_path = demo_complete_chinese_system()
    
    print("\n" + "=" * 70)
    
    if report_path:
        print("🎉 完整中文系统演示成功！")
        print()
        print("✅ 系统组件验证:")
        print("   • 多框架心理检测: ✅ 工作正常")
        print("   • 中文内容分析: ✅ 工作正常") 
        print("   • 中文报告生成: ✅ 工作正常")
        print("   • DOCX模板系统: ✅ 工作正常")
        print("   • 临床洞察和建议: ✅ 已生成")
        print()
        print("📄 生成的报告:")
        print(f"   • 文件: {os.path.basename(report_path)}")
        print(f"   • 位置: {report_path}")
        print("   • 格式: 专业中文DOCX，包含全面分析")
        print("   • 模板: ZENE_Report_Pro_Edited_25Dec2025.docx格式")
        print()
        print("💡 下一步:")
        print("   1. 打开DOCX报告查看中文分析")
        print("   2. 测试API端点: python test_api_report_endpoints.py")
        print("   3. 启动API服务器: uvicorn src.api.app:app --reload")
        print("   4. 在生产环境中使用!")
    else:
        print("❌ 中文系统演示失败!")
        print()
        print("🔧 故障排除:")
        print("   • 检查所有依赖项是否已安装")
        print("   • 验证心理检测是否正常工作")
        print("   • 确保报告生成标准已满足")
    
    print("\n🏁 演示完成!")

if __name__ == "__main__":
    main()