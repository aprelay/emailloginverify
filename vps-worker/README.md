# VPS Worker - Email Existence Verification Service

This is the worker service that runs on your VPS to check if email accounts exist using Playwright browser automation.

## ⚡ Quick Start

```bash
npm install
npm run install-browsers
cp .env.example .env
# Edit .env with your settings
npm start
```

## 🎯 What This Does

**NO PASSWORDS REQUIRED!** This worker checks if email accounts exist by:

1. Opening Office365/Gmail login page
2. Entering the email address
3. Clicking "Next"
4. Checking the response:
   - **Password field appears** → Email EXISTS (Valid ✅)
   - **"Account not found" error** → Email DOESN'T EXIST (Strong Bounce 🚫)

## 📋 Installation

### Prerequisites
- Node.js 18+ installed
- **Standard VPS with 2GB+ RAM** (NOT email-specialized VPS)
- **NO port 25 required** (we're not sending emails)
- Ubuntu 22.04 or similar Linux distribution

### Setup Steps

1. **SSH into your VPS:**
```bash
ssh root@your-vps-ip
```

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

3. **Create application directory:**
```bash
mkdir -p /opt/email-verifier
cd /opt/email-verifier
```

4. **Upload worker files:**
```bash
# From your local machine:
scd /home/user/webapp
scp -r vps-worker/* root@your-vps-ip:/opt/email-verifier/
```

5. **Install dependencies:**
```bash
npm install
```

6. **Install Playwright browsers:**
```bash
npm run install-browsers
```

7. **Install system dependencies:**
```bash
apt-get update
apt-get install -y \
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

8. **Configure environment:**
```bash
cp .env.example .env
nano .env
```

Update the following variables:
```env
API_ENDPOINT=https://your-app.pages.dev
API_TOKEN=dev-token-change-in-production
HEADLESS=true
POLL_INTERVAL=5000
```

9. **Test the worker:**
```bash
npm start
```

You should see:
```
🚀 Email Verification Worker Starting...
📡 API Endpoint: https://your-app.pages.dev
🔍 Verification Method: Email Existence Check (No Password Required)
✅ Worker initialized successfully
⏳ Starting worker loop...
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_ENDPOINT` | `http://localhost:3000` | Your Cloudflare Pages URL |
| `API_TOKEN` | `dev-token-change-in-production` | API token from database |
| `POLL_INTERVAL` | `5000` | How often to check for new jobs (ms) |
| `MAX_RETRIES` | `3` | Max retry attempts for failed jobs |
| `HEADLESS` | `true` | Run browser in headless mode |
| `TIMEOUT` | `30000` | Timeout for browser operations (ms) |
| `PROXY_SERVER` | - | Optional proxy server URL |
| `PROXY_USERNAME` | - | Optional proxy username |
| `PROXY_PASSWORD` | - | Optional proxy password |

### Example Configuration

**For Development/Testing:**
```env
API_ENDPOINT=http://localhost:3000
API_TOKEN=dev-token-change-in-production
HEADLESS=false
POLL_INTERVAL=3000
```

**For Production:**
```env
API_ENDPOINT=https://your-app.pages.dev
API_TOKEN=your-secure-random-token-here
HEADLESS=true
POLL_INTERVAL=5000
```

**With Proxy (Recommended for production):**
```env
API_ENDPOINT=https://your-app.pages.dev
API_TOKEN=your-secure-random-token-here
HEADLESS=true
PROXY_SERVER=http://proxy.example.com:8080
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password
```

## 🚀 Running as a Service

### Option 1: systemd (Recommended)

Create service file:
```bash
sudo nano /etc/systemd/system/email-verifier.service
```

Add content:
```ini
[Unit]
Description=Email Existence Verification Worker
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
sudo systemctl daemon-reload
sudo systemctl enable email-verifier
sudo systemctl start email-verifier
sudo systemctl status email-verifier
```

View logs:
```bash
sudo journalctl -u email-verifier -f
# or
tail -f /var/log/email-verifier.log
```

### Option 2: PM2 (Easier)

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start worker.js --name email-verifier

# Save configuration
pm2 save

# Setup auto-start on boot
pm2 startup
# Follow the instructions it prints

# Useful commands
pm2 status
pm2 logs email-verifier
pm2 logs email-verifier --lines 100
pm2 restart email-verifier
pm2 stop email-verifier
pm2 delete email-verifier
```

## 🌐 Proxy Configuration (Recommended)

Using a proxy improves success rate and prevents IP blocks.

### Why Use Proxies?

- **Avoid IP blocks** from Gmail/Office365
- **Higher success rate** for bulk verification
- **Better anonymity** and distribution
- **Bypass rate limiting**

### Recommended Proxy Providers

1. **BrightData** (formerly Luminati)
   - Best: Residential proxies
   - Price: ~$500/mo (40GB)
   - URL: https://brightdata.com
   - Best for: High-volume production

2. **Oxylabs**
   - Good: Datacenter and residential
   - Price: ~$300/mo
   - URL: https://oxylabs.io
   - Best for: Balance of price/quality

3. **Smartproxy**
   - Budget: Good quality, lower price
   - Price: ~$75/mo (5GB)
   - URL: https://smartproxy.com
   - Best for: Small-medium scale

4. **IPRoyal**
   - Budget: Cheap residential proxies
   - Price: ~$50/mo (5GB)
   - URL: https://iproyal.com
   - Best for: Budget projects

5. **Webshare**
   - Free tier available
   - Price: Free (10 proxies) or $2.99/mo
   - URL: https://webshare.io
   - Best for: Testing/development

### Configure Proxy

```bash
nano .env
```

Add:
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

## 📊 Monitoring

### Check Worker Status

```bash
# systemd
sudo systemctl status email-verifier

# PM2
pm2 status
pm2 logs email-verifier --lines 50
```

### View Statistics

The worker prints statistics every 60 seconds:
```
📊 Statistics:
  Uptime: 3600s
  Processed: 1250
  Valid (exists): 876
  Invalid (bounces): 352
  Errors: 22
```

### Monitor Performance

```bash
# CPU and memory usage
top
htop

# Disk usage
df -h

# Network connections
netstat -tupln | grep node

# Worker process
ps aux | grep worker
```

## 🐛 Troubleshooting

### Worker can't connect to API
**Problem:** `Network Error: Cannot connect to API`

**Solutions:**
1. Check API_ENDPOINT is correct: `echo $API_ENDPOINT`
2. Test connection: `curl https://your-app.pages.dev/api/stats`
3. Check firewall: `ufw status`
4. Verify DNS resolution: `ping your-app.pages.dev`

### Browser launch fails
**Problem:** `Error: Failed to launch browser`

**Solutions:**
```bash
# Install missing dependencies
apt-get update
apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2

# Reinstall Playwright
npm run install-browsers
```

### High memory usage
**Problem:** Worker using too much RAM

**Solutions:**
1. Use headless mode: `HEADLESS=true`
2. Increase poll interval: `POLL_INTERVAL=10000`
3. Run one worker per VPS (don't run multiple instances)
4. Upgrade VPS to 4GB RAM

### High "invalid" or "error" rate
**Problem:** Most emails return "invalid" or "error"

**Solutions:**
1. **Add proxy** - Most important!
2. Increase timeout: `TIMEOUT=60000`
3. Check for CAPTCHA in logs
4. Use residential proxy (not datacenter)
5. Reduce processing speed: `POLL_INTERVAL=10000`

### Jobs get stuck in "processing"
**Problem:** Jobs never complete

**Solutions:**
1. Check worker logs: `pm2 logs email-verifier`
2. Restart worker: `pm2 restart email-verifier`
3. Check VPS memory: `free -h`
4. Kill zombie processes: `pkill -9 chromium`

## 🎯 Performance Tips

1. **Use proxy** - Dramatically improves success rate
2. **Single worker per VPS** - Don't run multiple instances on same VPS
3. **Multiple VPS for scale** - Use 2-3 VPS with different IPs
4. **Adjust poll interval** - Increase if hitting rate limits
5. **Monitor logs** - Watch for patterns in errors
6. **Use headless mode** - Saves resources in production

## 📈 Scaling

### Single VPS (2GB RAM)
- Process ~500-1000 emails/hour
- Sequential processing
- Suitable for small batches

### Multiple VPS (3x 2GB RAM)
- Process ~1500-3000 emails/hour
- Parallel processing across workers
- Each worker polls same queue
- Better distribution and reliability

### With Proxy Rotation
- Process ~2000-4000 emails/hour
- Much higher success rate
- Avoid IP blocks
- Essential for large-scale verification

## 🔐 Security Notes

- Keep API_TOKEN secure
- Don't commit .env to git
- Use HTTPS for API_ENDPOINT
- Regularly rotate API tokens
- Monitor for unauthorized access
- Use firewall rules (UFW)

## 📝 Logs

### View Logs

```bash
# systemd
sudo journalctl -u email-verifier -f
tail -f /var/log/email-verifier.log

# PM2
pm2 logs email-verifier
pm2 logs email-verifier --lines 200
```

### Log Format

```
🔍 Processing Job #123
  Email: test@outlook.com
  Provider: office365
  ✅ Result: valid
  📝 Details: Account exists - password field displayed
```

## 🆘 Getting Help

1. Check logs first: `pm2 logs email-verifier`
2. Verify configuration: `cat .env`
3. Test API connection: `curl ${API_ENDPOINT}/api/stats`
4. Check system resources: `free -h && df -h`
5. Review worker README.md
6. Check main project DEPLOYMENT.md

---

**Worker Version**: 1.0  
**Method**: Email Existence Check  
**No Passwords Required**: Just email addresses  
**Playwright Version**: 1.48+  
**Node Version**: 18+
