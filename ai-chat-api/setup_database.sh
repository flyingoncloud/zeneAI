#!/bin/bash
# Database Setup Script for ZeneAI Chat API
# This script sets up PostgreSQL database and initializes all tables

set -e  # Exit on error

echo "=========================================="
echo "ZeneAI Database Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database configuration (from .env)
DB_NAME="chat_db"
DB_USER="chat_user"
DB_PASSWORD="chat_pass"
DB_HOST="localhost"
DB_PORT="5432"

# Step 1: Check if PostgreSQL is running
echo "Step 1: Checking PostgreSQL status..."
if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "Please start PostgreSQL first:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi

# Step 2: Check if database user exists
echo ""
echo "Step 2: Checking database user..."
if psql -U $USER -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo -e "${YELLOW}⚠ User '$DB_USER' already exists${NC}"
else
    echo "Creating database user '$DB_USER'..."
    psql -U $USER -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" > /dev/null
    echo -e "${GREEN}✓ User '$DB_USER' created${NC}"
fi

# Step 3: Check if database exists
echo ""
echo "Step 3: Checking database..."
if psql -U $USER -d postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠ Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping database '$DB_NAME'..."
        psql -U $USER -d postgres -c "DROP DATABASE $DB_NAME;" > /dev/null
        echo "Creating database '$DB_NAME'..."
        psql -U $USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" > /dev/null
        echo -e "${GREEN}✓ Database '$DB_NAME' recreated${NC}"
    else
        echo "Keeping existing database"
    fi
else
    echo "Creating database '$DB_NAME'..."
    psql -U $USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" > /dev/null
    echo -e "${GREEN}✓ Database '$DB_NAME' created${NC}"
fi

# Step 4: Grant privileges
echo ""
echo "Step 4: Granting privileges..."
psql -U $USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null
psql -U $USER -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" > /dev/null
echo -e "${GREEN}✓ Privileges granted${NC}"

# Step 5: Initialize database tables
echo ""
echo "Step 5: Initializing database tables..."
if [ -f "init_database.py" ]; then
    python init_database.py
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Database tables initialized${NC}"
    else
        echo -e "${RED}✗ Failed to initialize tables${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ init_database.py not found${NC}"
    exit 1
fi

# Step 6: Verify connection
echo ""
echo "Step 6: Verifying database connection..."
if psql -U $DB_USER -d $DB_NAME -h $DB_HOST -c "SELECT current_database(), current_user;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection verified${NC}"
else
    echo -e "${RED}✗ Failed to connect to database${NC}"
    exit 1
fi

# Step 7: Show table count
echo ""
echo "Step 7: Database summary..."
TABLE_COUNT=$(psql -U $DB_USER -d $DB_NAME -h $DB_HOST -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Total tables created: $TABLE_COUNT"

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Database setup completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Database connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "Connection string:"
echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "You can now start the backend with:"
echo "  python run.py"
echo ""
