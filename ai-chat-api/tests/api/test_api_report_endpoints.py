#!/usr/bin/env python3
"""
Test API Report Endpoints

This script tests the report generation API endpoints to ensure they work correctly
with the new PDF format and real conversation data.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

import requests
import json
from datetime import datetime

def test_api_endpoints():
    """Test the report generation API endpoints"""
    
    print("🌐 Testing API Report Endpoints")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test data - simulate a conversation with psychology analysis
    conversation_data = {
        "session_id": "test-api-session-001",
        "user_id": "test-user-001"
    }
    
    print("1. Testing conversation creation...")
    try:
        # Create conversation
        response = requests.post(f"{base_url}/conversations/", json=conversation_data)
        if response.status_code == 200:
            conversation = response.json()
            conversation_id = conversation['id']
            print(f"✅ Conversation created: ID {conversation_id}")
        else:
            print(f"❌ Failed to create conversation: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ API server not running. Please start the server with: uvicorn src.api.app:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error creating conversation: {e}")
        return False
    
    print("\n2. Testing chat messages with psychology analysis...")
    try:
        # Send messages to trigger psychology analysis
        messages = [
            "我总是觉得最坏的情况会发生，而且我感觉我有不同的部分在对压力做出不同的反应",
            "我在关系中也很焦虑，总是担心被抛弃",
            "我做了一个梦，梦见黑暗的影子在追我",
            "抑郁症告诉我我没有价值，但我想重写这个故事",
            "我感觉有一个内在的批评者总是在评判我",
            "我想要找到内在的平衡和和谐"
        ]
        
        for i, message in enumerate(messages, 1):
            chat_data = {
                "message": message,
                "session_id": conversation['session_id']
            }
            
            response = requests.post(f"{base_url}/chat/", json=chat_data)
            if response.status_code == 200:
                print(f"✅ Message {i} sent successfully")
            else:
                print(f"❌ Failed to send message {i}: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error sending messages: {e}")
        return False
    
    print("\n3. Testing report eligibility check...")
    try:
        response = requests.get(f"{base_url}/conversations/{conversation_id}/report-eligibility")
        if response.status_code == 200:
            eligibility = response.json()
            print(f"✅ Eligibility check completed")
            print(f"   Eligible: {eligibility['eligible']}")
            print(f"   Reason: {eligibility['reason']}")
            print(f"   Frameworks detected: {eligibility['detected_frameworks']}")
            
            if not eligibility['eligible']:
                print("⚠️  Conversation not eligible for report generation")
                return False
        else:
            print(f"❌ Failed to check eligibility: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error checking eligibility: {e}")
        return False
    
    print("\n4. Testing report generation...")
    try:
        response = requests.post(f"{base_url}/conversations/{conversation_id}/generate-report")
        if response.status_code == 200:
            report_info = response.json()
            print(f"✅ Report generated successfully")
            print(f"   Filename: {report_info['filename']}")
            print(f"   Download URL: {report_info['download_url']}")
            
            # Test report download
            print("\n5. Testing report download...")
            download_response = requests.get(f"{base_url}{report_info['download_url']}")
            if download_response.status_code == 200:
                print(f"✅ Report download successful")
                print(f"   Content type: {download_response.headers.get('content-type')}")
                print(f"   File size: {len(download_response.content)} bytes")
                
                # Save the downloaded file for verification
                download_path = f"api_test_reports/{report_info['filename']}"
                os.makedirs("api_test_reports", exist_ok=True)
                with open(download_path, 'wb') as f:
                    f.write(download_response.content)
                print(f"   Saved to: {download_path}")
                
                return True
            else:
                print(f"❌ Failed to download report: {download_response.status_code}")
                return False
        else:
            print(f"❌ Failed to generate report: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 ZENE API Report Endpoints Test")
    print("=" * 60)
    print()
    
    success = test_api_endpoints()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 All API endpoint tests PASSED!")
        print()
        print("✅ Summary:")
        print("   • Conversation creation: Working")
        print("   • Psychology analysis: Working")
        print("   • Report eligibility: Working")
        print("   • Report generation: Working")
        print("   • Report download: Working")
        print()
        print("💡 The complete report generation system is ready!")
    else:
        print("❌ Some API endpoint tests FAILED!")
        print()
        print("🔧 Troubleshooting:")
        print("   1. Make sure the API server is running:")
        print("      uvicorn src.api.app:app --reload")
        print("   2. Check that psychology detection is enabled")
        print("   3. Verify database is properly initialized")
    
    print("🏁 API testing completed!")

if __name__ == "__main__":
    main()