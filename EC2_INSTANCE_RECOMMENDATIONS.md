# EC2 Instance Type Recommendations for ZeneAI Deployment

## Application Architecture Analysis

### Stack Components

1. **Frontend**: Next.js 16 (React 19) - Server-Side Rendering (SSR)
2. **Backend API**: FastAPI (Python 3.10+) with OpenAI integration
3. **Database**: PostgreSQL 16
4. **Legacy Backend**: Spring Boot (Java 11) - appears to be legacy/alternative implementation

### Resource Requirements Analysis

#### Frontend (Next.js)
- **CPU**: Moderate (SSR compilation, React hydration)
- **Memory**: 1-2 GB minimum for production build
- **Network**: High (serving static assets, API calls)
- **Build time**: Requires 2-4 GB during `npm run build`

#### Backend (FastAPI)
- **CPU**: Moderate to High (OpenAI API calls, image processing)
- **Memory**: 1-2 GB (Python runtime, ML libraries if any)
- **Network**: High (OpenAI API calls, image uploads)
- **I/O**: Moderate (database queries, file operations)

#### Database (PostgreSQL 16)
- **CPU**: Low to Moderate (query processing)
- **Memory**: 1-2 GB minimum (buffer cache, connections)
- **Storage**: 20-50 GB (depends on user data growth)
- **I/O**: High (IOPS for database operations)

#### Key Considerations
- **OpenAI API calls**: Network-intensive, requires stable internet
- **Image analysis**: Memory-intensive (Vision API)
- **Questionnaire data**: 89 questions × multiple users = significant DB load
- **Real-time chat**: WebSocket or polling = sustained connections
- **Psychology reports**: Document generation = CPU + memory spikes

---

## Deployment Architecture Options

### Option 1: Single Instance (Development/Small Scale)
**All components on one EC2 instance**

### Option 2: Two-Tier (Recommended for Production)
- **App Server**: Frontend + Backend API
- **Database Server**: PostgreSQL (or use RDS)

### Option 3: Three-Tier (High Availability)
- **Frontend Server**: Next.js
- **Backend Server**: FastAPI
- **Database**: RDS PostgreSQL

---

## EC2 Instance Recommendations

### 🏆 Recommended: Option 2 (Two-Tier Architecture)

#### App Server: **t3.medium** or **t3a.medium**

**Specifications:**
- **vCPUs**: 2
- **Memory**: 4 GB
- **Network**: Up to 5 Gbps
- **EBS Bandwidth**: Up to 2,085 Mbps
- **Cost**: ~$30-35/month (t3.medium) or ~$27-31/month (t3a.medium)

**Why this works:**
- ✅ 4 GB RAM handles Next.js SSR + FastAPI comfortably
- ✅ 2 vCPUs sufficient for moderate concurrent users (50-100)
- ✅ Burstable performance for traffic spikes
- ✅ Cost-effective for startups
- ✅ Can handle OpenAI API calls efficiently

**Suitable for:**
- 50-200 concurrent users
- Development, staging, and small production deployments
- MVP and early-stage product

---

#### Database: **Amazon RDS db.t3.micro** or **db.t3.small**

**db.t3.micro** (Minimal):
- **vCPUs**: 2
- **Memory**: 1 GB
- **Storage**: 20 GB SSD
- **Cost**: ~$15-20/month
- **Suitable for**: <1000 users, light usage

**db.t3.small** (Recommended):
- **vCPUs**: 2
- **Memory**: 2 GB
- **Storage**: 50 GB SSD
- **Cost**: ~$30-35/month
- **Suitable for**: 1000-5000 users, moderate usage

**Why RDS over self-managed:**
- ✅ Automated backups
- ✅ Automatic minor version upgrades
- ✅ Multi-AZ for high availability
- ✅ Read replicas for scaling
- ✅ Monitoring and alerting built-in
- ✅ Less operational overhead

---

### Alternative: Single Instance (Budget Option)

#### **t3.large** (All-in-One)

**Specifications:**
- **vCPUs**: 2
- **Memory**: 8 GB
- **Network**: Up to 5 Gbps
- **Cost**: ~$60-70/month

**Configuration:**
- Next.js frontend (port 3000)
- FastAPI backend (port 8000)
- PostgreSQL (port 5432)
- Nginx reverse proxy (port 80/443)

**Why this works:**
- ✅ 8 GB RAM sufficient for all components
- ✅ Simpler deployment and management
- ✅ Lower total cost than multi-instance
- ✅ Good for MVP and testing

**Suitable for:**
- 20-100 concurrent users
- MVP, demo, or proof-of-concept
- Budget-constrained projects

---

### Scaling Up: Production with Growth

#### App Server: **t3.xlarge** or **c6i.xlarge**

**t3.xlarge** (Balanced):
- **vCPUs**: 4
- **Memory**: 16 GB
- **Cost**: ~$120-140/month
- **Suitable for**: 200-500 concurrent users

