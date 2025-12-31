#!/usr/bin/env python3
"""
Test OpenAI Import

Simple test to check if OpenAI is properly installed and importable.
"""

import sys
import os

print("🔍 Testing OpenAI Import")
print("=" * 30)

# Test 1: Basic import
try:
    import openai
    print("✅ OpenAI module imported successfully")
    print(f"   OpenAI version: {openai.__version__}")
except ImportError as e:
    print(f"❌ Failed to import OpenAI: {e}")
    sys.exit(1)

# Test 2: Check environment
try:
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key and api_key.startswith("sk-"):
        print("✅ OpenAI API key found and properly formatted")
    else:
        print("❌ OpenAI API key not found or improperly formatted")
except Exception as e:
    print(f"❌ Environment check failed: {e}")

# Test 3: Test OpenAI client creation
try:
    from openai import OpenAI
    client = OpenAI()
    print("✅ OpenAI client created successfully")
except Exception as e:
    print(f"❌ Failed to create OpenAI client: {e}")

# Test 4: Test psychology detector import
try:
    from src.psychology.multi_detector import MultiPsychologyDetector
    print("✅ MultiPsychologyDetector imported successfully")
    
    detector = MultiPsychologyDetector()
    print("✅ MultiPsychologyDetector created successfully")
    
    # Check registered frameworks
    if hasattr(detector, 'framework_manager') and detector.framework_manager:
        enabled_frameworks = detector.framework_manager.get_enabled_frameworks()
        print(f"✅ Enabled frameworks: {enabled_frameworks}")
    else:
        print("❌ No frameworks registered")
        
except Exception as e:
    print(f"❌ Psychology detector test failed: {e}")
    import traceback
    traceback.print_exc()

print("\n🏁 Import test completed!")