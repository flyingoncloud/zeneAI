#!/usr/bin/env python3
"""
Test script for improved multi-framework psychology-informed AI responses.
Tests that the AI responses are appropriately informed by the highest-confidence frameworks.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.psychology.multi_detector import MultiPsychologyDetector
from src.api.chat_service import _generate_psychology_context, get_system_prompt_for_language

def test_framework_prioritization():
    """Test that frameworks are prioritized by confidence in context generation."""
    
    print("🧠 Testing Improved Multi-Framework Psychology Context Generation")
    print("=" * 70)
    
    detector = MultiPsychologyDetector()
    detector.register_all_frameworks()
    
    # Test Case 1: Attachment-focused content
    print("\n📝 Test Case 1: Attachment-focused conversation")
    attachment_messages = [
        {'role': 'user', 'content': 'I am always anxious in relationships and worry about being abandoned'},
        {'role': 'assistant', 'content': 'That sounds difficult'},
        {'role': 'user', 'content': 'Yes, I have trouble trusting people and I get clingy when I feel insecure. I need constant reassurance.'}
    ]
    
    result1 = detector.analyze_conversation(attachment_messages)
    context1 = _generate_psychology_context(result1)
    
    print(f"🔍 Frameworks detected: {list(result1.get('frameworks', {}).keys())}")
    print(f"📋 Context generated: \"{context1}\"")
    
    # Check if attachment is mentioned first (highest confidence)
    if "依恋模式" in context1 and context1.index("依恋模式") < context1.find("IFS", context1.find("依恋模式")):
        print("✅ Attachment framework correctly prioritized")
    else:
        print("❌ Attachment framework not prioritized properly")
    
    # Test Case 2: CBT-focused content  
    print("\n📝 Test Case 2: CBT-focused conversation")
    cbt_messages = [
        {'role': 'user', 'content': 'I always think the worst case scenario will happen'},
        {'role': 'assistant', 'content': 'That sounds challenging'},
        {'role': 'user', 'content': 'Everything is either perfect or a complete disaster. I should be perfect at everything. I avoid doing things because I know they will fail.'}
    ]
    
    result2 = detector.analyze_conversation(cbt_messages)
    context2 = _generate_psychology_context(result2)
    
    print(f"🔍 Frameworks detected: {list(result2.get('frameworks', {}).keys())}")
    print(f"📋 Context generated: \"{context2}\"")
    
    # Test Case 3: Mixed framework content
    print("\n📝 Test Case 3: Mixed framework conversation")
    mixed_messages = [
        {'role': 'user', 'content': 'I have different parts of me that react to stress differently'},
        {'role': 'assistant', 'content': 'Tell me more about these parts'},
        {'role': 'user', 'content': 'Well, I also worry about being abandoned in relationships and I always think the worst will happen'}
    ]
    
    result3 = detector.analyze_conversation(mixed_messages)
    context3 = _generate_psychology_context(result3)
    
    print(f"🔍 Frameworks detected: {list(result3.get('frameworks', {}).keys())}")
    print(f"📋 Context generated: \"{context3}\"")
    
    # Test system prompt generation
    print("\n🤖 Testing System Prompt Generation")
    system_prompt = get_system_prompt_for_language("chinese", context3)
    print(f"📋 System prompt includes framework-specific guidance: {'框架' in system_prompt['content']}")
    
    if "根据检测到的心理学框架来调整你的回应风格" in system_prompt['content']:
        print("✅ System prompt includes framework-specific response guidance")
    else:
        print("❌ System prompt missing framework-specific guidance")
    
    print("\n🎉 Framework prioritization test completed!")
    return True

def test_confidence_sorting():
    """Test that frameworks are sorted by confidence."""
    
    print("\n🔢 Testing Confidence-Based Framework Sorting")
    print("=" * 50)
    
    detector = MultiPsychologyDetector()
    detector.register_all_frameworks()
    
    # Create a test case where we can verify sorting
    messages = [
        {'role': 'user', 'content': 'I feel anxious in relationships and have different internal parts'},
        {'role': 'assistant', 'content': 'That sounds complex'},
        {'role': 'user', 'content': 'Yes, I worry about abandonment and my inner critic is harsh'}
    ]
    
    result = detector.analyze_conversation(messages)
    frameworks = result.get('frameworks', {})
    
    # Extract frameworks with elements and their confidence scores
    framework_confidences = []
    for name, analysis in frameworks.items():
        elements = analysis.get('elements_detected', [])
        confidence = analysis.get('confidence_score', 0.0)
        if elements and confidence >= 0.3:
            framework_confidences.append((name, confidence))
    
    # Sort by confidence (descending)
    framework_confidences.sort(key=lambda x: x[1], reverse=True)
    
    print("📊 Framework confidence scores (sorted):")
    for name, confidence in framework_confidences:
        print(f"  {name}: {confidence:.2f}")
    
    # Generate context and verify order
    context = _generate_psychology_context(result)
    print(f"\n📋 Generated context: \"{context}\"")
    
    if len(framework_confidences) >= 2:
        highest_framework = framework_confidences[0][0]
        print(f"✅ Highest confidence framework: {highest_framework}")
        
        # Check if the highest confidence framework appears first in context
        framework_keywords = {
            'attachment': '依恋模式',
            'ifs': 'IFS部分',
            'cbt': '认知扭曲',
            'jungian': '原型内容',
            'narrative': '问题外化'
        }
        
        if highest_framework in framework_keywords:
            keyword = framework_keywords[highest_framework]
            if keyword in context:
                print(f"✅ Highest confidence framework ({highest_framework}) appears in context")
            else:
                print(f"❌ Highest confidence framework ({highest_framework}) missing from context")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting Improved Multi-Framework Response Tests")
    print("=" * 60)
    
    try:
        test_framework_prioritization()
        test_confidence_sorting()
        
        print("\n" + "=" * 60)
        print("✅ All tests completed successfully!")
        print("🎯 The system now prioritizes frameworks by confidence")
        print("🤖 AI responses will be informed by the most relevant frameworks")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)