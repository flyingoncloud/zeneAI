# Nginx Setup Guide for www.zeneme.ai

## Why Nginx?

**Without Nginx:**
- Frontend: `http://www.zeneme.ai:3000` ❌ (port in URL)
- Backend: `http://www.zeneme.ai:8000` ❌ (different port)
- No HTTPS ❌
- CORS issues ❌

**With Nginx:**
- Everything: `https://www.zeneme.ai` ✅
- Clean URLs ✅
- HTTPS with SSL ✅
- No CORS issues ✅

## Quick Setup (5 minutes)

### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Copy Configuration
```bash
cd ~/zeneAI
sudo cp nginx.conf.example /etc/nginx/sites-available/zeneme
sudo ln -s /etc/nginx/sites-available/zeneme /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 3. Install SSL Certificate
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (option 2)

### 4. Test and Restart
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Update Your Configuration

### Backend `.env`
```bash
# CORS is now simplified - only one domain!
CORS_ORIGINS=https://www.zeneme.ai

# Everything else stays the same
PRODUCTION_MODE=true
```

### Frontend `.env.local`
```bash
NEXT_PUBLIC_PRODUCTION_MODE=true

# API is now on same domain (no port needed)
NEXT_PUBLIC_API_URL=https://www.zeneme.ai

NEXT_PUBLIC_FRONTEND_URL=https://www.zeneme.ai
```

### Restart Services
```bash
sudo systemctl restart zeneme-backend
sudo systemctl restart zeneme-frontend
```

## How It Works

```
User Browser
    ↓
https://www.zeneme.ai/
    ↓
Nginx (port 443)
    ↓
    ├─→ / → Next.js (port 3000) - Frontend
    ├─→ /chat/ → FastAPI (port 8000) - Backend API
    ├─→ /auth/ → FastAPI (port 8000) - Auth endpoints
    └─→ /uploads/ → Static files
```

All on the same domain, no CORS issues!

## URL Mapping

| User Visits | Nginx Routes To | Service |
|------------|----------------|---------|
| `https://www.zeneme.ai/` | `http://localhost:3000/` | Next.js Frontend |
| `https://www.zeneme.ai/chat/` | `http://localhost:8000/chat/` | FastAPI Backend |
| `https://www.zeneme.ai/auth/login` | `http://localhost:8000/auth/login` | FastAPI Auth |
| `https://www.zeneme.ai/uploads/image.jpg` | `/home/ubuntu/zeneAI/ai-chat-api/uploads/image.jpg` | Static File |

## Troubleshooting

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check Nginx Configuration
```bash
sudo nginx -t
```

### View Nginx Logs
```bash
# Error log
sudo tail -f /var/log/nginx/zeneme-error.log

# Access log
sudo tail -f /var/log/nginx/zeneme-access.log
```

### Common Issues

**Issue: 502 Bad Gateway**
- Backend or frontend not running
- Check: `sudo systemctl status zeneme-backend zeneme-frontend`

**Issue: SSL certificate error**
- Certificate not installed or expired
- Run: `sudo certbot renew`

**Issue: "Connection refused"**
- Services not listening on correct ports
- Check: `sudo netstat -tlnp | grep -E '3000|8000'`

**Issue: CORS errors still appearing**
- Old CORS_ORIGINS in backend .env
- Update to: `CORS_ORIGINS=https://www.zeneme.ai`
- Restart: `sudo systemctl restart zeneme-backend`

## SSL Certificate Renewal

Certbot automatically renews certificates. To test renewal:
```bash
sudo certbot renew --dry-run
```

## Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Reload nginx (no downtime)
sudo systemctl reload nginx

# Stop nginx
sudo systemctl stop nginx

# Start nginx
sudo systemctl start nginx

# View status
sudo systemctl status nginx
```

## Security Headers

The nginx config includes security headers:
- `X-Frame-Options: SAMEORIGIN` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection

## Performance

Nginx provides:
- Static file caching (30-365 days)
- Gzip compression
- HTTP/2 support
- Connection pooling

## Next Steps

After nginx is working:
1. ✅ Set up systemd services (see `systemd/` folder)
2. ✅ Use deployment script: `./deploy-production.sh`
3. Set up monitoring (optional)
4. Set up backups (optional)
