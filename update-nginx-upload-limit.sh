#!/bin/bash
# Update nginx configuration to allow larger file uploads

echo "Updating nginx configuration for file uploads..."

# Copy the updated config
sudo cp ai-chat-api/ops/zenewe.conf /etc/nginx/sites-available/zenewe.conf

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration test passed. Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
    echo "Upload limit is now set to 20MB"
else
    echo "❌ Configuration test failed. Please check the config file."
    exit 1
fi
