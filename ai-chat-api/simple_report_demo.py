#!/usr/bin/env python3
"""
Simple Report Demo

This script creates a report with pre-built psychology analysis data,
bypassing the framework detection to demonstrate report generation.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime
from src.reports.report_generator import generate_conversation_report

def create_sample_conversation_with_analysis():
    """Create sample conversation data with pre-built psychology analysis"""
    
    return {
        'id': 12345,
        'session_id': 'simple-demo-session',
        'user_id': 'demo-user',
        'title': 'Simple Report Demo Session',
        'created_at': datetime.now().isoformat(),
        'messages': [
            {
                'id': 1,
                'role': 'user',
                'content': '我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'cbt': {
                            'framework_name': 'cbt',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.85,
                            'elements_detected': [
                                {
                                    'type': 'cognitive_distortion',
                                    'subtype': 'catastrophizing',
                                    'confidence': 0.90,
                                    'evidence': '最坏的情况会发生'
                                },
                                {
                                    'type': 'cognitive_distortion',
                                    'subtype': 'all_or_nothing',
                                    'confidence': 0.80,
                                    'evidence': '总是觉得'
                                }
                            ]
                        },
                        'ifs': {
                            'framework_name': 'ifs',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.80,
                            'elements_detected': [
                                {
                                    'type': 'ifs_part',
                                    'subtype': 'manager',
                                    'confidence': 0.80,
                                    'evidence': '不同的部分在对压力做出不同的反应'
                                }
                            ]
                        }
                    },
                    'cross_framework_insights': {
                        'multiple_frameworks_detected': {
                            'frameworks': ['cbt', 'ifs'],
                            'description': 'Multiple therapeutic frameworks detected',
                            'therapeutic_relevance': 'Complex psychological presentation'
                        }
                    },
                    'total_confidence': 0.825,
                    'timestamp': datetime.now().isoformat()
                }
            },
            {
                'id': 2,
                'role': 'assistant',
                'content': '听到你描述这些不同的反应，我能感受到你内在的复杂性。让我们一起探索这些不同的部分。',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 3,
                'role': 'user',
                'content': '我在关系中也总是焦虑，担心被抛弃。我很难信任别人。',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'attachment': {
                            'framework_name': 'attachment',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.88,
                            'elements_detected': [
                                {
                                    'type': 'attachment_style',
                                    'subtype': 'anxious',
                                    'confidence': 0.90,
                                    'evidence': '总是焦虑，担心被抛弃'
                                }
                            ]
                        },
                        'cbt': {
                            'framework_name': 'cbt',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.75,
                            'elements_detected': [
                                {
                                    'type': 'cognitive_distortion',
                                    'subtype': 'catastrophizing',
                                    'confidence': 0.80,
                                    'evidence': '担心被抛弃'
                                }
                            ]
                        }
                    },
                    'total_confidence': 0.815,
                    'timestamp': datetime.now().isoformat()
                }
            },
            {
                'id': 4,
                'role': 'assistant',
                'content': '我理解你在关系中的焦虑。这种依恋模式通常源于早期的关系经历。',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 5,
                'role': 'user',
                'content': '我做了一个梦，梦见黑暗的影子在追我。',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'jungian': {
                            'framework_name': 'jungian',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.92,
                            'elements_detected': [
                                {
                                    'type': 'dream_symbol',
                                    'subtype': 'shadow_figure',
                                    'confidence': 0.95,
                                    'evidence': '黑暗的影子在追我'
                                }
                            ]
                        }
                    },
                    'total_confidence': 0.92,
                    'timestamp': datetime.now().isoformat()
                }
            },
            {
                'id': 6,
                'role': 'assistant',
                'content': '你的梦境很有象征意义。阴影通常代表我们压抑的部分。',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 7,
                'role': 'user',
                'content': '抑郁症告诉我我没有价值，但我想重写这个故事。',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'narrative': {
                            'framework_name': 'narrative',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.89,
                            'elements_detected': [
                                {
                                    'type': 'externalization',
                                    'subtype': 'problem_externalization',
                                    'confidence': 0.90,
                                    'evidence': '抑郁症告诉我'
                                },
                                {
                                    'type': 'preferred_identity',
                                    'subtype': 'reauthoring',
                                    'confidence': 0.88,
                                    'evidence': '重写这个故事'
                                }
                            ]
                        }
                    },
                    'total_confidence': 0.89,
                    'timestamp': datetime.now().isoformat()
                }
            },
            {
                'id': 8,
                'role': 'assistant',
                'content': '我很欣赏你将抑郁症外化的方式，以及你想要重写自己故事的勇气。',
                'timestamp': datetime.now().isoformat()
            }
        ]
    }

def main():
    """Main demo function"""
    print("📄 Simple Report Generation Demo")
    print("=" * 50)
    print()
    
    # Ensure output directory exists
    os.makedirs("simple_demo_reports", exist_ok=True)
    
    print("📝 Creating sample conversation with psychology analysis...")
    conversation_data = create_sample_conversation_with_analysis()
    
    print(f"✅ Sample conversation created:")
    print(f"   • Messages: {len(conversation_data['messages'])}")
    print(f"   • Frameworks: CBT, IFS, Attachment, Jungian, Narrative")
    print(f"   • High confidence scores across all frameworks")
    
    print(f"\n📄 Generating PDF report...")
    
    try:
        report_path = generate_conversation_report(
            conversation_data=conversation_data,
            user_info={
                'name': 'Demo User',
                'session_type': 'Simple Demo Session'
            },
            output_dir="simple_demo_reports"
        )
        
        if report_path:
            print(f"✅ Report generated successfully!")
            print(f"📁 Report location: {report_path}")
            print(f"📊 File size: {os.path.getsize(report_path)} bytes")
            
            print(f"\n📋 Report Contents:")
            print(f"   • Executive Summary with 5 frameworks detected")
            print(f"   • Conversation overview with 8 messages")
            print(f"   • Detailed framework analysis for each psychology approach")
            print(f"   • Therapeutic insights and recommendations")
            print(f"   • Professional PDF format")
            
            print(f"\n💡 To view the report:")
            print(f"   Open: {report_path}")
            
            return True
        else:
            print(f"❌ Report generation failed - criteria not met")
            return False
            
    except Exception as e:
        print(f"❌ Report generation error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 SIMPLE REPORT DEMO SUCCESSFUL!")
        print("\n✅ This demonstrates that:")
        print("   • PDF report generation is working")
        print("   • Multi-framework analysis can be processed")
        print("   • Professional reports are created with proper formatting")
        print("   • The system can handle Chinese text content")
    else:
        print("❌ SIMPLE REPORT DEMO FAILED!")
    
    print("\n🏁 Demo completed!")