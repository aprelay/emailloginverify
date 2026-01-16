#!/bin/bash

# Complete VPS Worker Setup Script
# Run this script on your VPS after uploading files

set -e  # Exit on error

echo "🚀 Email Verifier Worker - Complete Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 18
echo -e "${BLUE}📦 Installing Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"

# Create directory
echo -e "${BLUE}📁 Creating application directory...${NC}"
mkdir -p /opt/email-verifier
cd /opt/email-verifier

# Install system dependencies for Playwright
echo -e "${BLUE}📦 Installing system dependencies...${NC}"
apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2

# Check if files exist
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Worker files not found!${NC}"
    echo "Please upload files first:"
    echo "  scp -r vps-worker/* root@142.171.246.247:/opt/email-verifier/"
    exit 1
fi

# Install Node.js dependencies
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
npm install

# Install Playwright browsers
echo -e "${BLUE}🎭 Installing Playwright browsers (this may take a few minutes)...${NC}"
npm run install-browsers

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${BLUE}⚙️  Creating configuration file...${NC}"
    cp .env.example .env
    
    # Update .env with correct API endpoint
    sed -i 's|API_ENDPOINT=.*|API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai|g' .env
    
    echo -e "${GREEN}✅ Configuration file created: .env${NC}"
    echo "Review and edit if needed: nano .env"
fi

# Install PM2 globally
echo -e "${BLUE}📦 Installing PM2 process manager...${NC}"
npm install -g pm2

# Start worker
echo -e "${BLUE}🚀 Starting worker...${NC}"
pm2 delete email-verifier 2>/dev/null || true
pm2 start worker.js --name email-verifier

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
echo -e "${BLUE}⚙️  Setting up auto-start on reboot...${NC}"
pm2 startup systemd -u root --hp /root

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Worker Status:"
pm2 status
echo ""
echo "View logs:"
echo "  pm2 logs email-verifier"
echo ""
echo "Useful commands:"
echo "  pm2 status                    - Check worker status"
echo "  pm2 logs email-verifier       - View live logs"
echo "  pm2 restart email-verifier    - Restart worker"
echo "  pm2 stop email-verifier       - Stop worker"
echo ""
echo "🌐 Web Interface: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai"
echo ""
echo "📝 Check logs now:"
pm2 logs email-verifier --lines 10 --nostream
