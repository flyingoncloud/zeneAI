# EC2 Setup Guide - Amazon Linux 2023

Complete guide for setting up ZeneAI backend on Amazon Linux 2023 EC2 instance.

## System Information

- **OS:** Amazon Linux 2023 (AL2023)
- **Architecture:** x86_64
- **Region:** ap-southeast-2 (Sydney)
- **Database:** PostgreSQL 16
- **Python:** 3.10+ (via Miniconda)
- **Node.js:** 18.20.8+ (18.x LTS recommended, 20.x+ also supported)

---

## Table of Contents

1. [Initial System Setup](#1-initial-system-setup)
2. [Install PostgreSQL 16](#2-install-postgresql-16)
3. [Install PostgreSQL Client (psql)](#3-install-postgresql-client-psql)
4. [Install Python Environment](#4-install-python-environment)
5. [Install Node.js](#5-install-nodejs)
6. [Clone Repository](#6-clone-repository)
7. [Setup Backend](#7-setup-backend)
8. [Setup Frontend](#8-setup-frontend)
9. [Configure Services](#9-configure-services)
   - [Option A: Direct Access (Without Nginx)](#option-a-direct-access-without-nginx)
   - [Option B: Production Setup with Nginx](#option-b-production-setup-with-nginx-recommended)
10. [Database Management](#10-database-management)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Initial System Setup

### Update System Packages

```bash
# Update all packages
sudo dnf update -y

# Install essential build tools
sudo dnf groupinstall "Development Tools" -y

# Install common utilities
# Note: curl-minimal is already installed on AL2023, which provides curl command
sudo dnf install -y git wget vim htop

# If you need the full curl package (optional), use:
# sudo dnf install -y curl --allowerasing
```

### Configure Timezone

```bash
# Set timezone to your region (example: Sydney)
sudo timedatectl set-timezone Australia/Sydney

# Verify
timedatectl
```

### Configure Firewall (if using firewalld)

```bash
# Check firewall status
sudo systemctl status firewalld

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow custom ports (backend: 8000, frontend: 3000)
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp

# Reload firewall
sudo firewall-cmd --reload
```

---

## 2. Install PostgreSQL 16

### Install PostgreSQL Server

```bash
# Install PostgreSQL 16
sudo dnf install postgresql16-server postgresql16-contrib -y

# Initialize database cluster
sudo postgresql-setup --initdb

# Start PostgreSQL service
sudo systemctl start postgresql

# Enable PostgreSQL to start on boot
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -i -u postgres

# Access PostgreSQL prompt
psql

# Create database and user with proper permissions
CREATE DATABASE chat_db;
CREATE USER chat_user WITH PASSWORD 'chat_pass';

# Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;

# Connect to the database
\c chat_db

# Grant schema permissions (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO chat_user;
GRANT CREATE ON SCHEMA public TO chat_user;

# Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO chat_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO chat_user;

# Make chat_user the owner of the database (recommended)
ALTER DATABASE chat_db OWNER TO chat_user;

# Exit psql
\q

# Exit postgres user
exit
```

### Configure PostgreSQL Authentication

```bash
# Edit pg_hba.conf to configure authentication
sudo vim /var/lib/pgsql/data/pg_hba.conf

# Find and modify the following lines:
# For postgres superuser - use 'peer' for passwordless sudo access
# local   all             postgres                                peer

# For application users - use 'md5' for password authentication
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

# The configuration should look like this:
# TYPE  DATABASE        USER            ADDRESS                 METHOD
# local   all             postgres                                peer
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

**Important:** Using `peer` authentication for the `postgres` user allows you to run `sudo -u postgres psql` without a password, which is the standard and most secure way to perform PostgreSQL administration on Linux.

### Configure PostgreSQL to Listen on All Interfaces (Optional)

```bash
# Edit postgresql.conf
sudo vim /var/lib/pgsql/data/postgresql.conf

# Find and uncomment/modify:
# listen_addresses = '*'

# Update pg_hba.conf to allow remote connections (if needed)
sudo vim /var/lib/pgsql/data/pg_hba.conf

# Add line for remote access (replace with your IP range):
# host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 3. Install PostgreSQL Client (psql)

The PostgreSQL client is included with the server installation, but you can verify:

```bash
# Verify psql installation
psql --version

# Expected output: psql (PostgreSQL) 16.x
```

### Test Database Connection

```bash
# Connect to database
psql -h localhost -U chat_user -d chat_db

# You should see the PostgreSQL prompt:
# chat_db=>

# Test query
SELECT version();

# Exit
\q
```

### Useful psql Commands

```bash
# List all databases
psql -h localhost -U chat_user -d chat_db -c "\l"

# List all tables in chat_db
psql -h localhost -U chat_user -d chat_db -c "\dt"

# Check table schema
psql -h localhost -U chat_user -d chat_db -c "\d assessment_questionnaires"

# Count records in a table
psql -h localhost -U chat_user -d chat_db -c "SELECT COUNT(*) FROM assessment_questionnaires;"

# Check for duplicate questionnaires
psql -h localhost -U chat_user -d chat_db -c "SELECT section, COUNT(*) as count FROM assessment_questionnaires GROUP BY section HAVING COUNT(*) > 1;"
```

---

## 4. Install Python Environment

### Install Miniconda

```bash
# Download Miniconda installer
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh

# Run installer
bash Miniconda3-latest-Linux-x86_64.sh

# Follow prompts:
# - Press Enter to review license
# - Type 'yes' to accept
# - Press Enter to confirm location
# - Type 'yes' to initialize conda

# Reload shell configuration
source ~/.bashrc

# Verify installation
conda --version
```

### Create Python Environment for Backend

```bash
# Create environment with Python 3.10
conda create -n ai-chat-api python=3.10 -y

# Activate environment
conda activate ai-chat-api

# Verify Python version
python --version
```

---

## 5. Install Node.js

### Install Required Dependencies

Node.js requires the `libatomic` library on Amazon Linux 2023:

```bash
# Install libatomic (required for Node.js)
sudo dnf install -y libatomic

# Verify library is installed
ldconfig -p | grep libatomic
```

### Check if Node.js is Already Installed

```bash
# Check Node.js version
node --version

# Check npm version
npm --version
```

Amazon Linux 2023 typically comes with Node.js 18.x pre-installed, which is perfect for the ZeneAI frontend.

### Install Node.js 18.x LTS (if not already installed)

```bash
# Install from Amazon Linux repos (provides Node.js 18.x LTS)
sudo dnf install nodejs -y

# Verify installation
node --version
npm --version

# Expected output: v18.20.8 or similar
```

### Alternative: Upgrade to Node.js 20.x or 25.x (Optional)

If you want to use a newer version:

**Using NVM (Node Version Manager) - Recommended for version control:**

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js 20.x LTS
nvm install 20

# Or install Node.js 25.x (latest)
# nvm install 25

# Set as default
nvm use 20
nvm alias default 20

# Verify installation
node --version
npm --version
```

**Using NodeSource Repository:**

```bash
# For Node.js 20 LTS:
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs -y

# For Node.js 25.x (latest):
# curl -fsSL https://rpm.nodesource.com/setup_25.x | sudo bash -
# sudo dnf install nodejs -y

# Verify installation
node --version
npm --version
```

**Note:** The ZeneAI frontend (Next.js 14) is fully compatible with Node.js 18.x LTS. Node.js 18.20.8 is stable and recommended for production use. Upgrading to 20.x or 25.x is optional.

### Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

---

## 6. Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/flyingoncloud/zeneAI.git

# Navigate to project
cd zeneAI

# Checkout the correct branch
git checkout ai-chat-api-v2
```

---

## 7. Setup Backend

### Install Python Dependencies

```bash
# Navigate to backend directory
cd ~/zeneAI/ai-chat-api

# Activate conda environment
conda activate ai-chat-api

# Install dependencies
pip install -r requirements.txt
```

### Configure Environment Variables

```bash
# Create .env file
vim .env

# Add the following (replace with your actual values):
```

```env
# Database Configuration
DATABASE_URL=postgresql://chat_user:your_secure_password_here@localhost:5432/chat_db

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://your-domain.com,https://your-domain.com

# AI Configuration
AI_RESPONSE_LANGUAGE=chinese
AI_FORCE_LANGUAGE=true
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
AI_PRESENCE_PENALTY=0.0
AI_FREQUENCY_PENALTY=0.0
```

### Initialize Database

```bash
# Run database initialization script
bash setup_database.sh

# Or manually:
python init_database.py
```

### Clean Up Duplicate Questionnaires (if needed)

```bash
# Run cleanup script
python cleanup_duplicate_questionnaires.py
```

### Test Backend

```bash
# Run backend manually to test
python run.py

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete

# Test in another terminal:
curl http://localhost:8000/

# Expected response:
# {"message":"AI Chat API with Natural Module Recommendations","version":"2.0.0",...}

# Stop with Ctrl+C
```

---

## 8. Setup Frontend

### Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd ~/zeneAI/zeneme-next

# Install dependencies
npm install
```

### Configure Environment Variables

```bash
# Create .env.local file
vim .env.local

# Add the following:
```

```env
NEXT_PUBLIC_API_URL=http://your-ec2-public-ip:8000
```

### Build Frontend

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# You should see:
# ▲ Next.js 14.x
# - Local:        http://localhost:3000
```

---

## 9. Configure Services

### Option A: Direct Access (Without Nginx)

Use this for testing or if you don't need a domain name.

#### Create Systemd Service for Backend

```bash
# Create service file
sudo vim /etc/systemd/system/zeneai-backend.service
```

```ini
[Unit]
Description=ZeneAI Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/zeneAI/ai-chat-api
Environment="PATH=/home/ec2-user/miniconda3/envs/ai-chat-api/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/ec2-user/miniconda3/envs/ai-chat-api/bin/python run.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable zeneai-backend

# Start service
sudo systemctl start zeneai-backend

# Check status
sudo systemctl status zeneai-backend

# View logs
sudo journalctl -u zeneai-backend -f
```

### Setup Frontend with PM2

```bash
# Navigate to frontend directory
cd ~/zeneAI/zeneme-next

# Start with PM2
pm2 start npm --name "zeneai-frontend" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Follow the command output to complete setup
```

### PM2 Management Commands

```bash
# List all processes
pm2 list

# View logs
pm2 logs zeneai-frontend

# Restart
pm2 restart zeneai-frontend

# Stop
pm2 stop zeneai-frontend

# Delete
pm2 delete zeneai-frontend
```

---

### Option B: Production Setup with Nginx (Recommended)

Use this when you have a domain name and want SSL/HTTPS support.

#### Install Nginx

```bash
# Install Nginx
sudo dnf install nginx -y

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t
```

#### Configure Nginx as Reverse Proxy

Create Nginx configuration for your domain:

```bash
# Create configuration file
sudo vim /etc/nginx/conf.d/zeneai.conf
```

Add the following configuration (replace `your-domain.com` with your actual domain):

```nginx
# Redirect HTTP to HTTPS (will be enabled after SSL setup)
# server {
#     listen 80;
#     server_name your-domain.com www.your-domain.com;
#     return 301 https://$server_name$request_uri;
# }

# HTTP configuration (temporary, before SSL)
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }

    # Backend root endpoint
    location = / {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files and uploads
    location /uploads {
        proxy_pass http://localhost:8000/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Increase upload size limit
    client_max_body_size 50M;
}
```

**Test and reload Nginx:**

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

#### Update Frontend Environment Variable

Update the frontend to use the domain instead of direct port access:

```bash
# Edit frontend .env.local
cd ~/zeneAI/zeneme-next
vim .env.local

# Change from:
# NEXT_PUBLIC_API_URL=http://your-ec2-public-ip:8000

# To:
# NEXT_PUBLIC_API_URL=https://your-domain.com/api
# Or for HTTP (before SSL):
# NEXT_PUBLIC_API_URL=http://your-domain.com/api
```

Rebuild and restart frontend:

```bash
npm run build
pm2 restart zeneai-frontend
```

#### Configure Firewall for Nginx

```bash
# Allow HTTP and HTTPS through firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

#### Update AWS Security Group

In AWS Console, update your EC2 security group:
- Add inbound rule: HTTP (port 80) from 0.0.0.0/0
- Add inbound rule: HTTPS (port 443) from 0.0.0.0/0
- Optional: Remove direct access to ports 3000 and 8000 for security

#### Install SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo dnf install certbot python3-certbot-nginx -y

# Obtain SSL certificate (replace with your domain and email)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --email your-email@example.com --agree-tos --no-eff-email

# Test automatic renewal
sudo certbot renew --dry-run

# Certbot will automatically:
# 1. Obtain SSL certificate
# 2. Update Nginx configuration
# 3. Set up automatic renewal
```

After SSL installation, Certbot will automatically update your Nginx configuration to:
- Redirect HTTP to HTTPS
- Enable SSL on port 443
- Configure SSL certificates

**Verify SSL is working:**

```bash
# Check Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Test HTTPS
curl -I https://your-domain.com
```

#### Nginx Management Commands

```bash
# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log

# Test configuration
sudo nginx -t
```

---

## 10. Database Management

### Backup Database

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
pg_dump -h localhost -U chat_user -d chat_db > ~/backups/chat_db_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
pg_dump -h localhost -U chat_user -d chat_db | gzip > ~/backups/chat_db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Restore from backup
psql -h localhost -U chat_user -d chat_db < ~/backups/chat_db_20250126_120000.sql

# Restore from compressed backup
gunzip -c ~/backups/chat_db_20250126_120000.sql.gz | psql -h localhost -U chat_user -d chat_db
```

### Database Maintenance

```bash
# Vacuum database (reclaim storage)
psql -h localhost -U chat_user -d chat_db -c "VACUUM ANALYZE;"

# Check database size
psql -h localhost -U chat_user -d chat_db -c "SELECT pg_size_pretty(pg_database_size('chat_db'));"

# Check table sizes
psql -h localhost -U chat_user -d chat_db -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Clean Up Duplicate Questionnaires

```bash
# Navigate to backend directory
cd ~/zeneAI/ai-chat-api

# Activate environment
conda activate ai-chat-api

# Run cleanup script
python cleanup_duplicate_questionnaires.py

# Or use psql directly
psql -h localhost -U chat_user -d chat_db -c "
SELECT q1.id, q1.section, q1.title
FROM assessment_questionnaires q1
WHERE EXISTS (
    SELECT 1 FROM assessment_questionnaires q2
    WHERE q2.section = q1.section AND q2.id < q1.id
);"
```

---

## 11. Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u zeneai-backend -n 50

# Check if port 8000 is in use
sudo lsof -i :8000

# Check Python environment
conda activate ai-chat-api
python --version
pip list | grep -i fastapi

# Test database connection
psql -h localhost -U chat_user -d chat_db -c "SELECT 1;"
```

### Frontend Not Starting

```bash
# Check PM2 logs
pm2 logs zeneai-frontend

# Check if port 3000 is in use
sudo lsof -i :3000

# Rebuild frontend
cd ~/zeneAI/zeneme-next
npm run build
pm2 restart zeneai-frontend
```

### Node.js Missing libatomic Library

```bash
# If you see "error while loading shared libraries: libatomic.so.1"
# Install the missing library
sudo dnf install -y libatomic

# Verify Node.js works
node --version
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log

# Test connection
psql -h localhost -U chat_user -d chat_db

# Check pg_hba.conf
sudo cat /var/lib/pgsql/data/pg_hba.conf | grep -v "^#"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Database Permission Issues

**Error: "permission denied for schema public"**

This occurs when the database user doesn't have permission to create tables in the public schema. Fix it with:

```bash
# Connect as postgres superuser
sudo -u postgres psql

# Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;

# Connect to the database
\c chat_db

# Grant schema permissions
GRANT ALL ON SCHEMA public TO chat_user;
GRANT CREATE ON SCHEMA public TO chat_user;

# Grant permissions on all existing tables (if any)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chat_user;

# Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO chat_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO chat_user;

# Make chat_user the owner of the database (recommended)
ALTER DATABASE chat_db OWNER TO chat_user;

# Exit psql
\q
```

**If `sudo -u postgres psql` asks for a password:**

This means `pg_hba.conf` is configured to require password authentication even for local connections. Fix it:

```bash
# Edit pg_hba.conf
sudo vim /var/lib/pgsql/data/pg_hba.conf

# Find the line:
# local   all             postgres                                md5

# Change it to:
# local   all             postgres                                peer

# Save and restart PostgreSQL
sudo systemctl restart postgresql

# Now this should work without a password:
sudo -u postgres psql
```

**Verify permissions:**

```bash
# Connect as chat_user
psql -h localhost -U chat_user -d chat_db

# Check schema permissions
\dn+

# Try creating a test table
CREATE TABLE test_permissions (id SERIAL PRIMARY KEY, name VARCHAR(50));

# If successful, drop the test table
DROP TABLE test_permissions;

# Exit
\q
```

**Alternative: Recreate database with correct ownership:**

If the above doesn't work, recreate the database:

```bash
# Connect as postgres
sudo -u postgres psql

# Drop existing database (WARNING: This deletes all data!)
DROP DATABASE IF EXISTS chat_db;

# Recreate database with chat_user as owner
CREATE DATABASE chat_db OWNER chat_user;

# Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;

# Exit
\q

# Now reinitialize the database
cd ~/zeneAI/ai-chat-api
conda activate ai-chat-api
python init_database.py
```

### Permission Issues

```bash
# Fix file permissions
cd ~/zeneAI
chmod +x ai-chat-api/setup_database.sh
chmod +x ai-chat-api/run.py

# Fix ownership
sudo chown -R ec2-user:ec2-user ~/zeneAI
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Check largest directories
du -h --max-depth=1 /home/ec2-user | sort -hr

# Clean up old logs
sudo journalctl --vacuum-time=7d

# Clean up conda cache
conda clean --all -y

# Clean up npm cache
npm cache clean --force
```

### Package Conflicts (curl/curl-minimal)

```bash
# If you encounter curl-minimal conflicts during installation:
# Amazon Linux 2023 comes with curl-minimal pre-installed
# This provides the curl command and is sufficient for most use cases

# Verify curl is available
curl --version

# If you need the full curl package with additional features:
sudo dnf install -y curl --allowerasing

# Or skip curl installation entirely (curl-minimal is already present)
sudo dnf install -y git wget vim htop
```

### Nginx Issues

```bash
# Nginx not starting
sudo systemctl status nginx
sudo journalctl -u nginx -n 50

# Check Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Port 80/443 already in use
sudo lsof -i :80
sudo lsof -i :443

# Restart Nginx
sudo systemctl restart nginx

# SELinux blocking Nginx (if applicable)
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_can_network_relay 1
```

### SSL Certificate Issues

```bash
# Certbot certificate renewal failed
sudo certbot renew --dry-run

# Check certificate status
sudo certbot certificates

# Manually renew certificate
sudo certbot renew

# Force certificate renewal
sudo certbot renew --force-renewal

# Check certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### DNS and Domain Issues

```bash
# Check if domain resolves to EC2 IP
nslookup your-domain.com
dig your-domain.com

# Check if Elastic IP is attached
curl ifconfig.me

# Test domain accessibility
curl -I http://your-domain.com
curl -I https://your-domain.com
```

---

## Quick Reference Commands

### Service Management

```bash
# Backend
sudo systemctl start zeneai-backend
sudo systemctl stop zeneai-backend
sudo systemctl restart zeneai-backend
sudo systemctl status zeneai-backend

# Frontend
pm2 start zeneai-frontend
pm2 stop zeneai-frontend
pm2 restart zeneai-frontend
pm2 logs zeneai-frontend

# PostgreSQL
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

### Database Quick Commands

```bash
# Connect to database
psql -h localhost -U chat_user -d chat_db

# List tables
psql -h localhost -U chat_user -d chat_db -c "\dt"

# Count questionnaires
psql -h localhost -U chat_user -d chat_db -c "SELECT COUNT(*) FROM assessment_questionnaires;"

# Check for duplicates
psql -h localhost -U chat_user -d chat_db -c "SELECT section, COUNT(*) FROM assessment_questionnaires GROUP BY section HAVING COUNT(*) > 1;"
```

### Log Viewing

```bash
# Backend logs
sudo journalctl -u zeneai-backend -f

# Frontend logs
pm2 logs zeneai-frontend

# PostgreSQL logs
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log

# System logs
sudo journalctl -f
```

---

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates (Let's Encrypt)
- [ ] Configure CORS properly
- [ ] Set strong OpenAI API key
- [ ] Enable automatic security updates
- [ ] Set up log rotation
- [ ] Configure backup automation
- [ ] Restrict SSH access (key-based only)
- [ ] Set up monitoring and alerts

---

## Next Steps

1. **Configure Domain and SSL** ✓ (Completed in Section 9 - Option B)
   - Point domain to EC2 Elastic IP
   - Install Nginx as reverse proxy
   - Set up Let's Encrypt SSL certificates

2. **Set Up Monitoring**
   - Install CloudWatch agent
   - Configure application monitoring
   - Set up alerts for errors and downtime

3. **Automate Backups**
   - Create cron job for database backups
   - Set up S3 backup storage
   - Test restore procedures

4. **Performance Optimization**
   - Configure PostgreSQL for production
   - Set up Redis for caching
   - Optimize frontend build
   - Enable Nginx caching

---

## Support

For issues or questions:
- Check logs first (backend, frontend, database)
- Review troubleshooting section
- Check GitHub issues: https://github.com/flyingoncloud/zeneAI/issues
- Consult deployment documentation in `docs/deployment/`

---

**Last Updated:** January 26, 2025
**Version:** 2.0.0
**Tested On:** Amazon Linux 2023, PostgreSQL 16, Python 3.10, Node.js 18.20.8 LTS, Nginx 1.24+
