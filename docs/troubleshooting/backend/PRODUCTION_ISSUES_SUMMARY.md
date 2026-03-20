# Production Issues Summary & Fixes

## Issues Identified

### 1. ✅ Domain Mismatch (www.zeneme.ai vs www.zenewe.ai)
**Status**: Fixed
**Issue**: Frontend was built with wrong domain hardcoded
**Fix**: Rebuild Next.js with correct domain
```bash
cd ~/zeneAI/zeneme-next
nano .env.production  # Verify NEXT_PUBLIC_API_URL=http://www.zenewe.ai
npm run build
pm2 restart zeneai-frontend
```

### 2. ✅ Auth Endpoints Returning 404
**Status**: Fixed
**Issue**: Nginx not routing `/auth/*` to backend
**Fix**: Update nginx configuration to include auth routes
```bash
# Edit /etc/nginx/conf.d/zeneme.conf
# Add 'auth' to the regex pattern:
location ~ ^/(chat|analyze-sketch|upload-sketch|conversations|questionnaires|api|auth|charts) {
    proxy_pass http://localhost:8000;
    ...
}

sudo nginx -t
sudo systemctl restart nginx
```

### 3. ✅ Charts Not Loading (404 on /charts/*)
**Status**: Fixed
**Issue**: Nginx not routing `/charts/*` to backend
**Fix**: Same as #2 - add 'charts' to nginx regex pattern

### 4. ⏳ Chinese Characters Not Displaying in Charts
**Status**: In Progress
**Issue**: EC2 server missing Chinese fonts
**Fix**: Install Chinese fonts on EC2
```bash
bash install-chinese-fonts-ec2.sh
pm2 restart zeneai-backend
```

### 5. ⏳ Email Login Not Working
**Status**: Needs Configuration
**Issue**: Email provider not configured (using 'console' mode)
**Fix**: Configure SendGrid or SMTP
```bash
cd ~/zeneAI/ai-chat-api
nano .env

# Add:
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM_EMAIL=noreply@zenewe.ai

pm2 restart zeneai-backend
```

## Quick Fix Commands

### Complete Setup (Run in Order)

```bash
# 1. Install Chinese fonts
bash install-chinese-fonts-ec2.sh

# 2. Update nginx configuration
sudo cp nginx-zenewe-updated.conf /etc/nginx/conf.d/zeneme.conf
sudo nginx -t
sudo systemctl restart nginx

# 3. Configure email (if needed)
cd ~/zeneAI/ai-chat-api
nano .env
# Set EMAIL_PROVIDER, SENDGRID_API_KEY, etc.

# 4. Rebuild frontend with correct domain
cd ~/zeneAI/zeneme-next
nano .env.production
# Verify: NEXT_PUBLIC_API_URL=http://www.zenewe.ai
npm run build

# 5. Restart all services
pm2 restart all

# 6. Verify everything works
bash check_routing.sh
bash test-chart-access.sh
```

## Verification Checklist

- [ ] Website loads: http://www.zenewe.ai
- [ ] Auth endpoints work: Test email login
- [ ] Charts load: Complete questionnaire and check radar chart
- [ ] Chinese characters display correctly in charts
- [ ] Email verification codes are sent (if configured)
- [ ] No 404 errors in browser console
- [ ] No CORS errors in browser console

## Files Created for Troubleshooting

1. **nginx-zenewe-updated.conf** - Updated nginx config with auth and charts
2. **install-chinese-fonts-ec2.sh** - Install Chinese fonts on EC2
3. **check_routing.sh** - Diagnostic script for routing issues
4. **test-chart-access.sh** - Test chart image access
5. **setup-nginx.sh** - Automated nginx setup
6. **QUICK_FIX_404_AUTH.md** - Quick fix guide for 404 errors

## Common Commands

### Check Service Status
```bash
pm2 status
sudo systemctl status nginx
```

### View Logs
```bash
pm2 logs zeneai-backend --lines 50
pm2 logs zeneai-frontend --lines 50
sudo tail -50 /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart zeneai-backend
pm2 restart zeneai-frontend
sudo systemctl restart nginx
```

### Test Endpoints
```bash
# Backend health
curl http://localhost:8000/health

# Auth endpoint
curl -X POST http://localhost:8000/auth/email/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Chart access
curl -I http://localhost:8000/charts/report_51/radar_chart.png
```

## Environment Variables Summary

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db
OPENAI_API_KEY=your_key_here
CORS_ORIGINS=http://www.zenewe.ai

# Email (choose one)
EMAIL_PROVIDER=sendgrid  # or smtp or console
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM_EMAIL=noreply@zenewe.ai

# Optional
PRODUCTION_MODE=true
```

### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=http://www.zenewe.ai
NEXT_PUBLIC_FRONTEND_URL=http://www.zenewe.ai
```

## Next Steps

1. **HTTPS Setup** (Recommended for production)
   ```bash
   sudo yum install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d www.zenewe.ai -d zenewe.ai
   ```

2. **Monitoring** (Optional)
   - Set up log rotation
   - Configure alerts for service failures
   - Monitor disk space for chart storage

3. **Backups** (Recommended)
   - Database backups
   - Chart files backup
   - Configuration backups

## Support

If issues persist:
1. Run diagnostic scripts: `bash check_routing.sh`
2. Check logs: `pm2 logs zeneai-backend`
3. Verify configuration: `sudo nginx -t`
4. Review documentation in `docs/troubleshooting/`
