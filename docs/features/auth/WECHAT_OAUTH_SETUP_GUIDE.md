# WeChat OAuth Integration Guide

Complete guide to implementing WeChat login for your application.

## Overview

WeChat OAuth allows users to log in using their WeChat account. This is essential for Chinese market applications.

## Prerequisites

- WeChat Official Account or Open Platform account
- Verified business entity (required for most OAuth features)
- Domain with HTTPS (required for production)

## Step 1: Register with WeChat Open Platform

### 1.1 Create Account

1. Go to: https://open.weixin.qq.com/
2. Register as a developer
3. Complete identity verification (requires Chinese business license or personal ID)

### 1.2 Create Web Application

1. Log in to WeChat Open Platform
2. Navigate to "管理中心" (Management Center)
3. Click "网站应用" (Web Application)
4. Click "创建应用" (Create Application)
5. Fill in application details:
   - Application Name: ZeneWe
   - Application Description: 心理健康评估平台
   - Application Icon: Upload your logo
   - Authorization Callback Domain: `www.zenewe.ai`

### 1.3 Get Credentials

After approval (usually 1-7 days), you'll receive:
- **AppID**: Unique application identifier
- **AppSecret**: Secret key for API calls

**Important**: Keep AppSecret confidential!

## Step 2: Configure Backend

### 2.1 Update Environment Variables

Add to `ai-chat-api/.env`:

```bash
# WeChat OAuth Configuration
WECHAT_APP_ID=wx1234567890abcdef
WECHAT_APP_SECRET=your_app_secret_here
WECHAT_REDIRECT_URI=https://www.zenewe.ai/auth/wechat/callback
```

### 2.2 Install Dependencies

```bash
cd ai-chat-api
pip install requests
```

### 2.3 Update WeChat OAuth Service

The service is already scaffolded at `src/services/wechat_oauth.py`. Update it:

```python
import os
import requests
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

WECHAT_APP_ID = os.getenv('WECHAT_APP_ID', '')
WECHAT_APP_SECRET = os.getenv('WECHAT_APP_SECRET', '')
WECHAT_REDIRECT_URI = os.getenv('WECHAT_REDIRECT_URI', '')

# WeChat OAuth URLs
WECHAT_AUTH_URL = 'https://open.weixin.qq.com/connect/qrconnect'
WECHAT_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token'
WECHAT_USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo'


def get_wechat_login_url(state: str = 'STATE') -> str:
    """
    Generate WeChat OAuth login URL

    Args:
        state: Random string to prevent CSRF attacks

    Returns:
        WeChat OAuth authorization URL
    """
    params = {
        'appid': WECHAT_APP_ID,
        'redirect_uri': WECHAT_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'snsapi_login',  # For web login with QR code
        'state': state
    }

    query_string = '&'.join([f'{k}={v}' for k, v in params.items()])
    return f'{WECHAT_AUTH_URL}?{query_string}#wechat_redirect'


def exchange_code_for_token(code: str) -> Optional[Dict]:
    """
    Exchange authorization code for access token

    Args:
        code: Authorization code from WeChat callback

    Returns:
        Token response with access_token, openid, etc.
    """
    try:
        params = {
            'appid': WECHAT_APP_ID,
            'secret': WECHAT_APP_SECRET,
            'code': code,
            'grant_type': 'authorization_code'
        }

        response = requests.get(WECHAT_TOKEN_URL, params=params, timeout=10)
        data = response.json()

        if 'errcode' in data:
            logger.error(f"[WeChat] Token exchange error: {data}")
            return None

        logger.info(f"[WeChat] Token obtained for openid: {data.get('openid')}")
        return data

    except Exception as e:
        logger.error(f"[WeChat] Token exchange failed: {e}")
        return None


def get_user_info(access_token: str, openid: str) -> Optional[Dict]:
    """
    Get WeChat user information

    Args:
        access_token: Access token from token exchange
        openid: User's OpenID

    Returns:
        User info including nickname, avatar, etc.
    """
    try:
        params = {
            'access_token': access_token,
            'openid': openid,
            'lang': 'zh_CN'
        }

        response = requests.get(WECHAT_USERINFO_URL, params=params, timeout=10)
        data = response.json()

        if 'errcode' in data:
            logger.error(f"[WeChat] Get user info error: {data}")
            return None

        logger.info(f"[WeChat] User info retrieved: {data.get('nickname')}")
        return data

    except Exception as e:
        logger.error(f"[WeChat] Get user info failed: {e}")
        return None


def verify_wechat_login(code: str) -> Optional[Dict]:
    """
    Complete WeChat OAuth flow

    Args:
        code: Authorization code from callback

    Returns:
        User information dict or None
    """
    # Step 1: Exchange code for token
    token_data = exchange_code_for_token(code)
    if not token_data:
        return None

    access_token = token_data.get('access_token')
    openid = token_data.get('openid')

    if not access_token or not openid:
        logger.error("[WeChat] Missing access_token or openid")
        return None

    # Step 2: Get user info
    user_info = get_user_info(access_token, openid)
    if not user_info:
        return None

    # Return standardized user data
    return {
        'openid': openid,
        'unionid': user_info.get('unionid'),  # If available
        'nickname': user_info.get('nickname'),
        'avatar': user_info.get('headimgurl'),
        'sex': user_info.get('sex'),  # 1=male, 2=female, 0=unknown
        'province': user_info.get('province'),
        'city': user_info.get('city'),
        'country': user_info.get('country')
    }
```

### 2.4 Add Callback Route

Add to `src/api/auth_routes.py`:

