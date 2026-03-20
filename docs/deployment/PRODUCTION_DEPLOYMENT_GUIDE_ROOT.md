# ZeneMe Production Deployment Guide

## Overview

This guide covers deploying the ZeneMe application to production on EC2, including fixing the Admin panel API URL issue and importing the correct database.

**Production Environment:**
- Domain: `www.zeneme.ai` → `13.55.236.142`
- Backend: Python FastAPI on port 8000 (managed by PM2 as `zeneai-backend`)
- Frontend: Next.js on port 3000 (managed by PM2 as `zeneai-frontend`)
- Database: PostgreSQL 15.15 (`postgresql://chat_user:chat_pass@localhost:5432/chat_db`)
- Web Server: Nginx (proxying requests)

---

## Issue Summary

### Problem 1: Admin Panel Using localhost:8000
The Admin panel was hardcoded to use `localhost:8000` because it used a different environment variable name (`NEXT_PUBLIC_API_BASE_URL`) instead of the standard `NEXT_PUBLIC_API_URL`.

**Solution:** Standardized all files to use `NEXT_PUBLIC_API_URL` (fixed in commit `94602559`)

### Problem 2: Wrong Question Count
EC2 database had 97 old seeded questions instead of 8 admin-created questions from local development.

**Solution:** Import the local database backup to EC2

---

## Deployment Steps

### Step 1: Pull Latest Code

```bash
# SSH to EC2
ssh ec2-user@13.55.236.142

# Navigate to frontend directory
cd ~/zeneme-next

# Pull latest changes
git pull origin ai-chat-api-v2
```

### Step 2: Configure Environment Variables

Create `.env.production` file with the correct API URL:

```bash
cd ~/zeneme-next

cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=http://www.zeneme.ai
EOF
```

**Important:** The environment variable must be `NEXT_PUBLIC_API_URL` (not `NEXT_PUBLIC_API_BASE_URL`)

### Step 3: Rebuild Frontend

```bash
# Stop the frontend
pm2 stop zeneai-frontend

# Clean build artifacts and cache
rm -rf .next node_modules/.cache

# Rebuild with environment variable
NEXT_PUBLIC_API_URL=http://www.zeneme.ai npm run build

# Verify the build contains correct URL (should see www.zeneme.ai, not localhost)
strings .next/static/chunks/*.js | grep -E "(www\.zeneme\.ai|localhost:8000)" | head -20

# Restart frontend
pm2 restart zeneai-frontend
```

### Step 4: Import Database (Optional)

If you need to sync the database from local to EC2:

```bash
# On your LOCAL Mac, transfer the backup file
scp ~/zeneAI/ai-chat-api/db_backup/chat_db_backup_20260213_184010.dump ec2-user@13.55.236.142:~/ai-chat-api/db_backup/

# On EC2, import the database
cd ~/ai-chat-api
./ops/import_database.sh db_backup/chat_db_backup_20260213_184010.dump

# Verify question count (should be 8)
PGPASSWORD=chat_pass psql -h localhost -U chat_user -d chat_db -c "SELECT COUNT(*) FROM assessment_questions WHERE questionnaire_id='admin_created';"

# Restart backend to reload data
pm2 restart zeneai-backend
```

### Step 5: Update Backend CORS (If Needed)

The backend CORS should already be configured, but verify:

```bash
cd ~/ai-chat-api
cat .env | grep CORS

# Should include:
# CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://www.zeneme.ai,https://www.zeneme.ai,http://zeneme.ai,https://zeneme.ai,http://13.55.236.142,null
```

If not configured, update `.env` and restart:

```bash
# Edit .env to add production domains to CORS_ORIGINS
nano .env

# Restart backend
pm2 restart zeneai-backend
```

---

## Verification

### 1. Check PM2 Status

```bash
pm2 list
```

Expected output:
```
┌────┬────────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name               │ mode    │ pid     │ uptime   │ ↺      │ status│ cpu      │
├────┼────────────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 1  │ zeneai-backend     │ fork    │ XXXXXX  │ Xm       │ X      │ online│ 0%       │
│ 0  │ zeneai-frontend    │ fork    │ XXXXXX  │ Xm       │ X      │ online│ 0%       │
└────┴────────────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

### 2. Check Backend Logs

```bash
pm2 logs zeneai-backend --lines 50
```

Look for:
- `✓ Database initialized successfully`
- `Application startup complete`
- No CORS errors

### 3. Check Frontend Logs

```bash
pm2 logs zeneai-frontend --lines 50
```

Look for:
- `✓ Ready in XXXms`
- No build errors

### 4. Test in Browser

**Important:** Use incognito/private mode or clear browser cache to avoid cached JavaScript

1. Open `http://www.zeneme.ai/admin` in incognito mode
2. Open Browser DevTools → Network tab
3. Login to admin panel
4. Verify API calls go to `www.zeneme.ai/api/admin/questions` (NOT `localhost:8000`)

