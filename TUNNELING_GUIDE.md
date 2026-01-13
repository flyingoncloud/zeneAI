# 🌐 Tunneling Guide - Share ZeneAI Psychology Tester

This guide shows you how to share your ZeneAI Psychology Framework Tester with others via the internet using tunneling services.

## Quick Start (Using ngrok - Recommended)

### 1. Install ngrok

**macOS:**
```bash
brew install ngrok
```

**Windows/Linux:**
Download from [ngrok.com/download](https://ngrok.com/download)

**Sign up (free):**
- Go to [ngrok.com](https://ngrok.com)
- Sign up for a free account
- Get your authtoken from the dashboard

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 2. Start Your FastAPI Backend

```bash
cd /Users/lxfhfut/Dropbox/Work/Start-Up/ai-chat/zeneAI/ai-chat-api
python run.py
```

✅ Your API should now be running on `http://localhost:8000`

### 3. Tunnel the Backend with ngrok

Open a **new terminal** and run:

```bash
ngrok http 8000
```

You'll see output like:
```
Session Status    online
Account           Your Name (Plan: Free)
Forwarding        https://abc123-ngrok-free.app -> http://localhost:8000
```

📝 **Copy the HTTPS URL** (e.g., `https://abc123-ngrok-free.app`)

### 4. Serve the Test HTML

Open **another new terminal**:

```bash
cd /Users/lxfhfut/Dropbox/Work/Start-Up/ai-chat/zeneAI/ai-chat-api
python -m http.server 8080
```

✅ Your HTML is now served at `http://localhost:8080/test_framework_web.html`

### 5. Configure the API URL in the Browser

1. Open `http://localhost:8080/test_framework_web.html` in your browser
2. Click the **⚙️ Settings** button (top-right corner)
3. Paste your ngrok URL: `https://abc123-ngrok-free.app`
4. Click **Save**

✅ Now the frontend is configured to use the public backend!

### 6. Tunnel the Frontend (Optional - for remote access)

If you want others to access the HTML file remotely, tunnel the HTTP server too:

```bash
# In another terminal
ngrok http 8080
```

You'll get another URL like: `https://xyz789-ngrok-free.app`

📤 **Share this URL** with others: `https://xyz789-ngrok-free.app/test_framework_web.html`

---

## 🎯 Summary - What to Share

### For Local Testing (you only):
- Just use `http://localhost:8080/test_framework_web.html`
- Configure API to your ngrok backend URL

### For Remote Users:
Share **2 things**:
1. **Frontend URL**: `https://xyz789-ngrok-free.app/test_framework_web.html`
2. **Tell them to configure API**: Click ⚙️, enter `https://abc123-ngrok-free.app`

**OR** pre-configure it:
1. Set API URL via settings UI to your backend ngrok URL
2. Share only the frontend ngrok URL
3. Users can start chatting immediately!

---

## Alternative Methods

### Option 2: Using Cloudflare Tunnel (Free, No Sign-up)

```bash
# Install
brew install cloudflare/cloudflare/cloudflared

# Tunnel backend
cloudflared tunnel --url http://localhost:8000

# Tunnel frontend (in another terminal)
cloudflared tunnel --url http://localhost:8080
```

### Option 3: Using localtunnel (Free, No Sign-up)

```bash
# Install
npm install -g localtunnel

# Tunnel backend
lt --port 8000

# Tunnel frontend
lt --port 8080
```

---

## 📋 Complete Workflow

### Terminal 1: Backend API
```bash
cd /Users/lxfhfut/Dropbox/Work/Start-Up/ai-chat/zeneAI/ai-chat-api
python run.py
```

### Terminal 2: Backend Tunnel
```bash
ngrok http 8000
# Copy the HTTPS URL (e.g., https://abc123-ngrok-free.app)
```

### Terminal 3: Frontend Server
```bash
cd /Users/lxfhfut/Dropbox/Work/Start-Up/ai-chat/zeneAI/ai-chat-api
python -m http.server 8080
```

### Terminal 4: Frontend Tunnel (Optional)
```bash
ngrok http 8080
# Copy the HTTPS URL (e.g., https://xyz789-ngrok-free.app)
```

### Browser Configuration
1. Open the frontend URL
2. Click ⚙️ Settings
3. Enter backend ngrok URL
4. Save and start chatting!

---

## 🔒 Security Notes

### ngrok Free Plan Notes:
- URLs change every time you restart ngrok
- Free plan URLs include "ngrok-free.app" warning page (users click "Visit Site")
- Sessions expire after 2 hours (need to restart)

### For Production:
- Use ngrok paid plan for custom domains
- Or deploy to Vercel/Netlify (frontend) + Railway/Render (backend)
- Add authentication if needed

---

## 🛠️ Troubleshooting

### "Connection refused" error
- Check if backend is running on port 8000
- Check if ngrok is running
- Verify API URL in settings matches ngrok URL

### "CORS error"
- Ensure `CORS_ORIGINS=*` in `.env` file
- Restart backend after changing .env

### ngrok "Session Expired"
- Free plan sessions expire
- Just restart ngrok and update the URL in settings

### "Failed to fetch" error
- Verify backend ngrok URL is HTTPS (not HTTP)
- Check backend is responding: `curl https://your-ngrok-url.ngrok-free.app/`

---

## 💡 Tips

1. **Keep all terminals open** while sharing
2. **Save your ngrok URLs** - you'll need them for configuration
3. **Use HTTPS URLs** from ngrok (not HTTP)
4. **Test yourself first** before sharing with others
5. **Restart ngrok** if the URL stops working (free plan limitation)

---

## 🚀 Quick Test

After setup, test if it works:

1. Visit your frontend URL (local or ngrok)
2. Send a message: "I feel anxious"
3. Check if AI responds
4. Send 2 more messages
5. Click "📊 Generate Report"
6. Verify report is generated

If all works, you're ready to share! 🎉

---

## Need Help?

- ngrok docs: https://ngrok.com/docs
- Check backend logs in Terminal 1
- Check browser console (F12) for errors
- Verify API URL in settings matches your backend tunnel
