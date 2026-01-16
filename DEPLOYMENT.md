# Deployment Guide - Email Verifier System

Complete guide for deploying the Email Verifier system to production.

## 📋 Deployment Checklist

- [ ] Cloudflare account created
- [ ] GitHub repository created
- [ ] VPS server provisioned (2GB+ RAM)
- [ ] Domain configured (optional)
- [ ] Proxy service account (recommended)

## 🌐 Part 1: Deploy to Cloudflare Pages

### Step 1: Setup Cloudflare API Key

```bash
# In this sandbox, run:
# This will configure your Cloudflare authentication
# If it fails, go to the Deploy tab to add your API key
```

### Step 2: Create Production D1 Database

```bash
cd /home/user/webapp

# Create production database
npx wrangler d1 create webapp-production

# Copy the database_id from output and update wrangler.jsonc
# Replace "to-be-created" with the actual database ID
```

### Step 3: Update wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webapp",
  "compatibility_date": "2026-01-16",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "YOUR-DATABASE-ID-HERE"  // Replace this
    }
  ]
}
```

### Step 4: Apply Migrations to Production

```bash
# Apply database schema to production
npm run db:migrate:prod

# Seed with default API token
npx wrangler d1 execute webapp-production --file=./seed.sql
```

### Step 5: Build and Deploy

```bash
# Build the application
npm run build

# Create Cloudflare Pages project
npx wrangler pages project create webapp \
  --production-branch main \
  --compatibility-date 2026-01-16

# Deploy to production
npm run deploy:prod

# You'll receive URLs:
# Production: https://webapp.pages.dev
# Branch: https://main.webapp.pages.dev
```

### Step 6: Get Production API Token

```bash
# Query the database to get your API token
npx wrangler d1 execute webapp-production --command="SELECT token FROM api_tokens WHERE is_active = 1"

# Output will show: dev-token-change-in-production
# IMPORTANT: Change this in production!
```

### Step 7: Create Secure API Token (Recommended)

```bash
# Generate a secure random token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Insert new token into production database
npx wrangler d1 execute webapp-production --command="INSERT INTO api_tokens (token, name) VALUES ('YOUR-SECURE-TOKEN-HERE', 'Production VPS Worker')"

# Deactivate default token
npx wrangler d1 execute webapp-production --command="UPDATE api_tokens SET is_active = 0 WHERE token = 'dev-token-change-in-production'"
```

## 🖥️ Part 2: Setup VPS Worker

### Step 1: Provision VPS

**Recommended providers:**
- DigitalOcean (Droplet)
- Linode
- Vultr
- AWS Lightsail
- Google Cloud Compute Engine

**Minimum specs:**
- 2GB RAM
- 2 CPU cores
- 20GB storage
- Ubuntu 22.04 LTS

### Step 2: Initial VPS Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version

# Create application directory
mkdir -p /opt/email-verifier
cd /opt/email-verifier
```

### Step 3: Upload Worker Files

**Option A: Manual upload**
```bash
# From your local machine
cd /home/user/webapp
scp -r vps-worker/* root@your-vps-ip:/opt/email-verifier/
```

**Option B: Git clone (recommended)**
```bash
# On VPS
cd /opt/email-verifier
# Clone your repository
git clone https://github.com/your-username/email-verifier.git .
cd vps-worker
```

### Step 4: Install Dependencies

```bash
cd /opt/email-verifier

# Install Node.js dependencies
npm install

# Install Playwright browsers
npm run install-browsers

# Install system dependencies for Playwright
apt install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libcairo2
```

### Step 5: Configure Worker

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Update `.env` file:
```env
# Your Cloudflare Pages URL
API_ENDPOINT=https://webapp.pages.dev

# Your secure API token from Step 7
API_TOKEN=your-secure-token-from-production-database

# Worker settings
POLL_INTERVAL=5000
MAX_RETRIES=3
HEADLESS=true
TIMEOUT=30000

# Optional: Add proxy for better success rate
# PROXY_SERVER=http://your-proxy-server:port
# PROXY_USERNAME=your-proxy-username
# PROXY_PASSWORD=your-proxy-password
```

### Step 6: Test Worker

```bash
# Test run
node worker.js

# You should see:
# 🚀 Email Verification Worker Starting...
# 📡 API Endpoint: https://webapp.pages.dev
# ✅ Worker initialized successfully
# ⏳ Starting worker loop...
# ⏳ Polling for new jobs...

# Press Ctrl+C to stop
```

### Step 7: Setup as System Service

