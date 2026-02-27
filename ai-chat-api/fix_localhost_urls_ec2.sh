#!/bin/bash

# Fix Localhost URLs on EC2 Production
# This script:
# 1. Fixes localhost URLs in PostgreSQL database
# 2. Pulls latest frontend code
# 3. Rebuilds and restarts the frontend

set -e  # Exit on error

echo "=========================================="
echo "Fix Localhost URLs - EC2 Production"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection (adjust if needed)
DB_URL="postgresql://chat_user:chat_pass@localhost:5432/chat_db"

echo -e "${YELLOW}Step 1: Check current localhost URLs in database${NC}"
echo "Checking media_url field..."
psql "$DB_URL" -c "SELECT COUNT(*) as media_url_localhost FROM assessment_questions WHERE media_url LIKE '%localhost%';"

echo ""
echo "Checking options field..."
psql "$DB_URL" -c "SELECT COUNT(*) as options_localhost FROM assessment_questions WHERE options::text LIKE '%localhost%';"

echo ""
echo -e "${YELLOW}Step 2: Fix localhost URLs in database${NC}"
echo "Fixing media_url field..."
psql "$DB_URL" -c "UPDATE assessment_questions SET media_url = REPLACE(media_url, 'http://localhost:8000', '') WHERE media_url LIKE '%localhost%';"

echo ""
echo "Fixing options field..."
psql "$DB_URL" -c "UPDATE assessment_questions SET options = REPLACE(options::text, 'http://localhost:8000', '')::jsonb WHERE options::text LIKE '%localhost%';"

echo ""
echo -e "${GREEN}✓ Database URLs fixed${NC}"

echo ""
echo -e "${YELLOW}Step 3: Verify all localhost URLs are gone${NC}"
psql "$DB_URL" -c "SELECT COUNT(*) as remaining_localhost FROM assessment_questions WHERE media_url LIKE '%localhost%' OR options::text LIKE '%localhost%';"

echo ""
echo -e "${YELLOW}Step 4: Pull latest frontend code${NC}"
cd /app/zeneAI/zeneme-next
git pull origin main

echo ""
echo -e "${YELLOW}Step 5: Rebuild frontend${NC}"
npm run build

echo ""
echo -e "${YELLOW}Step 6: Restart frontend with PM2${NC}"
pm2 restart zeneme-next

echo ""
echo -e "${GREEN}=========================================="
echo "✓ All fixes applied successfully!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test the admin panel at: https://www.zenewe.ai/admin"
echo "2. Check that images display with production URLs"
echo "3. Verify Question 4 images load correctly"
echo ""
