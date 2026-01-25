# EBS Volume Sizing Guide for ZeneAI

## Application Storage Analysis

Let me break down the storage requirements for each component of your application.

---

## Storage Breakdown by Component

### 1. Operating System (Ubuntu/Amazon Linux)

| Component | Size | Notes |
|-----------|------|-------|
| Base OS | 4-6 GB | Ubuntu 22.04 or Amazon Linux 2023 |
| System packages | 2-3 GB | apt/yum packages, utilities |
| Swap space | 2-4 GB | Optional, 0.5-1x RAM recommended |
| **Subtotal** | **8-13 GB** | |

---

### 2. Frontend (Next.js)

| Component | Size | Notes |
|-----------|------|-------|
| Node.js runtime | 200 MB | Node.js 20.x |
| node_modules | 500-800 MB | All dependencies installed |
| Application code | 50-100 MB | Your source code |
| .next build output | 200-400 MB | Production build artifacts |
| Static assets | 100-200 MB | Images, fonts, icons |
| Build cache | 500 MB | For faster rebuilds |
| **Subtotal** | **1.5-2.2 GB** | |

**Growth rate**: +100-200 MB per major update

---

### 3. Backend (FastAPI + Python)

| Component | Size | Notes |
|-----------|------|-------|
| Python 3.10 | 150 MB | Python runtime |
| Virtual environment | 300-500 MB | pip packages from requirements.txt |
| Application code | 50-100 MB | Your Python code |
| OpenAI SDK | 50 MB | openai package |
| SQLAlchemy + psycopg2 | 100 MB | Database libraries |
| FastAPI + Uvicorn | 100 MB | Web framework |
| **Subtotal** | **750 MB - 1 GB** | |

**Growth rate**: +50-100 MB per major update

---

### 4. Database (PostgreSQL) - If Self-Hosted

| Component | Size | Notes |
|-----------|------|-------|
| PostgreSQL 16 | 200 MB | Database engine |
| Initial schema | 10 MB | Tables, indexes, functions |
| User data (Year 1) | 2-5 GB | Conversations, messages, questionnaires |
| User data (Year 2) | 5-10 GB | Growing user base |
| User data (Year 3) | 10-20 GB | Established product |
| WAL logs | 1-2 GB | Write-ahead logs |
| Temp tables | 500 MB | Temporary query data |
| Indexes | 20-30% of data | Additional space for indexes |
| **Subtotal (Year 1)** | **5-10 GB** | |
| **Subtotal (Year 3)** | **15-30 GB** | |

**Growth rate**:
- **Low usage**: 100-200 MB/month
- **Medium usage**: 500 MB - 1 GB/month
- **High usage**: 2-5 GB/month

#### Database Growth Estimation

**Per User Data:**
```
Conversations: 1 KB per conversation
Messages: 500 bytes per message (avg 20 messages/conversation)
Questionnaire responses: 2 KB per response (89 questions × 4 questionnaires)
Psychology reports: 10 KB per report

Average per active user: 50-100 KB
1000 active users: 50-100 MB
10,000 active users: 500 MB - 1 GB
100,000 active users: 5-10 GB
```

---

### 5. Application Logs

