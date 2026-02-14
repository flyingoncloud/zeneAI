# SMS Integration Guide

**Current Status**: Placeholder implementation (logs code to console)
**For Production**: Integrate with SMS provider service

## Current Behavior

The verification code is:
- ✅ Generated (6-digit random code)
- ✅ Stored in memory with 60s expiry
- ✅ Logged to backend console
- ❌ NOT sent to actual phone number

**For Development/Testing**: Check the backend logs to see the verification code.

## SMS Provider Options

### 1. Twilio (Recommended - Global)

**Pros**:
- Easy to use API
- Global coverage
- Reliable delivery
- Good documentation
- Free trial credits

**Pricing**: ~$0.0075 per SMS (varies by country)

**Setup**:
```bash
pip install twilio
```

**Implementation**:
```python
from twilio.rest import Client
import os

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

def send_sms(phone: str, code: str) -> bool:
    """Send SMS using Twilio"""
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        message = client.messages.create(
            body=f"Your ZeneWe verification code is: {code}. Valid for 60 seconds.",
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )

        logger.info(f"[SMS] Sent via Twilio: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"[SMS] Twilio error: {e}")
        return False
```

**Environment Variables** (add to `.env`):
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. AWS SNS (Good for AWS Infrastructure)

**Pros**:
- Integrates with AWS ecosystem
- Pay-as-you-go pricing
- High reliability
- No phone number needed

**Pricing**: ~$0.00645 per SMS (varies by country)

**Setup**:
```bash
pip install boto3
```

**Implementation**:
```python
import boto3
import os

AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-2")

def send_sms(phone: str, code: str) -> bool:
    """Send SMS using AWS SNS"""
    try:
        sns_client = boto3.client('sns', region_name=AWS_REGION)

        response = sns_client.publish(
            PhoneNumber=phone,
            Message=f"Your ZeneWe verification code is: {code}. Valid for 60 seconds.",
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                }
            }
        )

        logger.info(f"[SMS] Sent via AWS SNS: {response['MessageId']}")
        return True
    except Exception as e:
        logger.error(f"[SMS] AWS SNS error: {e}")
        return False
```

**AWS Credentials**: Configure via AWS CLI or environment variables

### 3. Alibaba Cloud SMS (Best for China)

**Pros**:
- Excellent for Chinese phone numbers
- Competitive pricing
- Required for China operations
- Template-based messaging

**Pricing**: ~¥0.045 per SMS

**Setup**:
```bash
pip install alibabacloud_dysmsapi20170525
```

**Implementation**:
```python
from alibabacloud_dysmsapi20170525.client import Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dysmsapi20170525 import models as dysmsapi_models
import os

ALIBABA_ACCESS_KEY_ID = os.getenv("ALIBABA_ACCESS_KEY_ID")
ALIBABA_ACCESS_KEY_SECRET = os.getenv("ALIBABA_ACCESS_KEY_SECRET")
ALIBABA_SMS_SIGN_NAME = os.getenv("ALIBABA_SMS_SIGN_NAME")
ALIBABA_SMS_TEMPLATE_CODE = os.getenv("ALIBABA_SMS_TEMPLATE_CODE")

def send_sms(phone: str, code: str) -> bool:
    """Send SMS using Alibaba Cloud"""
    try:
        config = open_api_models.Config(
            access_key_id=ALIBABA_ACCESS_KEY_ID,
            access_key_secret=ALIBABA_ACCESS_KEY_SECRET,
            endpoint='dysmsapi.aliyuncs.com'
        )

        client = Client(config)

        request = dysmsapi_models.SendSmsRequest(
            phone_numbers=phone,
            sign_name=ALIBABA_SMS_SIGN_NAME,
            template_code=ALIBABA_SMS_TEMPLATE_CODE,
            template_param=f'{{"code":"{code}"}}'
        )

        response = client.send_sms(request)

        if response.body.code == 'OK':
            logger.info(f"[SMS] Sent via Alibaba Cloud: {response.body.biz_id}")
            return True
        else:
            logger.error(f"[SMS] Alibaba Cloud error: {response.body.message}")
            return False
    except Exception as e:
        logger.error(f"[SMS] Alibaba Cloud error: {e}")
        return False
```

**Environment Variables**:
```env
ALIBABA_ACCESS_KEY_ID=your_access_key_id
ALIBABA_ACCESS_KEY_SECRET=your_access_key_secret
ALIBABA_SMS_SIGN_NAME=your_sign_name
ALIBABA_SMS_TEMPLATE_CODE=SMS_123456789
```

### 4. MessageBird (Good for Europe/Australia)

**Pros**:
- Good coverage in Europe and Australia
- Simple API
- Competitive pricing

**Pricing**: ~$0.05 per SMS (varies by country)

**Setup**:
```bash
pip install messagebird
```

**Implementation**:
```python
import messagebird
import os

MESSAGEBIRD_API_KEY = os.getenv("MESSAGEBIRD_API_KEY")

def send_sms(phone: str, code: str) -> bool:
    """Send SMS using MessageBird"""
    try:
        client = messagebird.Client(MESSAGEBIRD_API_KEY)

        message = client.message_create(
            'ZeneWe',
            phone,
            f"Your ZeneWe verification code is: {code}. Valid for 60 seconds."
        )

        logger.info(f"[SMS] Sent via MessageBird: {message.id}")
        return True
    except Exception as e:
        logger.error(f"[SMS] MessageBird error: {e}")
        return False
```

## Recommended Implementation

Create a flexible SMS service that supports multiple providers:

<function_calls>
<invoke name="fsWrite">
<parameter name="path">ai-chat-api/src/services/sms_service.py""
SMS Service - Flexible SMS provider integration

Supports multiple SMS providers:
- Twilio (default)
- AWS SNS
- Alibaba Cloud
- MessageBird
- Console (development/testing)

Configure via environment variables:
- SMS_PROVIDER: twilio, aws_sns, alibaba, messagebird, console
- Provider-specific credentials
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# SMS Provider Configuration
SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console").lower()


def send_sms(phone: str, code: str, message: Optional[str] = None) -> bool:
    """
    Send SMS verification code

    Args:
        phone: Phone number with country code (e.g., +610435135321)
        code: Verification code
        message: Optional custom message (default: verification code message)

    Returns:
        bool: True if sent successfully, False otherwise
    """
    if message is None:
        message = f"Your ZeneWe verification code is: {code}. Valid for 60 seconds."

    logger.info(f"[SMS] Sending to {phone} via {SMS_PROVIDER}")

    if SMS_PROVIDER == "twilio":
        return _send_via_twilio(phone, message)
    elif SMS_PROVIDER == "aws_sns":
        return _send_via_aws_sns(phone, message)
    elif SMS_PROVIDER == "alibaba":
        return _send_via_alibaba(phone, code)
    elif SMS_PROVIDER == "messagebird":
        return _send_via_messagebird(phone, message)
    elif SMS_PROVIDER == "console":
        return _send_via_console(phone, code)
    else:
        logger.error(f"[SMS] Unknown provider: {SMS_PROVIDER}")
        return False


def _send_via_console(phone: str, code: str) -> bool:
    """Development/testing: Log code to console"""
    logger.info(f"[SMS] 📱 VERIFICATION CODE for {phone}: {code}")
    logger.info(f"[SMS] ⚠️  Using console provider - no actual SMS sent")
    return True


def _send_via_twilio(phone: str, message: str) -> bool:
    """Send SMS via Twilio"""
    try:
        from twilio.rest import Client

        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_PHONE_NUMBER")

        if not all([account_sid, auth_token, from_number]):
            logger.error("[SMS] Twilio credentials not configured")
            return False

        client = Client(account_sid, auth_token)

        msg = client.messages.create(
            body=message,
            from_=from_number,
            to=phone
        )

        logger.info(f"[SMS] ✓ Sent via Twilio: {msg.sid}")
        return True

    except ImportError:
        logger.error("[SMS] Twilio library not installed: pip install twilio")
        return False
    except Exception as e:
        logger.error(f"[SMS] Twilio error: {e}")
        return False


def _send_via_aws_sns(phone: str, message: str) -> bool:
    """Send SMS via AWS SNS"""
    try:
        import boto3

        region = os.getenv("AWS_REGION", "ap-southeast-2")

        sns_client = boto3.client('sns', region_name=region)

        response = sns_client.publish(
            PhoneNumber=phone,
            Message=message,
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                }
            }
        )

        logger.info(f"[SMS] ✓ Sent via AWS SNS: {response['MessageId']}")
        return True

    except ImportError:
        logger.error("[SMS] Boto3 library not installed: pip install boto3")
        return False
    except Exception as e:
        logger.error(f"[SMS] AWS SNS error: {e}")
        return False


def _send_via_alibaba(phone: str, code: str) -> bool:
    """Send SMS via Alibaba Cloud (template-based)"""
    try:
        from alibabacloud_dysmsapi20170525.client import Client
        from alibabacloud_tea_openapi import models as open_api_models
        from alibabacloud_dysmsapi20170525 import models as dysmsapi_models

        access_key_id = os.getenv("ALIBABA_ACCESS_KEY_ID")
        access_key_secret = os.getenv("ALIBABA_ACCESS_KEY_SECRET")
        sign_name = os.getenv("ALIBABA_SMS_SIGN_NAME")
        template_code = os.getenv("ALIBABA_SMS_TEMPLATE_CODE")

        if not all([access_key_id, access_key_secret, sign_name, template_code]):
            logger.error("[SMS] Alibaba Cloud credentials not configured")
            return False

        config = open_api_models.Config(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint='dysmsapi.aliyuncs.com'
        )

        client = Client(config)

        request = dysmsapi_models.SendSmsRequest(
            phone_numbers=phone,
            sign_name=sign_name,
            template_code=template_code,
            template_param=f'{{"code":"{code}"}}'
        )

        response = client.send_sms(request)

        if response.body.code == 'OK':
            logger.info(f"[SMS] ✓ Sent via Alibaba Cloud: {response.body.biz_id}")
            return True
        else:
            logger.error(f"[SMS] Alibaba Cloud error: {response.body.message}")
            return False

    except ImportError:
        logger.error("[SMS] Alibaba Cloud library not installed: pip install alibabacloud_dysmsapi20170525")
        return False
    except Exception as e:
        logger.error(f"[SMS] Alibaba Cloud error: {e}")
        return False


def _send_via_messagebird(phone: str, message: str) -> bool:
    """Send SMS via MessageBird"""
    try:
        import messagebird

        api_key = os.getenv("MESSAGEBIRD_API_KEY")

        if not api_key:
            logger.error("[SMS] MessageBird API key not configured")
            return False

        client = messagebird.Client(api_key)

        msg = client.message_create(
            'ZeneWe',
            phone,
            message
        )

        logger.info(f"[SMS] ✓ Sent via MessageBird: {msg.id}")
        return True

    except ImportError:
        logger.error("[SMS] MessageBird library not installed: pip install messagebird")
        return False
    except Exception as e:
        logger.error(f"[SMS] MessageBird error: {e}")
        return False
