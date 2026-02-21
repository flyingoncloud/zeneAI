#!/usr/bin/env python3
"""
Test SendGrid configuration and diagnose issues
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_sendgrid_config():
    """Test SendGrid configuration"""

    print("=" * 60)
    print("SendGrid Configuration Test")
    print("=" * 60)

    # Check environment variables
    api_key = os.getenv('SENDGRID_API_KEY', '')
    from_email = os.getenv('SENDGRID_FROM_EMAIL', '')
    provider = os.getenv('EMAIL_PROVIDER', 'console')

    print(f"\n1. Environment Variables:")
    print(f"   EMAIL_PROVIDER: {provider}")
    print(f"   SENDGRID_API_KEY: {'✓ Set' if api_key else '✗ Not set'}")
    if api_key:
        print(f"   API Key starts with: {api_key[:10]}...")
        print(f"   API Key length: {len(api_key)} chars")
    print(f"   SENDGRID_FROM_EMAIL: {from_email}")

    if provider != 'sendgrid':
        print(f"\n⚠️  EMAIL_PROVIDER is '{provider}', should be 'sendgrid'")
        return False

    if not api_key:
        print("\n✗ SENDGRID_API_KEY is not set!")
        return False

    if not from_email:
        print("\n✗ SENDGRID_FROM_EMAIL is not set!")
        return False

    # Test SendGrid API
    print(f"\n2. Testing SendGrid API...")

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        print("   ✓ SendGrid library imported successfully")

        # Create client
        sg = SendGridAPIClient(api_key)
        print("   ✓ SendGrid client created")

        # Test with a simple message (won't actually send)
        message = Mail(
            from_email=from_email,
            to_emails='test@example.com',
            subject='Test',
            html_content='<p>Test</p>'
        )

        print(f"\n3. Attempting to send test email...")
        print(f"   From: {from_email}")
        print(f"   To: test@example.com")

        response = sg.send(message)

        print(f"\n✓ SUCCESS!")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.body}")

        if response.status_code == 202:
            print("\n✓ Email sent successfully!")
            print("\nNote: Check if 'test@example.com' received the email")
            print("      (it won't if it's not a real address)")

        return True

    except ImportError:
        print("\n✗ SendGrid library not installed!")
        print("   Run: pip install sendgrid")
        return False

    except Exception as e:
        print(f"\n✗ ERROR: {e}")

        error_str = str(e)

        if '403' in error_str or 'Forbidden' in error_str:
            print("\n📋 HTTP 403 Forbidden - Common causes:")
            print("   1. Invalid API Key")
            print("      → Check your API key at: https://app.sendgrid.com/settings/api_keys")
            print("      → Make sure it's copied correctly (no extra spaces)")
            print()
            print("   2. Sender Email Not Verified")
            print("      → Verify your sender email at: https://app.sendgrid.com/settings/sender_auth")
            print(f"      → Current sender: {from_email}")
            print("      → You must verify this email before sending")
            print()
            print("   3. API Key Permissions")
            print("      → API key must have 'Mail Send' permission")
            print("      → Check permissions at: https://app.sendgrid.com/settings/api_keys")
            print()
            print("   4. SendGrid Account Status")
            print("      → Check if your account is active")
            print("      → Free tier: 100 emails/day")

        elif '401' in error_str or 'Unauthorized' in error_str:
            print("\n📋 HTTP 401 Unauthorized:")
            print("   → API key is invalid or expired")
            print("   → Generate a new API key at: https://app.sendgrid.com/settings/api_keys")

        return False


def main():
    success = test_sendgrid_config()

    print("\n" + "=" * 60)
    if success:
        print("✓ SendGrid is configured correctly!")
    else:
        print("✗ SendGrid configuration has issues")
        print("\nNext steps:")
        print("1. Fix the issues above")
        print("2. Update .env file")
        print("3. Restart the backend")
        print("4. Run this script again")
    print("=" * 60)

    return 0 if success else 1


if __name__ == '__main__':
    sys.exit(main())
