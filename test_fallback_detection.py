#!/usr/bin/env python3
"""
Test fallback module detection
"""
from typing import Dict, List


def _detect_module_mentions(
    text: str,
    module_status: Dict,
    language: str = "chinese"
) -> List[str]:
    """
    Fallback detection: Check if AI response mentions any modules without calling function
    """
    detected = []

    # Define module keywords for detection
    if language == "chinese":
        module_patterns = {
            "breathing_exercise": ["呼吸训练", "呼吸练习", "深呼吸", "呼吸"],
            "emotion_labeling": ["情绪命名", "给情绪命名", "命名情绪", "情绪标签"],
            "inner_doodling": ["内视涂鸦", "涂鸦", "画一幅", "绘制"],
            "quick_assessment": ["内视快测", "快测", "评估", "测试", "量表"]
        }
    else:
        module_patterns = {
            "breathing_exercise": ["breathing exercise", "breathing practice", "deep breath", "breath"],
            "emotion_labeling": ["emotion labeling", "label emotion", "name emotion", "emotion label"],
            "inner_doodling": ["inner doodling", "doodling", "draw", "sketch"],
            "quick_assessment": ["quick assessment", "assessment", "test", "questionnaire"]
        }

    text_lower = text.lower()

    for module_id, keywords in module_patterns.items():
        # Skip if module is already completed
        if module_status.get(module_id, {}).get("completed_at"):
            continue

        # Check if any keyword is mentioned
        for keyword in keywords:
            if keyword.lower() in text_lower:
                detected.append(module_id)
                break  # Only add once per module

    return detected

def test_fallback_detection():
    """Test that fallback detection catches module mentions"""

    # Test 1: Chinese breathing exercise mention
    print("Test 1: Chinese breathing exercise mention")
    text = "我建议我们可以尝试一下呼吸训练，这可能会有助于你在此时平复一下情绪"
    module_status = {}
    detected = _detect_module_mentions(text, module_status, language="chinese")
    print(f"  Text: {text[:50]}...")
    print(f"  Detected: {detected}")
    assert "breathing_exercise" in detected, "Should detect breathing exercise"
    print("  ✓ Pass\n")

    # Test 2: Completed module should not be detected
    print("Test 2: Completed module should not be detected")
    text = "让我们试试呼吸练习"
    module_status = {
        "breathing_exercise": {
            "completed_at": "2024-01-01T00:00:00"
        }
    }
    detected = _detect_module_mentions(text, module_status, language="chinese")
    print(f"  Text: {text}")
    print(f"  Module status: completed")
    print(f"  Detected: {detected}")
    assert "breathing_exercise" not in detected, "Should not detect completed module"
    print("  ✓ Pass\n")

    # Test 3: Multiple module mentions
    print("Test 3: Multiple module mentions")
    text = "我们可以试试呼吸练习，然后做情绪命名"
    module_status = {}
    detected = _detect_module_mentions(text, module_status, language="chinese")
    print(f"  Text: {text}")
    print(f"  Detected: {detected}")
    assert "breathing_exercise" in detected, "Should detect breathing exercise"
    assert "emotion_labeling" in detected, "Should detect emotion labeling"
    print("  ✓ Pass\n")

    # Test 4: English detection
    print("Test 4: English breathing exercise mention")
    text = "Let's try some breathing exercises to help you calm down"
    module_status = {}
    detected = _detect_module_mentions(text, module_status, language="english")
    print(f"  Text: {text}")
    print(f"  Detected: {detected}")
    assert "breathing_exercise" in detected, "Should detect breathing exercise in English"
    print("  ✓ Pass\n")

    # Test 5: No module mentions
    print("Test 5: No module mentions")
    text = "我能理解你现在的感受，这种郁闷的情绪一定让你觉得很不舒服"
    module_status = {}
    detected = _detect_module_mentions(text, module_status, language="chinese")
    print(f"  Text: {text}")
    print(f"  Detected: {detected}")
    assert len(detected) == 0, "Should not detect any modules"
    print("  ✓ Pass\n")

    print("=" * 60)
    print("✓ All tests passed!")
    print("=" * 60)


if __name__ == "__main__":
    test_fallback_detection()
