# SSL Certificate Setup Guide (Let's Encrypt)

## Overview
This guide shows you how to generate free SSL certificates for `www.zeneme.ai` using Let's Encrypt and Certbot.

## Prerequisites

1. **Domain Name**: `www.zeneme.ai` and `zeneme.ai` pointing to your EC2 server
2. **EC2 Server**: Running Ubuntu/Debian with public IP
3. **Nginx**: Installed and running
4. **Port 80 & 443**: Open in EC2 security group
5. **Root Access**: SSH access to your EC2 server

## Step-by-Step Setup

### Step 1: Verify DNS Configuration

Before generating certificates, ensure your domain points to your EC2 server.

```bash
# Check DNS resolution
nslookup www.zeneme.ai
nslookup zeneme.ai

# Should return your EC2 public IP address
# Example: 13.55.236.142
```

**If DNS is not configured:**
1. Go to your domain registrar (e.g., GoDaddy, Namecheap, Alibaba Cloud)
2. Add A records:
   - `www.zeneme.ai` → `13.55.236.142` (your EC2 IP)
   - `zeneme.ai` → `13.55.236.142` (your EC2 IP)
3. Wait 5-60 minutes for DNS propagation

### Step 2: Connect to EC2 Server

```bash
# SSH into your EC2 server
ssh -i your-key.pem ubuntu@13.55.236.142

# Or if you're already connected, continue
```

### Step 3: Install Certbot

```bash
# Update package list
sudo apt update

# Install Certbot and Nginx plugin
sudo apt install certbot python3-certbot-nginx -y

# Verify installation
certbot --version
# Should show: certbot 1.x.x or higher
```

### Step 4: Configure Nginx (Temporary)

Before running Certbot, create a basic Nginx configuration:

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/zeneme
```

**Add this temporary configuration:**

```nginx
# Temporary HTTP server for certificate generation
server {
    listen 80;
    server_name www.zeneme.ai zeneme.ai;

    # Root directory for Let's Encrypt verification
    root /var/www/html;

    location / {
        # Temporary: return 200 for testing
        return 200 "Server is running\n";
        add_header Content-Type text/plain;
    }
}
```

**Enable the site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/zeneme /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Test HTTP access:**

```bash
# From your local machine
curl http://www.zeneme.ai
# Should return: "Server is running"
```

### Step 5: Generate SSL Certificates

Now run Certbot to generate certificates:

```bash
# Generate certificates for both domains
sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai
```

**You'll be prompted with:**

1. **Email address**: Enter your email (for renewal notifications)
   ```
   Enter email address: your-email@example.com
   ```

2. **Terms of Service**: Type `Y` to agree
   ```
   Please read the Terms of Service at https://letsencrypt.org/documents/LE-SA-v1.3-September-21-2022.pdf
   (A)gree/(C)ancel: A
   ```

3. **Share email**: Type `N` (optional)
   ```
   Would you be willing to share your email address with EFF?
   (Y)es/(N)o: N
   ```

4. **Redirect HTTP to HTTPS**: Type `2` (recommended)
   ```
   Please choose whether or not to redirect HTTP traffic to HTTPS
   1: No redirect
   2: Redirect - Make all requests redirect to secure HTTPS access
   Select: 2
   ```

**Expected output:**

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/www.zeneme.ai/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/www.zeneme.ai/privkey.pem
This certificate expires on 2026-05-25.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Congratulations! You have successfully enabled HTTPS on https://www.zeneme.ai and https://zeneme.ai
```

### Step 6: Verify Certificate Files

```bash
# Check certificate files exist
sudo ls -la /etc/letsencrypt/live/www.zeneme.ai/

# Should show:
# fullchain.pem  -> ../../archive/www.zeneme.ai/fullchain1.pem
# privkey.pem    -> ../../archive/www.zeneme.ai/privkey1.pem
# cert.pem       -> ../../archive/www.zeneme.ai/cert1.pem
# chain.pem      -> ../../archive/www.zeneme.ai/chain1.pem
```

**File descriptions:**
- `fullchain.pem`: Certificate + intermediate certificates (use this in Nginx)
- `privkey.pem`: Private key (use this in Nginx)
- `cert.pem`: Your certificate only
- `chain.pem`: Intermediate certificates only

### Step 7: Update Nginx Configuration

Now update your Nginx config with the full production configuration:

```bash
sudo nano /etc/nginx/sites-available/zeneme
```

