# WeChat OAuth Login - Design Document

## Overview

This document describes the WeChat OAuth 2.0 login implementation for ZeneWe, allowing users to authenticate using their WeChat account via QR code scanning.

## Status

- **Backend**: ✅ Complete (committed: 6f0bd76c)
- **Frontend**: ⏳ Pending implementation
- **Testing**: ⏳ Requires WeChat Open Platform credentials

---

## Architecture

### OAuth 2.0 Flow Diagram

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌────────────┐
│ User    │         │ Your App │         │ Backend │         │ WeChat API │
└────┬────┘         └────┬─────┘         └────┬────┘         └─────┬──────┘
     │                   │                     │                    │
     │ 1. Click "微信登录" │                     │                    │
     ├──────────────────>│                     │                    │
     │                   │                     │                    │
     │                   │ 2. GET /auth/wechat/login-url           │
     │                   ├────────────────────>│                    │
     │                   │                     │                    │
     │                   │                     │ 3. Generate state  │
     │                   │                     │    + OAuth URL     │
     │                   │                     ├───────────────────>│
     │                   │                     │                    │
     │                   │ 4. Return {login_url, state}            │
     │                   │<────────────────────┤                    │
     │                   │                     │                    │
     │ 5. Redirect/Popup to WeChat QR page    │                    │
     │<──────────────────┤                     │                    │
     │                   │                     │                    │
     │ 6. Scan QR with WeChat mobile app       │                    │
     ├────────────────────────────────────────────────────────────>│
     │                   │                     │                    │
     │ 7. Authorize in WeChat app              │                    │
     ├────────────────────────────────────────────────────────────>│
     │                   │                     │                    │
     │ 8. Redirect to callback with code+state │                    │
     │<────────────────────────────────────────────────────────────┤
     │                   │                     │                    │
     │ 9. GET /auth/wechat/callback?code=xxx&state=yyy             │
     ├──────────────────>├────────────────────>│                    │
     │                   │                     │                    │
     │                   │                     │ 10. Verify state   │
     │                   │                     │     Exchange code  │
     │                   │                     ├───────────────────>│
     │                   │                     │                    │
     │                   │                     │ 11. Get user info  │
     │                   │                     ├───────────────────>│
     │                   │                     │                    │
     │                   │                     │ 12. Return profile │
     │                   │                     │<───────────────────┤
     │                   │                     │                    │
     │                   │                     │ 13. Create/update  │
     │                   │                     │     user in DB     │
     │                   │                     │                    │
     │                   │ 14. Return {user, token}                │
     │                   │<────────────────────┤                    │
     │                   │                     │                    │
     │ 15. Login success │                     │                    │
     │<──────────────────┤                     │                    │
```

---

## Backend Implementation (Complete)

### 1. WeChat OAuth Service
**File**: `ai-chat-api/src/services/wechat_oauth.py`

**Functions**:
- `get_wechat_login_url(state: str) -> str`
  - Generates WeChat OAuth URL with QR code
  - Parameters: appid, redirect_uri, response_type, scope, state
  - Returns: Full OAuth URL for user to visit

- `exchange_code_for_token(code: str) -> Optional[Dict]`
  - Exchanges authorization code for access token
  - Returns: access_token, openid, unionid, expires_in

- `get_user_info(access_token: str, openid: str) -> Optional[Dict]`
  - Fetches user profile from WeChat
  - Returns: nickname, headimgurl, sex, province, city, country

- `is_configured() -> bool`
  - Checks if WECHAT_APP_ID and WECHAT_APP_SECRET are set

**Configuration** (`.env`):
```env
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=http://localhost:3000/auth/wechat/callback
```

### 2. Auth Routes
**File**: `ai-chat-api/src/api/auth_routes.py`

**Endpoints**:

#### GET `/auth/wechat/login-url`
Generates WeChat OAuth login URL with CSRF protection.

**Response**:
```json
{
  "success": true,
  "login_url": "https://open.weixin.qq.com/connect/qrconnect?appid=...",
  "state": "random_32_char_token"
}
```

**Error Responses**:
- 503: WeChat OAuth not configured
- 500: Internal server error

#### GET `/auth/wechat/callback?code=xxx&state=yyy`
Handles OAuth callback from WeChat.

**Query Parameters**:
- `code`: Authorization code from WeChat
- `state`: CSRF protection token

**Response**:
```json
{
  "success": true,
  "message": "WeChat login successful",
  "user": {
    "id": "wechat_abc123...",
    "name": "微信用户昵称",
    "avatar": "https://...",
    "provider": "wechat"
  },
  "token": "auth_token_here"
}
```

**Error Responses**:
- 400: Invalid/expired state token
- 400: Failed to exchange code
- 400: Failed to get user info
- 500: Internal server error

**Security Features**:
- State token validation (5-minute expiration)
- One-time use state tokens
- CSRF protection
- Secure user ID generation (MD5 hash of unionid/openid)

### 3. User Database Schema
**Table**: `user_profiles`

**WeChat-specific fields**:
- `user_id`: `wechat_{md5_hash}` format
- `username`: WeChat nickname
- `auth_provider`: `'wechat'`
- `provider_id`: unionid (preferred) or openid
- `avatar_url`: WeChat profile picture URL
- `last_login_at`: Updated on each login

---

## Frontend Implementation (Pending)

### Option 1: Full Page Redirect (Recommended)

**Pros**:
- Simpler implementation
- Works on desktop and mobile
- No popup blocker issues
- Better mobile UX (WeChat app integration)

**Cons**:
- User leaves your page temporarily
- Need to handle return state

**Implementation**:

#### 1. Update AuthPage.tsx
```typescript
const handleWeChatLogin = async () => {
  try {
    setIsLoading(true);

    // Get OAuth URL from backend
    const result = await getWeChatLoginUrl();

    if (result.success && result.login_url) {
      // Save state for verification
      sessionStorage.setItem('wechat_oauth_state', result.state);

      // Redirect to WeChat OAuth page
      window.location.href = result.login_url;
    } else {
      toast.error('微信登录暂不可用');
    }
  } catch (error) {
    toast.error('微信登录失败');
  } finally {
    setIsLoading(false);
  }
};
```

#### 2. Create Callback Page
**File**: `zeneme-next/src/app/auth/wechat/callback/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuthStore';
import { handleWeChatCallback } from '@/lib/api';
import { toast } from 'sonner';

