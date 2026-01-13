# 🚀 Quick Start - Share test_framework_web.html

Perfect for **ngrok free plan** (one tunnel only)!

## Super Simple (3 Steps!)

### 1. Install & Configure ngrok (one-time)

```bash
# Install ngrok
brew install ngrok

# Get your authtoken:
# 1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
# 2. Copy your token
# 3. Run:
ngrok config add-authtoken YOUR_TOKEN_FROM_DASHBOARD
```

### 2. Run the script

```bash
cd /Users/lxfhfut/Dropbox/Work/Start-Up/ai-chat/zeneAI
./start_tunneled.sh
```

### 3. Share with others!

The script will show you exactly what to share. Two options:

**Option 1 (Easiest):** Email them the HTML file + backend URL
**Option 2:** Upload HTML to a website + share backend URL

---

## What You'll See

```bash
$ ./start_tunneled.sh

🌐 ZeneAI Psychology Tester - Sharing Setup
==============================================

1️⃣  Starting FastAPI backend on port 8000...
   ✅ Backend running

2️⃣  Creating ngrok tunnel for backend...
   ✅ Backend tunnel created
   🔗 https://abc123.ngrok-free.app

3️⃣  Starting local web server on port 8080...
   ✅ Local server running

==============================================
✨ READY TO SHARE!
==============================================

📤 HOW TO SHARE (2 OPTIONS):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION 1: Send them the HTML file (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Share this file with them:
   📄 ai-chat-api/test_framework_web.html

2️⃣  Give them this backend URL:
   🔗 https://abc123.ngrok-free.app

3️⃣  Tell them to:
   • Open test_framework_web.html in browser
   • Click ⚙️ button (top-right)
   • Paste backend URL
   • Click 'Save'
   • Start chatting!
```

---

## How to Share

### Option 1: Email/Slack the HTML File ⭐ Recommended

**What to send:**
1. Attach `test_framework_web.html` file
2. Include this message:

```
Hi! Try out this AI Psychology Tester:

1. Open the attached test_framework_web.html in your browser
2. Click the ⚙️ button (top-right corner)
3. Enter this API URL: https://abc123.ngrok-free.app
   (replace with your actual ngrok URL)
4. Click 'Save'
5. Start chatting!

You can generate psychological reports after 3+ messages.
```

### Option 2: Host HTML Somewhere

Upload `test_framework_web.html` to:
- **GitHub Pages** (free, easy)
- **Netlify** (free, drag & drop)
- **Vercel** (free, drag & drop)
- **Your own website**
- **Dropbox Public** folder

Then share:
```
Check out: https://your-site.com/test_framework_web.html
Configure API: https://abc123.ngrok-free.app
```

---

## Test Checklist (Before Sharing)

After running the script, test locally:

- [ ] Open `http://localhost:8080/test_framework_web.html`
- [ ] Click ⚙️ Settings
- [ ] Paste backend URL (shown in script output)
- [ ] Click Save
- [ ] Send message: "I feel anxious"
- [ ] Verify AI responds
- [ ] Send 2 more messages (total 3+)
- [ ] Click "📊 Generate Report"
- [ ] Verify report opens with all 5 dimensions

✅ All working? Now share it!

---

## Quick GitHub Pages Upload (Free Hosting!)

If you want to host the HTML file:

```bash
cd /Users/lxfhfut/Dropbox/Work/Start-Up/ai-chat/zeneAI

# Create a new repo on GitHub, then:
git init
git add ai-chat-api/test_framework_web.html
git commit -m "Add psychology tester"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# Enable GitHub Pages:
# Go to repo Settings → Pages → Source: main branch
# Your URL: https://YOUR_USERNAME.github.io/YOUR_REPO/test_framework_web.html
```

Then share: `https://YOUR_USERNAME.github.io/YOUR_REPO/test_framework_web.html`

Tell users to configure API to your ngrok URL!

---

## Important: ngrok Free Plan Notes

✅ **What works:**
- One tunnel (backend) - Perfect!
- 40 connections/minute
- Works great for testing with friends

⚠️ **Limitations:**
- URL changes each restart
- 2-hour session timeout
- "Visit Site" warning page (users just click through)

💡 **For longer sharing:**
- Pay for ngrok (custom domains)
- Or use Cloud deployment (Render, Railway, etc.)

---

## Troubleshooting

### "Failed to create ngrok tunnel"
```bash
# Check if authenticated:
ngrok config add-authtoken YOUR_TOKEN

# Kill existing ngrok:
pkill ngrok
./start_tunneled.sh
```

### "Connection refused" in browser
1. Check script is still running
2. Verify API URL in ⚙️ Settings matches backend URL
3. Try backend URL directly (should show API info)

### "CORS error"
Check `.env` file has:
```
CORS_ORIGINS=*
```
Restart the script after changing.

### Report generation fails
- Need 3+ messages in conversation
- Check OpenAI API key in `.env`
- Check backend logs: `tail /tmp/zeneai_backend.log`

---

## What Users Can Do

✅ Chat with psychology-informed AI
✅ See real-time pattern detection
✅ Generate comprehensive reports
✅ Download reports as Markdown
✅ Private sessions (separate for each user)

❌ Cannot see other users' conversations
❌ Cannot access your files or API keys

---

## Stop Sharing

Just press `Ctrl+C` in the terminal!

All services stop automatically.

---

## Example User Instructions

Copy this and send to your users:

```
🧠 ZeneAI Psychology Tester

1. Open the attached test_framework_web.html file in your browser
   (or visit: [your hosted URL if you uploaded it])

2. Click the ⚙️ Settings button in the top-right corner

3. Enter this API URL:
   https://[YOUR_NGROK_URL].ngrok-free.app

4. Click 'Save'

5. Start chatting! The AI will detect psychological patterns.

6. After 3+ messages, click "📊 Generate Report" for a detailed
   analysis across 5 psychological dimensions:
   • Emotional Awareness
   • Cognitive Patterns
   • Relational Patterns
   • Personality Types
   • IFS (Internal Family Systems)

Each dimension has a confidence score showing data reliability.
Low confidence = need more conversation for accurate analysis.

Note: This is for exploration only, not professional diagnosis.
```

---

## Next Steps

Want to make it permanent?
- Deploy backend to Railway/Render (free tier)
- Host HTML on GitHub Pages/Netlify
- Get custom domain
- No more ngrok restarts!

For now, this script works great for testing with friends! 🎉
