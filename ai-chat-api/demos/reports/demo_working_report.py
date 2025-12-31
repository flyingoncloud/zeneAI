#!/usr/bin/env python3
"""
Working Report Generation Demo

This script creates a conversation that definitely meets report criteria
and generates a professional PDF report.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from datetime import datetime
from src.reports.report_generator import generate_conversation_report

def create_conversation_with_guaranteed_analysis():
    """Create a conversation with guaranteed psychology analysis that meets report criteria"""
    
    print("📝 Creating conversation with comprehensive psychology analysis...")
    
    # Create conversation data with rich psychology analysis
    conversation_data = {
        'id': 99999,
        'session_id': 'demo-guaranteed-report',
        'user_id': 'demo-user',
        'title': 'Comprehensive Multi-Framework Psychology Session',
        'created_at': datetime.now().isoformat(),
        'messages': [
            # Message 1: User message with CBT and IFS analysis
            {
                'id': 1,
                'role': 'user',
                'content': '我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应。有时候我很焦虑，有时候我会变得很愤怒。',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'cbt': {
                            'framework_name': 'cbt',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.88,
                            'elements_detected': [
                                {
                                    'type': 'cognitive_distortion',
                                    'subtype': 'catastrophizing',
                                    'confidence': 0.92,
                                    'evidence': '总是觉得最坏的情况会发生'
                                },
                                {
                                    'type': 'cognitive_distortion',
                                    'subtype': 'all_or_nothing',
                                    'confidence': 0.85,
                                    'evidence': '总是觉得'
                                }
                            ]
                        },
                        'ifs': {
                            'framework_name': 'ifs',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.82,
                            'elements_detected': [
                                {
                                    'type': 'ifs_part',
                                    'subtype': 'manager',
                                    'confidence': 0.85,
                                    'evidence': '不同的部分在对压力做出不同的反应'
                                },
                                {
                                    'type': 'ifs_part',
                                    'subtype': 'firefighter',
                                    'confidence': 0.80,
                                    'evidence': '有时候我会变得很愤怒'
                                }
                            ]
                        }
                    },
                    'cross_framework_insights': {
                        'multiple_frameworks_detected': {
                            'frameworks': ['cbt', 'ifs'],
                            'description': 'Multiple therapeutic frameworks detected: CBT and IFS',
                            'therapeutic_relevance': 'Complex psychological presentation requiring integrated approach'
                        }
                    },
                    'total_confidence': 0.85,
                    'timestamp': datetime.now().isoformat()
                }
            },
            
            # Message 2: AI response
            {
                'id': 2,
                'role': 'assistant',
                'content': '听到你描述这些不同的反应，我能感受到你内在的复杂性。让我们一起探索这些不同的部分，以及它们如何影响你对压力的反应。',
                'timestamp': datetime.now().isoformat()
            },
            
            # Message 3: User message with Attachment analysis
            {
                'id': 3,
                'role': 'user',
                'content': '我在关系中也总是焦虑，担心被抛弃。我很难信任别人，当我感到不安全时就会变得很粘人或者完全疏远。',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'attachment': {
                            'framework_name': 'attachment',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.91,
                            'elements_detected': [
                                {
                                    'type': 'attachment_style',
                                    'subtype': 'anxious',
                                    'confidence': 0.93,
                                    'evidence': '总是焦虑，担心被抛弃'
                                },
                                {
                                    'type': 'relational_pattern',
                                    'subtype': 'approach_avoidance',
                                    'confidence': 0.89,
                                    'evidence': '变得很粘人或者完全疏远'
                                }
                            ]
                        },
                        'cbt': {
                            'framework_name': 'cbt',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.78,
                            'elements_detected': [
                                {
                                    'type': 'cognitive_distortion',
                                    'subtype': 'catastrophizing',
                                    'confidence': 0.82,
                                    'evidence': '担心被抛弃'
                                }
                            ]
                        }
                    },
                    'cross_framework_insights': {
                        'multiple_frameworks_detected': {
                            'frameworks': ['attachment', 'cbt'],
                            'description': 'Attachment and cognitive patterns detected',
                            'therapeutic_relevance': 'Relational and cognitive elements requiring integrated treatment'
                        }
                    },
                    'total_confidence': 0.845,
                    'timestamp': datetime.now().isoformat()
                }
            },
            
            # Message 4: AI response
            {
                'id': 4,
                'role': 'assistant',
                'content': '你描述的这种在亲密关系中的模式很常见。这种焦虑和对被抛弃的担心可能与早期的依恋经历有关。',
                'timestamp': datetime.now().isoformat()
            },
            
            # Message 5: User message with Jungian analysis
            {
                'id': 5,
                'role': 'user',
                'content': '我昨晚做了一个梦，梦见一个黑暗的影子在追我。我感觉这像是我内心的阴影面，那些我不愿意面对的部分。',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'jungian': {
                            'framework_name': 'jungian',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.94,
                            'elements_detected': [
                                {
                                    'type': 'dream_symbol',
                                    'subtype': 'shadow_figure',
                                    'confidence': 0.96,
                                    'evidence': '黑暗的影子在追我'
                                },
                                {
                                    'type': 'archetype',
                                    'subtype': 'shadow',
                                    'confidence': 0.92,
                                    'evidence': '内心的阴影面'
                                }
                            ]
                        },
                        'ifs': {
                            'framework_name': 'ifs',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.75,
                            'elements_detected': [
                                {
                                    'type': 'ifs_part',
                                    'subtype': 'exile',
                                    'confidence': 0.78,
                                    'evidence': '不愿意面对的部分'
                                }
                            ]
                        }
                    },
                    'cross_framework_insights': {
                        'multiple_frameworks_detected': {
                            'frameworks': ['jungian', 'ifs'],
                            'description': 'Jungian and IFS elements detected',
                            'therapeutic_relevance': 'Shadow work and parts integration indicated'
                        }
                    },
                    'total_confidence': 0.845,
                    'timestamp': datetime.now().isoformat()
                }
            },
            
            # Message 6: AI response
            {
                'id': 6,
                'role': 'assistant',
                'content': '你的梦境很有象征意义。在心理学中，阴影通常代表我们压抑或否认的部分。探索这些阴影面可能是治愈的重要步骤。',
                'timestamp': datetime.now().isoformat()
            },
            
            # Message 7: User message with Narrative analysis
            {
                'id': 7,
                'role': 'user',
                'content': '抑郁症告诉我我没有价值，但我想重写这个故事。曾经有一段时间我感到自信和有能力，我想找回那种感觉。',
                'timestamp': datetime.now().isoformat(),
                'psychology_analysis': {
                    'analyzed': True,
                    'frameworks': {
                        'narrative': {
                            'framework_name': 'narrative',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.92,
                            'elements_detected': [
                                {
                                    'type': 'externalization',
                                    'subtype': 'problem_externalization',
                                    'confidence': 0.94,
                                    'evidence': '抑郁症告诉我'
                                },
                                {
                                    'type': 'preferred_identity',
                                    'subtype': 'reauthoring',
                                    'confidence': 0.90,
                                    'evidence': '重写这个故事'
                                },
                                {
                                    'type': 'unique_outcome',
                                    'subtype': 'exception_story',
                                    'confidence': 0.88,
                                    'evidence': '曾经有一段时间我感到自信和有能力'
                                }
                            ]
                        }
                    },
                    'total_confidence': 0.92,
                    'timestamp': datetime.now().isoformat()
                }
            },
            
            # Message 8: AI response
            {
                'id': 8,
                'role': 'assistant',
                'content': '我很欣赏你将抑郁症外化的方式，以及你想要重写自己故事的勇气。那些自信和有能力的时光证明了你内在的力量。',
                'timestamp': datetime.now().isoformat()
            }
        ]
    }
    
    return conversation_data

def main():
    """Main demo function"""
    
    print("🎯 ZENE Working Report Generation Demo")
    print("=" * 60)
    print()
    
    # Ensure output directory exists
    os.makedirs("demo_reports", exist_ok=True)
    
    # Create conversation with guaranteed analysis
    conversation_data = create_conversation_with_guaranteed_analysis()
    
    print(f"✅ Conversation created with {len(conversation_data['messages'])} messages")
    
    # Count psychology analyses
    analyses = [msg for msg in conversation_data['messages'] 
               if msg.get('psychology_analysis', {}).get('analyzed', False)]
    print(f"✅ Psychology analyses: {len(analyses)} messages analyzed")
    
    # Count frameworks
    all_frameworks = set()
    total_confidence = 0
    analysis_count = 0
    
    for msg in analyses:
        frameworks = msg['psychology_analysis'].get('frameworks', {})
        for name, data in frameworks.items():
            confidence = data.get('confidence_score', 0.0)
            if confidence >= 0.5:
                all_frameworks.add(name)
                total_confidence += confidence
                analysis_count += 1
    
    avg_confidence = total_confidence / max(analysis_count, 1)
    
    print(f"✅ Frameworks detected: {len(all_frameworks)} ({', '.join(all_frameworks)})")
    print(f"✅ Average confidence: {avg_confidence:.2f}")
    
    # Check if criteria are met
    print(f"\n📋 Report Criteria Check:")
    print(f"   • Messages: {len(conversation_data['messages'])} (need ≥6) ✅")
    print(f"   • Frameworks: {len(all_frameworks)} (need ≥2) ✅")
    print(f"   • Confidence: {avg_confidence:.2f} (need ≥0.6) ✅")
    
    # Generate report
    print(f"\n📄 Generating Professional PDF Report...")
    print("-" * 40)
    
    try:
        report_path = generate_conversation_report(
            conversation_data=conversation_data,
            user_info={
                'name': 'Demo User',
                'session_type': 'Multi-Framework Analysis Demo'
            },
            output_dir="demo_reports"
        )
        
        if report_path:
            print(f"✅ Professional PDF report generated!")
            print(f"📁 Report location: {report_path}")
            print(f"📊 File size: {os.path.getsize(report_path)} bytes")
            
            print(f"\n📋 Report Contents:")
            print(f"   • Executive Summary with {len(all_frameworks)} frameworks")
            print(f"   • Conversation overview with {len(conversation_data['messages'])} messages")
            print(f"   • Detailed framework analysis")
            print(f"   • Therapeutic insights and recommendations")
            print(f"   • Professional formatting and styling")
            
            print(f"\n🎉 REPORT GENERATION SUCCESSFUL!")
            print(f"📄 Open the PDF: {report_path}")
            
            return True
        else:
            print("❌ Report generation failed - criteria not met")
            return False
            
    except Exception as e:
        print(f"❌ Report generation error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    main()