export default function WeChatCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // Verify state matches
      const savedState = sessionStorage.getItem('wechat_oauth_state');

      if (!code || !state) {
        toast.error('微信登录失败：缺少参数');
        router.push('/');
        return;
      }

      if (state !== savedState) {
        toast.error('微信登录失败：安全验证失败');
        router.push('/');
        return;
      }

      try {
        // Send to backend for verification
        const result = await handleWeChatCallback(code, state);

        if (result.success && result.user) {
          // Clear saved state
          sessionStorage.removeItem('wechat_oauth_state');

          // Login user
          login(result.user);

          // Show success message
          toast.success('微信登录成功！');

          // Redirect to app
          router.push('/');
        } else {
          throw new Error(result.message || '登录失败');
        }
      } catch (error) {
        console.error('WeChat callback error:', error);
        toast.error(error instanceof Error ? error.message : '微信登录失败');
        router.push('/');
      }
    };

    processCallback();
  }, [searchParams, router, login]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-lg">正在登录...</p>
      </div>
    </div>
  );
}
```

#### 3. Update Next.js Config
Ensure the callback route is properly configured in `next.config.js` if needed.

---

### Option 2: Popup Window (Alternative)

**Pros**:
- User stays on your page
- Better desktop UX
- Can show loading state on main page

**Cons**:
- Popup blockers may interfere
- More complex implementation
- Requires postMessage communication
- Mobile experience not ideal

**Implementation**:

#### 1. Update AuthPage.tsx
```typescript
const handleWeChatLogin = async () => {
  try {
    setIsLoading(true);

    // Get OAuth URL from backend
    const result = await getWeChatLoginUrl();

    if (result.success && result.login_url) {
      // Save state for verification
      sessionStorage.setItem('wechat_oauth_state', result.state);

      // Open popup window
      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        result.login_url,
        'WeChat Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for callback message
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'wechat-login-success') {
          window.removeEventListener('message', handleMessage);

          // Login user
          login(event.data.user);
          toast.success('微信登录成功！');
          setIsLoading(false);
        } else if (event.data.type === 'wechat-login-error') {
          window.removeEventListener('message', handleMessage);
          toast.error(event.data.error || '微信登录失败');
          setIsLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
        }
      }, 1000);
    } else {
      toast.error('微信登录暂不可用');
      setIsLoading(false);
    }
  } catch (error) {
    toast.error('微信登录失败');
    setIsLoading(false);
  }
};
```

#### 2. Update Callback Page for Popup
```typescript
// In callback page, send message to parent window
if (window.opener) {
  window.opener.postMessage({
    type: 'wechat-login-success',
    user: result.user
  }, window.location.origin);
  window.close();
} else {
  // Fallback to redirect if not in popup
  router.push('/');
}
```

---

## WeChat Open Platform Setup

### Prerequisites

1. **Register WeChat Open Platform Account**
   - Visit: https://open.weixin.qq.com/
   - Requires Chinese business license or verified organization
   - Individual accounts have limited features

2. **Create Website Application**
   - Application Type: 网站应用 (Website Application)
   - Fill in application details
   - Submit for review (takes 1-7 days)

3. **Configure Callback URL**
   - Development: `http://localhost:3000/auth/wechat/callback`
   - Production: `https://yourdomain.com/auth/wechat/callback`
   - **Important**: Must use HTTPS in production
   - Domain must be verified and match registered domain

