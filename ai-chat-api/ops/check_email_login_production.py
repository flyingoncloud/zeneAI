#!/usr/bin/env python3
"""
Diagnostic script to check email login configuration on production

Run this on EC2 to diagnose email login issues:
    python ops/check_email_login_production.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def check_environment():
    """Check environment variables"""
    print("=" * 80)
    print("ENVIRONMENT CONFIGURATION CHECK")
    print("=" * 80)

    # Load .env file if exists
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        print(f"✓ .env file found at: {env_file}")
        from dotenv import load_dotenv
        load_dotenv(env_file)
    else:
        print(f"✗ .env file NOT found at: {env_file}")
        print("  This may cause issues if environment variables are not set")

    print("\nEmail Configuration:")
    print("-" * 80)

    email_provider = os.getenv('EMAIL_PROVIDER', 'console')
    print(f"EMAIL_PROVIDER: {email_provider}")

    if email_provider == 'console':
        print("⚠️  WARNING: Using console mode (emails logged to console only)")
        print("   For production, set EMAIL_PROVIDER=sendgrid or smtp")
    elif email_provider == 'sendgrid':
        api_key = os.getenv('SENDGRID_API_KEY', '')
        from_email = os.getenv('SENDGRID_FROM_EMAIL', '')
        print(f"SENDGRID_API_KEY: {'✓ Set' if api_key else '✗ NOT SET'}")
        print(f"SENDGRID_FROM_EMAIL: {from_email or '✗ NOT SET'}")

        if not api_key:
            print("\n⚠️  ERROR: SENDGRID_API_KEY is not set!")
            print("   Email verification codes will NOT be sent")
    elif email_provider == 'smtp':
        smtp_host = os.getenv('SMTP_HOST', '')
        smtp_port = os.getenv('SMTP_PORT', '')
        smtp_username = os.getenv('SMTP_USERNAME', '')
        smtp_password = os.getenv('SMTP_PASSWORD', '')
        smtp_from = os.getenv('SMTP_FROM_EMAIL', '')

        print(f"SMTP_HOST: {smtp_host or '✗ NOT SET'}")
        print(f"SMTP_PORT: {smtp_port or '✗ NOT SET'}")
        print(f"SMTP_USERNAME: {'✓ Set' if smtp_username else '✗ NOT SET'}")
        print(f"SMTP_PASSWORD: {'✓ Set' if smtp_password else '✗ NOT SET'}")
        print(f"SMTP_FROM_EMAIL: {smtp_from or '✗ NOT SET'}")

        if not all([smtp_host, smtp_port, smtp_username, smtp_password]):
            print("\n⚠️  ERROR: SMTP configuration incomplete!")
            print("   Email verification codes will NOT be sent")

    print("\nDatabase Configuration:")
    print("-" * 80)
    db_url = os.getenv('DATABASE_URL', '')
    if db_url:
        # Mask password in output
        if '@' in db_url:
            parts = db_url.split('@')
            if ':' in parts[0]:
                user_pass = parts[0].split(':')
                masked = f"{user_pass[0]}:****@{parts[1]}"
                print(f"DATABASE_URL: {masked}")
        else:
            print(f"DATABASE_URL: {db_url}")
    else:
        print("DATABASE_URL: ✗ NOT SET")
        print("⚠️  WARNING: Database connection may fail")

    print("\nCORS Configuration:")
    print("-" * 80)
    cors_origins = os.getenv('CORS_ORIGINS', '')
    print(f"CORS_ORIGINS: {cors_origins or '✗ NOT SET'}")

    if cors_origins:
        origins = [o.strip() for o in cors_origins.split(',')]
        for origin in origins:
            if origin.startswith('http://') and 'localhost' not in origin:
                print(f"⚠️  WARNING: HTTP origin in production: {origin}")
                print("   Consider using HTTPS for security")


def check_database_connection():
    """Check database connection and user table"""
    print("\n" + "=" * 80)
    print("DATABASE CONNECTION CHECK")
    print("=" * 80)

    try:
        from src.database.database import SessionLocal
        from src.database.psychology_models import UserProfile

        db = SessionLocal()

        # Count users
        total_users = db.query(UserProfile).count()
        email_users = db.query(UserProfile).filter(
            UserProfile.auth_provider == 'email'
        ).count()

        print(f"✓ Database connection successful")
        print(f"Total users: {total_users}")
        print(f"Email users: {email_users}")

        # Check for users with email but no password
        users_no_password = db.query(UserProfile).filter(
            UserProfile.email.isnot(None),
            UserProfile.password_hash.is_(None)
        ).count()

        if users_no_password > 0:
            print(f"\n⚠️  WARNING: {users_no_password} users have email but no password")
            print("   These users cannot login with email/password")

        db.close()

    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("\nPossible causes:")
        print("1. PostgreSQL service not running")
        print("2. Incorrect DATABASE_URL")
        print("3. Database user permissions issue")
        return False

    return True


def test_email_service():
    """Test email service"""
    print("\n" + "=" * 80)
    print("EMAIL SERVICE TEST")
    print("=" * 80)

    try:
        from src.services.email_service import send_verification_email, EMAIL_PROVIDER

        print(f"Email provider: {EMAIL_PROVIDER}")

        if EMAIL_PROVIDER == 'console':
            print("\n✓ Console mode - emails will be logged to console")
            print("  This is OK for development but NOT for production")

            # Test sending
            test_email = "test@example.com"
            test_code = "123456"
            result = send_verification_email(test_email, test_code)

            if result:
                print(f"✓ Test email logged successfully")
            else:
                print(f"✗ Test email failed")
        else:
            print(f"\n⚠️  Cannot test {EMAIL_PROVIDER} without sending real email")
            print("  To test, try registering with a real email address")

    except Exception as e:
        print(f"✗ Email service test failed: {e}")
        import traceback
        traceback.print_exc()


def check_api_endpoints():
    """Check if API endpoints are accessible"""
    print("\n" + "=" * 80)
    print("API ENDPOINTS CHECK")
    print("=" * 80)

    try:
        import requests

        # Check if API is running
        api_url = "http://localhost:8000"

        try:
            response = requests.get(f"{api_url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✓ API is running at {api_url}")
            else:
                print(f"⚠️  API returned status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"✗ Cannot connect to API at {api_url}")
            print("  Is the backend service running?")
            print("  Check with: pm2 status")
            return False
        except Exception as e:
            print(f"✗ API check failed: {e}")
            return False

        # Check auth endpoints
        endpoints = [
            "/auth/email/send-code",
            "/auth/email/register",
            "/auth/email/login"
        ]

        print("\nAuth endpoints:")
        for endpoint in endpoints:
            try:
                # Just check if endpoint exists (will return 422 for missing body)
                response = requests.post(f"{api_url}{endpoint}", json={}, timeout=5)
                if response.status_code in [200, 422]:  # 422 = validation error (expected)
                    print(f"  ✓ {endpoint}")
                else:
                    print(f"  ⚠️  {endpoint} returned {response.status_code}")
            except Exception as e:
                print(f"  ✗ {endpoint} - {e}")

    except ImportError:
        print("⚠️  'requests' library not installed")
        print("   Install with: pip install requests")
    except Exception as e:
        print(f"✗ API check failed: {e}")


def main():
    """Run all diagnostic checks"""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "EMAIL LOGIN DIAGNOSTIC TOOL" + " " * 31 + "║")
    print("╚" + "=" * 78 + "╝")
    print("\n")

    check_environment()

    if check_database_connection():
        test_email_service()

    check_api_endpoints()

    print("\n" + "=" * 80)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 80)
    print("\nNext steps:")
    print("1. If EMAIL_PROVIDER=console, change to 'sendgrid' or 'smtp' in .env")
    print("2. If using SendGrid, verify SENDGRID_API_KEY is set correctly")
    print("3. If using SMTP, verify all SMTP_* variables are set")
    print("4. Restart backend after changing .env: pm2 restart zeneai-backend")
    print("5. Check backend logs: pm2 logs zeneai-backend")
    print("\n")


if __name__ == "__main__":
    main()