### 5. Test Main App

1. Visit `http://www.zeneme.ai/`
2. Start a chat conversation
3. Verify API calls go to `www.zeneme.ai/chat/` (NOT `localhost:8000`)

---

## Troubleshooting

### Issue: Still seeing localhost:8000 in browser

**Cause:** Browser is using cached JavaScript files

**Solution:**
1. Open in incognito/private mode, OR
2. Hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows), OR
3. Clear browser cache for `www.zeneme.ai`

### Issue: CORS errors in browser console

**Cause:** Backend CORS not configured for production domain

**Solution:**
```bash
cd ~/ai-chat-api
nano .env
# Add www.zeneme.ai to CORS_ORIGINS
pm2 restart zeneai-backend
```

### Issue: 502 Bad Gateway

**Cause:** Frontend or backend not running

**Solution:**
```bash
pm2 list
pm2 restart zeneai-frontend
pm2 restart zeneai-backend
```

### Issue: Database connection errors

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
PGPASSWORD=chat_pass psql -h localhost -U chat_user -d chat_db -c "SELECT 1;"
```

---

## Environment Variables Reference

### Frontend (.env.production)

```bash
NEXT_PUBLIC_API_URL=http://www.zeneme.ai
```

**Note:** This variable is baked into JavaScript at build time. You must rebuild after changing it.

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db

# OpenAI
OPENAI_API_KEY=sk-...

# API
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080,http://www.zeneme.ai,https://www.zeneme.ai,http://zeneme.ai,https://zeneme.ai,http://13.55.236.142,null
```

---

## PM2 Commands Reference

```bash
# List all processes
pm2 list

# View logs
pm2 logs zeneai-backend
pm2 logs zeneai-frontend

# Restart processes
pm2 restart zeneai-backend
pm2 restart zeneai-frontend

# Stop processes
pm2 stop zeneai-backend
pm2 stop zeneai-frontend

# Start processes
pm2 start zeneai-backend
pm2 start zeneai-frontend

# Monitor CPU/Memory
pm2 monit

# Process info
pm2 info zeneai-backend
pm2 info zeneai-frontend
```

---

## Database Operations

### Export Database

```bash
cd ~/ai-chat-api
./ops/export_database.sh
# Creates: db_backup/chat_db_backup_YYYYMMDD_HHMMSS.dump
```

### Import Database

```bash
cd ~/ai-chat-api
./ops/import_database.sh db_backup/chat_db_backup_YYYYMMDD_HHMMSS.dump
```

### Check Question Count

```bash
PGPASSWORD=chat_pass psql -h localhost -U chat_user -d chat_db -c "SELECT COUNT(*) FROM assessment_questions WHERE questionnaire_id='admin_created';"
```

---

## Files Changed in Latest Deployment

### Commit 94602559: Fix API URL Environment Variable
- `zeneme-next/src/hooks/useAdminStore.tsx`
- `zeneme-next/src/components/admin/QuestionEditor.tsx`
- `zeneme-next/src/components/admin/MediaLibrary.tsx`
- `zeneme-next/src/components/features/tools/InnerQuickTest.tsx`

**Change:** `NEXT_PUBLIC_API_BASE_URL` → `NEXT_PUBLIC_API_URL`

### Commit 38371a48: Add Psychology Report
- `ai-chat-api/reports/charts/report_18/` (4 chart images)
- `ai-chat-api/reports/generated/psychology_report_18.docx`

---

## Quick Deployment Checklist

- [ ] SSH to EC2: `ssh ec2-user@13.55.236.142`
- [ ] Pull code: `cd ~/zeneme-next && git pull origin ai-chat-api-v2`
- [ ] Create `.env.production` with `NEXT_PUBLIC_API_URL=http://www.zeneme.ai`
- [ ] Stop frontend: `pm2 stop zeneai-frontend`
- [ ] Clean build: `rm -rf .next node_modules/.cache`
- [ ] Rebuild: `NEXT_PUBLIC_API_URL=http://www.zeneme.ai npm run build`
- [ ] Verify build: `strings .next/static/chunks/*.js | grep www.zeneme.ai`
- [ ] Restart: `pm2 restart zeneai-frontend`
- [ ] Test in incognito: `http://www.zeneme.ai/admin`
- [ ] Verify API calls go to `www.zeneme.ai` (not `localhost:8000`)

---

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-15-main.log`

---

**Last Updated:** 2026-02-13
**Git Branch:** `ai-chat-api-v2`
**Latest Commit:** `38371a48`
