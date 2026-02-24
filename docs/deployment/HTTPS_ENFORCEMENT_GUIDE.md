# HTTPS Enforcement Guide

## Overview
This guide explains how to enforce HTTPS access for your Zeneme application in production.

## Why HTTPS is Required

1. **Security**: Encrypts all data between users and server
2. **WeChat Requirements**: WeChat requires HTTPS for many features
3. **Browser APIs**: Modern features (clipboard, geolocation, camera) require HTTPS
4. **Cookies**: Secure cookies with `SameSite=None` require HTTPS
5. **SEO**: Search engines rank HTTPS sites higher
6. **Trust**: Users trust sites with the padlock icon

## Current Setup (Development)

### Development Environment
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- No HTTPS required for local development

### Production Environment
- Frontend: `https://www.zeneme.ai`
- Backend: `https://www.zeneme.ai/api` (or separate domain)
- HTTPS required

## Implementation Steps

### 1. Backend: Add HTTPS Redirect Middleware

**File**: `ai-chat-api/src/middleware/https_redirect.py` (NEW)

```python
from fastapi import Request
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
import os

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """
    Middleware to redirect HTTP requests to HTTPS in production
    """
    async def dispatch(self, request: Request, call_next):
        # Only enforce HTTPS in production
        is_production = os.getenv("PRODUCTION_MODE", "false").lower() == "true"

        if is_production:
            # Check if request is HTTP (not HTTPS)
            if request.url.scheme == "http":
                # Redirect to HTTPS
                url = request.url.replace(scheme="https")
                return RedirectResponse(url=str(url), status_code=301)

        # Continue with request
        response = await call_next(request)
        return response
```

**Add to `ai-chat-api/src/api/app.py`**:

```python
from src.middleware.https_redirect import HTTPSRedirectMiddleware

# Add after creating app
app = FastAPI(...)

# Add HTTPS redirect middleware (before CORS)
app.add_middleware(HTTPSRedirectMiddleware)

# CORS middleware
app.add_middleware(CORSMiddleware, ...)
```

### 2. Backend: Update CORS for HTTPS Only

**File**: `ai-chat-api/.env.production`

```bash
# Production Mode
PRODUCTION_MODE=true

# CORS - HTTPS only in production
CORS_ORIGINS=https://www.zeneme.ai,https://zeneme.ai

# Cookie Settings - Secure in production
COOKIE_SECURE=true
COOKIE_SAMESITE=None
COOKIE_HTTPONLY=true
```

### 3. Frontend: Environment Detection

**File**: `zeneme-next/src/utils/environment.ts` (NEW)

```typescript
/**
 * Environment detection utilities
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' ||
         process.env.NEXT_PUBLIC_PRODUCTION_MODE === 'true';
}

export function getApiBaseUrl(): string {
  if (isProduction()) {
    return process.env.NEXT_PUBLIC_API_URL || 'https://www.zeneme.ai/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

export function requiresHttps(): boolean {
  return isProduction();
}
```

### 4. Frontend: Update API Calls

**File**: `zeneme-next/src/lib/api.ts`

Update to use environment-aware base URL:

```typescript
import { getApiBaseUrl } from '@/utils/environment';

const API_BASE_URL = getApiBaseUrl();

// All API calls will now use correct protocol
```

### 5. Nginx Configuration (Production Server)

**File**: `/etc/nginx/sites-available/zeneme` (on EC2)

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name www.zeneme.ai zeneme.ai;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl;
    http2 on;
    server_name www.zeneme.ai zeneme.ai;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/www.zeneme.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.zeneme.ai/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. SSL Certificate Setup (Let's Encrypt)

**On EC2 Server**:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

### 7. Environment Variables

**Development** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PRODUCTION_MODE=false
```

**Production** (`.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://www.zeneme.ai/api
NEXT_PUBLIC_PRODUCTION_MODE=true
```

## Testing HTTPS Enforcement

### 1. Test HTTP Redirect
```bash
# Should redirect to HTTPS
curl -I http://www.zeneme.ai
# Expected: 301 Moved Permanently
# Location: https://www.zeneme.ai
```

### 2. Test HTTPS Access
```bash
# Should work
curl -I https://www.zeneme.ai
# Expected: 200 OK
```

### 3. Test in Browser
1. Open `http://www.zeneme.ai` (HTTP)
2. Should automatically redirect to `https://www.zeneme.ai`
3. Check for padlock icon in address bar

### 4. Test WeChat Banner
1. Open in WeChat browser
2. Banner should show with copy URL button
3. Copied URL should be HTTPS

## Security Checklist

- [ ] SSL certificate installed and valid
- [ ] HTTP to HTTPS redirect working
- [ ] HSTS header enabled (forces HTTPS for 1 year)
- [ ] Secure cookies enabled (`Secure=true`, `SameSite=None`)
- [ ] CORS only allows HTTPS origins
- [ ] API calls use HTTPS in production
- [ ] WeChat OAuth redirect URI uses HTTPS
- [ ] All external resources (images, scripts) use HTTPS

## Common Issues

### Issue 1: Mixed Content Warnings
**Problem**: Page loads over HTTPS but loads HTTP resources
**Solution**: Ensure all resources use HTTPS or protocol-relative URLs

### Issue 2: Cookies Not Working
**Problem**: Cookies not set in production
**Solution**: Ensure `Secure=true` and `SameSite=None` for cross-origin cookies

### Issue 3: WeChat Features Not Working
**Problem**: Camera, location, etc. don't work
**Solution**: WeChat requires HTTPS for these features

### Issue 4: Certificate Expired
**Problem**: SSL certificate expired
**Solution**: Certbot auto-renews, but check: `sudo certbot renew`

## Monitoring

### Check SSL Certificate Expiry
```bash
echo | openssl s_client -servername www.zeneme.ai -connect www.zeneme.ai:443 2>/dev/null | openssl x509 -noout -dates
```

### Check HTTPS Redirect
```bash
curl -I http://www.zeneme.ai | grep -i location
```

### Check Security Headers
```bash
curl -I https://www.zeneme.ai | grep -i strict-transport-security
```

## References

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [MDN: Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
- [WeChat HTTPS Requirements](https://developers.weixin.qq.com/)

## Next Steps

1. Set up SSL certificate on EC2
2. Configure Nginx for HTTPS
3. Update environment variables
4. Test HTTP to HTTPS redirect
5. Verify all features work over HTTPS
6. Monitor certificate expiry
