#!/usr/bin/env python3
"""
Test Real Conversation Analysis

This script analyzes the real conversation provided by the user to demonstrate
multi-framework psychology detection and report generation capabilities.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime
from src.psychology.multi_detector import MultiPsychologyDetector
from src.reports.report_generator import generate_conversation_report

def analyze_real_conversation():
    """Analyze the real conversation provided by the user"""
    
    # The real conversation from the user
    conversation_messages = [
        {
            "role": "user",
            "content": "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应"
        },
        {
            "role": "assistant", 
            "content": "你好，听到你描述自己总是担心最坏的情况会发生，以及感觉有不同部分对压力做出不同反应。这些感受可能反映了你内在不同的部分正在争执或表达各自的需求。在IFS治疗中，我们通常将这些内在部分称为部分，而将平衡、全面的自我视为自我。让我们以一种富有同情心和好奇心的态度来探索你的不同部分。"
        }
    ]
    
    print("🧠 Real Conversation Analysis")
    print("=" * 60)
    print()
    
    # Initialize detector
    detector = MultiPsychologyDetector()
    
    # Analyze the conversation
    print("🔍 Analyzing user message...")
    print(f"User: {conversation_messages[0]['content']}")
    print()
    
    try:
        # Run psychology detection on the conversation
        analysis = detector.analyze_conversation(
            messages=conversation_messages,
            existing_state=None,
            current_message_id=1
        )
        
        print("📊 Psychology Analysis Results:")
        print("=" * 40)
        
        if analysis.get('analyzed', False):
            frameworks = analysis.get('frameworks', {})
            
            print(f"Total Confidence: {analysis.get('total_confidence', 0.0):.2f}")
            print(f"Frameworks Detected: {len(frameworks)}")
            print()
            
            # Display each framework's analysis
            for framework_name, framework_data in frameworks.items():
                confidence = framework_data.get('confidence_score', 0.0)
                elements = framework_data.get('elements_detected', [])
                
                if confidence > 0.3 or elements:
                    print(f"🎯 {framework_name.upper()} Framework:")
                    print(f"   Confidence: {confidence:.2f}")
                    print(f"   Elements Detected: {len(elements)}")
                    
                    for element in elements[:3]:  # Show first 3 elements
                        print(f"   • {element.get('type', 'unknown')}: {element.get('subtype', 'N/A')} ({element.get('confidence', 0.0):.2f})")
                    
                    print()
            
            # Cross-framework insights
            cross_insights = analysis.get('cross_framework_insights', {})
            if cross_insights.get('multiple_frameworks_detected'):
                detected_frameworks = cross_insights['multiple_frameworks_detected'].get('frameworks', [])
                print(f"🔗 Cross-Framework Analysis:")
                print(f"   Multiple frameworks detected: {', '.join(detected_frameworks)}")
                print(f"   Therapeutic relevance: {cross_insights['multiple_frameworks_detected'].get('therapeutic_relevance', 'N/A')}")
                print()
        
        else:
            print("❌ No psychology analysis performed")
            return None
            
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        return None
    
    return analysis

def test_report_generation_with_real_conversation():
    """Test report generation with the real conversation (extended)"""
    
    print("📄 Testing Report Generation with Real Conversation")
    print("=" * 60)
    
    # Create extended conversation data for report testing
    # We need to extend the conversation to meet report criteria
    conversation_data = {
        'id': 99999,
        'session_id': 'real-conversation-test',
        'user_id': 'real-user',
        'title': 'Real Psychology Session Analysis',
        'created_at': datetime.now().isoformat(),
        'messages': []
    }
    
    # Add the real conversation messages with simulated psychology analysis
    real_messages = [
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
            'content': '你好，听到你描述自己总是担心最坏的情况会发生，以及感觉有不同部分对压力做出不同反应。这些感受可能反映了你内在不同的部分正在争执或表达各自的需求。在IFS治疗中，我们通常将这些内在部分称为部分，而将平衡、全面的自我视为自我。',
            'timestamp': datetime.now().isoformat()
        }
    ]
    
    # Add additional messages to meet report criteria (need 6+ messages)
    additional_messages = [
        {
            'id': 3,
            'role': 'user',
            'content': '我在关系中也很焦虑，总是担心被抛弃',
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
                                'evidence': '总是担心被抛弃'
                            }
                        ]
                    }
                },
                'total_confidence': 0.88,
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
            'content': '我做了一个梦，梦见黑暗的影子',
            'timestamp': datetime.now().isoformat(),
            'psychology_analysis': {
                'analyzed': True,
                'frameworks': {
                    'jungian': {
                        'framework_name': 'jungian',
                        'analyzed': True,
                        'llm_used': True,
                        'confidence_score': 0.85,
                        'elements_detected': [
                            {
                                'type': 'dream_symbol',
                                'subtype': 'shadow_figure',
                                'confidence': 0.90,
                                'evidence': '黑暗的影子'
                            }
                        ]
                    }
                },
                'total_confidence': 0.85,
                'timestamp': datetime.now().isoformat()
            }
        },
        {
            'id': 6,
            'role': 'assistant',
            'content': '你的梦境很有意义。黑暗的影子可能代表你内心的阴影面。',
            'timestamp': datetime.now().isoformat()
        }
    ]
    
    conversation_data['messages'] = real_messages + additional_messages
    
    # Test report generation
    try:
        report_path = generate_conversation_report(
            conversation_data=conversation_data,
            user_info={'name': 'Real User Test'},
            output_dir="real_conversation_reports"
        )
        
        if report_path:
            print(f"✅ Report generated successfully!")
            print(f"📁 Report path: {report_path}")
            print(f"📊 File size: {os.path.getsize(report_path)} bytes")
            return report_path
        else:
            print("❌ Report generation failed - criteria not met")
            return None
            
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        return None

def main():
    """Main function to run real conversation analysis"""
    
    print("🎯 ZENE Real Conversation Analysis & Report Generation")
    print("=" * 70)
    print()
    
    # Ensure output directory exists
    os.makedirs("real_conversation_reports", exist_ok=True)
    
    # Step 1: Analyze the real conversation
    analysis = analyze_real_conversation()
    
    if analysis:
        print("✅ Real conversation analysis completed successfully!")
        print()
        
        # Step 2: Test report generation with extended conversation
        report_path = test_report_generation_with_real_conversation()
        
        if report_path:
            print("🎉 Complete Analysis & Report Generation SUCCESSFUL!")
            print()
            print("📋 Summary:")
            print(f"   • Psychology analysis: ✅ Completed")
            print(f"   • Report generation: ✅ Completed")
            print(f"   • Report file: {os.path.basename(report_path)}")
            print()
            print("💡 Next steps:")
            print("   1. Review the generated report")
            print("   2. Test with the actual API endpoints")
            print("   3. Verify report download functionality")
        else:
            print("⚠️  Report generation failed, but analysis was successful")
    else:
        print("❌ Real conversation analysis failed")
    
    print("=" * 70)
    print("🏁 Real conversation testing completed!")

if __name__ == "__main__":
    main()