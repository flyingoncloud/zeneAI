# Email Login Not Working on Production - Troubleshooting Guide

## Problem
Email login works on local development but fails on production (EC2).

## Common Causes

### 1. Email Provider Not Configured (Most Likely)
**Symptom**: Users don't receive verification codes

**Cause**: Production `.env` file has `EMAIL_PROVIDER=console` (default), which only logs emails to console instead of sending them.

**Solution**:
```bash
# SSH into EC2
ssh ec2-user@your-ec2-ip

# Navigate to backend directory
cd ~/zeneAI/ai-chat-api

# Edit .env file
nano .env

# Change EMAIL_PROVIDER from 'console' to 'sendgrid' or 'smtp'
EMAIL_PROVIDER=sendgrid

# Add SendGrid configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@zenewe.ai

# Save and exit (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart zeneai-backend

# Check logs
pm2 logs zeneai-backend --lines 50
```

### 2. CORS Configuration Issue
**Symptom**: API calls fail with CORS errors in browser console

**Cause**: Frontend domain not in `CORS_ORIGINS`

**Solution**:
```bash
# Edit .env file
nano .env

# Ensure CORS_ORIGINS includes your domain
CORS_ORIGINS=http://www.zenewe.ai,https://www.zenewe.ai

# Restart backend
pm2 restart zeneai-backend
```

### 3. Database Connection Issue
**Symptom**: 500 errors when trying to login

**Cause**: Database not accessible or user table missing columns

**Solution**:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database connection
cd ~/zeneAI/ai-chat-api
python3 -c "from src.database.database import SessionLocal; db = SessionLocal(); print('✓ Connected'); db.close()"

# Check if auth columns exist
python3 ops/check_email_login_production.py
```

### 4. API Not Running
**Symptom**: Cannot connect to API

**Cause**: Backend service crashed or not started

**Solution**:
```bash
# Check pm2 status
pm2 status

# If not running, start it
pm2 start ecosystem.config.js

# Check logs for errors
pm2 logs zeneai-backend --lines 100
```

## Diagnostic Steps

### Step 1: Run Diagnostic Script
```bash
cd ~/zeneAI/ai-chat-api
python3 ops/check_email_login_production.py
```

This will check:
- Environment configuration
- Email provider setup
- Database connection
- API endpoints

### Step 2: Check Backend Logs
```bash
# View real-time logs
pm2 logs zeneai-backend

# View last 100 lines
pm2 logs zeneai-backend --lines 100

# Look for errors like:
# - "Failed to send verification email"
# - "SENDGRID_API_KEY not set"
# - "Database connection failed"
# - "CORS error"
```

### Step 3: Test Email Sending Manually
```bash
cd ~/zeneAI/ai-chat-api
python3 << 'EOF'
from src.services.email_service import send_verification_email
result = send_verification_email("your-test-email@example.com", "123456")
print(f"Email sent: {result}")
EOF
```

### Step 4: Check Frontend API Calls
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login with email
4. Check the API request:
   - URL should be `http://www.zenewe.ai/auth/email/send-code`
   - Status should be 200 (not 500, 404, or CORS error)
   - Response should show `{"success": true, "message": "..."}`

## Setting Up Email Provider

### Option A: SendGrid (Recommended for Production)

1. **Sign up for SendGrid**
   - Go to https://sendgrid.com
   - Free tier: 100 emails/day (sufficient for testing)

2. **Create API Key**
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Name: "Zeneme Production"
   - Permissions: "Full Access" or "Mail Send"
   - Copy the API key (you won't see it again!)

3. **Verify Sender Email**
   - Go to Settings > Sender Authentication
   - Click "Verify a Single Sender"
   - Enter: noreply@zenewe.ai (or your domain)
   - Check your email and click verification link

4. **Configure on EC2**
   ```bash
   nano ~/zeneAI/ai-chat-api/.env

   # Add these lines:
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@zenewe.ai

   # Save and restart
   pm2 restart zeneai-backend
   ```

### Option B: SMTP (Gmail, Outlook, etc.)

1. **For Gmail**
   - Enable 2-Factor Authentication
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Copy the 16-character password

2. **Configure on EC2**
   ```bash
   nano ~/zeneAI/ai-chat-api/.env

   # Add these lines:
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password-here
   SMTP_FROM_EMAIL=your-email@gmail.com

   # Save and restart
   pm2 restart zeneai-backend
   ```

## Verification

After configuration, test the email login:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Go to** http://www.zenewe.ai
3. **Click** "邮箱登录" (Email Login)
4. **Enter** your email address
5. **Click** "发送验证码" (Send Code)
6. **Check** your email inbox (and spam folder)
7. **Enter** the 6-digit code
8. **Complete** registration

## Common Errors and Solutions

### Error: "Failed to send verification email"
- Check EMAIL_PROVIDER is set correctly
- Verify API keys are correct
- Check backend logs for detailed error

### Error: "No verification code found"
- Code expired (10 minutes)
- Request a new code
- Check if backend restarted (clears in-memory codes)

### Error: "Invalid verification code"
- Double-check the code from email
- Code is case-sensitive (all digits)
- Request a new code if expired

### Error: "Email already registered"
- User already exists in database
- Use "Login" instead of "Register"
- Or use password reset (if implemented)

### Error: CORS policy blocked
- Check CORS_ORIGINS in .env
- Must include frontend domain
- Restart backend after changing

## Production Checklist

- [ ] EMAIL_PROVIDER set to 'sendgrid' or 'smtp' (not 'console')
- [ ] Email API keys configured correctly
- [ ] Sender email verified with provider
- [ ] CORS_ORIGINS includes frontend domain
- [ ] Database connection working
- [ ] Backend service running (pm2 status)
- [ ] Test email sending manually
- [ ] Test full registration flow
- [ ] Check backend logs for errors

## Need Help?

If issues persist:

1. **Collect diagnostic info**:
   ```bash
   cd ~/zeneAI/ai-chat-api
   python3 ops/check_email_login_production.py > diagnostic.txt
   pm2 logs zeneai-backend --lines 200 >> diagnostic.txt
   ```

2. **Check the diagnostic output** for specific errors

3. **Review backend logs** for detailed error messages

## Related Files
- `ai-chat-api/.env` - Environment configuration
- `ai-chat-api/src/api/auth_routes.py` - Authentication endpoints
- `ai-chat-api/src/services/email_service.py` - Email sending logic
- `ai-chat-api/ops/check_email_login_production.py` - Diagnostic script
