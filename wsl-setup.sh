#!/bin/bash

# Complete WSL Ubuntu Setup Script
# Run this in Ubuntu (WSL) terminal

echo "🚀 Email Verifier Worker - WSL Ubuntu Setup"
echo "============================================"
echo ""

# Create directory
mkdir -p ~/email-verifier
cd ~/email-verifier

# Create package.json
cat > package.json << 'EOFPKG'
{
  "name": "email-verifier-worker",
  "version": "1.0.0",
  "description": "Email verification worker using Playwright",
  "type": "module",
  "main": "worker.js",
  "scripts": {
    "start": "node worker.js",
    "install-browsers": "npx playwright install chromium"
  },
  "dependencies": {
    "playwright": "^1.48.0",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0"
  }
}
EOFPKG

# Create .env
cat > .env << 'EOFENV'
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=5000
MAX_RETRIES=3
HEADLESS=true
TIMEOUT=30000
EOFENV

# Create worker.js - Copy from /home/user/webapp/vps-worker/worker.js
echo "Creating worker.js..."

# Note: You'll need to copy the worker.js content here
# For now, let's create a placeholder that tells user to copy it

cat > worker.js << 'EOFWORKER'
// Worker.js will be created in next step
// Please see MANUAL_VPS_SETUP.md for the full worker.js content
console.log('Worker placeholder - replace with actual worker.js content');
EOFWORKER

echo ""
echo "✅ Files created in ~/email-verifier"
echo ""
echo "Next steps:"
echo "1. Copy worker.js content from MANUAL_VPS_SETUP.md"
echo "2. Run: npm install"
echo "3. Run: npm run install-browsers"
echo "4. Run: node worker.js"
echo ""
