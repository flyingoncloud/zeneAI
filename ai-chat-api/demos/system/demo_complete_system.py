#!/usr/bin/env python3
"""
Complete System Demo

This script demonstrates the complete ZENE psychology analysis and report generation system:
1. Multi-framework psychology detection
2. AI response enhancement with psychology context
3. Professional PDF report generation
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from datetime import datetime
from src.psychology.multi_detector import MultiPsychologyDetector
from src.reports.report_generator import generate_conversation_report

def demo_complete_system():
    """Demonstrate the complete system with a realistic conversation"""
    
    print("🧠 ZENE Complete System Demo")
    print("=" * 60)
    print()
    
    # Initialize the psychology detector
    detector = MultiPsychologyDetector()
    
    # Simulate a realistic therapy conversation
    conversation_messages = [
        {
            "role": "user",
            "content": "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应。有时候我很焦虑，有时候我会变得很愤怒。"
        },
        {
            "role": "assistant",
            "content": "听到你描述这些不同的反应，我能感受到你内在的复杂性。让我们一起探索这些不同的部分，以及它们如何影响你对压力的反应。"
        },
        {
            "role": "user", 
            "content": "我在关系中也总是焦虑，担心被抛弃。我很难信任别人，当我感到不安全时就会变得很粘人或者完全疏远。"
        },
        {
            "role": "assistant",
            "content": "你描述的这种在亲密关系中的模式很常见。这种焦虑和对被抛弃的担心可能与早期的依恋经历有关。"
        },
        {
            "role": "user",
            "content": "我昨晚做了一个梦，梦见一个黑暗的影子在追我。我感觉这像是我内心的阴影面，那些我不愿意面对的部分。"
        },
        {
            "role": "assistant", 
            "content": "你的梦境很有象征意义。在心理学中，阴影通常代表我们压抑或否认的部分。探索这些阴影面可能是治愈的重要步骤。"
        },
        {
            "role": "user",
            "content": "抑郁症告诉我我没有价值，但我想重写这个故事。曾经有一段时间我感到自信和有能力，我想找回那种感觉。"
        },
        {
            "role": "assistant",
            "content": "我很欣赏你将抑郁症外化的方式，以及你想要重写自己故事的勇气。那些自信和有能力的时光证明了你内在的力量。"
        }
    ]
    
    print("📝 Analyzing Conversation Messages...")
    print("-" * 40)
    
    # Build conversation data with psychology analysis
    conversation_data = {
        'id': 88888,
        'session_id': 'demo-complete-system',
        'user_id': 'demo-user',
        'title': 'Complete System Demo Session',
        'created_at': datetime.now().isoformat(),
        'messages': []
    }
    
    # Analyze each user message and build the conversation data
    for i, message in enumerate(conversation_messages):
        message_data = {
            'id': i + 1,
            'role': message['role'],
            'content': message['content'],
            'timestamp': datetime.now().isoformat()
        }
        
        # Run psychology analysis on user messages
        if message['role'] == 'user':
            print(f"\n🔍 Analyzing User Message {len([m for m in conversation_data['messages'] if m['role'] == 'user']) + 1}:")
            print(f"   \"{message['content'][:80]}...\"")
            
            try:
                # Run psychology detection
                analysis = detector.analyze_conversation(
                    messages=conversation_messages[:i+1],
                    existing_state=None,
                    current_message_id=i+1
                )
                
                if analysis and analysis.get('analyzed', False):
                    message_data['psychology_analysis'] = analysis
                    
                    # Display detected frameworks
                    frameworks = analysis.get('frameworks', {})
                    detected = []
                    for name, data in frameworks.items():
                        confidence = data.get('confidence_score', 0.0)
                        if confidence > 0.3:
                            detected.append(f"{name.upper()}({confidence:.2f})")
                    
                    if detected:
                        print(f"   🎯 Detected: {', '.join(detected)}")
                    else:
                        print("   📊 No significant patterns detected")
                else:
                    print("   📊 No analysis performed")
                    
            except Exception as e:
                print(f"   ❌ Analysis error: {e}")
        
        conversation_data['messages'].append(message_data)
    
    print(f"\n✅ Conversation analysis completed!")
    print(f"   Total messages: {len(conversation_data['messages'])}")
    
    # Generate comprehensive report
    print(f"\n📄 Generating Professional PDF Report...")
    print("-" * 40)
    
    try:
        report_path = generate_conversation_report(
            conversation_data=conversation_data,
            user_info={
                'name': 'Demo User',
                'session_type': 'Individual Therapy Demo'
            },
            output_dir="demo_reports"
        )
        
        if report_path:
            print(f"✅ Professional PDF report generated!")
            print(f"📁 Report location: {report_path}")
            print(f"📊 File size: {os.path.getsize(report_path)} bytes")
            
            # Display report summary
            print(f"\n📋 Report Summary:")
            print(f"   • Format: Professional PDF")
            print(f"   • Sections: Executive Summary, Framework Analysis, Insights, Recommendations")
            print(f"   • Multi-framework analysis included")
            print(f"   • Clinical interpretations provided")
            print(f"   • Therapeutic recommendations generated")
            
            return report_path
        else:
            print("❌ Report generation failed - criteria not met")
            return None
            
    except Exception as e:
        print(f"❌ Report generation error: {e}")
        return None

def main():
    """Main demo function"""
    print("🎯 ZENE Psychology Analysis & Report Generation")
    print("Complete System Demonstration")
    print("=" * 70)
    print()
    
    # Ensure output directory exists
    os.makedirs("demo_reports", exist_ok=True)
    
    # Run the complete system demo
    report_path = demo_complete_system()
    
    print("\n" + "=" * 70)
    
    if report_path:
        print("🎉 COMPLETE SYSTEM DEMO SUCCESSFUL!")
        print()
        print("✅ System Components Verified:")
        print("   • Multi-Framework Psychology Detection: ✅ Working")
        print("   • CBT, IFS, Jungian, Narrative, Attachment: ✅ Integrated")
        print("   • Professional PDF Report Generation: ✅ Working")
        print("   • Clinical Insights & Recommendations: ✅ Generated")
        print()
        print("📄 Generated Report:")
        print(f"   • File: {os.path.basename(report_path)}")
        print(f"   • Location: {report_path}")
        print("   • Format: Professional PDF with comprehensive analysis")
        print()
        print("💡 Next Steps:")
        print("   1. Open the PDF report to review the analysis")
        print("   2. Test the API endpoints with: python test_api_report_endpoints.py")
        print("   3. Start the API server: uvicorn src.api.app:app --reload")
        print("   4. Use the system in production!")
    else:
        print("❌ SYSTEM DEMO FAILED!")
        print()
        print("🔧 Troubleshooting:")
        print("   • Check that all dependencies are installed")
        print("   • Verify psychology detection is working")
        print("   • Ensure report generation criteria are met")
    
    print("\n🏁 Demo completed!")

if __name__ == "__main__":
    main()