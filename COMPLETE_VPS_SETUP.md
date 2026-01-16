# 🚀 Complete VPS Setup Guide

## Your VPS Credentials
```
IP Address: 142.171.246.247
Username: root
Password: 1ayY46X18k
```

---

## 🎯 Two Setup Methods

### Method 1: Automated (Recommended) - 5 Minutes
### Method 2: Manual - 10 Minutes

---

## 📋 Method 1: Automated Setup (EASIEST)

### Step 1: Upload Files to VPS

**Option A: Using the upload script**
```bash
cd /home/user/webapp
./upload-to-vps.sh
# Enter password when prompted: 1ayY46X18k
```

**Option B: Manual upload**
```bash
cd /home/user/webapp
scp -r vps-worker/* root@142.171.246.247:/opt/email-verifier/
# Enter password: 1ayY46X18k
```

### Step 2: SSH into VPS and Run Setup Script

```bash
# Connect to VPS
ssh root@142.171.246.247
# Password: 1ayY46X18k

# Run automated setup
cd /opt/email-verifier
chmod +x setup-vps.sh
./setup-vps.sh
```

That's it! The script will:
- ✅ Update system
- ✅ Install Node.js 18
- ✅ Install all dependencies
- ✅ Install Playwright browsers
- ✅ Create configuration
- ✅ Install PM2
- ✅ Start worker
- ✅ Setup auto-start on reboot

### Step 3: Verify It's Working

```bash
# Check worker status
pm2 status

# View live logs
pm2 logs email-verifier

# You should see:
# 🚀 Email Verification Worker Starting...
# ✅ Worker initialized successfully
# ⏳ Starting worker loop...
```

---

## 📋 Method 2: Manual Setup (Step by Step)

### Step 1: Connect to VPS

```bash
ssh root@142.171.246.247
# Password: 1ayY46X18k
```

### Step 2: Update System

```bash
apt update && apt upgrade -y
```

### Step 3: Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Step 4: Create Application Directory

```bash
mkdir -p /opt/email-verifier
cd /opt/email-verifier
```

### Step 5: Upload Worker Files

**On your local machine/sandbox:**
```bash
cd /home/user/webapp
scp -r vps-worker/* root@142.171.246.247:/opt/email-verifier/
# Enter password: 1ayY46X18k
```

### Step 6: Install Dependencies

**Back on VPS:**
```bash
cd /opt/email-verifier

# Install Node.js packages
npm install

# Install Playwright browsers (takes 2-3 minutes)
npm run install-browsers

# Install system dependencies
apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2
```

### Step 7: Configure Worker

```bash
cp .env.example .env
nano .env
```

Replace content with:
```env
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=5000
MAX_RETRIES=3
HEADLESS=true
TIMEOUT=30000
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 8: Install PM2 and Start Worker

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start worker.js --name email-verifier

# Save configuration
pm2 save

# Setup auto-start on reboot
pm2 startup

# Check status
pm2 status
```

### Step 9: View Logs

```bash
pm2 logs email-verifier
```

You should see:
```
🚀 Email Verification Worker Starting...
📡 API Endpoint: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
🔍 Verification Method: Email Existence Check (No Password Required)
✅ Worker initialized successfully
⏳ Starting worker loop...
⏳ Polling for new jobs...
```

---

## ✅ Testing Your Setup

### 1. Open Web Interface
Go to: **https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai**

### 2. Submit Test Emails

Enter in the textarea:
```
test@outlook.com
demo@gmail.com
someone@hotmail.com
```

### 3. Click "Start Verification"

### 4. Watch the Worker Process Jobs

On VPS, watch logs:
```bash
pm2 logs email-verifier
```

You should see:
```
🔍 Processing Job #1
  Email: test@outlook.com
  Provider: office365
  📧 Testing Office365: test@outlook.com
  ✅ Result: valid (or strong_bounce)
  📝 Details: Account exists - password field displayed
```

### 5. Check Results in Web Interface

Results will appear in the table automatically!

---

## 🔧 Useful Commands

### Worker Management
```bash
# View status
pm2 status

# View logs (live)
pm2 logs email-verifier

# View last 50 log lines
pm2 logs email-verifier --lines 50

# Restart worker
pm2 restart email-verifier

# Stop worker
pm2 stop email-verifier

# Delete worker from PM2
pm2 delete email-verifier
```

### System Monitoring
```bash
# Check RAM usage
free -h

# Check disk space
df -h

# Check running processes
htop  # or just: top

# Check if worker is running
ps aux | grep worker
```

### Configuration
```bash
# Edit configuration
cd /opt/email-verifier
nano .env

# After editing, restart worker
pm2 restart email-verifier
```

---

## 🐛 Troubleshooting

### Worker not starting?
```bash
# Check logs for errors
pm2 logs email-verifier --lines 100

# Try running directly to see errors
cd /opt/email-verifier
node worker.js
```

### Can't connect to API?
```bash
# Test connection from VPS
curl https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai/api/stats

# Should return JSON with stats
```

### Browser launch fails?
```bash
# Reinstall system dependencies
apt install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
  libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2

# Reinstall Playwright browsers
cd /opt/email-verifier
npm run install-browsers
```

### High error rate?
Consider adding a proxy to `.env`:
```env
PROXY_SERVER=http://your-proxy:port
PROXY_USERNAME=username
PROXY_PASSWORD=password
```

---

## 🔐 Security Recommendations

### 1. Change Root Password
```bash
passwd
# Enter new password twice
```

### 2. Create Non-Root User (Optional)
```bash
adduser verifier
usermod -aG sudo verifier
```

### 3. Setup Firewall
```bash
apt install -y ufw
ufw allow 22/tcp    # SSH
ufw enable
```

### 4. Change API Token (For Production)
```bash
# Generate secure token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with new token
nano .env

# Update in Cloudflare database too
```

---

## 📊 Expected Performance

### With 2GB RAM VPS:
- Process: ~500-1,000 emails/hour
- Concurrent jobs: 1 (sequential processing)
- Success rate: 70-90% (without proxy)

### With Proxy:
- Process: ~1,000-2,000 emails/hour  
- Success rate: 90-95%

---

## 🎯 Next Steps

1. ✅ **Test with real emails** (only ones you have permission to verify)
2. 📈 **Monitor performance** - watch logs and success rate
3. 🌐 **Add proxy** (optional) - for better success rate
4. 🚀 **Deploy to production** - follow DEPLOYMENT.md when ready
5. 📊 **Scale up** - add more VPS workers if needed

---

## 🆘 Need Help?

### Check Logs First
```bash
pm2 logs email-verifier --lines 100
```

### Test API Connection
```bash
curl https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai/api/stats
```

### Restart Worker
```bash
pm2 restart email-verifier
```

### Check System Resources
```bash
free -h    # RAM
df -h      # Disk
top        # CPU
```

---

**Your VPS is ready!** Follow either Method 1 (automated) or Method 2 (manual) above to complete setup. The whole process takes 5-10 minutes.

🌐 **Web Interface**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
