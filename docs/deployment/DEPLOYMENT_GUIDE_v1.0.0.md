# Deployment Guide - v1.0.0-psychology-report-spec

## Overview

This guide provides step-by-step instructions for deploying ZeneAI with the psychology report generation feature on a new EC2 instance or any fresh environment.

## Tag Information

- **Tag**: `v1.0.0-psychology-report-spec`
- **Branch**: `ai-chat-api-v2`
- **Commit**: `f7fd68ea`
- **Release Date**: January 25, 2026

## What's Included

This release includes:
- ✅ Complete psychology report generation specification (14 user stories)
- ✅ Automated database setup scripts
- ✅ Markdown report generator implementation
- ✅ DOCX report generation with Chinese font support
- ✅ Comprehensive deployment documentation
- ✅ EC2 deployment guides and recommendations
- ✅ Database initialization with 22+ tables
- ✅ CORS configuration for frontend integration

## Prerequisites

### System Requirements
- Ubuntu 20.04+ or Amazon Linux 2023
- Python 3.9+
- Node.js 18+
- PostgreSQL 16
- 4GB+ RAM (8GB recommended)
- 20GB+ storage

### Required Accounts/Keys
- GitHub account with repository access
- OpenAI API key
- AWS account (for EC2 deployment)

## Deployment Steps

### 1. Clone Repository with Tag

```bash
# Clone the repository
git clone https://github.com/flyingoncloud/zeneAI.git
cd zeneAI

# Checkout the specific tag
git checkout v1.0.0-psychology-report-spec

# Verify you're on the correct tag
git describe --tags
# Should output: v1.0.0-psychology-report-spec
```

### 2. Install System Dependencies

#### For Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Python and pip
sudo apt install -y python3.9 python3-pip python3-venv

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install build essentials (for some Python packages)
sudo apt install -y build-essential libpq-dev
```

#### For Amazon Linux 2023:
```bash
# Install PostgreSQL
sudo dnf install -y postgresql16 postgresql16-server

# Initialize PostgreSQL
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Python
sudo dnf install -y python3.9 python3-pip

# Install Node.js
sudo dnf install -y nodejs npm
```

### 3. Set Up PostgreSQL Database

```bash
# Navigate to backend directory
cd ai-chat-api

# Make setup script executable
chmod +x setup_database.sh

# Run database setup script
./setup_database.sh
```

The script will:
- Check PostgreSQL status
- Create database user `chat_user` with password `chat_pass`
- Create database `chat_db`
- Grant necessary privileges
- Initialize all tables (22+ tables)
- Verify connection

**Note**: If you want to use different credentials, edit the script or manually create the database:

```bash
# Manual database setup
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE USER your_user WITH PASSWORD 'your_password';
CREATE DATABASE your_db OWNER your_user;
GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;
\q

# Then update .env file with your credentials
```

### 4. Configure Backend Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env
```

Update the following variables:

```env
# OpenAI API Key (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# Database (update if you changed credentials)
DATABASE_URL=postgresql://chat_user:chat_pass@localhost:5432/chat_db

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# CORS (add your frontend URL)
CORS_ORIGINS=http://localhost:3000,http://your-domain.com,null

# IFS Detection
IFS_DETECTION_ENABLED=true
IFS_ANALYSIS_INTERVAL=3
IFS_WINDOW_SIZE=10
IFS_MIN_CONFIDENCE=0.6
IFS_LLM_MODEL=gpt-3.5-turbo

# AI Response Language
AI_RESPONSE_LANGUAGE=chinese
AI_FORCE_LANGUAGE=true
```

### 5. Install Backend Dependencies

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 6. Test Backend

```bash
# Test database connection
python test_db_connection.py

# Test Chinese fonts (for DOCX generation)
python test_chinese_fonts.py

# Start backend server
python run.py
```

The backend should start on `http://0.0.0.0:8000`

### 7. Set Up Frontend

```bash
# Navigate to frontend directory
cd ../zeneme-next

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF

# Start development server
npm run dev
```

The frontend should start on `http://localhost:3000`

### 8. Verify Installation

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/
   # Should return: {"message": "ZeneAI Chat API is running"}
   ```

2. **Database Tables**:
   ```bash
   psql -U chat_user -d chat_db -h localhost -c "\dt"
   # Should list 22+ tables
   ```

3. **Frontend Access**:
   - Open browser: `http://localhost:3000`
   - Should see ZeneAI chat interface

## Production Deployment (EC2)

### EC2 Instance Recommendations

Based on the analysis in `EC2_INSTANCE_RECOMMENDATIONS.md`:

- **Recommended**: `m5.large` or `m5d.large`
  - 2 vCPUs, 8GB RAM
  - Good balance of compute and memory
  - Cost: ~$0.096/hour (~$70/month)

