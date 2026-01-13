#!/bin/bash

# Stop all ZeneAI services

echo "🛑 Stopping all ZeneAI services..."
echo ""

# Kill backend
BACKEND_PIDS=$(ps aux | grep "python run.py" | grep -v grep | awk '{print $2}')
if [ -n "$BACKEND_PIDS" ]; then
    echo "Stopping backend (PIDs: $BACKEND_PIDS)..."
    kill $BACKEND_PIDS 2>/dev/null
    echo "   ✅ Backend stopped"
else
    echo "   ℹ️  No backend running"
fi

# Kill ngrok
NGROK_PIDS=$(ps aux | grep "ngrok http" | grep -v grep | awk '{print $2}')
if [ -n "$NGROK_PIDS" ]; then
    echo "Stopping ngrok (PIDs: $NGROK_PIDS)..."
    kill $NGROK_PIDS 2>/dev/null
    echo "   ✅ ngrok stopped"
else
    echo "   ℹ️  No ngrok running"
fi

# Kill HTTP server
HTTP_PIDS=$(ps aux | grep "python3 -m http.server 8080" | grep -v grep | awk '{print $2}')
if [ -n "$HTTP_PIDS" ]; then
    echo "Stopping HTTP server (PIDs: $HTTP_PIDS)..."
    kill $HTTP_PIDS 2>/dev/null
    echo "   ✅ HTTP server stopped"
else
    echo "   ℹ️  No HTTP server running"
fi

echo ""
echo "✅ All services stopped!"
echo ""
echo "To start again, run: ./start_tunneled.sh"
