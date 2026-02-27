#!/bin/bash
# Fix .env.local file and rebuild Next.js app
# Run this on EC2 server

set -e  # Exit on error

echo "=========================================="
echo "Fixing .env.local and rebuilding Next.js"
echo "=========================================="
echo ""

# Navigate to Next.js directory
cd ~/zeneme-next || cd /home/ec2-user/zeneme-next || {
    echo "ERROR: Could not find zeneme-next directory"
    echo "Please run this script from the correct location"
    exit 1
}

echo "Current directory: $(pwd)"
echo ""

# Backup existing .env.local
if [ -f .env.local ]; then
    echo "Backing up existing .env.local..."
    cp .env.local .env.local.backup
    echo "✓ Backup created: .env.local.backup"
fi

# Create clean .env.local file with proper newline
echo "Creating clean .env.local file..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://www.zenewe.ai
NEXT_PUBLIC_PRODUCTION_MODE=true
EOF

echo "✓ .env.local created"
echo ""

# Verify file contents
echo "Verifying .env.local contents:"
echo "---"
cat .env.local
echo "---"
echo ""

# Clean previous build
echo "Cleaning previous build..."
rm -rf .next
echo "✓ .next directory removed"
echo ""

# Rebuild
echo "Building Next.js app (this may take a few minutes)..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Build completed successfully"
    echo ""

    # Verify the build contains the correct URL
    echo "Verifying build contains production URL..."
    if grep -r "zenewe.ai" .next/static/chunks/ > /dev/null 2>&1; then
        echo "✓ Production URL found in build"
    else
        echo "⚠ WARNING: Production URL not found in build"
    fi

    if grep -r "localhost:8000" .next/static/chunks/ > /dev/null 2>&1; then
        echo "⚠ WARNING: localhost:8000 still found in build"
    else
        echo "✓ No localhost:8000 found in build"
    fi
    echo ""

    # Restart PM2
    echo "Restarting PM2 process..."
    pm2 restart zeneme-next

    if [ $? -eq 0 ]; then
        echo "✓ PM2 restarted successfully"
        echo ""
        echo "=========================================="
        echo "Deployment complete!"
        echo "=========================================="
        echo ""
        echo "Next steps:"
        echo "1. Open https://www.zenewe.ai in your browser"
        echo "2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
        echo "3. Upload an image and check the URL"
        echo "4. It should be: https://www.zenewe.ai/uploads/..."
        echo ""
        echo "To check logs:"
        echo "  pm2 logs zeneme-next --lines 50"
    else
        echo "✗ Failed to restart PM2"
        exit 1
    fi
else
    echo ""
    echo "✗ Build failed"
    echo "Check the error messages above"
    exit 1
fi
