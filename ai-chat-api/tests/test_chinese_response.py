#!/usr/bin/env python3
"""
Test script to verify Chinese response functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.api.chat_service import get_ai_response, get_system_prompt_for_language
from src.config.settings import AI_RESPONSE_LANGUAGE, AI_FORCE_LANGUAGE

def test_chinese_responses():
    """Test that AI responds in Chinese regardless of input language"""
    
    print(f"AI_RESPONSE_LANGUAGE: {AI_RESPONSE_LANGUAGE}")
    print(f"AI_FORCE_LANGUAGE: {AI_FORCE_LANGUAGE}")
    print("-" * 50)
    
    # Test system prompt generation
    chinese_prompt = get_system_prompt_for_language("chinese")
    print("Chinese System Prompt:")
    print(chinese_prompt["content"])
    print("-" * 50)
    
    # Test messages in different languages
    test_cases = [
        {
            "language": "English",
            "messages": [{"role": "user", "content": "Hello, how are you today?"}]
        },
        {
            "language": "Japanese", 
            "messages": [{"role": "user", "content": "こんにちは、元気ですか？"}]
        },
        {
            "language": "Chinese",
            "messages": [{"role": "user", "content": "你好，今天怎么样？"}]
        }
    ]
    
    print("Testing AI responses (should all be in Chinese):")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: Input in {test_case['language']}")
        print(f"Input: {test_case['messages'][0]['content']}")
        
        try:
            response = get_ai_response(test_case['messages'])
            print(f"Response: {response}")
            print("-" * 50)
        except Exception as e:
            print(f"Error: {e}")
            print("-" * 50)

if __name__ == "__main__":
    test_chinese_responses()