4. **Get Credentials**
   - AppID: Unique application identifier
   - AppSecret: Secret key for API calls
   - Add to `.env` file

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Callback URL | HTTP allowed | HTTPS required |
| Domain verification | Not required | Required |
| Account type | Test account possible | Business account required |
| User limit | Limited test users | Unlimited |

---

## Security Considerations

### 1. CSRF Protection
- State token generated with `secrets.token_urlsafe(32)`
- Stored in-memory with 5-minute expiration
- Validated before accepting authorization code
- One-time use (deleted after validation)

### 2. User Identity
- Primary ID: `unionid` (consistent across all apps)
- Fallback ID: `openid` (app-specific)
- User ID format: `wechat_{md5_hash}`
- Prevents collision with other auth providers

### 3. Token Management
- Backend generates auth token after successful login
- Token stored in frontend auth store
- Token should be validated on protected routes
- Consider implementing JWT for production

### 4. Data Privacy
- Only request necessary user data
- Store minimal profile information
- WeChat avatar URLs are public
- Comply with privacy regulations

---

## Error Handling

### Backend Errors

| Error Code | Scenario | User Message |
|------------|----------|--------------|
| 503 | WeChat not configured | 微信登录暂不可用 |
| 400 | Invalid state token | 安全验证失败，请重试 |
| 400 | Code exchange failed | 微信授权失败，请重试 |
| 400 | User info fetch failed | 获取用户信息失败 |
| 500 | Server error | 服务器错误，请稍后重试 |

### Frontend Errors

| Scenario | Handling |
|----------|----------|
| Popup blocked | Show instruction to allow popups |
| Network error | Retry with exponential backoff |
| User cancels | Silent failure, return to login |
| State mismatch | Clear state, show error, redirect |

---

## Testing Strategy

### Unit Tests
- [ ] Test `get_wechat_login_url()` URL generation
- [ ] Test state token validation
- [ ] Test user creation/update logic
- [ ] Test error handling for API failures

### Integration Tests
- [ ] Test full OAuth flow with mock WeChat API
- [ ] Test callback handling with valid/invalid codes
- [ ] Test state token expiration
- [ ] Test user profile updates on repeat login

### Manual Testing
1. **Development**:
   - Use WeChat test account
   - Test on desktop browser
   - Test on mobile browser
   - Test QR code scanning

2. **Production**:
   - Test with real WeChat account
   - Verify HTTPS callback works
   - Test on multiple devices
   - Monitor error rates

---

## Deployment Checklist

### Backend
- [ ] Add WeChat credentials to production `.env`
- [ ] Update `WECHAT_REDIRECT_URI` to production URL
- [ ] Ensure HTTPS is enabled
- [ ] Configure CORS for production domain
- [ ] Set up monitoring for OAuth errors
- [ ] Consider using Redis for state storage (instead of in-memory)

### Frontend
- [ ] Update API_BASE_URL for production
- [ ] Test callback page routing
- [ ] Verify error messages are user-friendly
- [ ] Add analytics tracking for WeChat login
- [ ] Test on multiple browsers
- [ ] Optimize loading states

### WeChat Platform
- [ ] Update callback URL to production domain
- [ ] Verify domain ownership
- [ ] Test with production credentials
- [ ] Monitor API quota usage
- [ ] Set up webhook for user events (optional)

---

## Future Enhancements

### Phase 2
- [ ] Add WeChat Mini Program login support
- [ ] Implement WeChat Pay integration
- [ ] Add WeChat sharing functionality
- [ ] Support WeChat Work (企业微信) login

### Phase 3
- [ ] Implement refresh token flow
- [ ] Add account linking (link WeChat to existing account)
- [ ] Support multiple OAuth providers simultaneously
- [ ] Add WeChat notification integration

---

## API Reference

### Frontend API Functions

```typescript
// Get WeChat OAuth login URL
getWeChatLoginUrl(): Promise<{
  success: boolean;
  login_url?: string;
  state?: string;
  error?: string;
}>

// Handle WeChat OAuth callback
handleWeChatCallback(code: string, state: string): Promise<AuthResponse>
```

### Backend Endpoints

```
GET  /auth/wechat/login-url
GET  /auth/wechat/callback?code={code}&state={state}
```

---

## Resources

### Documentation
- WeChat Open Platform: https://open.weixin.qq.com/
- OAuth 2.0 Docs: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
- API Reference: https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Authorized_Interface_Calling_UnionID.html

### Support
- WeChat Developer Forum: https://developers.weixin.qq.com/community/
- Technical Support: Contact through WeChat Open Platform

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-15 | 1.0 | Initial design document created |
| 2026-02-15 | 1.0 | Backend implementation completed (commit: 6f0bd76c) |

---

## Notes

- This implementation uses WeChat Open Platform (开放平台) for website login
- Different from WeChat Official Account (公众号) or Mini Program (小程序) login
- QR code is displayed by WeChat, not generated by our app
- User must have WeChat mobile app installed to scan QR code
- Consider adding fallback authentication methods for users without WeChat
