#!/bin/bash

# VPS Upload Script
# This script uploads the worker files to your VPS

VPS_IP="142.171.246.247"
VPS_USER="root"
VPS_PATH="/opt/email-verifier"

echo "🚀 Uploading worker files to VPS..."
echo "📡 VPS IP: $VPS_IP"
echo "📁 Destination: $VPS_PATH"
echo ""
echo "⚠️  You will be prompted for the password: 1ayY46X18k"
echo ""

# Upload files
scp -r vps-worker/* ${VPS_USER}@${VPS_IP}:${VPS_PATH}/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Files uploaded successfully!"
    echo ""
    echo "Next steps:"
    echo "1. SSH into VPS: ssh root@$VPS_IP"
    echo "2. Go to directory: cd $VPS_PATH"
    echo "3. Install dependencies: npm install"
    echo "4. Install browsers: npm run install-browsers"
    echo "5. Configure: cp .env.example .env && nano .env"
    echo "6. Start worker: pm2 start worker.js --name email-verifier"
else
    echo ""
    echo "❌ Upload failed. Please check:"
    echo "- VPS is accessible"
    echo "- Password is correct"
    echo "- Directory exists on VPS"
fi
