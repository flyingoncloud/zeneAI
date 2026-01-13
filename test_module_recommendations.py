#!/usr/bin/env python3
"""
Test script for Module Recommendation System

Tests the psychological state analyzer, trigger detector, and module recommender
with various conversation scenarios.
"""

import sys
import os

# Add ai-chat-api to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai-chat-api'))

from src.modules.psychological_analyzer import PsychologicalStateAnalyzer
from src.modules.trigger_detector import TriggerDetector
from src.modules.recommender import ModuleRecommender
from src.modules.module_config import MODULES


def print_section(title):
    """Print a section header"""
    print(f"\n{'=' * 80}")
    print(f"  {title}")
    print('=' * 80)


def print_state(state):
    """Print psychological state analysis"""
    print("\n📊 Psychological State Analysis:")
    print(f"  - Emotional Intensity:   {state['emotional_intensity']:.2f}")
    print(f"  - Emotional Clarity:     {state['emotional_clarity']:.2f}")
    print(f"  - Expression Complexity: {state['expression_complexity']:.2f}")
    print(f"  - Self Awareness:        {state['self_awareness']:.2f}")
    print(f"  - Conversation Depth:    {state['conversation_depth']:.2f}")

    print("\n🔍 Indicators:")
    for indicator, value in state['indicators'].items():
        if value:
            print(f"  ✓ {indicator}")

    # NEW: Display patterns if available
    if 'patterns' in state:
        patterns = state['patterns']
        print("\n🧠 Pattern Recognition:")

        defense = patterns.get('defense_mechanisms', {})
        if defense.get('detected'):
            print(f"  - Defense Mechanisms: {', '.join(defense['detected'])} (confidence: {defense.get('confidence', 0):.2f})")
            if defense.get('impact'):
                print(f"    Impact: {defense['impact']}")

        attachment = patterns.get('attachment_patterns', {})
        if attachment.get('primary_pattern'):
            print(f"  - Attachment Pattern: {attachment['primary_pattern']} (confidence: {attachment.get('confidence', 0):.2f})")

        themes = patterns.get('recurring_themes', {})
        if themes.get('dominant_theme'):
            print(f"  - Dominant Theme: {themes['dominant_theme']}")

    # NEW: Display progression if available
    if 'progression' in state:
        progression = state['progression']
        if progression.get('trajectory') not in ['unknown', 'insufficient_data']:
            print("\n📊 Emotional Progression:")
            print(f"  - Trajectory: {progression['trajectory']}")
            print(f"  - Intensity Trend: {progression.get('intensity_trend', 0):.2f}")
            if progression.get('shifts'):
                print(f"  - Shifts: {len(progression['shifts'])} detected")


def print_recommendations(recommendations):
    """Print module recommendations"""
    if not recommendations:
        print("\n❌ No module recommendations")
        return

    print(f"\n✅ Module Recommendations ({len(recommendations)}):\n")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec['icon']} {rec['name']} (Priority: {rec['priority']}, Score: {rec['score']:.2f})")
        print(f"   Description: {rec['description']}")
        print(f"   Reasons: {', '.join(rec['reasons'])}")
        print(f"   Guidance: \"{rec['guidance']}\"")
        print()


def test_scenario(scenario_name, message, history, language="zh"):
    """Test a conversation scenario"""
    print_section(f"TEST: {scenario_name}")

    print(f"\n💬 User Message:\n\"{message}\"\n")

    # Initialize components
    analyzer = PsychologicalStateAnalyzer()
    detector = TriggerDetector()
    recommender = ModuleRecommender()

    # Step 1: Analyze state
    state = analyzer.analyze_state(message, history, language)
    print_state(state)

    # Step 2: Detect triggers
    triggers = detector.detect_triggers(state)
    print(f"\n🎯 Triggered Modules: {list(triggers.keys())}")

    # Step 3: Get recommendations
    top_recommendations = detector.get_top_recommendations(triggers, max_recommendations=2)

    # Step 4: Build full recommendations
    recommendations_result = recommender.get_recommendations(
        current_message=message,
        conversation_history=history,
        language=language,
        max_recommendations=2
    )

    print_recommendations(recommendations_result['recommendations'])

    # Step 5: Show AI prompt format
    if recommendations_result['has_recommendations']:
        print("\n📝 AI System Prompt Addition (preview):")
        prompt = recommender.format_for_ai_prompt(recommendations_result)
        print(prompt[:500] + "..." if len(prompt) > 500 else prompt)