**Option A: systemd (recommended for production)**

```bash
# Create service file
nano /etc/systemd/system/email-verifier.service
```

Add content:
```ini
[Unit]
Description=Email Verification Worker
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/email-verifier
ExecStart=/usr/bin/node worker.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/email-verifier.log
StandardError=append:/var/log/email-verifier-error.log

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
# Reload systemd
systemctl daemon-reload

# Enable auto-start on boot
systemctl enable email-verifier

# Start service
systemctl start email-verifier

# Check status
systemctl status email-verifier

# View logs
tail -f /var/log/email-verifier.log
```

**Option B: PM2 (easier management)**

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start worker.js --name email-verifier

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup

# Useful commands
pm2 status
pm2 logs email-verifier
pm2 restart email-verifier
pm2 stop email-verifier
```

## 🔐 Part 3: Security Hardening

### Firewall Setup

```bash
# Install UFW
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow outbound HTTPS (for API and web scraping)
ufw allow out 443/tcp

# Enable firewall
ufw enable
```

### Create Non-Root User (Recommended)

```bash
# Create user
adduser verifier

# Add to sudo group
usermod -aG sudo verifier

# Switch ownership
chown -R verifier:verifier /opt/email-verifier

# Update systemd service to use new user
nano /etc/systemd/system/email-verifier.service
# Change: User=root to User=verifier

# Reload and restart
systemctl daemon-reload
systemctl restart email-verifier
```

## 🌐 Part 4: Proxy Configuration (Recommended)

### Why Use Proxies?

- Avoid IP blocks from Gmail/Office365
- Higher success rate for bulk verification
- Bypass rate limiting
- Better geographic distribution

### Recommended Proxy Providers

1. **BrightData** (formerly Luminati)
   - Best: Residential proxies
   - URL: https://brightdata.com

2. **Oxylabs**
   - Good: Datacenter and residential
   - URL: https://oxylabs.io

3. **Smartproxy**
   - Budget-friendly option
   - URL: https://smartproxy.com

### Configure Proxy

```bash
# Edit worker .env
nano /opt/email-verifier/.env
```

Add proxy settings:
```env
PROXY_SERVER=http://proxy.example.com:8080
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password
```

Restart worker:
```bash
systemctl restart email-verifier
# or
pm2 restart email-verifier
```

## 📊 Part 5: Monitoring & Maintenance

### Check Worker Status

```bash
# systemd
systemctl status email-verifier
journalctl -u email-verifier -f

# PM2
pm2 status
pm2 logs email-verifier --lines 100
```

### Monitor Performance

```bash
# Check CPU and memory
top
htop

# Check disk usage
df -h

# Check network connections
netstat -tupln
```

### Database Maintenance

```bash
# Check queue size
npx wrangler d1 execute webapp-production --command="SELECT COUNT(*) FROM verification_queue WHERE status = 'pending'"

# View recent results
npx wrangler d1 execute webapp-production --command="SELECT * FROM verification_queue ORDER BY created_at DESC LIMIT 10"

# Clear old data
npx wrangler d1 execute webapp-production --command="DELETE FROM verification_queue WHERE completed_at < datetime('now', '-30 days')"
```

## 🔄 Part 6: Updates & Upgrades

### Update Worker Code

```bash
# SSH to VPS
cd /opt/email-verifier

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Restart service
systemctl restart email-verifier
# or
pm2 restart email-verifier
```

### Update Cloudflare App

```bash
# In development environment
cd /home/user/webapp

# Make changes, commit
git add .
git commit -m "Update feature"
git push origin main

# Rebuild and deploy
npm run build
npm run deploy:prod
```

## 🚨 Troubleshooting

### Worker not connecting to API

1. Check API endpoint URL in .env
2. Verify API token is correct
3. Test API from VPS: `curl https://your-app.pages.dev/api/worker/stats -H "X-API-Token: your-token"`
4. Check firewall rules

### High failure rate

1. Add proxy configuration
2. Increase timeout in .env
3. Check worker logs for specific errors
4. Verify credentials are correct

### Worker crashes

1. Check logs: `journalctl -u email-verifier -n 100`
2. Verify system dependencies installed
3. Check available RAM: `free -h`
4. Increase restart delay in systemd

## 📞 Getting Help

- Check worker logs first
- Review API endpoint health
- Test manual API calls with curl
- Verify database migrations applied
- Check VPS resources (RAM, CPU, disk)

---

**Deployment Complete!** 🎉

Your email verification system is now live and ready to process jobs.
