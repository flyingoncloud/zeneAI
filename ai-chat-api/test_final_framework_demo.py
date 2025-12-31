#!/usr/bin/env python3
"""
Final demonstration of improved multi-framework psychology-informed AI responses.
Shows how the system now intelligently prioritizes and responds based on detected frameworks.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.psychology.multi_detector import MultiPsychologyDetector
from src.api.chat_service import _generate_psychology_context, get_system_prompt_for_language

def demonstrate_framework_responses():
    """Demonstrate how different frameworks are prioritized and inform AI responses."""
    
    print("🎯 Final Multi-Framework Psychology Response Demonstration")
    print("=" * 65)
    
    detector = MultiPsychologyDetector()
    detector.register_all_frameworks()
    
    test_cases = [
        {
            'name': 'CBT-Dominant Conversation',
            'messages': [
                {'role': 'user', 'content': 'I always think the worst case scenario will happen'},
                {'role': 'assistant', 'content': 'That sounds challenging'},
                {'role': 'user', 'content': 'Everything is either perfect or a complete disaster. I should be perfect at everything. I avoid doing things because I know they will fail.'}
            ],
            'expected_primary': 'cbt'
        },
        {
            'name': 'Attachment-Dominant Conversation', 
            'messages': [
                {'role': 'user', 'content': 'I am always anxious in relationships and worry about being abandoned'},
                {'role': 'assistant', 'content': 'That sounds difficult'},
                {'role': 'user', 'content': 'Yes, I have trouble trusting people and I get clingy when I feel insecure. I need constant reassurance from my partner.'}
            ],
            'expected_primary': 'attachment'
        },
        {
            'name': 'IFS-Dominant Conversation',
            'messages': [
                {'role': 'user', 'content': 'I have different parts of me that react to stress differently'},
                {'role': 'assistant', 'content': 'Tell me more about these parts'},
                {'role': 'user', 'content': 'Well, there is a part that tries to be perfect and another part that just wants to hide. Sometimes I feel calm and curious about these parts.'}
            ],
            'expected_primary': 'ifs'
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📝 Test Case {i}: {test_case['name']}")
        print("-" * 50)
        
        # Show the conversation
        print("💬 Conversation:")
        for msg in test_case['messages']:
            role_emoji = "👤" if msg['role'] == 'user' else "🤖"
            print(f"  {role_emoji} {msg['role']}: {msg['content'][:80]}{'...' if len(msg['content']) > 80 else ''}")
        
        # Analyze with multi-framework detector
        result = detector.analyze_conversation(test_case['messages'])
        
        # Show detected frameworks sorted by confidence
        print("\n🔍 Framework Analysis (sorted by confidence):")
        framework_items = []
        for framework, analysis in result.get('frameworks', {}).items():
            elements = analysis.get('elements_detected', [])
            confidence = analysis.get('confidence_score', 0.0)
            if elements and confidence >= 0.3:
                framework_items.append((framework, analysis, confidence))
        
        framework_items.sort(key=lambda x: x[2], reverse=True)
        
        for framework_name, analysis, confidence in framework_items:
            elements = analysis.get('elements_detected', [])
            print(f"  {framework_name}: {confidence:.2f} confidence, {len(elements)} elements")
        
        # Generate psychology context
        context = _generate_psychology_context(result)
        print(f"\n📋 Psychology Context Generated:")
        print(f"  \"{context}\"")
        
        # Show how this would inform the AI response
        system_prompt = get_system_prompt_for_language('chinese', context)
        print(f"\n🤖 AI Response Guidance:")
        
        if framework_items:
            primary_framework = framework_items[0][0]
            print(f"  Primary framework detected: {primary_framework}")
            
            framework_guidance = {
                'cbt': '关注思维模式和行为，温和地处理认知扭曲',
                'attachment': '关注关系动态和依恋需求，验证情感体验',
                'ifs': '承认不同的内在部分，支持自我能量',
                'jungian': '尊重象征和原型内容，探索深层意义',
                'narrative': '支持问题外化和重新创作故事'
            }
            
            if primary_framework in framework_guidance:
                print(f"  AI will: {framework_guidance[primary_framework]}")
            
            # Check if expected primary framework matches
            if primary_framework == test_case['expected_primary']:
                print(f"  ✅ Correctly identified {test_case['expected_primary']} as primary framework")
            else:
                print(f"  ⚠️  Expected {test_case['expected_primary']}, got {primary_framework}")
        
        print(f"  Framework-specific system prompt: {'✅ Included' if '根据检测到的心理学框架来调整' in system_prompt['content'] else '❌ Missing'}")
    
    print("\n" + "=" * 65)
    print("🎉 Multi-Framework Psychology Response System Complete!")
    print("\n✨ Key Improvements:")
    print("  • Frameworks prioritized by confidence score")
    print("  • AI responses informed by most relevant therapeutic approach")
    print("  • Flexible analysis intervals (no longer rigid multiples)")
    print("  • Comprehensive framework coverage (IFS, CBT, Jungian, Narrative, Attachment)")
    print("  • Natural integration of psychology insights into responses")
    print("\n🚀 The system now provides intelligent, framework-appropriate therapeutic responses!")

if __name__ == "__main__":
    try:
        demonstrate_framework_responses()
    except Exception as e:
        print(f"\n❌ Demo failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)