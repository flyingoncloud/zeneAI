# DNS Configuration Guide: Linking zeneme.com to AWS EC2

## Overview

This guide explains how to configure your domain `zeneme.com` (registered outside AWS) to point to your EC2 instance using an Elastic IP address.

---

## Prerequisites

✅ Domain registered (zeneme.com) with a domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
✅ EC2 instance running in AWS
✅ Elastic IP allocated and associated with your EC2 instance
✅ Access to your domain registrar's DNS management panel

---

## Step 1: Get Your Elastic IP Address

### From AWS Console

1. **Log in to AWS Console**
2. **Navigate to EC2 Dashboard**
3. **Click "Elastic IPs"** in the left sidebar (under "Network & Security")
4. **Find your Elastic IP** - it should show as "Associated" with your instance
5. **Copy the IP address** (example: `54.123.45.67`)

### From AWS CLI

```bash
# List all Elastic IPs
aws ec2 describe-addresses

# Get Elastic IP for specific instance
aws ec2 describe-addresses --filters "Name=instance-id,Values=i-1234567890abcdef0"
```

**Example output:**
```json
{
    "Addresses": [
        {
            "PublicIp": "54.123.45.67",
            "InstanceId": "i-1234567890abcdef0",
            "Domain": "vpc"
        }
    ]
}
```

**Note your Elastic IP**: `54.123.45.67` (example)

---

## Step 2: Configure DNS Records at Your Domain Registrar

You need to add DNS records at your domain registrar (where you bought zeneme.com). The process varies slightly by registrar, but the records are the same.

### Required DNS Records

#### Option A: Simple Configuration (Recommended for MVP)

Add these two A records:

| Type | Name/Host | Value/Points To | TTL |
|------|-----------|-----------------|-----|
| A | @ | 54.123.45.67 | 3600 |
| A | www | 54.123.45.67 | 3600 |

**Explanation:**
- `@` = root domain (zeneme.com)
- `www` = www subdomain (www.zeneme.com)
- Both point to your Elastic IP
- TTL = Time To Live (3600 seconds = 1 hour)

#### Option B: With API Subdomain (Recommended for Production)

| Type | Name/Host | Value/Points To | TTL |
|------|-----------|-----------------|-----|
| A | @ | 54.123.45.67 | 3600 |
| A | www | 54.123.45.67 | 3600 |
| A | api | 54.123.45.67 | 3600 |

**Explanation:**
- `api` = API subdomain (api.zeneme.com)
- Useful if you want to separate frontend and backend URLs

---

## Step 3: DNS Configuration by Registrar

### GoDaddy

1. **Log in to GoDaddy**
2. **Go to "My Products"**
3. **Find zeneme.com** → Click "DNS"
4. **Click "Add"** to add new records
5. **Add A records:**
   - Type: `A`
   - Name: `@`
   - Value: `54.123.45.67`
   - TTL: `1 Hour`
   - Click "Save"
6. **Repeat for www:**
   - Type: `A`
   - Name: `www`
   - Value: `54.123.45.67`
   - TTL: `1 Hour`
   - Click "Save"

### Namecheap

1. **Log in to Namecheap**
2. **Go to "Domain List"**
3. **Click "Manage"** next to zeneme.com
4. **Go to "Advanced DNS" tab**
5. **Click "Add New Record"**
6. **Add A records:**
   - Type: `A Record`
   - Host: `@`
   - Value: `54.123.45.67`
   - TTL: `Automatic`
   - Click "Save"
7. **Repeat for www:**
   - Type: `A Record`
   - Host: `www`
   - Value: `54.123.45.67`
   - TTL: `Automatic`
   - Click "Save"

### Cloudflare

1. **Log in to Cloudflare**
2. **Select zeneme.com**
3. **Go to "DNS" tab**
4. **Click "Add record"**
5. **Add A records:**
   - Type: `A`
   - Name: `@`
   - IPv4 address: `54.123.45.67`
   - Proxy status: `Proxied` (orange cloud) or `DNS only` (gray cloud)
   - TTL: `Auto`
   - Click "Save"
6. **Repeat for www:**
   - Type: `A`
   - Name: `www`
   - IPv4 address: `54.123.45.67`
   - Proxy status: Same as above
   - TTL: `Auto`
   - Click "Save"

**Note**: If using Cloudflare proxy (orange cloud), you get free SSL and DDoS protection.

### Google Domains

1. **Log in to Google Domains**
2. **Select zeneme.com**
3. **Go to "DNS" tab**
4. **Scroll to "Custom resource records"**
5. **Add A records:**
   - Name: `@`
   - Type: `A`
   - TTL: `1h`
   - Data: `54.123.45.67`
   - Click "Add"
