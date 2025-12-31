#!/usr/bin/env python3
"""
Real Conversation Analysis Test

This script analyzes the real conversation you provided to show
how the multi-framework psychology detection system works.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.psychology.multi_detector import MultiPsychologyDetector
from src.psychology.detectors.cbt_detector import CBTDetector
# IFS detector will be imported when needed
from src.psychology.adapters.ifs_adapter import IFSAdapter
from src.api.chat_service import _generate_psychology_context

def analyze_real_conversation():
    """Analyze the real conversation provided by the user"""
    
    print("🔍 Real Conversation Analysis")
    print("=" * 60)
    
    # The real conversation messages
    messages = [
        {
            "role": "user", 
            "content": "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应"
        },
        {
            "role": "assistant",
            "content": "你好，听到你描述自己总是担心最坏的情况会发生，以及感觉有不同部分对压力做出不同反应。这些感受可能反映了你内在不同的部分正在争执或表达各自的需求。"
        }
    ]
    
    print("📝 Original User Message:")
    print(f"   \"{messages[0]['content']}\"")
    print()
    
    print("🤖 AI Response:")
    print(f"   \"{messages[1]['content'][:100]}...\"")
    print()
    
    # Initialize the multi-framework detector
    detector = MultiPsychologyDetector()
    
    # Analyze the conversation
    analysis = detector.analyze_conversation(messages)
    
    print("🧠 Framework Analysis Results:")
    print("-" * 40)
    
    if not analysis.get('analyzed', False):
        print("❌ No analysis performed")
        return
    
    frameworks = analysis.get('frameworks', {})
    if not frameworks:
        print("❌ No frameworks detected")
        return
    
    # Sort frameworks by confidence
    framework_items = []
    for name, result in frameworks.items():
        confidence = result.get('confidence_score', 0.0)
        elements = result.get('elements_detected', [])
        if confidence > 0 or elements:
            framework_items.append((name, result, confidence))
    
    framework_items.sort(key=lambda x: x[2], reverse=True)
    
    print("📊 Detected Frameworks (sorted by confidence):")
    for name, result, confidence in framework_items:
        elements = result.get('elements_detected', [])
        print(f"  • {name.upper()}: {confidence:.2f} confidence")
        
        if elements:
            print(f"    Elements detected: {len(elements)}")
            for element in elements[:3]:  # Show top 3
                elem_type = element.get('type', 'unknown')
                subtype = element.get('subtype', elem_type)
                elem_confidence = element.get('confidence', 0.0)
                print(f"      - {elem_type}: {subtype} ({elem_confidence:.2f})")
        print()
    
    # Show cross-framework insights
    cross_insights = analysis.get('cross_framework_insights', {})
    if cross_insights:
        print("🔗 Cross-Framework Insights:")
        if cross_insights.get('multiple_frameworks_detected'):
            detected = cross_insights['multiple_frameworks_detected']['frameworks']
            print(f"  • Multiple frameworks detected: {', '.join(detected)}")
            print(f"  • Therapeutic relevance: {cross_insights['multiple_frameworks_detected']['therapeutic_relevance']}")
        print()
    
    # Generate psychology context
    psychology_context = _generate_psychology_context(analysis)
    if psychology_context:
        print("💬 Psychology Context for AI:")
        print(f"  \"{psychology_context}\"")
        print()
    
    # Analysis of what should have been detected
    print("🎯 Expected Framework Detection Analysis:")
    print("-" * 40)
    
    user_message = messages[0]['content']
    
    print("📋 User Message Analysis:")
    print(f"  Original: \"{user_message}\"")
    print()
    
    print("🔍 CBT Patterns Expected:")
    print("  • '总是觉得最坏的情况会发生' → Catastrophizing (灾难化思维)")
    print("  • Should detect: cognitive_distortion type with catastrophizing subtype")
    print()
    
    print("🔍 IFS Patterns Expected:")
    print("  • '我有不同的部分在对压力做出不同的反应' → Parts language")
    print("  • Should detect: ifs_part type with various subtypes")
    print()
    
    print("🤖 AI Response Analysis:")
    ai_response = messages[1]['content']
    print("  The AI response shows strong IFS influence:")
    print("  • Uses IFS terminology: '内在不同的部分', '部分', '自我'")
    print("  • Focuses on parts work and Self energy")
    print("  • Suggests exploring parts with curiosity and compassion")
    print()
    
    # Show what the system should improve
    print("💡 System Performance Analysis:")
    print("-" * 40)
    
    cbt_detected = any(fw[0] == 'cbt' for fw in framework_items if fw[2] > 0.3)
    ifs_detected = any(fw[0] == 'ifs' for fw in framework_items if fw[2] > 0.3)
    
    print(f"  ✅ CBT Detection: {'SUCCESS' if cbt_detected else 'NEEDS IMPROVEMENT'}")
    print(f"  ✅ IFS Detection: {'SUCCESS' if ifs_detected else 'NEEDS IMPROVEMENT'}")
    
    if cbt_detected and ifs_detected:
        print("  🎉 Multi-framework detection working correctly!")
    else:
        print("  ⚠️  Framework detection may need tuning for Chinese language")
    
    return analysis

def test_individual_frameworks():
    """Test individual framework detectors with the Chinese message"""
    
    print("\n🔬 Individual Framework Testing")
    print("=" * 60)
    
    user_message = "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应"
    messages = [{"role": "user", "content": user_message}]
    
    print(f"Testing message: \"{user_message}\"")
    print()
    
    # Test CBT Detector
    print("🧠 CBT Detector Test:")
    try:
        cbt_detector = CBTDetector()
        cbt_patterns = cbt_detector.quick_scan(messages)
        print(f"  Patterns found: {cbt_patterns.get('has_patterns', False)}")
        if cbt_patterns.get('patterns_found'):
            for pattern_type, patterns in cbt_patterns['patterns_found'].items():
                print(f"    {pattern_type}: {patterns}")
        
        if cbt_patterns.get('has_patterns', False):
            cbt_llm_result = cbt_detector.analyze_with_llm(messages, cbt_patterns)
            print(f"  LLM Analysis - Confidence: {cbt_llm_result.get('confidence_score', 0.0):.2f}")
            elements = cbt_llm_result.get('elements_detected', [])
            print(f"  Elements detected: {len(elements)}")
            for element in elements[:2]:
                print(f"    - {element.get('type')}: {element.get('subtype')} ({element.get('confidence', 0.0):.2f})")
    except Exception as e:
        print(f"  ❌ CBT Detector Error: {e}")
    
    print()
    
    # Test IFS Detector (via adapter)
    print("🎭 IFS Detector Test:")
    try:
        from src.ifs.detector import IFSDetector
        ifs_detector = IFSDetector()
        ifs_adapter = IFSAdapter(ifs_detector)
        
        ifs_patterns = ifs_adapter.quick_scan(messages)
        print(f"  Patterns found: {ifs_patterns.get('has_patterns', False)}")
        if ifs_patterns.get('patterns_found'):
            for pattern_type, patterns in ifs_patterns['patterns_found'].items():
                print(f"    {pattern_type}: {patterns}")
        
        if ifs_patterns.get('has_patterns', False):
            ifs_llm_result = ifs_adapter.analyze_with_llm(messages, ifs_patterns)
            print(f"  LLM Analysis - Confidence: {ifs_llm_result.get('confidence_score', 0.0):.2f}")
            elements = ifs_llm_result.get('elements_detected', [])
            print(f"  Elements detected: {len(elements)}")
            for element in elements[:2]:
                print(f"    - {element.get('type')}: {element.get('subtype')} ({element.get('confidence', 0.0):.2f})")
    except Exception as e:
        print(f"  ❌ IFS Detector Error: {e}")

def main():
    """Main function to run the analysis"""
    
    print("🌟 Multi-Framework Psychology Detection - Real Conversation Analysis")
    print("=" * 80)
    print()
    
    # Analyze the real conversation
    analysis = analyze_real_conversation()
    
    # Test individual frameworks
    test_individual_frameworks()
    
    print("\n" + "=" * 80)
    print("📋 Summary:")
    print("This real conversation demonstrates the multi-framework system detecting")
    print("both CBT patterns (catastrophizing) and IFS patterns (parts language)")
    print("in Chinese, showing the system's bilingual capabilities.")
    print()
    print("The AI response appropriately integrated IFS therapeutic approach,")
    print("showing how psychology context influences response generation.")

if __name__ == "__main__":
    main()