**c6i.xlarge** (Compute-Optimized):
- **vCPUs**: 4
- **Memory**: 8 GB
- **Cost**: ~$140-160/month
- **Suitable for**: CPU-intensive workloads, heavy OpenAI usage

#### Database: **db.t3.medium** or **db.r6i.large**

**db.t3.medium**:
- **vCPUs**: 2
- **Memory**: 4 GB
- **Cost**: ~$60-70/month
- **Suitable for**: 5000-10000 users

**db.r6i.large** (Memory-Optimized):
- **vCPUs**: 2
- **Memory**: 16 GB
- **Cost**: ~$180-200/month
- **Suitable for**: >10000 users, complex queries

---

## Detailed Cost Breakdown

### Scenario 1: MVP/Startup (Recommended)

| Component | Instance Type | Monthly Cost | Annual Cost |
|-----------|---------------|--------------|-------------|
| App Server | t3.medium | $35 | $420 |
| Database | RDS db.t3.small | $35 | $420 |
| EBS Storage (50GB) | gp3 | $5 | $60 |
| Data Transfer | 100GB/month | $9 | $108 |
| **Total** | | **~$84/month** | **~$1,008/year** |

### Scenario 2: Budget Single Instance

| Component | Instance Type | Monthly Cost | Annual Cost |
|-----------|---------------|--------------|-------------|
| All-in-One | t3.large | $70 | $840 |
| EBS Storage (100GB) | gp3 | $10 | $120 |
| Data Transfer | 100GB/month | $9 | $108 |
| **Total** | | **~$89/month** | **~$1,068/year** |

### Scenario 3: Production with Growth

| Component | Instance Type | Monthly Cost | Annual Cost |
|-----------|---------------|--------------|-------------|
| App Server | t3.xlarge | $140 | $1,680 |
| Database | RDS db.t3.medium | $70 | $840 |
| EBS Storage (200GB) | gp3 | $20 | $240 |
| Data Transfer | 500GB/month | $45 | $540 |
| **Total** | | **~$275/month** | **~$3,300/year** |

*Note: Prices are approximate and vary by region. US East (N. Virginia) used as reference.*

---

## Storage Recommendations

### EBS Volume Types

#### **gp3** (Recommended for Most Cases)
- **Baseline**: 3,000 IOPS, 125 MB/s throughput
- **Cost**: $0.08/GB-month
- **Use for**: App server, general database workloads
- **Why**: Best price/performance ratio

#### **io2** (High-Performance Database)
- **IOPS**: Up to 64,000 IOPS
- **Cost**: $0.125/GB-month + $0.065/IOPS
- **Use for**: Production database with heavy writes
- **Why**: Consistent low-latency performance

### Storage Sizing

**App Server:**
- **OS + System**: 8 GB
- **Node.js + Dependencies**: 2 GB
- **Python + Dependencies**: 2 GB
- **Application Code**: 1 GB
- **Logs**: 5 GB
- **Buffer**: 10 GB
- **Total**: **30 GB minimum, 50 GB recommended**

**Database:**
- **PostgreSQL System**: 5 GB
- **Initial Data**: 5 GB
- **User Data Growth**: 10 GB/year (estimated)
- **Backups**: 10 GB
- **Buffer**: 10 GB
- **Total**: **40 GB minimum, 100 GB recommended**

---

## Network and Security

### Security Groups

**App Server (Frontend + Backend):**
```
Inbound:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0
- Port 22 (SSH) from YOUR_IP only

Outbound:
- All traffic (for OpenAI API calls)
```

**Database (RDS or Self-Managed):**
```
Inbound:
- Port 5432 (PostgreSQL) from App Server Security Group only

Outbound:
- None required
```

### Elastic IP
- **Recommended**: Yes, for stable DNS mapping
- **Cost**: Free when attached to running instance
- **Benefit**: Persistent IP address across restarts

### Load Balancer (Optional for Production)
- **Type**: Application Load Balancer (ALB)
- **Cost**: ~$16/month + data processing
- **Benefits**: SSL termination, health checks, auto-scaling

---

## Deployment Configurations

### Configuration 1: Docker Compose (Single Instance)

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./zeneme-next
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build: ./ai-chat-api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://chat_user:chat_pass@postgres:5432/chat_db
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=chat_user
      - POSTGRES_PASSWORD=chat_pass
      - POSTGRES_DB=chat_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

### Configuration 2: Systemd Services (Two-Tier)

