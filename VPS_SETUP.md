# VPS Setup Instructions

## Your VPS Details
- **IP Address**: 142.171.246.247
- **Username**: root
- **Password**: 1ayY46X18k
- **OS**: Ubuntu 22.04 LTS (assumed)

## Complete Setup Script

### Step 1: Connect to VPS

```bash
ssh root@142.171.246.247
# Enter password: 1ayY46X18k
```

### Step 2: Run Complete Setup (Copy & Paste All)

```bash
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

# You'll need to upload files here - see next step
```

### Step 3: Upload Worker Files

**On your local machine** (in the sandbox), run:

```bash
cd /home/user/webapp
scp -r vps-worker/* root@142.171.246.247:/opt/email-verifier/
# Enter password when prompted: 1ayY46X18k
```

### Step 4: Continue on VPS

```bash
cd /opt/email-verifier

# Install Node.js dependencies
npm install

# Install Playwright browsers
npm run install-browsers

# Install system dependencies
apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2

# Create configuration
cp .env.example .env
nano .env
```

### Step 5: Configure .env File

Replace the content with:

```env
# API Endpoint (your Cloudflare Pages URL)
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai

# API Token (from your database)
API_TOKEN=dev-token-change-in-production

# Worker Configuration
POLL_INTERVAL=5000
MAX_RETRIES=3
HEADLESS=true
TIMEOUT=30000
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 6: Start Worker with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start worker.js --name email-verifier

# Save PM2 configuration
pm2 save

# Setup auto-start on reboot
pm2 startup

# Check status
pm2 status
pm2 logs email-verifier --lines 20
```

### Step 7: Verify It's Working

You should see output like:
```
🚀 Email Verification Worker Starting...
📡 API Endpoint: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
🔍 Verification Method: Email Existence Check (No Password Required)
✅ Worker initialized successfully
⏳ Starting worker loop...
.......
```

## Quick Commands Reference

```bash
# View logs
pm2 logs email-verifier

# Restart worker
pm2 restart email-verifier

# Stop worker
pm2 stop email-verifier

# Check status
pm2 status

# View system resources
free -h
df -h
htop
```

## Testing

Once worker is running:
1. Go to: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
2. Enter test emails
3. Click "Start Verification"
4. Watch results appear in real-time!

## Troubleshooting

If you see errors:
```bash
# Check logs
pm2 logs email-verifier --lines 50

# Restart worker
pm2 restart email-verifier

# Check if port 3000 accessible from VPS
curl https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai/api/stats
```

## Security Note

⚠️ **IMPORTANT**: After setup, change your root password:
```bash
passwd
# Enter new password twice
```

---

**Status**: Ready to setup
**Next**: SSH into VPS and run the commands above