- **Budget Option**: `t3.medium`
  - 2 vCPUs, 4GB RAM
  - Burstable performance
  - Cost: ~$0.0416/hour (~$30/month)

- **High Performance**: `m5.xlarge`
  - 4 vCPUs, 16GB RAM
  - For high traffic
  - Cost: ~$0.192/hour (~$140/month)

### Storage Recommendations

See `EBS_VOLUME_SIZING_GUIDE.md` for details:

- **Minimum**: 20GB gp3
- **Recommended**: 30GB gp3
- **Production**: 50GB gp3 with snapshots

### Security Group Configuration

```
Inbound Rules:
- Port 22 (SSH): Your IP only
- Port 8000 (Backend API): 0.0.0.0/0 or specific IPs
- Port 3000 (Frontend): 0.0.0.0/0 or specific IPs
- Port 5432 (PostgreSQL): 127.0.0.1 only (localhost)

Outbound Rules:
- All traffic: 0.0.0.0/0
```

### Production Environment Setup

1. **Use Process Manager**:
   ```bash
   # Install PM2
   npm install -g pm2

   # Start backend with PM2
   cd ai-chat-api
   pm2 start run.py --name zeneai-backend --interpreter python3

   # Start frontend with PM2
   cd ../zeneme-next
   pm2 start npm --name zeneai-frontend -- start

   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

2. **Set Up Nginx Reverse Proxy**:
   ```bash
   sudo apt install -y nginx

   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/zeneai
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend API
       location /api/ {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/zeneai /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

3. **Set Up SSL with Let's Encrypt**:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Troubleshooting

### Database Connection Issues

See `REPORT_GENERATION_FIXES.md` for common issues:

1. **"database does not exist"**:
   ```bash
   cd ai-chat-api
   ./setup_database.sh
   ```

2. **"column does not exist"**:
   ```bash
   python init_database.py
   ```

3. **Permission denied**:
   ```bash
   sudo -u postgres psql
   GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;
   GRANT ALL ON SCHEMA public TO chat_user;
   ```

### CORS Issues

If frontend can't connect to backend:

1. Check `.env` file has correct CORS_ORIGINS
2. Restart backend: `python run.py`
3. Verify in browser console

### Chinese Font Issues

See `CHINESE_FONT_FIX.md`:

```bash
# Test fonts
python test_chinese_fonts.py

# Install fonts if needed
sudo apt install -y fonts-noto-cjk
```

### Backend Won't Start

1. Check port 8000 is not in use:
   ```bash
   lsof -i :8000
   # Kill process if needed
   kill -9 <PID>
   ```

2. Check Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Check logs:
   ```bash
   tail -f backend.log
   ```

## Monitoring and Maintenance

### Log Files

- Backend logs: `ai-chat-api/backend.log`
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`

### Database Backups

```bash
# Create backup
pg_dump -U chat_user -d chat_db -h localhost > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U chat_user -d chat_db -h localhost < backup_20260125.sql
```

### Update Deployment

```bash
# Pull latest changes
git fetch --tags
git checkout v1.0.0-psychology-report-spec

# Update backend
cd ai-chat-api
source venv/bin/activate
pip install -r requirements.txt
pm2 restart zeneai-backend

# Update frontend
cd ../zeneme-next
npm install
npm run build
pm2 restart zeneai-frontend
```

## Additional Documentation

- `README.md` - Project overview
- `SETUP.md` - Detailed setup instructions
- `EC2_INSTANCE_RECOMMENDATIONS.md` - EC2 sizing guide
- `EBS_VOLUME_SIZING_GUIDE.md` - Storage recommendations
- `PSYCHOLOGY_REPORT_INTEGRATION_GUIDE.md` - Report generation guide
- `QUESTIONNAIRE_TO_REPORT_INTEGRATION.md` - Questionnaire flow
- `UI_FLOW_GUIDE.md` - User interface flow

## Support

For issues or questions:
1. Check troubleshooting guides in documentation
2. Review GitHub issues
3. Contact development team

## Version History

- **v1.0.0-psychology-report-spec** (2026-01-25)
  - Initial release with psychology report generation
  - Database setup automation
  - Comprehensive documentation
  - EC2 deployment ready

---

**Deployment Checklist**:
- [ ] Clone repository with tag
- [ ] Install system dependencies
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Install backend dependencies
- [ ] Test backend connection
- [ ] Set up frontend
- [ ] Verify installation
- [ ] Configure production settings (PM2, Nginx, SSL)
- [ ] Set up monitoring and backups
- [ ] Test end-to-end functionality

**Estimated Deployment Time**: 30-60 minutes for experienced users
