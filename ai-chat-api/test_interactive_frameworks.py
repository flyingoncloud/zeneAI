#!/usr/bin/env python3
"""
Interactive Framework Testing Script

This script helps you test different psychology frameworks by providing
pre-written conversation examples and showing the framework detection results.
"""

import requests
import json
import time
from typing import Dict, List

# API Configuration
API_BASE = "http://localhost:5000/api"

class FrameworkTester:
    def __init__(self):
        self.conversation_id = None
        self.framework_examples = {
            "ifs": [
                "Part of me wants to take risks, but another part is terrified of failure",
                "There's a protective part that tries to control everything",
                "I notice different parts of me show up in different situations",
                "My inner critic is really loud today"
            ],
            "cbt": [
                "I always think the worst case scenario will happen",
                "Everything is either perfect or a complete disaster",
                "I should be perfect at everything I do",
                "What if I fail and everyone thinks I'm incompetent?"
            ],
            "jungian": [
                "I had a dream about being chased by a dark shadow figure",
                "I feel like I'm on a hero's journey, facing challenges to transform",
                "There's a wise old woman in my dreams who gives me advice",
                "I'm confronting the shadow aspects of my personality"
            ],
            "narrative": [
                "Depression tells me I'm worthless, but I want to rewrite that story",
                "There was a time when I felt confident and capable",
                "The anxiety tries to convince me I can't handle challenges",
                "I'm not just my problems - there's more to my story"
            ],
            "attachment": [
                "I'm always anxious in relationships and worry about being abandoned",
                "I have trouble trusting people and get clingy when I feel insecure",
                "I tend to avoid getting too close because I might get hurt",
                "My childhood relationships taught me that people leave"
            ]
        }
    
    def create_conversation(self) -> bool:
        """Create a new conversation for testing"""
        try:
            response = requests.post(f"{API_BASE}/conversations", 
                                   json={"title": "Framework Testing Session"})
            if response.status_code == 201:
                self.conversation_id = response.json()["id"]
                print(f"✅ Created conversation ID: {self.conversation_id}")
                return True
            else:
                print(f"❌ Failed to create conversation: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error creating conversation: {e}")
            return False
    
    def send_message(self, content: str) -> Dict:
        """Send a message and return the response with psychology analysis"""
        try:
            response = requests.post(
                f"{API_BASE}/conversations/{self.conversation_id}/messages",
                json={"content": content}
            )
            if response.status_code == 201:
                return response.json()
            else:
                print(f"❌ Failed to send message: {response.status_code}")
                return {}
        except Exception as e:
            print(f"❌ Error sending message: {e}")
            return {}
    
    def display_framework_analysis(self, response: Dict):
        """Display the psychology framework analysis from the response"""
        psychology = response.get("psychology_analysis", {})
        
        if not psychology.get("analyzed", False):
            print("🔍 No psychology analysis performed yet")
            return
        
        frameworks = psychology.get("frameworks", {})
        if not frameworks:
            print("🔍 No frameworks detected")
            return
        
        print("\n🧠 Framework Analysis:")
        print("-" * 50)
        
        # Sort frameworks by confidence
        framework_items = []
        for name, analysis in frameworks.items():
            confidence = analysis.get("confidence_score", 0.0)
            elements = analysis.get("elements_detected", [])
            if confidence > 0 or elements:
                framework_items.append((name, analysis, confidence))
        
        framework_items.sort(key=lambda x: x[2], reverse=True)
        
        for name, analysis, confidence in framework_items:
            elements = analysis.get("elements_detected", [])
            print(f"  📊 {name.upper()}: {confidence:.2f} confidence")
            
            if elements:
                element_types = {}
                for element in elements[:3]:  # Show top 3 elements
                    elem_type = element.get("type", "unknown")
                    subtype = element.get("subtype", elem_type)
                    if elem_type not in element_types:
                        element_types[elem_type] = []
                    element_types[elem_type].append(subtype)
                
                for elem_type, subtypes in element_types.items():
                    print(f"    • {elem_type}: {', '.join(subtypes[:2])}")
        
        # Show cross-framework insights
        cross_insights = psychology.get("cross_framework_insights", {})
        if cross_insights.get("multiple_frameworks_detected"):
            detected = cross_insights["multiple_frameworks_detected"]["frameworks"]
            print(f"\n🔗 Multiple frameworks detected: {', '.join(detected)}")
    
    def test_framework(self, framework_name: str):
        """Test a specific framework with example messages"""
        if framework_name not in self.framework_examples:
            print(f"❌ Unknown framework: {framework_name}")
            return
        
        print(f"\n🎯 Testing {framework_name.upper()} Framework")
        print("=" * 60)
        
        examples = self.framework_examples[framework_name]
        
        for i, message in enumerate(examples, 1):
            print(f"\n📝 Message {i}: {message}")
            
            response = self.send_message(message)
            if response:
                self.display_framework_analysis(response)
                
                # Show AI response
                ai_response = response.get("content", "")
                if ai_response:
                    print(f"\n🤖 AI Response: {ai_response[:200]}...")
            
            # Small delay between messages
            time.sleep(1)
    
    def test_all_frameworks(self):
        """Test all frameworks sequentially"""
        print("\n🚀 Testing All Psychology Frameworks")
        print("=" * 60)
        
        for framework in self.framework_examples.keys():
            self.test_framework(framework)
            print("\n" + "="*60)
    
    def interactive_mode(self):
        """Interactive mode for custom testing"""
        print("\n💬 Interactive Mode - Type your own messages")
        print("Type 'quit' to exit")
        print("-" * 50)
        
        while True:
            user_input = input("\n👤 You: ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                break
            
            if not user_input:
                continue
            
            response = self.send_message(user_input)
            if response:
                self.display_framework_analysis(response)
                
                ai_response = response.get("content", "")
                if ai_response:
                    print(f"\n🤖 AI: {ai_response}")

def main():
    print("🧠 Multi-Framework Psychology Detection Tester")
    print("=" * 60)
    
    tester = FrameworkTester()
    
    # Create conversation
    if not tester.create_conversation():
        return
    
    while True:
        print("\n📋 Choose testing mode:")
        print("1. Test specific framework")
        print("2. Test all frameworks")
        print("3. Interactive mode")
        print("4. Quit")
        
        choice = input("\nEnter choice (1-4): ").strip()
        
        if choice == "1":
            print("\nAvailable frameworks:")
            for i, framework in enumerate(tester.framework_examples.keys(), 1):
                print(f"{i}. {framework.upper()}")
            
            try:
                fw_choice = int(input("\nSelect framework (1-5): ")) - 1
                frameworks = list(tester.framework_examples.keys())
                if 0 <= fw_choice < len(frameworks):
                    tester.test_framework(frameworks[fw_choice])
                else:
                    print("❌ Invalid choice")
            except ValueError:
                print("❌ Please enter a number")
        
        elif choice == "2":
            tester.test_all_frameworks()
        
        elif choice == "3":
            tester.interactive_mode()
        
        elif choice == "4":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")

if __name__ == "__main__":
    main()