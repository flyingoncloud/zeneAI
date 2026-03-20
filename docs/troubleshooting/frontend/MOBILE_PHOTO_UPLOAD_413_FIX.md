# Mobile Photo Upload 413 Error Fix

## Problem
Mobile photo uploads were failing with HTTP 413 "Request Entity Too Large" error, while laptop uploads worked fine.

## Root Cause
Mobile phone cameras produce larger image files (often 5-10MB) compared to typical laptop webcam photos. The nginx configuration was missing the `client_max_body_size` directive, causing it to use the default 1MB limit.

## Error Details
```
ERROR Error uploading file: Error: HTTP error! status: 413
ERROR File upload error: Error: HTTP error! status: 413
```

HTTP 413 means the request body (uploaded file) exceeded the server's configured maximum size.

## Solution

### 1. Updated nginx Configuration
Added `client_max_body_size 20M;` to the HTTPS server block in `ai-chat-api/ops/zenewe.conf`:

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name www.zenewe.ai zenewe.ai;

    # Increase upload size limit for images
    client_max_body_size 20M;

    # ... rest of config
}
```

### 2. Deployment Script
Created `update-nginx-upload-limit.sh` to safely update and reload nginx configuration.

## Deployment Steps

On your EC2 server, run:

```bash
# Pull the latest changes
git pull origin ai-chat-api-v2

# Run the update script
./update-nginx-upload-limit.sh
```

The script will:
1. Copy the updated config to `/etc/nginx/sites-available/`
2. Test the configuration with `nginx -t`
3. Reload nginx if the test passes

## Verification

After deployment, test by:
1. Opening the site on mobile
2. Uploading a photo from your phone's camera
3. Should now succeed with photos up to 20MB

## Technical Notes

- Backend already had 5MB limit in FastAPI (`max_size = 5 * 1024 * 1024`)
- Nginx default is 1MB if `client_max_body_size` is not set
- Set to 20MB to provide headroom for future needs
- Mobile photos are typically 3-8MB depending on camera quality

## Files Modified
- `ai-chat-api/ops/zenewe.conf` - Added client_max_body_size directive
- `update-nginx-upload-limit.sh` - Deployment script (new)
- `zeneme-next/src/components/ChatInput.tsx` - Added debug logging
- `zeneme-next/src/components/shared/GlobalFeedback.tsx` - Improved toast visibility