**App Server:**
```bash
# /etc/systemd/system/zeneme-frontend.service
[Unit]
Description=ZeneAI Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/zeneme-next
Environment="NODE_ENV=production"
Environment="NEXT_PUBLIC_API_URL=http://localhost:8000"
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target

# /etc/systemd/system/zeneme-backend.service
[Unit]
Description=ZeneAI Backend API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/ai-chat-api
Environment="DATABASE_URL=postgresql://chat_user:chat_pass@RDS_ENDPOINT:5432/chat_db"
Environment="OPENAI_API_KEY=your-key"
ExecStart=/home/ubuntu/ai-chat-api/venv/bin/python run.py
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Performance Optimization Tips

### 1. Enable CloudFront CDN
- **Cost**: ~$1-5/month for low traffic
- **Benefit**: Faster static asset delivery, reduced EC2 load
- **Setup**: Point CloudFront to your EC2 instance

### 2. Use ElastiCache for Redis
- **Instance**: cache.t3.micro (~$12/month)
- **Use for**: Session storage, API response caching
- **Benefit**: Reduce database load, faster response times

### 3. Enable Auto Scaling (Production)
- **Min instances**: 1
- **Max instances**: 3-5
- **Trigger**: CPU > 70% for 5 minutes
- **Benefit**: Handle traffic spikes automatically

### 4. Database Optimization
- **Connection pooling**: Max 20-50 connections
- **Query optimization**: Add indexes on frequently queried columns
- **Read replicas**: For read-heavy workloads
- **Backup strategy**: Daily automated backups with 7-day retention

### 5. Monitoring and Alerts
- **CloudWatch**: CPU, memory, disk, network metrics
- **Application logs**: Centralized logging with CloudWatch Logs
- **Alerts**: Set up SNS notifications for high CPU/memory
- **Cost alerts**: Budget alerts for unexpected cost increases

---

## Migration Path

### Phase 1: MVP (Month 1-3)
- **Instance**: t3.medium + RDS db.t3.small
- **Cost**: ~$84/month
- **Users**: 50-200 concurrent

### Phase 2: Growth (Month 4-12)
- **Instance**: t3.large + RDS db.t3.medium
- **Add**: CloudFront CDN
- **Cost**: ~$150/month
- **Users**: 200-1000 concurrent

### Phase 3: Scale (Year 2+)
- **Instance**: t3.xlarge (or multiple t3.medium with ALB)
- **Database**: RDS db.r6i.large with read replica
- **Add**: ElastiCache, Auto Scaling
- **Cost**: ~$400-600/month
- **Users**: 1000-5000 concurrent

---

## Final Recommendations

### 🎯 Best Choice for Your Application

**For MVP/Startup (Recommended):**
```
App Server: t3.medium (2 vCPU, 4 GB RAM)
Database: RDS db.t3.small (2 vCPU, 2 GB RAM)
Storage: 50 GB gp3 (app) + 50 GB (database)
Total Cost: ~$84/month
```

**Why this is optimal:**
1. ✅ Sufficient resources for 50-200 concurrent users
2. ✅ Room to grow without immediate scaling needs
3. ✅ Cost-effective for early-stage product
4. ✅ Easy to upgrade when needed
5. ✅ Managed database reduces operational overhead
6. ✅ Burstable performance handles traffic spikes

**When to upgrade:**
- CPU consistently > 70%
- Memory consistently > 80%
- Response times > 2 seconds
- Database connections maxed out
- User base > 500 concurrent users

---

## Quick Start Deployment Script

```bash
#!/bin/bash
# deploy.sh - Quick deployment script for t3.medium

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.10
sudo apt install -y python3.10 python3.10-venv python3-pip

# Install PostgreSQL client (for RDS connection)
sudo apt install -y postgresql-client

# Install Nginx
sudo apt install -y nginx

# Install Docker (optional)
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Clone repository
git clone https://github.com/your-repo/zeneme-ai.git
cd zeneme-ai

# Setup backend
cd ai-chat-api
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials

# Setup frontend
cd ../zeneme-next
npm install
npm run build
cp .env.example .env.local
# Edit .env.local with your API URL

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/zeneme
sudo ln -s /etc/nginx/sites-available/zeneme /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup systemd services
sudo cp zeneme-frontend.service /etc/systemd/system/
sudo cp zeneme-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable zeneme-frontend zeneme-backend
sudo systemctl start zeneme-frontend zeneme-backend

echo "Deployment complete! Check status with:"
echo "sudo systemctl status zeneme-frontend"
echo "sudo systemctl status zeneme-backend"
```

---

## Monitoring Checklist

- [ ] CloudWatch agent installed
- [ ] CPU utilization alerts (>80%)
- [ ] Memory utilization alerts (>85%)
- [ ] Disk space alerts (<20% free)
- [ ] Application error logs monitored
- [ ] Database connection pool monitored
- [ ] API response time tracked
- [ ] Cost budget alerts configured
- [ ] Backup verification automated
- [ ] Security group rules reviewed

---

## Summary

**Recommended Starting Point:**
- **App Server**: t3.medium ($35/month)
- **Database**: RDS db.t3.small ($35/month)
- **Total**: ~$84/month

**This configuration provides:**
- Reliable performance for 50-200 users
- Room for growth
- Managed database with backups
- Cost-effective for MVP
- Easy upgrade path

**Next Steps:**
1. Launch t3.medium EC2 instance
2. Create RDS db.t3.small PostgreSQL instance
3. Deploy application using provided scripts
4. Configure monitoring and alerts
5. Test with load testing tools
6. Monitor and scale as needed

Good luck with your deployment! 🚀