```python
@router.get("/auth/wechat/callback")
async def wechat_callback(
    code: str = Query(...),
    state: str = Query(...)
):
    """
    WeChat OAuth callback endpoint

    Query params:
        code: Authorization code from WeChat
        state: State parameter for CSRF protection
    """
    try:
        # Verify state to prevent CSRF (implement state validation)

        # Get user info from WeChat
        from src.services.wechat_oauth import verify_wechat_login
        wechat_user = verify_wechat_login(code)

        if not wechat_user:
            raise HTTPException(status_code=400, detail="WeChat login failed")

        # Check if user exists
        user = db.query(User).filter(
            User.wechat_openid == wechat_user['openid']
        ).first()

        if not user:
            # Create new user
            user = User(
                username=wechat_user['nickname'] or f"wechat_{wechat_user['openid'][:8]}",
                wechat_openid=wechat_user['openid'],
                wechat_unionid=wechat_user.get('unionid'),
                avatar_url=wechat_user.get('avatar'),
                auth_provider='wechat'
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Generate session token
        token = secrets.token_urlsafe(32)
        user.session_token = token
        user.last_login = datetime.utcnow()
        db.commit()

        # Redirect to frontend with token
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(
            url=f"{frontend_url}/auth/success?token={token}"
        )

    except Exception as e:
        logger.error(f"[Auth] WeChat callback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

## Step 3: Update Frontend

### 3.1 Update AuthPage Component

Replace the mock WeChat login in `zeneme-next/src/components/auth/AuthPage.tsx`:

```typescript
const handleSocialLogin = async (provider: 'google' | 'wechat') => {
  if (provider === 'wechat') {
    // Redirect to WeChat OAuth
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem('wechat_state', state);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.location.href = `${apiUrl}/auth/wechat/login?state=${state}`;
    return;
  }

  // Google login (keep existing mock or implement real OAuth)
  // ...
};
```

### 3.2 Add WeChat Login Initiation Route

Add to `src/api/auth_routes.py`:

```python
@router.get("/auth/wechat/login")
async def wechat_login(state: str = Query(...)):
    """
    Initiate WeChat OAuth flow

    Query params:
        state: Random string for CSRF protection
    """
    from src.services.wechat_oauth import get_wechat_login_url

    # Store state in session/cache for validation (implement as needed)

    # Redirect to WeChat
    login_url = get_wechat_login_url(state)
    return RedirectResponse(url=login_url)
```

### 3.3 Add Success Handler Page

Create `zeneme-next/src/app/auth/success/page.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Fetch user info with token
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            login(data.user);
            router.push('/');
          }
        })
        .catch(err => {
          console.error('Auth error:', err);
          router.push('/auth?error=login_failed');
        });
    } else {
      router.push('/auth?error=no_token');
    }
  }, [searchParams, login, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">正在登录...</p>
      </div>
    </div>
  );
}
```

## Step 4: Database Schema

Ensure your User model has WeChat fields (already in your schema):

```python
class User(Base):
    # ... existing fields ...
    wechat_openid = Column(String, unique=True, nullable=True)
    wechat_unionid = Column(String, unique=True, nullable=True)
    auth_provider = Column(String, default='email')  # 'email', 'phone', 'wechat', 'google'
```

## Step 5: Testing

### 5.1 Local Testing (Development)

WeChat OAuth requires HTTPS and a registered domain. For local testing:

1. Use ngrok or similar tunnel:
   ```bash
   ngrok http 3000
   ```

2. Update WeChat Open Platform with ngrok URL

3. Update `.env`:
   ```bash
   WECHAT_REDIRECT_URI=https://your-ngrok-url.ngrok.io/auth/wechat/callback
   ```

### 5.2 Production Testing

1. Ensure domain is registered in WeChat Open Platform
2. HTTPS is configured
3. Test the complete flow:
   - Click WeChat login button
   - Scan QR code with WeChat app
   - Confirm authorization
   - Redirected back to your app
   - User logged in successfully

## Common Issues

### Issue: "redirect_uri parameter error"
**Cause**: Redirect URI doesn't match registered domain
**Solution**:
- Check WeChat Open Platform settings
- Ensure exact match (including protocol and path)
- No trailing slashes

### Issue: QR code doesn't appear
**Cause**: Invalid AppID or network issues
**Solution**:
- Verify WECHAT_APP_ID is correct
- Check if WeChat services are accessible
- Try from different network

### Issue: "invalid code"
**Cause**: Authorization code expired or already used
**Solution**:
- Codes expire in 5 minutes
- Each code can only be used once
- Don't refresh callback page

## Security Best Practices

1. **State Parameter**: Always validate state to prevent CSRF
2. **HTTPS Only**: Never use HTTP in production
3. **Secret Protection**: Never expose AppSecret in frontend
4. **Token Storage**: Store tokens securely (httpOnly cookies recommended)
5. **Session Management**: Implement proper session timeout

## WeChat Mini Program (Optional)

If you want to support WeChat Mini Program login:

1. Register Mini Program in WeChat Open Platform
2. Use `wx.login()` API in Mini Program
3. Send code to your backend
4. Exchange for session_key and openid
5. Different OAuth flow than web

## Production Checklist

- [ ] WeChat Open Platform account verified
- [ ] Web application approved
- [ ] AppID and AppSecret configured
- [ ] Redirect URI matches exactly
- [ ] HTTPS enabled on domain
- [ ] State validation implemented
- [ ] Error handling in place
- [ ] User data privacy compliant
- [ ] Session management secure
- [ ] Tested end-to-end flow

## Resources

- WeChat Open Platform: https://open.weixin.qq.com/
- OAuth Documentation: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
- API Reference: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Authorized_Interface_Calling_UnionID.html

## Support

For WeChat OAuth issues:
- WeChat Developer Community: https://developers.weixin.qq.com/community/
- Email: dev@wechat.com (Chinese only)
