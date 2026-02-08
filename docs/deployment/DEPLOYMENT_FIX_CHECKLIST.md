# Deployment Fix Checklist - February 7, 2026

## Issue Summary

1. **NetworkError on page initialization** - Backend likely crashed or not running
2. **Emotion saving works but needs backend restart** - Code changes not deployed
3. **Mood tracker already fixed** - Code updated to append with timestamps

## Immediate Actions Required

### Step 1: Check Backend Status

```bash
# SSH to EC2
ssh ec2-user@your-ec2-instance

# Check if backend is running
sudo systemctl status zeneai-backend

# OR if using PM2
pm2 list

# Check backend logs for errors
sudo journalctl -u zeneai-backend -n 100 --no-pager

# OR if using PM2
pm2 logs zeneai-backend --lines 100
```

### Step 2: Restart Backend (if needed)

```bash
# If using systemd
sudo systemctl restart zeneai-backend
sudo systemctl status zeneai-backend

# OR if using PM2
pm2 restart zeneai-backend
pm2 logs zeneai-backend --lines 50
```

### Step 3: Test Backend Connectivity

```bash
# Test root endpoint
curl http://localhost:8000/

# Expected response:
# {
#   "message": "AI Chat API with Natural Module Recommendations",
#   "version": "2.0.0",
#   ...
# }

# Test questionnaires endpoint
curl http://localhost:8000/questionnaires

# Should return list of questionnaires
```

### Step 4: Rebuild and Restart Frontend

```bash
# Navigate to frontend directory
cd ~/zeneAI/zeneme-next

# Pull latest changes (if any)
git pull origin ai-chat-api-v2

# Rebuild
npm run build

# Restart with PM2
pm2 restart zeneai-frontend

# Check status
pm2 list
pm2 logs zeneai-frontend --lines 50
```

### Step 5: Verify Nginx Configuration

```bash
# Test nginx config
sudo nginx -t

# Reload nginx if needed
sudo systemctl reload nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Step 6: Test from Browser

1. Open https://www.zeneme.ai in browser
2. Open browser console (F12)
3. Check for any network errors
4. Try to:
   - Start a new chat
   - Complete emotional first aid (情感命名)
   - Add multiple emotions on the same day
   - Check mood tracker (情绪追踪)

## Verification Tests

### Test 1: Multiple Emotions Per Day (情感命名)

1. Go to Emotional First Aid (情感命名)
2. Complete breathing exercise
3. Select an emotion (e.g., "Happy") with intensity 4
4. Return to chat
5. Go back to Emotional First Aid
6. Complete again with different emotion (e.g., "Calm") with intensity 3
7. **Expected**: Both emotions should be saved, not overwritten

### Test 2: Mood Tracker (情绪追踪)

1. Go to Mood Tracker (情绪追踪)
2. Click on today's date
3. Add a mood (e.g., "Happy") with a note
4. Save
5. Click on today's date again
6. Add a different mood (e.g., "Calm") with a different note
7. **Expected**: Both moods should be visible (with timestamps)

### Test 3: Backend API Direct Test

```bash
# Test module completion endpoint
curl -X POST http://localhost:8000/conversations/1/modules/emotional_first_aid/complete \
  -H "Content-Type: application/json" \
  -d '{
    "completion_data": {
      "emotion": "Happy",
      "intensity": 4,
      "timestamp": "2026-02-07T10:00:00Z"
    }
  }'

# Expected: Should return success with completion_history array
```

## Code Changes Already Made

### Backend Changes (ai-chat-api/src/api/app.py)

✅ Lines 328-395: `complete_module` endpoint updated to:
- Store emotional_first_aid completions in `completion_history` array
- Each entry includes timestamp
- Maintains backward compatibility with `completion_data`

### Frontend Changes (zeneme-next/src/hooks/useZenemeStore.tsx)

✅ `MoodLog` type: Added `timestamp` field
✅ `logMood` function: Changed to append entries instead of filtering by date

## Troubleshooting

### If Backend Won't Start

```bash
# Check Python environment
cd ~/zeneAI/ai-chat-api
source venv/bin/activate  # or conda activate base

# Check for missing dependencies
pip install -r requirements.txt

# Check database connection
python test_db_connection.py

# Try running manually to see errors
python run.py
```

### If Frontend Build Fails

```bash
cd ~/zeneAI/zeneme-next

# Clear cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstall dependencies if needed
npm install

# Try build again
npm run build
```

### If Nginx Shows 502 Bad Gateway

```bash
# Check if frontend is running
curl http://localhost:3000/

# Check if backend is running
curl http://localhost:8000/

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Next Steps After Fixes

1. ✅ Verify backend is running and accessible
2. ✅ Verify frontend is built and running
3. ✅ Test multiple emotion entries work
4. ✅ Test mood tracker works
5. 📋 Plan admin questionnaire integration (spec created)
6. 📋 Implement admin routes and components
7. 📋 Connect admin UI to backend APIs

## Admin Integration Spec

Created: `.kiro/specs/admin-questionnaire-integration/requirements.md`

This spec outlines the plan to integrate the questionnaire admin management system from `26_02_07_ZeneWe_Admin` into `zeneme-next`.

Key features:
- Admin authentication
- Questionnaire CRUD operations
- 8 template types (F1-F8)
- Media library management
- Publishing workflow
- Backend API integration

## Contact Points

- Frontend: `zeneme-next/` (port 3000)
- Backend: `ai-chat-api/` (port 8000)
- Nginx: `/etc/nginx/conf.d/zeneme.conf`
- PM2: `pm2 list`, `pm2 logs`
- Systemd: `sudo systemctl status zeneai-backend`

## Important Files

- Backend module completion: `ai-chat-api/src/api/app.py` (lines 328-395)
- Frontend store: `zeneme-next/src/hooks/useZenemeStore.tsx`
- Emotional First Aid: `zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`
- Mood Tracker: `zeneme-next/src/components/features/tools/MoodTracker.tsx`
- Admin components: `26_02_07_ZeneWe_Admin/src/components/admin/`
