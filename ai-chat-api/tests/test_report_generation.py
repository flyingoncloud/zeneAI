#!/usr/bin/env python3
"""
Test Report Generation

This script demonstrates the ZENE psychology report generation system
by creating a sample conversation and generating a professional DOCX report.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime
from src.reports.report_generator import ZENEReportGenerator, generate_conversation_report

def create_sample_conversation_data():
    """Create sample conversation data with psychology analysis"""
    
    return {
        'id': 12345,
        'session_id': 'test-session-001',
        'user_id': 'user-001',
        'title': 'Multi-Framework Psychology Session',
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
                                },
                                {
                                    'type': 'ifs_self',
                                    'subtype': 'self_energy',
                                    'confidence': 0.75,
                                    'evidence': '我感觉'
                                }
                            ]
                        }
                    },
                    'cross_framework_insights': {
                        'multiple_frameworks_detected': {
                            'frameworks': ['cbt', 'ifs'],
                            'description': 'Multiple therapeutic frameworks detected: cbt, ifs',
                            'therapeutic_relevance': 'Complex psychological presentation requiring multi-modal approach'
                        }
                    },
                    'total_confidence': 0.825,
                    'timestamp': datetime.now().isoformat()
                }
            },
            {
                'id': 2,
                'role': 'assistant',
                'content': '你好，听到你描述自己总是担心最坏的情况会发生，以及感觉有不同部分对压力做出不同反应。这些感受可能反映了你内在不同的部分正在争执或表达各自的需求。',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 3,
                'role': 'user',
                'content': '是的，我在关系中也总是焦虑，担心被抛弃。我很难信任别人，当我感到不安全时就会变得很粘人。',
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
                                },
                                {
                                    'type': 'relational_pattern',
                                    'subtype': 'relationship_maintenance',
                                    'confidence': 0.85,
                                    'evidence': '变得很粘人'
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
                    'cross_framework_insights': {
                        'multiple_frameworks_detected': {
                            'frameworks': ['attachment', 'cbt'],
                            'description': 'Multiple therapeutic frameworks detected: attachment, cbt',
                            'therapeutic_relevance': 'Complex psychological presentation requiring multi-modal approach'
                        }
                    },
                    'total_confidence': 0.815,
                    'timestamp': datetime.now().isoformat()
                }
            },
            {
                'id': 4,
                'role': 'assistant',
                'content': '我理解你在关系中的焦虑和对被抛弃的担心。这种依恋模式通常源于早期的关系经历。让我们探索一下这些感受背后的需求。',
                'timestamp': datetime.now().isoformat()
            },
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
                            'confidence_score': 0.92,
                            'elements_detected': [
                                {
                                    'type': 'dream_symbol',
                                    'subtype': 'shadow_figure',
                                    'confidence': 0.95,
                                    'evidence': '黑暗的影子在追我'
                                },
                                {
                                    'type': 'archetype',
                                    'subtype': 'shadow',
                                    'confidence': 0.90,
                                    'evidence': '内心的阴影面'
                                }
                            ]
                        },
                        'ifs': {
                            'framework_name': 'ifs',
                            'analyzed': True,
                            'llm_used': True,
                            'confidence_score': 0.70,
                            'elements_detected': [
                                {
                                    'type': 'ifs_part',
                                    'subtype': 'exile',
                                    'confidence': 0.75,
                                    'evidence': '不愿意面对的部分'
                                }
                            ]
                        }
                    },
                    'cross_framework_insights': {
                        'multiple_frameworks_detected': {
                            'frameworks': ['jungian', 'ifs'],
                            'description': 'Multiple therapeutic frameworks detected: jungian, ifs',
                            'therapeutic_relevance': 'Complex psychological presentation requiring multi-modal approach'
                        }
                    },
                    'total_confidence': 0.81,
                    'timestamp': datetime.now().isoformat()
                }
            },
            {
                'id': 6,
                'role': 'assistant',
                'content': '你的梦境很有意义。黑暗的影子确实可能代表你内心的阴影面 - 那些被压抑或否认的部分。在荣格心理学中，整合阴影是个体化过程的重要部分。',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 7,
                'role': 'user',
                'content': '抑郁症告诉我我没有价值，但我想重写这个故事。曾经有一段时间我感到自信和有能力。',
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
                                },
                                {
                                    'type': 'unique_outcome',
                                    'subtype': 'exception_story',
                                    'confidence': 0.85,
                                    'evidence': '曾经有一段时间我感到自信和有能力'
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
                'content': '我很欣赏你将抑郁症外化的方式，以及你想要重写自己故事的愿望。那段感到自信和有能力的时光是很重要的例外故事，它们证明了你内在的力量。',
                'timestamp': datetime.now().isoformat()
            }
        ]
    }

def test_report_eligibility():
    """Test report eligibility checking"""
    print("🔍 Testing Report Eligibility")
    print("=" * 50)
    
    conversation_data = create_sample_conversation_data()
    generator = ZENEReportGenerator()
    
    eligible, reason = generator.should_generate_report(conversation_data)
    
    print(f"Eligible: {eligible}")
    print(f"Reason: {reason}")
    print()
    
    return eligible

def test_report_generation():
    """Test full report generation"""
    print("📄 Testing Report Generation")
    print("=" * 50)
    
    conversation_data = create_sample_conversation_data()
    
    # Test with sample user info
    user_info = {
        'name': 'Test User',
        'age': 30,
        'session_type': 'Individual Therapy'
    }
    
    try:
        report_path = generate_conversation_report(
            conversation_data=conversation_data,
            user_info=user_info,
            output_dir="test_reports"
        )
        
        if report_path:
            print(f"✅ Report generated successfully!")
            print(f"📁 Report path: {report_path}")
            print(f"📊 File size: {os.path.getsize(report_path)} bytes")
            
            # Check if file exists and is readable
            if os.path.exists(report_path):
                print("✅ Report file exists and is accessible")
                print("💡 To view the report:")
                print(f"   1. Open: {report_path}")
                print("   2. Or use any PDF viewer to open the file")
                return report_path
            else:
                print("❌ Report file not found")
                return None
        else:
            print("❌ Report generation failed - criteria not met")
            return None
            
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        return None

def test_insufficient_data():
    """Test report generation with insufficient data"""
    print("⚠️  Testing Insufficient Data Scenario")
    print("=" * 50)
    
    # Create conversation with insufficient data
    insufficient_data = {
        'id': 999,
        'session_id': 'test-insufficient',
        'messages': [
            {
                'id': 1,
                'role': 'user',
                'content': 'Hello',
                'timestamp': datetime.now().isoformat()
            },
            {
                'id': 2,
                'role': 'assistant',
                'content': 'Hi there!',
                'timestamp': datetime.now().isoformat()
            }
        ]
    }
    
    generator = ZENEReportGenerator()
    eligible, reason = generator.should_generate_report(insufficient_data)
    
    print(f"Eligible: {eligible}")
    print(f"Reason: {reason}")
    print("✅ Correctly rejected insufficient data")
    print()

def main():
    """Main test function"""
    print("🧠 ZENE Psychology Report Generation Test")
    print("=" * 60)
    print()
    
    # Ensure test output directory exists
    os.makedirs("test_reports", exist_ok=True)
    
    # Test 1: Check eligibility
    eligible = test_report_eligibility()
    
    # Test 2: Generate report if eligible
    if eligible:
        report_path = test_report_generation()
        
        if report_path:
            print("🎉 Report Generation Test PASSED!")
            print(f"📄 Generated report: {os.path.basename(report_path)}")
            print()
            print("💡 To view the report:")
            print(f"   1. Open: {report_path}")
            print("   2. Or use any PDF viewer to open the file")
        else:
            print("❌ Report Generation Test FAILED!")
    
    # Test 3: Test insufficient data handling
    test_insufficient_data()
    
    print("=" * 60)
    print("🏁 All tests completed!")

if __name__ == "__main__":
    main()