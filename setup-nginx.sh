#!/bin/bash
# Setup script for nginx on EC2
# Run this on EC2: bash setup-nginx.sh

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    NGINX SETUP FOR www.zenewe.ai                          ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Please run as regular user (not root)"
    echo "   The script will use sudo when needed"
    exit 1
fi

# Step 1: Check if nginx is installed
echo -e "\n[1/7] Checking nginx installation..."
if command -v nginx &> /dev/null; then
    echo "✓ Nginx is already installed"
    nginx -v
else
    echo "Installing nginx..."
    sudo yum install nginx -y
    echo "✓ Nginx installed"
fi

# Step 2: Backup existing configuration
echo -e "\n[2/7] Backing up existing configuration..."
if [ -f /etc/nginx/conf.d/zenewe.conf ]; then
    sudo cp /etc/nginx/conf.d/zenewe.conf /etc/nginx/conf.d/zenewe.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "✓ Existing config backed up"
else
    echo "✓ No existing config to backup"
fi

# Step 3: Copy nginx configuration
echo -e "\n[3/7] Installing nginx configuration..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "$SCRIPT_DIR/nginx-zenewe.conf" ]; then
    sudo cp "$SCRIPT_DIR/nginx-zenewe.conf" /etc/nginx/conf.d/zenewe.conf
    echo "✓ Configuration copied to /etc/nginx/conf.d/zenewe.conf"
else
    echo "✗ nginx-zenewe.conf not found in current directory"
    echo "  Please ensure nginx-zenewe.conf is in the same directory as this script"
    exit 1
fi

# Step 4: Remove default nginx config if exists
echo -e "\n[4/7] Removing default nginx configuration..."
if [ -f /etc/nginx/conf.d/default.conf ]; then
    sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled
    echo "✓ Default config disabled"
else
    echo "✓ No default config to remove"
fi

# Step 5: Test nginx configuration
echo -e "\n[5/7] Testing nginx configuration..."
if sudo nginx -t; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration has errors"
    echo "  Please check the error messages above"
    exit 1
fi

# Step 6: Enable and start nginx
echo -e "\n[6/7] Starting nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "✗ Nginx failed to start"
    echo "  Check logs with: sudo journalctl -u nginx -n 50"
    exit 1
fi

# Step 7: Verify routing
echo -e "\n[7/7] Verifying routing..."

# Test backend health
echo -n "Testing backend health... "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓"
else
    echo "✗"
    echo "⚠️  Backend is not responding on port 8000"
    echo "   Start backend with: cd ~/zeneAI/ai-chat-api && pm2 restart zeneai-backend"
fi

# Test auth endpoint through nginx
echo -n "Testing auth endpoint through nginx... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/auth/email/send-code \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' 2>/dev/null)

if [ "$response" = "422" ] || [ "$response" = "200" ]; then
    echo "✓ (HTTP $response)"
else
    echo "✗ (HTTP $response)"
    echo "⚠️  Auth endpoint not routing correctly"
fi

echo -e "\n╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                              SETUP COMPLETE                                ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

echo -e "\nNginx is now configured and running!"
echo ""
echo "Next steps:"
echo "1. Ensure backend is running: pm2 status"
echo "2. Ensure frontend is running: pm2 status"
echo "3. Test the site: http://www.zenewe.ai"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status nginx    - Check nginx status"
echo "  sudo systemctl restart nginx   - Restart nginx"
echo "  sudo nginx -t                  - Test configuration"
echo "  sudo tail -f /var/log/nginx/zenewe-error.log  - View error logs"
echo ""
echo "If you need HTTPS (recommended for production):"
echo "  sudo yum install certbot python3-certbot-nginx -y"
echo "  sudo certbot --nginx -d www.zenewe.ai -d zenewe.ai"
echo ""
