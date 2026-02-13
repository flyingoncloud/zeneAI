#!/bin/bash

# Database Import Script
# Imports a PostgreSQL database backup file

set -e

# Configuration
DB_HOST="localhost"
DB_USER="chat_user"
DB_NAME="chat_db"
DB_PASSWORD="chat_pass"
BACKUP_DIR="db_backup"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect OS and set pg_restore path
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  PG_RESTORE="/opt/homebrew/opt/postgresql@15/bin/pg_restore"
  if [ ! -f "$PG_RESTORE" ]; then
    PG_RESTORE="pg_restore"  # Fallback to system pg_restore
  fi
else
  # Linux
  PG_RESTORE="pg_restore"
fi

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No backup file specified${NC}"
  echo ""
  echo "Usage: ./import_database.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -lh "${BACKUP_DIR}"/*.dump 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
  exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will replace all data in the database!${NC}"
echo -e "Database: ${DB_NAME}"
echo -e "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Import cancelled."
  exit 0
fi

echo -e "${YELLOW}Starting database import...${NC}"

# Import database
# -c flag: clean (drop) database objects before recreating them
PGPASSWORD="${DB_PASSWORD}" "${PG_RESTORE}" \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -c \
  --if-exists \
  "${BACKUP_FILE}"

# Check if import was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Database imported successfully!${NC}"
else
  echo -e "${RED}✗ Database import failed!${NC}"
  exit 1
fi
