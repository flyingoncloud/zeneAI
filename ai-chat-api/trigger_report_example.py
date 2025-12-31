#!/usr/bin/env python3
"""
Manual Report Generation Example

This script shows how to manually trigger report generation
for existing conversations or create new ones.
"""

import requests
import json

def trigger_report_for_existing_conversation(conversation_id):
    """Trigger report generation for an existing conversation"""
    
    base_url = "http://localhost:8000"
    
    print(f"🔍 Checking eligibility for conversation {conversation_id}...")
    
    # Step 1: Check eligibility
    response = requests.get(f"{base_url}/conversations/{conversation_id}/report-eligibility")
    
    if response.status_code == 200:
        eligibility = response.json()
        print(f"✅ Eligibility check completed")
        print(f"   Eligible: {eligibility['eligible']}")
        print(f"   Reason: {eligibility['reason']}")
        
        if eligibility['eligible']:
            print(f"\n📄 Generating report...")
            
            # Step 2: Generate report
            report_response = requests.post(f"{base_url}/conversations/{conversation_id}/generate-report")
            
            if report_response.status_code == 200:
                report_info = report_response.json()
                print(f"✅ Report generated successfully!")
                print(f"   Filename: {report_info['filename']}")
                print(f"   Download URL: {base_url}{report_info['download_url']}")
                
                # Step 3: Download report
                download_response = requests.get(f"{base_url}{report_info['download_url']}")
                if download_response.status_code == 200:
                    filename = f"downloaded_{report_info['filename']}"
                    with open(filename, 'wb') as f:
                        f.write(download_response.content)
                    print(f"✅ Report downloaded: {filename}")
                    return filename
                else:
                    print(f"❌ Failed to download report: {download_response.status_code}")
            else:
                print(f"❌ Failed to generate report: {report_response.status_code}")
                print(f"   Error: {report_response.text}")
        else:
            print(f"❌ Conversation not eligible for report generation")
            print(f"   Criteria: {eligibility['criteria']}")
    else:
        print(f"❌ Failed to check eligibility: {response.status_code}")
    
    return None

def create_conversation_and_generate_report():
    """Create a new conversation with psychology content and generate report"""
    
    base_url = "http://localhost:8000"
    
    print("🆕 Creating new conversation...")
    
    # Step 1: Create conversation
    conversation_data = {
        "session_id": f"manual-test-{int(__import__('time').time())}",
        "user_id": "manual-test-user"
    }
    
    response = requests.post(f"{base_url}/conversations/", json=conversation_data)
    if response.status_code != 200:
        print(f"❌ Failed to create conversation: {response.status_code}")
        return None
    
    conversation = response.json()
    conversation_id = conversation['id']
    session_id = conversation['session_id']
    
    print(f"✅ Conversation created: ID {conversation_id}")
    
    # Step 2: Send messages with psychology content
    psychology_messages = [
        "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应",
        "我在关系中也很焦虑，总是担心被抛弃。我很难信任别人",
        "我做了一个梦，梦见黑暗的影子在追我。我感觉这像是我内心的阴影面",
        "抑郁症告诉我我没有价值，但我想重写这个故事",
        "我感觉有一个内在的批评者总是在评判我",
        "我想要找到内在的平衡和和谐，整合这些不同的部分"
    ]
    
    print(f"\n💬 Sending {len(psychology_messages)} messages...")
    
    for i, message in enumerate(psychology_messages, 1):
        chat_data = {
            "message": message,
            "session_id": session_id
        }
        
        response = requests.post(f"{base_url}/chat/", json=chat_data)
        if response.status_code == 200:
            print(f"   ✅ Message {i} sent")
        else:
            print(f"   ❌ Failed to send message {i}: {response.status_code}")
    
    print(f"\n⏳ Waiting a moment for psychology analysis...")
    __import__('time').sleep(2)
    
    # Step 3: Generate report
    return trigger_report_for_existing_conversation(conversation_id)

def main():
    """Main function with options"""
    
    print("🎯 ZENE Report Generation Trigger")
    print("=" * 50)
    print()
    print("Choose an option:")
    print("1. Generate report for existing conversation (need conversation ID)")
    print("2. Create new conversation and generate report")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        conversation_id = input("Enter conversation ID: ").strip()
        try:
            conversation_id = int(conversation_id)
            trigger_report_for_existing_conversation(conversation_id)
        except ValueError:
            print("❌ Invalid conversation ID. Must be a number.")
    
    elif choice == "2":
        create_conversation_and_generate_report()
    
    elif choice == "3":
        print("👋 Goodbye!")
    
    else:
        print("❌ Invalid choice. Please run the script again.")

if __name__ == "__main__":
    main()