**Replace with:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name www.zeneme.ai zeneme.ai;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl;
    http2 on;
    server_name www.zeneme.ai zeneme.ai;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/www.zeneme.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.zeneme.ai/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (uploads)
    location /uploads {
        proxy_pass http://localhost:8000/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Test and reload:**

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 8: Test HTTPS

```bash
# Test from local machine
curl -I https://www.zeneme.ai
# Should return: HTTP/2 200

# Test HTTP redirect
curl -I http://www.zeneme.ai
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://www.zeneme.ai/

# Test in browser
# Open: https://www.zeneme.ai
# Should show padlock icon 🔒
```

### Step 9: Verify Auto-Renewal

Certbot automatically sets up certificate renewal. Verify it:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal (dry run - doesn't actually renew)
sudo certbot renew --dry-run

# Expected output:
# Congratulations, all simulated renewals succeeded
```

**Certificates auto-renew:**
- Certificates expire in 90 days
- Certbot checks twice daily
- Auto-renews when < 30 days remain
- No manual action needed

### Step 10: Check Certificate Details

```bash
# View certificate expiry date
sudo certbot certificates

# Expected output:
# Certificate Name: www.zeneme.ai
#   Domains: www.zeneme.ai zeneme.ai
#   Expiry Date: 2026-05-25 12:34:56+00:00 (VALID: 89 days)
#   Certificate Path: /etc/letsencrypt/live/www.zeneme.ai/fullchain.pem
#   Private Key Path: /etc/letsencrypt/live/www.zeneme.ai/privkey.pem
```

## Troubleshooting

### Issue 1: DNS Not Resolving

**Error**: `Failed to connect to www.zeneme.ai`

**Solution**:
```bash
# Check DNS
nslookup www.zeneme.ai

# If not resolving, wait for DNS propagation (up to 48 hours)
# Or check domain registrar settings
```

### Issue 2: Port 80/443 Not Open

**Error**: `Connection refused` or `Timeout`

**Solution**:
```bash
# Check EC2 Security Group
# Ensure these rules exist:
# - Type: HTTP, Port: 80, Source: 0.0.0.0/0
# - Type: HTTPS, Port: 443, Source: 0.0.0.0/0

# Check if Nginx is listening
sudo netstat -tlnp | grep nginx
# Should show: 0.0.0.0:80 and 0.0.0.0:443
```

### Issue 3: Certificate Generation Failed

**Error**: `Failed authorization procedure`

**Solution**:
```bash
# Ensure Nginx is running
sudo systemctl status nginx

# Ensure port 80 is accessible
curl http://www.zeneme.ai

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Try again with verbose output
sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai --verbose
```

### Issue 4: Permission Denied

**Error**: `Permission denied` when accessing certificate files

**Solution**:
```bash
# Certificate files are owned by root
# Nginx runs as root, so this is normal
# Don't change permissions on certificate files

# If needed, verify Nginx user
ps aux | grep nginx
# Should show: root and www-data users
```

### Issue 5: Certificate Already Exists

**Error**: `Certificate already exists`

**Solution**:
```bash
# Renew existing certificate
sudo certbot renew --force-renewal

# Or delete and recreate
sudo certbot delete --cert-name www.zeneme.ai
sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai
```

## Manual Renewal (If Needed)

```bash
# Renew all certificates
sudo certbot renew

# Renew specific certificate
sudo certbot renew --cert-name www.zeneme.ai

# Force renewal (even if not expiring soon)
sudo certbot renew --force-renewal

# After renewal, reload Nginx
sudo systemctl reload nginx
```

## Certificate Files Location

```
/etc/letsencrypt/
├── live/
│   └── www.zeneme.ai/
│       ├── fullchain.pem  → Use in Nginx (ssl_certificate)
│       ├── privkey.pem    → Use in Nginx (ssl_certificate_key)
│       ├── cert.pem
│       └── chain.pem
├── archive/
│   └── www.zeneme.ai/
│       ├── fullchain1.pem  (actual file)
│       ├── privkey1.pem    (actual file)
│       └── ...
└── renewal/
    └── www.zeneme.ai.conf  (renewal configuration)
```

## Security Best Practices

1. **Never share private key**: Keep `privkey.pem` secure
2. **Use strong SSL protocols**: TLSv1.2 and TLSv1.3 only
3. **Enable HSTS**: Force HTTPS for 1 year
4. **Monitor expiry**: Check certificate status monthly
5. **Test renewal**: Run dry-run tests quarterly

## Quick Reference Commands

```bash
# Generate certificate
sudo certbot --nginx -d www.zeneme.ai -d zeneme.ai

# List certificates
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Delete certificate
sudo certbot delete --cert-name www.zeneme.ai

# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View certificate expiry
echo | openssl s_client -servername www.zeneme.ai -connect www.zeneme.ai:443 2>/dev/null | openssl x509 -noout -dates
```

## Next Steps

1. ✅ Generate SSL certificates
2. ✅ Configure Nginx for HTTPS
3. ✅ Test HTTPS access
4. ✅ Verify auto-renewal
5. 📋 Update application to use HTTPS URLs
6. 📋 Test all features over HTTPS
7. 📋 Monitor certificate expiry

## Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/) - Test your SSL configuration
