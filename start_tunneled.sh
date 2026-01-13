#!/bin/bash

# ZeneAI - Simple Tunneling Script (ngrok free plan friendly)
# Tunnels backend only, share HTML file directly

echo "🌐 ZeneAI Psychology Tester - Sharing Setup"
echo "=============================================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed!"
    echo ""
    echo "Install it with:"
    echo "  brew install ngrok"
    echo ""
    echo "Then configure your authtoken:"
    echo "  1. Sign up at https://ngrok.com"
    echo "  2. Get token from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "  3. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    exit 1
fi

echo "✅ ngrok is installed"
echo ""

# Get the directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$SCRIPT_DIR/ai-chat-api"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    jobs -p | xargs kill 2>/dev/null
    echo "   🧹 Cleaning up temporary files..."
    rm "$SCRIPT_DIR/shared_chat_interface.html" 2>/dev/null
    exit 0
}
trap cleanup EXIT INT TERM

echo "Starting services..."
echo ""

# 1. Start Backend
echo "1️⃣  Starting FastAPI backend on port 8000..."
cd "$API_DIR"
python3 run.py > /tmp/zeneai_backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Failed to start backend"
    echo "   Check logs: tail /tmp/zeneai_backend.log"
    exit 1
fi
echo "   ✅ Backend running (PID: $BACKEND_PID)"
echo ""

# 2. Tunnel Backend
echo "2️⃣  Creating ngrok tunnel for backend..."
ngrok http 8000 --log=stdout > /tmp/ngrok_backend.log 2>&1 &
NGROK_PID=$!
sleep 4

# Get backend URL
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Failed to create ngrok tunnel"
    echo ""
    echo "Please check:"
    echo "  1. Is ngrok authenticated? Run: ngrok config add-authtoken YOUR_TOKEN"
    echo "  2. Check ngrok logs: tail /tmp/ngrok_backend.log"
    echo ""
    exit 1
fi

echo "   ✅ Backend tunnel created"
echo "   🔗 $BACKEND_URL"
echo ""

# 3. Create Sharable HTML
echo "3️⃣  Creating sharable HTML file with tunnel URL..."

# Read the original HTML, inject the backend URL, and save to a new file
sed "s|const API_BASE = 'http://localhost:8000';|const API_BASE = '$BACKEND_URL';|" "$SCRIPT_DIR/test_chat_interface.html" > "$SCRIPT_DIR/shared_chat_interface.html"

if [ $? -ne 0 ]; then
    echo "❌ Failed to create shared_chat_interface.html"
    exit 1
fi

echo "   ✅ Created shared_chat_interface.html"
echo ""

# 4. Serve HTML locally (for you to test)
echo "4️⃣  Starting local web server on port 8080..."
# Serve from the main directory to access the new shared file
cd "$SCRIPT_DIR"
python3 -m http.server 8080 > /tmp/zeneai_http.log 2>&1 &
HTTP_PID=$!
sleep 2

if ! ps -p $HTTP_PID > /dev/null; then
    echo "⚠️  Warning: Could not start HTTP server on port 8080"
    echo "   You can still share the HTML file directly"
else
    echo "   ✅ Local server running (PID: $HTTP_PID)"
    echo "   🔗 http://localhost:8080/shared_chat_interface.html"
fi


echo ""
echo "=============================================="
echo "✨ READY TO SHARE!"
echo "=============================================="
echo ""
echo "📤 HOW TO SHARE:"
echo ""
echo "1️⃣  Share this file with them (email, Slack, etc.):"
echo "   📄 $SCRIPT_DIR/shared_chat_interface.html"
echo ""
echo "2️⃣  That's it! They can open the file and start chatting immediately."
echo "   The backend URL is already embedded in the file."
echo ""
echo "=============================================="
echo "🧪 TEST IT YOURSELF FIRST:"
echo "=============================================="
echo ""
if ps -p $HTTP_PID > /dev/null 2>&1; then
    echo "1. Open: http://localhost:8080/shared_chat_interface.html"
else
    echo "1. Open: $SCRIPT_DIR/shared_chat_interface.html"
fi
echo "2. Send a test message and verify it works ✅"
echo ""
echo "=============================================="
echo "📋 CURRENT STATUS:"
echo "=============================================="
echo ""
echo "   Backend API:     $BACKEND_URL"
echo "   Backend Local:   http://localhost:8000"
if ps -p $HTTP_PID > /dev/null 2>&1; then
    echo "   Local Test URL:  http://localhost:8080/shared_chat_interface.html"
fi
echo "   Sharable File:   $SCRIPT_DIR/shared_chat_interface.html"
echo ""
echo "=============================================="
echo ""
echo "💡 TIPS:"
echo "   • Keep this terminal open while sharing"
echo "   • Free plan URLs change each time you restart"
echo "   • Free plan URLs expire after ~2 hours"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Keep running
wait