| Component | Size | Notes |
|-----------|------|-------|
| System logs | 500 MB | /var/log/* |
| Frontend logs | 1-2 GB | Access logs, error logs |
| Backend logs | 2-5 GB | API logs, OpenAI call logs |
| Database logs | 500 MB - 1 GB | PostgreSQL logs |
| Nginx logs | 1-2 GB | Access and error logs |
| **Subtotal** | **5-10 GB** | With log rotation |

**Growth rate**: 100-500 MB/day (with rotation)

**Log rotation recommended:**
```bash
# Keep last 7 days, compress old logs
/var/log/app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

---

### 6. Temporary Files & Cache

| Component | Size | Notes |
|-----------|------|-------|
| /tmp directory | 1-2 GB | Temporary files |
| Image uploads (temp) | 500 MB - 1 GB | Before moving to S3 |
| Build artifacts | 500 MB | Deployment artifacts |
| Package manager cache | 500 MB | apt/yum cache |
| **Subtotal** | **2.5-4.5 GB** | |

---

### 7. Backups (Optional on EBS)

| Component | Size | Notes |
|-----------|------|-------|
| Database backup | Same as DB size | Daily backup |
| Config backups | 100 MB | Application configs |
| **Subtotal** | **Variable** | Better to use S3 |

**Recommendation**: Use S3 for backups, not EBS

---

## Total Storage Requirements

### Scenario 1: MVP/Startup (Single Instance with Database)

| Component | Size |
|-----------|------|
| Operating System | 10 GB |
| Frontend (Next.js) | 2 GB |
| Backend (FastAPI) | 1 GB |
| Database (PostgreSQL) | 10 GB |
| Logs | 5 GB |
| Temp/Cache | 3 GB |
| Buffer (20%) | 6 GB |
| **Total** | **37 GB** |

**Recommended**: **50 GB** (provides 35% buffer)

---

### Scenario 2: Production (App Server Only, RDS for Database)

| Component | Size |
|-----------|------|
| Operating System | 10 GB |
| Frontend (Next.js) | 2 GB |
| Backend (FastAPI) | 1 GB |
| Logs | 5 GB |
| Temp/Cache | 3 GB |
| Buffer (30%) | 6 GB |
| **Total** | **27 GB** |

**Recommended**: **30-40 GB** (provides 10-50% buffer)

---

### Scenario 3: High-Traffic Production

| Component | Size |
|-----------|------|
| Operating System | 10 GB |
| Frontend (Next.js) | 3 GB |
| Backend (FastAPI) | 2 GB |
| Logs (more traffic) | 10 GB |
| Temp/Cache | 5 GB |
| Buffer (30%) | 9 GB |
| **Total** | **39 GB** |

**Recommended**: **50-60 GB** (provides 25-50% buffer)

---

### Scenario 4: Database Server (Self-Hosted PostgreSQL)

| Component | Size |
|-----------|------|
| Operating System | 8 GB |
| PostgreSQL | 1 GB |
| Database data (Year 1) | 10 GB |
| Database data (Year 2) | 20 GB |
| Database data (Year 3) | 40 GB |
| WAL logs | 2 GB |
| Temp tables | 1 GB |
| Indexes (30% overhead) | 12 GB (Year 3) |
| Logs | 3 GB |
| Buffer (20%) | 17 GB (Year 3) |
| **Total (Year 1)** | **35 GB** |
| **Total (Year 3)** | **104 GB** |

**Recommended**:
- **Year 1**: **50 GB** (43% buffer)
- **Year 2**: **80 GB** (33% buffer)
- **Year 3**: **120 GB** (15% buffer)

---

## Recommended EBS Volume Configurations

### 🎯 Configuration 1: MVP Single Instance (Recommended)

**Instance**: t3.medium or t3.large
**Architecture**: All-in-one (Frontend + Backend + Database)

```
Root Volume (/dev/xvda):
- Type: gp3
- Size: 50 GB
- IOPS: 3,000 (baseline)
- Throughput: 125 MB/s (baseline)
- Cost: $4/month

Layout:
/dev/xvda1 (50 GB):
  / (root)           - 10 GB (OS)
  /opt/app           - 3 GB (Applications)
  /var/lib/postgresql - 10 GB (Database)
  /var/log           - 5 GB (Logs)
  /tmp               - 3 GB (Temp)
  Buffer             - 19 GB (38%)
```

**Why 50 GB?**
- ✅ Sufficient for 6-12 months
- ✅ 38% buffer for growth
- ✅ Cost-effective ($4/month)
- ✅ Easy to expand later

---

### 🚀 Configuration 2: Production App Server (with RDS)

**Instance**: t3.medium or m5d.large
**Architecture**: App server only (database on RDS)

```
Root Volume (/dev/xvda):
- Type: gp3
- Size: 30 GB
- IOPS: 3,000 (baseline)
- Throughput: 125 MB/s (baseline)
- Cost: $2.40/month

Layout:
/dev/xvda1 (30 GB):
  / (root)     - 10 GB (OS)
  /opt/app     - 3 GB (Applications)
  /var/log     - 5 GB (Logs)
  /tmp         - 3 GB (Temp)
  Buffer       - 9 GB (30%)
```

**Why 30 GB?**
- ✅ No database = less storage needed
- ✅ 30% buffer adequate
- ✅ Very cost-effective ($2.40/month)
- ✅ Can add data volume if needed

**Optional Data Volume** (if using m5d with NVMe):
```
Data Volume (/dev/xvdf):
- Type: gp3
- Size: 20 GB
- Mount: /data
- Purpose: Persistent data that survives instance stop
- Cost: $1.60/month
```

---

### 💪 Configuration 3: High-Traffic Production

**Instance**: t3.xlarge or m5d.xlarge
**Architecture**: App server with heavy logging

```
Root Volume (/dev/xvda):
- Type: gp3
- Size: 40 GB
- IOPS: 3,000 (baseline)
- Throughput: 125 MB/s (baseline)
- Cost: $3.20/month

Data Volume (/dev/xvdf):
- Type: gp3
- Size: 20 GB
- IOPS: 3,000 (baseline)
- Throughput: 125 MB/s (baseline)
- Mount: /data
- Cost: $1.60/month

Total: 60 GB, $4.80/month

Layout:
/dev/xvda1 (40 GB):
  / (root)     - 10 GB (OS)
  /opt/app     - 5 GB (Applications)
  /var/log     - 10 GB (Logs)
  /tmp         - 5 GB (Temp)
  Buffer       - 10 GB (25%)

/dev/xvdf1 (20 GB):
  /data        - 20 GB (User uploads, cache)
```

**Why separate volumes?**
- ✅ Isolate logs from root
- ✅ Easier to expand specific volumes
- ✅ Better I/O performance
- ✅ Can snapshot independently

---

### 🗄️ Configuration 4: Self-Hosted Database Server

**Instance**: t3.medium or db-optimized instance
**Architecture**: PostgreSQL only

```
Root Volume (/dev/xvda):
- Type: gp3
- Size: 20 GB
- IOPS: 3,000
- Throughput: 125 MB/s
- Cost: $1.60/month

Database Volume (/dev/xvdf):
- Type: gp3
- Size: 100 GB (Year 1) → 200 GB (Year 3)
- IOPS: 5,000 (provisioned)
- Throughput: 250 MB/s (provisioned)
- Mount: /var/lib/postgresql
- Cost: $8/month (100 GB) + $1.30/month (extra IOPS)

Total: 120 GB, $10.90/month

Layout:
/dev/xvda1 (20 GB):
  / (root)     - 10 GB (OS)
  /var/log     - 3 GB (Logs)
  Buffer       - 7 GB (35%)

/dev/xvdf1 (100 GB):
  /var/lib/postgresql - 100 GB (Database)
```

**Why separate database volume?**
- ✅ Better I/O performance
- ✅ Independent snapshots
- ✅ Easier to expand
- ✅ Can use higher IOPS

---

## EBS Volume Type Comparison

### gp3 (General Purpose SSD) - **Recommended**

**Specifications:**
- **Baseline**: 3,000 IOPS, 125 MB/s
- **Max**: 16,000 IOPS, 1,000 MB/s (with provisioning)
- **Cost**: $0.08/GB-month
- **Extra IOPS**: $0.005/IOPS-month (above 3,000)
- **Extra Throughput**: $0.04/MB/s-month (above 125 MB/s)

**Best for:**
- ✅ Application servers
- ✅ Development/staging
- ✅ Small to medium databases
- ✅ Cost-sensitive deployments

**Example costs:**
- 50 GB: $4/month
- 100 GB: $8/month
- 100 GB + 5,000 IOPS: $9.30/month

---

### io2 (Provisioned IOPS SSD)

**Specifications:**
- **IOPS**: 100 - 64,000 IOPS
- **Throughput**: Up to 1,000 MB/s
- **Cost**: $0.125/GB-month + $0.065/IOPS-month
- **Durability**: 99.999% (vs 99.8-99.9% for gp3)

**Best for:**
- ✅ Production databases with heavy writes
- ✅ Mission-critical applications
- ✅ Consistent low-latency requirements
- ✅ >10,000 IOPS needed

**Example costs:**
- 100 GB + 5,000 IOPS: $12.50 + $325 = **$337.50/month** 😱
- 100 GB + 10,000 IOPS: $12.50 + $650 = **$662.50/month** 😱

**Verdict**: ❌ **Too expensive for your use case**

---

### st1 (Throughput Optimized HDD)

**Specifications:**
- **Throughput**: 40 MB/s per TB (baseline), 500 MB/s max
- **IOPS**: Not optimized for IOPS
- **Cost**: $0.045/GB-month
- **Min size**: 125 GB

**Best for:**
- ✅ Big data, data warehouses
- ✅ Log processing
- ✅ Sequential access patterns
- ❌ **Not suitable for your app** (needs random I/O)

---

## Volume Expansion Strategy

### When to Expand?

**Monitor these metrics:**
```bash
# Check disk usage
df -h

# Alert thresholds:
- Warning: 70% full
- Critical: 85% full
- Emergency: 95% full
```

**CloudWatch Alarms:**
```
Metric: DiskSpaceUtilization
Threshold: >80%
Action: SNS notification
```

### How to Expand (No Downtime)

**Step 1: Modify volume in AWS Console**
```
Current: 50 GB → New: 80 GB
Wait for "optimizing" to complete (5-10 minutes)
```

**Step 2: Extend partition (on instance)**
```bash
# Check current size
lsblk

# Grow partition
sudo growpart /dev/xvda 1

# Resize filesystem
sudo resize2fs /dev/xvda1  # For ext4
# OR
sudo xfs_growfs /  # For XFS

# Verify
df -h
```

**No reboot required!** ✅

---

## Cost Optimization Tips

### 1. Use gp3 Instead of gp2
```
50 GB gp2: $5/month
50 GB gp3: $4/month
Savings: 20%
```

### 2. Right-Size Your Volumes
```
❌ Over-provisioned: 200 GB (only using 40 GB) = $16/month
✅ Right-sized: 60 GB (using 40 GB) = $4.80/month
Savings: 70%
```

### 3. Delete Unused Snapshots
```
10 snapshots × 50 GB = 500 GB
Cost: $25/month
Action: Keep only last 7 days
New cost: $7/month
Savings: 72%
```

### 4. Use S3 for Backups
```
❌ EBS snapshot: $0.05/GB-month
✅ S3 Standard: $0.023/GB-month
✅ S3 Glacier: $0.004/GB-month
Savings: 54-92%
```

### 5. Compress Logs
```
Uncompressed logs: 10 GB
Compressed logs: 2 GB
Savings: 80% space
```

---

## Monitoring and Alerts

### CloudWatch Metrics to Monitor

```yaml
Metrics:
  - DiskSpaceUtilization
    Threshold: >80%
    Action: Email alert

  - VolumeReadOps
    Threshold: >1000/sec
    Action: Consider higher IOPS

  - VolumeWriteOps
    Threshold: >1000/sec
    Action: Consider higher IOPS

  - VolumeThroughputPercentage
    Threshold: >90%
    Action: Increase throughput

  - VolumeQueueLength
    Threshold: >10
    Action: I/O bottleneck, upgrade volume
```

### Automated Monitoring Script

```bash
#!/bin/bash
# /opt/scripts/disk-monitor.sh

THRESHOLD=80
USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
    echo "Disk usage is ${USAGE}% - Above threshold!"
    # Send SNS notification
    aws sns publish \
        --topic-arn arn:aws:sns:us-east-1:123456789:disk-alerts \
        --message "Disk usage is ${USAGE}% on $(hostname)"
fi
```

**Cron job:**
```bash
# Run every hour
0 * * * * /opt/scripts/disk-monitor.sh
```

---

## Backup Strategy

### Option 1: EBS Snapshots (Automated)

```yaml
Backup Schedule:
  - Daily: 7 days retention
  - Weekly: 4 weeks retention
  - Monthly: 12 months retention

Cost (50 GB volume):
  - Daily (7 × 50 GB): $17.50/month
  - Weekly (4 × 50 GB): $10/month
  - Monthly (12 × 50 GB): $30/month
  Total: $57.50/month
```

**AWS Backup service:**
```
Automated, managed backups
Cost: Same as snapshots + $0.50/month management fee
```

### Option 2: Database Dumps to S3 (Recommended)

```bash
#!/bin/bash
# /opt/scripts/db-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"

# Dump database
pg_dump chat_db | gzip > /tmp/${BACKUP_FILE}

# Upload to S3
aws s3 cp /tmp/${BACKUP_FILE} s3://zeneme-backups/database/

# Cleanup local file
rm /tmp/${BACKUP_FILE}

# Delete backups older than 30 days
aws s3 ls s3://zeneme-backups/database/ | \
    awk '{print $4}' | \
    while read file; do
        # Delete old files logic here
    done
```

**Cost (50 GB database):**
```
S3 Standard: 50 GB × $0.023 = $1.15/month
S3 Glacier: 50 GB × $0.004 = $0.20/month
Savings vs EBS: 98% (Glacier)
```

---

## Final Recommendations

### 🎯 For MVP/Startup (Single Instance)

**Volume Configuration:**
```
Root Volume: 50 GB gp3
Cost: $4/month
Sufficient for: 6-12 months
```

**When to expand**: When usage >70% (35 GB used)

---

### 🚀 For Production (App + RDS)

**Volume Configuration:**
```
App Server: 30 GB gp3
Cost: $2.40/month
Sufficient for: 12+ months
```

**RDS Storage:**
```
Database: 50 GB gp3 (managed by AWS)
Auto-scaling: Enable (up to 100 GB)
Cost: Included in RDS pricing
```

---

### 💪 For High-Traffic Production

**Volume Configuration:**
```
Root Volume: 40 GB gp3
Data Volume: 20 GB gp3
Total: 60 GB
Cost: $4.80/month
Sufficient for: 12+ months
```

---

## Quick Reference Table

| Scenario | Instance | Root Volume | Data Volume | Total | Monthly Cost |
|----------|----------|-------------|-------------|-------|--------------|
| MVP Single | t3.medium | 50 GB gp3 | - | 50 GB | $4.00 |
| Production App | t3.medium | 30 GB gp3 | - | 30 GB | $2.40 |
| Production App | m5d.large | 30 GB gp3 | - | 30 GB | $2.40 |
| High Traffic | t3.xlarge | 40 GB gp3 | 20 GB gp3 | 60 GB | $4.80 |
| Database Server | t3.medium | 20 GB gp3 | 100 GB gp3 | 120 GB | $9.60 |

---

## Summary

**Recommended Starting Point:**
- **50 GB gp3** for single instance (all-in-one)
- **30 GB gp3** for app server (with RDS)
- **100 GB gp3** for self-hosted database

**Key Takeaways:**
- ✅ Start with 50 GB for MVP
- ✅ Use gp3 (not gp2 or io2)
- ✅ Monitor at 70% usage
- ✅ Expand before 85% full
- ✅ Use S3 for backups
- ✅ Enable log rotation
- ✅ Set up CloudWatch alarms

**Expansion is easy and has no downtime**, so it's better to start smaller and grow as needed rather than over-provision from the start! 📈
