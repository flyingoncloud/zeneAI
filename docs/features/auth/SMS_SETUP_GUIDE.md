# SMS Integration Setup Guide

## Current Status

✅ SMS service implemented with multiple provider support
⚠️ Currently using **console mode** (development) - codes logged to backend console
📱 To send real SMS, configure one of the supported providers below

## Quick Start (Development)

For development/testing, the system logs verification codes to the backend console:

```bash
# Start backend
cd ai-chat-api
uvicorn src.api.app:app --reload --port 8000

# Watch for verification codes in console:
# INFO:src.services.sms_service:[SMS] 📱 VERIFICATION CODE for +610435135321: 057748
```

## Production Setup

### Option 1: Twilio (Recommended for Global)

**Best for**: International SMS, reliable delivery, good documentation

1. **Sign up**: https://www.twilio.com/try-twilio
2. **Get credentials**:
   - Account SID
   - Auth Token
   - Phone Number (purchase from Twilio)

3. **Add to `.env`**:
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

4. **Install library**:
```bash
pip install twilio
```

5. **Test**:
```bash
# Restart backend and try phone login
# SMS will be sent to real phone numbers
```

**Pricing**: ~$0.0075 USD per SMS (varies by country)

---

### Option 2: AWS SNS (Recommended for AWS Users)

**Best for**: Already using AWS, cost-effective at scale

1. **Setup AWS Account**: https://aws.amazon.com/
2. **Enable SNS SMS**: https://console.aws.amazon.com/sns/
3. **Configure IAM**: Create user with `sns:Publish` permission
4. **Get credentials**: Access Key ID and Secret Access Key

5. **Add to `.env`**:
```env
SMS_PROVIDER=aws_sns
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

6. **Install library**:
```bash
pip install boto3
```

7. **Configure AWS CLI** (optional):
```bash
aws configure
```

**Pricing**: ~$0.00645 USD per SMS (varies by region)

---

### Option 3: Alibaba Cloud (Recommended for China)

**Best for**: China market, Chinese phone numbers

1. **Sign up**: https://www.alibabacloud.com/
2. **Enable SMS Service**: https://dysms.console.aliyun.com/
3. **Create template**: Must be approved by Alibaba
4. **Get credentials**:
   - Access Key ID
   - Access Key Secret
   - Sign Name (signature)
   - Template Code

5. **Add to `.env`**:
```env
SMS_PROVIDER=alibaba
ALIBABA_ACCESS_KEY_ID=LTAIxxxxxxxxxxxxxxxx
ALIBABA_ACCESS_KEY_SECRET=your_secret_here
ALIBABA_SMS_SIGN_NAME=ZeneWe
ALIBABA_SMS_TEMPLATE_CODE=SMS_123456789
```

6. **Install library**:
```bash
pip install alibabacloud_dysmsapi20170525
```

**Template Example**:
```
您的验证码是：${code}，60秒内有效。
```

**Pricing**: ~¥0.045 CNY per SMS (~$0.006 USD)

---

### Option 4: MessageBird (Recommended for Europe)

**Best for**: European market, GDPR compliance

1. **Sign up**: https://www.messagebird.com/
2. **Get API key**: https://dashboard.messagebird.com/en/developers/access
3. **Add to `.env`**:
```env
SMS_PROVIDER=messagebird
MESSAGEBIRD_API_KEY=your_api_key_here
```

4. **Install library**:
```bash
pip install messagebird
```

**Pricing**: ~€0.05 EUR per SMS (varies by country)

---

## Environment Variables Reference

### Console Mode (Development)
```env
SMS_PROVIDER=console
# No additional configuration needed
# Codes logged to backend console
```

### Twilio
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### AWS SNS
```env
SMS_PROVIDER=aws_sns
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Alibaba Cloud
```env
SMS_PROVIDER=alibaba
ALIBABA_ACCESS_KEY_ID=LTAIxxxxxxxxxxxxxxxx
ALIBABA_ACCESS_KEY_SECRET=your_secret
ALIBABA_SMS_SIGN_NAME=YourAppName
ALIBABA_SMS_TEMPLATE_CODE=SMS_123456789
```

### MessageBird
```env
SMS_PROVIDER=messagebird
MESSAGEBIRD_API_KEY=your_api_key
```

---

## Testing

### 1. Console Mode (Current)
```bash
# Start backend
uvicorn src.api.app:app --reload --port 8000

# In frontend, request verification code
# Check backend console for code:
# INFO:src.services.sms_service:[SMS] 📱 VERIFICATION CODE for +610435135321: 057748

# Use the code from console to login
```

### 2. Real SMS (After Configuration)
```bash
# Update .env with provider credentials
# Restart backend
uvicorn src.api.app:app --reload --port 8000

# Request verification code in frontend
# Check your phone for SMS
# Use received code to login
```

---

## Troubleshooting

### SMS Not Received

1. **Check backend logs**:
   ```
   INFO:src.services.sms_service:[SMS] ✓ Sent via Twilio: SM...
   ```
   If you see this, SMS was sent successfully

2. **Check phone number format**:
   - Must include country code: `+610435135321`
   - No spaces or dashes: `+61-043-513-5321` ❌

3. **Check provider dashboard**:
   - Twilio: https://console.twilio.com/us1/monitor/logs/sms
   - AWS SNS: CloudWatch Logs
   - Alibaba: SMS Console

4. **Check spam folder**: Some carriers filter SMS

5. **Try different number**: Some numbers may be blocked

### Provider Errors

**Twilio "Unverified number"**:
- Trial accounts can only send to verified numbers
- Verify number in Twilio console or upgrade account

**AWS SNS "Throttling"**:
- Default limit: 20 SMS/second
- Request limit increase in AWS console

**Alibaba "Template not approved"**:
- Template must be approved before use
- Check template status in console

---

## Cost Comparison

| Provider | Cost per SMS | Best For |
|----------|-------------|----------|
| Console | Free | Development |
| Twilio | ~$0.0075 | Global, reliable |
| AWS SNS | ~$0.0065 | AWS users, scale |
| Alibaba | ~$0.006 | China market |
| MessageBird | ~$0.05 | Europe, GDPR |

---

## Security Best Practices

1. **Rate Limiting**: Already implemented (60s cooldown)
2. **Code Expiry**: Already implemented (60s expiry)
3. **Attempt Limiting**: Already implemented (3 attempts)
4. **Secure Credentials**: Use environment variables, never commit
5. **Monitor Usage**: Set up alerts for unusual SMS volume
6. **Verify Numbers**: Consider phone number verification service

---

## Next Steps

1. **Choose Provider**: Based on your target market
2. **Sign Up**: Create account with chosen provider
3. **Get Credentials**: Follow provider-specific steps above
4. **Update .env**: Add credentials to environment file
5. **Install Library**: `pip install <provider-library>`
6. **Restart Backend**: `uvicorn src.api.app:app --reload --port 8000`
7. **Test**: Try phone login with real phone number

---

## Support

- **Twilio Docs**: https://www.twilio.com/docs/sms
- **AWS SNS Docs**: https://docs.aws.amazon.com/sns/
- **Alibaba Docs**: https://www.alibabacloud.com/help/en/sms
- **MessageBird Docs**: https://developers.messagebird.com/

For issues, check backend logs and provider dashboards first.