6. **Repeat for www:**
   - Name: `www`
   - Type: `A`
   - TTL: `1h`
   - Data: `54.123.45.67`
   - Click "Add"

### Other Registrars

The process is similar for all registrars:
1. Find DNS management or DNS settings
2. Add A records for `@` and `www`
3. Point both to your Elastic IP
4. Save changes

---

## Step 4: Verify DNS Configuration

### Wait for DNS Propagation

DNS changes take time to propagate globally:
- **Minimum**: 5-15 minutes
- **Typical**: 1-4 hours
- **Maximum**: 24-48 hours (rare)

### Check DNS Propagation

#### Method 1: Online Tools

**Recommended tools:**
- https://dnschecker.org
- https://www.whatsmydns.net
- https://mxtoolbox.com/SuperTool.aspx

**Steps:**
1. Go to dnschecker.org
2. Enter `zeneme.com`
3. Select "A" record type
4. Click "Search"
5. Check if your Elastic IP appears globally

#### Method 2: Command Line

**On macOS/Linux:**
```bash
# Check root domain
dig zeneme.com

# Check www subdomain
dig www.zeneme.com

# Check specific DNS server
dig @8.8.8.8 zeneme.com

# Simple lookup
nslookup zeneme.com
```

**Expected output:**
```
;; ANSWER SECTION:
zeneme.com.		3600	IN	A	54.123.45.67
```

**On Windows:**
```cmd
nslookup zeneme.com
nslookup www.zeneme.com
```

#### Method 3: Browser Test

Once DNS propagates:
```
http://zeneme.com
http://www.zeneme.com
http://54.123.45.67
```

All three should show the same content (your EC2 instance).

---

## Step 5: Configure Nginx on EC2

Your EC2 instance needs to be configured to respond to your domain name.

### Nginx Configuration

**File**: `/etc/nginx/sites-available/zeneme`

```nginx
# Redirect HTTP to HTTPS (after SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name zeneme.com www.zeneme.com;

    # For now, serve the application
    # Later, uncomment this to redirect to HTTPS
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:3000;  # Next.js frontend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;  # FastAPI backend
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Apply Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/zeneme /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

## Step 6: Set Up SSL Certificate (HTTPS)

Once DNS is working, set up free SSL with Let's Encrypt.

### Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Amazon Linux 2
sudo yum install certbot python3-certbot-nginx -y
```

### Obtain SSL Certificate

```bash
# Get certificate for both domains
sudo certbot --nginx -d zeneme.com -d www.zeneme.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Auto-Renewal

Certbot automatically sets up renewal. Verify:

```bash
# Test renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

### Updated Nginx Configuration (After SSL)

Certbot will automatically update your Nginx config to:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name zeneme.com www.zeneme.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name zeneme.com www.zeneme.com;

    ssl_certificate /etc/letsencrypt/live/zeneme.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zeneme.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Step 7: Update Application Configuration

### Frontend Environment Variables

**File**: `zeneme-next/.env.local`

```bash
# Update API URL to use domain
NEXT_PUBLIC_API_URL=https://zeneme.com/api

# Or if using api subdomain
# NEXT_PUBLIC_API_URL=https://api.zeneme.com
```

### Backend Environment Variables

**File**: `ai-chat-api/.env`

```bash
# Update allowed origins for CORS
ALLOWED_ORIGINS=https://zeneme.com,https://www.zeneme.com

# Database connection (if using RDS)
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/chat_db

# OpenAI API key
OPENAI_API_KEY=your-key-here
```

### Rebuild and Restart

```bash
# Frontend
cd zeneme-next
npm run build
sudo systemctl restart zeneme-frontend

# Backend
cd ai-chat-api
sudo systemctl restart zeneme-backend

# Nginx
sudo systemctl reload nginx
```

---

## Step 8: Security Group Configuration

Ensure your EC2 security group allows traffic:

### Required Inbound Rules

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS traffic |
| SSH | TCP | 22 | Your IP | SSH access |

### AWS Console Steps

1. **Go to EC2 Dashboard**
2. **Click "Security Groups"**
3. **Select your instance's security group**
4. **Click "Edit inbound rules"**
5. **Add rules:**
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
6. **Save rules**

### AWS CLI