def main():
    """Run test scenarios"""
    print("\n" + "=" * 80)
    print("  MODULE RECOMMENDATION SYSTEM - TEST SUITE")
    print("=" * 80)

    # Test 1: High emotional intensity
    test_scenario(
        scenario_name="High Emotional Intensity (Breathing Exercise)",
        message="我真的要崩溃了！太焦虑了，心跳加速，喘不过气，感觉快要失控了！",
        history=[
            {"role": "user", "content": "最近工作压力很大"},
            {"role": "assistant", "content": "我理解你的感受，工作压力确实不容易应对。"}
        ],
        language="zh"
    )

    # Test 2: Vague emotion expression
    test_scenario(
        scenario_name="Vague Emotion Expression (Emotion Labeling)",
        message="我就是感觉不太好，怪怪的，说不上来是什么感觉，反正就是不舒服。",
        history=[
            {"role": "user", "content": "今天发生了一些事情"},
            {"role": "assistant", "content": "可以跟我说说发生了什么吗？"}
        ],
        language="zh"
    )

    # Test 3: Symbolic language
    test_scenario(
        scenario_name="Symbolic Language (Inner Doodling)",
        message="我梦见自己被困在一个黑暗的房间里，感觉像是有什么东西在压着我，像一座大山。",
        history=[
            {"role": "user", "content": "昨晚做了个奇怪的梦"},
            {"role": "assistant", "content": "梦境有时候能反映我们内心的状态，你能描述一下吗？"}
        ],
        language="zh"
    )

    # Test 4: Self-exploration + New user
    test_scenario(
        scenario_name="Self-Exploration + New User (Quick Assessment)",
        message="我想了解一下自己为什么总是这样，我到底是什么样的人？",
        history=[],
        language="zh"
    )

    # NEW Test 5: Defense Mechanism Detection (Avoidance)
    test_scenario(
        scenario_name="Defense Mechanism - Avoidance Pattern",
        message="我不想谈这个了，换个话题吧。其实也没什么大不了的，算了吧。",
        history=[
            {"role": "user", "content": "最近和老板的关系有点紧张"},
            {"role": "assistant", "content": "能跟我说说发生了什么吗？"},
            {"role": "user", "content": "不想说了，没什么好说的"}
        ],
        language="zh"
    )

    # NEW Test 6: Anxious Attachment Pattern
    test_scenario(
        scenario_name="Attachment Pattern - Anxious Type",
        message="我总是担心失去他，需要一直确认他还在乎我。我害怕被抛弃，这种不安全感让我很痛苦。",
        history=[
            {"role": "user", "content": "我在感情里总是很焦虑"},
            {"role": "assistant", "content": "这种焦虑是什么时候开始的？"}
        ],
        language="zh"
    )

    # NEW Test 7: Escalating Emotional Intensity (Progression)
    print_section("TEST: Emotional Progression - Escalating Intensity")
    print("\n💬 Simulating 3-message escalation:\n")

    messages = [
        "有点烦躁",
        "真的很烦，压力好大",
        "我要疯了！受不了了！太压抑了！"
    ]

    history = []
    for i, msg in enumerate(messages, 1):
        print(f"Message {i}: \"{msg}\"")
        analyzer = PsychologicalStateAnalyzer()
        state = analyzer.analyze_state(msg, history, "zh")
        print(f"  → Intensity: {state['emotional_intensity']:.2f}")
        history.append({"role": "user", "content": msg})
        history.append({"role": "assistant", "content": "我在听你说。"})

    print("\n✅ Expected: Intensity increases from ~0.3 → 0.5 → 0.9 (escalating)")

    # NEW Test 8: Sub-Module Conflict Resolution
    test_scenario(
        scenario_name="Sub-Module Conflict (Breathing vs Labeling)",
        message="我感觉不太好，心跳很快，但说不清是什么感受。就是很不舒服，怪怪的。",
        history=[
            {"role": "user", "content": "今天有点不对劲"},
            {"role": "assistant", "content": "能具体说说吗？"}
        ],
        language="zh"
    )
    print("\n💡 Expected: Both breathing (high intensity) and labeling (vague) triggered")
    print("   → Should recommend only the higher-scoring sub-module (score-based selection)")

    print_section("TEST SUITE COMPLETED")
    print("\n✅ All test scenarios completed successfully!")
    print("✅ Tested: Base features + Pattern recognition + Emotional progression + Sub-module conflicts")


if __name__ == "__main__":
    main()
