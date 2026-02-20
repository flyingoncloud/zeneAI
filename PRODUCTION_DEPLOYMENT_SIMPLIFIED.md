# Simplified Production Deployment Guide

## Quick Setup for EC2 (www.zeneme.ai)

### Backend Configuration

1. **Copy environment template:**
   ```bash
   cd ~/zeneAI/ai-chat-api
   cp .env.production.example .env
   ```

2. **Edit `.env` with minimal required changes:**
   ```bash
   nano .env
   ```

   **Only change these lines:**
   ```bash
   # Enable production mode
   PRODUCTION_MODE=true

   # Simplified CORS - only HTTPS domains
   CORS_ORIGINS=https://www.zeneme.ai,https://zeneme.ai

   # Your OpenAI key
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

3. **Restart backend:**
   ```bash
   # If using systemd
   sudo systemctl restart zeneme-backend

   # Or if running manually
   pkill -f uvicorn
   uvicorn src.api.app:app --host 0.0.0.0 --port 8000
   ```

### Frontend Configuration

1. **Copy environment template:**
   ```bash
   cd ~/zeneAI/zeneme-next
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`:**
   ```bash
   nano .env.local
   ```

   **Set these values:**
   ```bash
   # Enable production mode
   NEXT_PUBLIC_PRODUCTION_MODE=true

   # Backend API URL (same server)
   NEXT_PUBLIC_API_URL=http://www.zeneme.ai:8000

   # Frontend URL
   NEXT_PUBLIC_FRONTEND_URL=https://www.zeneme.ai
   ```

3. **Rebuild and restart frontend:**
   ```bash
   npm run build
   npm start
   ```

## What This Does

### Production Mode Enabled:
- ✅ Root page redirects directly to login (no welcome animation)
- ✅ Cookies use `Secure` and `SameSite=None` for HTTPS
- ✅ CORS only allows your production domains
- ✅ API requests go to production URL

### CORS Simplified:
- ❌ Removed: `http://localhost:3000` (dev only)
- ❌ Removed: `http://localhost:8080` (dev only)
- ❌ Removed: `http://www.zeneme.ai` (insecure)
- ❌ Removed: `http://zeneme.ai` (insecure)
- ❌ Removed: `http://13.55.236.142` (IP address)
- ❌ Removed: `null` (dev only)
- ✅ Kept: `https://www.zeneme.ai` (secure)
- ✅ Kept: `https://zeneme.ai` (secure, no www)

## Verification

### Check Backend Logs:
```bash
# Look for these lines in backend logs
tail -f ~/zeneAI/ai-chat-api/backend.log
```

You should see:
```
============================================================
Environment Mode: PRODUCTION
Cookie Configuration:
  - SameSite: none
  - Secure: True
  - HttpOnly: True
CORS Origins: ['https://www.zeneme.ai', 'https://zeneme.ai']
============================================================
```

### Test in Browser:
1. Visit `https://www.zeneme.ai`
2. Should go directly to login page (no welcome animation)
3. Open DevTools → Network tab
4. Login and check cookies:
   - Should have `Secure` flag
   - Should have `SameSite=None`

## Troubleshooting

### Issue: Still seeing welcome page
**Solution:** Check frontend `.env.local` has `NEXT_PUBLIC_PRODUCTION_MODE=true`

### Issue: CORS errors in browser console
**Solution:**
1. Check backend `.env` has `CORS_ORIGINS=https://www.zeneme.ai,https://zeneme.ai`
2. Restart backend: `sudo systemctl restart zeneme-backend`

### Issue: Cookies not working
**Solution:**
1. Ensure you're accessing via HTTPS (not HTTP)
2. Check backend logs show `Secure: True`
3. If using HTTP, cookies with `Secure` flag won't work

### Issue: API requests failing
**Solution:** Check frontend `.env.local` has correct `NEXT_PUBLIC_API_URL`

## Development Mode (Local)

To switch back to development mode, just remove or comment out the production flags:

**Backend `.env`:**
```bash
# PRODUCTION_MODE=true  # Comment out
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,null
```

**Frontend `.env.local`:**
```bash
# NEXT_PUBLIC_PRODUCTION_MODE=true  # Comment out
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Security Notes

1. **Always use HTTPS in production** - HTTP domains are removed from CORS
2. **Never commit `.env` files** - they contain secrets
3. **Use environment-specific files** - `.env.production.example` is safe to commit
4. **Verify SendGrid sender** - before using `EMAIL_PROVIDER=sendgrid`

## Nginx Setup (Recommended)

### Why Use Nginx?

Without nginx, you need to:
- Access frontend at `www.zeneme.ai:3000` (ugly port number)
- Access backend at `www.zeneme.ai:8000` (different port)
- No HTTPS (insecure)
- No automatic HTTP → HTTPS redirect

With nginx:
- ✅ Clean URLs: `https://www.zeneme.ai` (no port numbers)
- ✅ HTTPS with SSL certificate
- ✅ Single domain for both frontend and backend
- ✅ Better security and performance

### Quick Nginx Setup

1. **Install nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Copy nginx config:**
   ```bash
   sudo cp ~/zeneAI/nginx.conf.example /etc/nginx/sites-available/zeneme
   sudo ln -s /etc/nginx/sites-available/zeneme /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default site
   ```

3. **Install SSL certificate (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai
   ```

4. **Test and restart nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Update Environment Variables for Nginx

**Backend `.env`:**
```bash
# No changes needed - backend still runs on port 8000
# Nginx will proxy requests to it
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_PRODUCTION_MODE=true

# With nginx, API is on same domain under /api
NEXT_PUBLIC_API_URL=https://www.zeneme.ai

# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=https://www.zeneme.ai
```

**CORS Configuration:**
```bash
# Simplified - only one domain needed now!
CORS_ORIGINS=https://www.zeneme.ai
```

### URL Structure with Nginx

- `https://www.zeneme.ai/` → Frontend (Next.js on port 3000)
- `https://www.zeneme.ai/chat/` → Backend API (FastAPI on port 8000)
- `https://www.zeneme.ai/auth/` → Backend API
- `https://www.zeneme.ai/uploads/` → Static files from backend

All on the same domain, no CORS issues!

## Next Steps

After basic deployment works:
1. ✅ Set up nginx reverse proxy (see above)
2. ✅ Set up HTTPS/SSL certificate (see above)
3. Set up systemd services for auto-restart
4. Configure domain DNS properly
5. Set up monitoring and logging