```bash
# Get security group ID
aws ec2 describe-instances --instance-ids i-1234567890abcdef0 \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Add HTTP rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-1234567890abcdef0 \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-1234567890abcdef0 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

## Troubleshooting

### DNS Not Resolving

**Problem**: `zeneme.com` doesn't resolve to your IP

**Solutions:**
1. **Wait longer** - DNS propagation can take up to 48 hours
2. **Check DNS records** - Verify A records are correct at registrar
3. **Clear DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```
4. **Test with different DNS:**
   ```bash
   dig @8.8.8.8 zeneme.com  # Google DNS
   dig @1.1.1.1 zeneme.com  # Cloudflare DNS
   ```

### Connection Refused

**Problem**: DNS resolves but connection refused

**Solutions:**
1. **Check security group** - Ensure ports 80/443 are open
2. **Check Nginx status:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```
3. **Check application status:**
   ```bash
   sudo systemctl status zeneme-frontend
   sudo systemctl status zeneme-backend
   ```
4. **Check firewall:**
   ```bash
   sudo ufw status
   # If active, allow ports:
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

### SSL Certificate Issues

**Problem**: SSL certificate not working

**Solutions:**
1. **Verify DNS first** - SSL requires working DNS
2. **Check certificate:**
   ```bash
   sudo certbot certificates
   ```
3. **Renew certificate:**
   ```bash
   sudo certbot renew --force-renewal
   ```
4. **Check Nginx SSL config:**
   ```bash
   sudo nginx -t
   ```

### Wrong Content Displayed

**Problem**: Domain shows wrong website or default page

**Solutions:**
1. **Check Nginx server_name:**
   ```bash
   sudo nginx -T | grep server_name
   ```
2. **Verify proxy_pass targets:**
   ```bash
   sudo nginx -T | grep proxy_pass
   ```
3. **Check application logs:**
   ```bash
   sudo journalctl -u zeneme-frontend -n 50
   sudo journalctl -u zeneme-backend -n 50
   ```

---

## Alternative: Using AWS Route 53

If you want to manage DNS within AWS (optional but recommended for production):

### Benefits of Route 53

- ✅ Better integration with AWS services
- ✅ Health checks and failover
- ✅ Lower latency DNS queries
- ✅ Easy to manage from AWS Console
- ✅ Supports alias records (better than A records)

### Migration Steps

1. **Create Hosted Zone in Route 53:**
   ```bash
   aws route53 create-hosted-zone --name zeneme.com --caller-reference $(date +%s)
   ```

2. **Get Name Servers:**
   - AWS Console → Route 53 → Hosted Zones → zeneme.com
   - Note the 4 name servers (ns-xxx.awsdns-xx.com)

3. **Update Name Servers at Registrar:**
   - Go to your domain registrar
   - Find "Name Servers" or "DNS Settings"
   - Replace with Route 53 name servers
   - Save changes

4. **Create DNS Records in Route 53:**
   ```bash
   # Create A record for root domain
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z1234567890ABC \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "zeneme.com",
           "Type": "A",
           "TTL": 300,
           "ResourceRecords": [{"Value": "54.123.45.67"}]
         }
       }]
     }'

   # Create A record for www
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z1234567890ABC \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "www.zeneme.com",
           "Type": "A",
           "TTL": 300,
           "ResourceRecords": [{"Value": "54.123.45.67"}]
         }
       }]
     }'
   ```

5. **Wait for propagation** (usually faster with Route 53)

---

## Quick Reference Checklist

- [ ] Elastic IP allocated and associated with EC2 instance
- [ ] DNS A records created at domain registrar
  - [ ] @ → Elastic IP
  - [ ] www → Elastic IP
- [ ] DNS propagation verified (dnschecker.org)
- [ ] Security group allows ports 80 and 443
- [ ] Nginx installed and configured
- [ ] Nginx server_name includes your domain
- [ ] Application running and accessible via IP
- [ ] SSL certificate obtained with Certbot
- [ ] Application environment variables updated
- [ ] Application restarted after configuration changes
- [ ] Domain accessible via HTTPS

---

## Summary

**Basic Setup (HTTP only):**
1. Get Elastic IP from AWS
2. Add A records at domain registrar
3. Configure Nginx with domain name
4. Wait for DNS propagation
5. Test: http://zeneme.com

**Production Setup (HTTPS):**
1. Complete basic setup
2. Install Certbot
3. Obtain SSL certificate
4. Configure automatic renewal
5. Update application URLs
6. Test: https://zeneme.com

**Estimated Time:**
- DNS configuration: 5-10 minutes
- DNS propagation: 1-4 hours
- SSL setup: 10-15 minutes
- Total: 2-5 hours (mostly waiting for DNS)

Your domain will be live at:
- https://zeneme.com
- https://www.zeneme.com

Good luck with your deployment! 🚀
