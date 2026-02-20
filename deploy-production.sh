#!/bin/bash
# Production Deployment Script for www.zeneme.ai
# Run this on your EC2 instance

set -e  # Exit on error

echo "=========================================="
echo "Zeneme AI Production Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Error: Do not run this script as root${NC}"
    exit 1
fi

# Step 1: Update code
echo -e "${YELLOW}Step 1: Updating code from git...${NC}"
cd ~/zeneAI
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# Step 2: Backend setup
echo -e "${YELLOW}Step 2: Setting up backend...${NC}"
cd ~/zeneAI/ai-chat-api

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env from .env.production.example"
    exit 1
fi

# Install Python dependencies
pip install -r requirements.txt --quiet
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Run database migrations if needed
# python -m alembic upgrade head
echo ""

# Step 3: Frontend setup
echo -e "${YELLOW}Step 3: Setting up frontend...${NC}"
cd ~/zeneAI/zeneme-next

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local file not found!${NC}"
    echo "Please create .env.local from .env.local.example"
    exit 1
fi

# Install Node dependencies
npm install --quiet
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Build Next.js
echo "Building Next.js (this may take a minute)..."
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 4: Setup systemd services (if not already done)
echo -e "${YELLOW}Step 4: Setting up systemd services...${NC}"
cd ~/zeneAI

if [ ! -f /etc/systemd/system/zeneme-backend.service ]; then
    echo "Installing backend service..."
    sudo cp systemd/zeneme-backend.service /etc/systemd/system/
    sudo systemctl enable zeneme-backend
    echo -e "${GREEN}✓ Backend service installed${NC}"
else
    echo "Backend service already installed"
fi

if [ ! -f /etc/systemd/system/zeneme-frontend.service ]; then
    echo "Installing frontend service..."
    sudo cp systemd/zeneme-frontend.service /etc/systemd/system/
    sudo systemctl enable zeneme-frontend
    echo -e "${GREEN}✓ Frontend service installed${NC}"
else
    echo "Frontend service already installed"
fi
echo ""

# Step 5: Setup nginx (if not already done)
echo -e "${YELLOW}Step 5: Setting up nginx...${NC}"
if [ ! -f /etc/nginx/sites-available/zeneme ]; then
    echo "Installing nginx config..."
    sudo cp nginx.conf.example /etc/nginx/sites-available/zeneme
    sudo ln -s /etc/nginx/sites-available/zeneme /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default

    # Test nginx config
    sudo nginx -t
    echo -e "${GREEN}✓ Nginx configured${NC}"

    echo ""
    echo -e "${YELLOW}Important: You need to set up SSL certificate!${NC}"
    echo "Run: sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai"
else
    echo "Nginx already configured"
fi
echo ""

# Step 6: Restart services
echo -e "${YELLOW}Step 6: Restarting services...${NC}"
sudo systemctl restart zeneme-backend
sudo systemctl restart zeneme-frontend
sudo systemctl restart nginx
echo -e "${GREEN}✓ All services restarted${NC}"
echo ""

# Step 7: Check status
echo -e "${YELLOW}Step 7: Checking service status...${NC}"
echo ""
echo "Backend status:"
sudo systemctl status zeneme-backend --no-pager | head -n 5
echo ""
echo "Frontend status:"
sudo systemctl status zeneme-frontend --no-pager | head -n 5
echo ""
echo "Nginx status:"
sudo systemctl status nginx --no-pager | head -n 5
echo ""

# Final message
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Your application should now be running at:"
echo "  https://www.zeneme.ai"
echo ""
echo "To check logs:"
echo "  Backend:  sudo journalctl -u zeneme-backend -f"
echo "  Frontend: sudo journalctl -u zeneme-frontend -f"
echo "  Nginx:    sudo tail -f /var/log/nginx/zeneme-error.log"
echo ""
echo "To restart services:"
echo "  sudo systemctl restart zeneme-backend"
echo "  sudo systemctl restart zeneme-frontend"
echo "  sudo systemctl restart nginx"
echo ""
