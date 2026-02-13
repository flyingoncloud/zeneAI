#!/bin/bash

# Database Export Script
# Exports the PostgreSQL database to a timestamped backup file

set -e

# Configuration
DB_HOST="localhost"
DB_USER="chat_user"
DB_NAME="chat_db"
DB_PASSWORD="chat_pass"
BACKUP_DIR="db_backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/chat_db_backup_${TIMESTAMP}.dump"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting database export...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Export database using PostgreSQL 15
PGPASSWORD="${DB_PASSWORD}" /opt/homebrew/opt/postgresql@15/bin/pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -F c \
  -f "${BACKUP_FILE}"

# Check if export was successful
if [ $? -eq 0 ]; then
  FILE_SIZE=$(ls -lh "${BACKUP_FILE}" | awk '{print $5}')
  echo -e "${GREEN}✓ Database exported successfully!${NC}"
  echo -e "  File: ${BACKUP_FILE}"
  echo -e "  Size: ${FILE_SIZE}"
else
  echo "✗ Database export failed!"
  exit 1
fi
