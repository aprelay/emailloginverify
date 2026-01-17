# 🚀 Your New VPS Setup Guide

## ✅ Your Working VPS Credentials

```
IP Address: 72.62.166.160
Username: root
Password: Newmoney012A@
```

**Status**: ✅ **VPS is online and SSH port is accessible!**

---

## 🎯 Quick Setup (Copy-Paste Method)

Since the VPS is accessible, follow these steps:

### **Step 1: Connect to Your VPS**

**On Windows:**
```
Open CMD or PowerShell and run:
ssh root@72.62.166.160
```

**On Mac/Linux:**
```bash
ssh root@72.62.166.160
```

Password: `Newmoney012A@`

---

### **Step 2: Run This Complete Setup Script**

Once connected to VPS, copy-paste this ENTIRE block:

```bash
# Complete automated setup
echo "🚀 Starting Email Verifier Setup..."

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Create directory
mkdir -p /opt/email-verifier
cd /opt/email-verifier

# Create package.json
cat > package.json << 'EOFPKG'
{
  "name": "email-verifier-worker",
  "version": "1.0.0",
  "description": "Email verification worker",
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

# Create .env configuration
cat > .env << 'EOFENV'
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=5000
MAX_RETRIES=3
HEADLESS=true
TIMEOUT=30000
EOFENV

# Install Node packages
echo "📦 Installing Node.js packages..."
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers (this takes 2-3 minutes)..."
npm run install-browsers

# Install system dependencies
echo "📦 Installing system dependencies..."
apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2

echo ""
echo "✅ Base setup complete!"
echo ""
echo "⚠️  IMPORTANT: Now you need to create worker.js"
echo "See next step below..."
```

---

### **Step 3: Create worker.js File**

Now create the main worker file. Copy-paste this:

```bash
cat > /opt/email-verifier/worker.js << 'EOFWORKER'
import playwright from 'playwright';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000',
  apiToken: process.env.API_TOKEN || 'dev-token-change-in-production',
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000,
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TIMEOUT) || 30000,
  proxy: process.env.PROXY_SERVER ? {
    server: process.env.PROXY_SERVER,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD
  } : null
};

console.log('🚀 Email Verification Worker Starting...');
console.log('📡 API Endpoint:', CONFIG.apiEndpoint);
console.log('🔍 Method: Email Existence Check (No Password Required)');
console.log('');

const api = axios.create({
  baseURL: CONFIG.apiEndpoint,
  headers: { 'X-API-Token': CONFIG.apiToken, 'Content-Type': 'application/json' }
});

const stats = { processed: 0, valid: 0, invalid: 0, errors: 0, startTime: Date.now() };

async function verifyOffice365(email) {
  const browser = await playwright.chromium.launch({
    headless: CONFIG.headless,
    proxy: CONFIG.proxy,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();
    console.log(`  📧 Testing Office365: ${email}`);
    await page.goto('https://login.microsoftonline.com/', { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    await page.click('input[type="submit"]');
    await page.waitForTimeout(3000);
    const pageText = (await page.content()).toLowerCase();
    const hasError = pageText.includes("account doesn't exist") || pageText.includes("couldn't find your account");
    const passwordField = await page.$('input[type="password"]');
    await browser.close();
    if (passwordField) return { result: 'valid', details: 'Account exists' };
    if (hasError) return { result: 'strong_bounce', details: 'Account does not exist' };
    return { result: 'invalid', details: 'Could not verify' };
  } catch (error) {
    await browser.close();
    return { result: 'error', error_message: error.message, details: 'Automation error' };
  }
}

async function verifyGmail(email) {
  const browser = await playwright.chromium.launch({
    headless: CONFIG.headless,
    proxy: CONFIG.proxy,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();
    console.log(`  📧 Testing Gmail: ${email}`);
    await page.goto('https://accounts.google.com/signin/v2/identifier', { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    const nextButton = await page.$('#identifierNext');
    if (nextButton) await nextButton.click();
    await page.waitForTimeout(3000);
    const pageText = (await page.content()).toLowerCase();
    const hasError = pageText.includes("couldn't find your google account");
    const passwordField = await page.$('input[type="password"]');
    await browser.close();
    if (passwordField) return { result: 'valid', details: 'Account exists' };
    if (hasError) return { result: 'strong_bounce', details: 'Account does not exist' };
    return { result: 'invalid', details: 'Could not verify' };
  } catch (error) {
    await browser.close();
    return { result: 'error', error_message: error.message, details: 'Automation error' };
  }
}

async function processJob(job) {
  console.log(`\n🔍 Processing Job #${job.id}: ${job.email} (${job.provider})`);
  let result;
  try {
    result = job.provider === 'office365' ? await verifyOffice365(job.email) : await verifyGmail(job.email);
    await api.post('/api/worker/result', { id: job.id, ...result });
    stats.processed++;
    if (result.result === 'valid') stats.valid++;
    else if (result.result === 'strong_bounce') stats.invalid++;
    else stats.errors++;
    console.log(`  ✅ Result: ${result.result}`);
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
  }
}

async function workerLoop() {
  process.stdout.write('.');
  try {
    const response = await api.get('/api/worker/next');
    if (response.data.success && response.data.job) await processJob(response.data.job);
  } catch (error) {
    if (error.response) console.error(`\n❌ API Error: ${error.response.status}`);
  }
  setTimeout(workerLoop, CONFIG.pollInterval);
}

function printStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
  console.log(`\n📊 Stats: Uptime ${uptime}s | Processed ${stats.processed} | Valid ${stats.valid} | Invalid ${stats.invalid} | Errors ${stats.errors}`);
}

process.on('SIGINT', () => { console.log('\n🛑 Shutting down...'); printStats(); process.exit(0); });
setInterval(printStats, 60000);

console.log('✅ Worker ready\n⏳ Polling for jobs...\n');
workerLoop();
EOFWORKER

echo "✅ worker.js created successfully!"
```

---

### **Step 4: Install PM2 and Start Worker**

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
cd /opt/email-verifier
pm2 start worker.js --name email-verifier

# Save configuration
pm2 save

# Setup auto-start on reboot
pm2 startup

# Check status
pm2 status

# View logs
pm2 logs email-verifier --lines 20
```

You should see:
```
🚀 Email Verification Worker Starting...
📡 API Endpoint: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
✅ Worker ready
⏳ Polling for jobs...
```

---

## ✅ Test It!

### 1. Keep VPS connected (worker running)

### 2. Open browser
Go to: **https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai**

### 3. Enter test emails:
```
test@outlook.com
demo@gmail.com
someone@hotmail.com
```

### 4. Click "Start Verification"

### 5. Watch VPS logs:
```bash
pm2 logs email-verifier
```

You'll see it processing!

---

## 🔧 Useful Commands

```bash
# View status
pm2 status

# View logs (live)
pm2 logs email-verifier

# Restart worker
pm2 restart email-verifier

# Stop worker
pm2 stop email-verifier

# Edit configuration
nano /opt/email-verifier/.env
pm2 restart email-verifier
```

---

## 📊 What You Have Now

✅ **VPS**: 72.62.166.160 (Working!)  
✅ **Web App**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai  
✅ **Worker**: Ready to install  
✅ **All files**: Ready to copy-paste  

---

## 🚀 Quick Start Right Now

1. **Connect**: `ssh root@72.62.166.160` (password: `Newmoney012A@`)
2. **Copy-paste**: The complete setup script from Step 2
3. **Copy-paste**: The worker.js creation from Step 3
4. **Start**: PM2 commands from Step 4
5. **Test**: Go to web interface and verify emails!

**Total time: ~10 minutes**

---

## 🎉 You're Almost There!

Just SSH to your VPS and follow the steps above. Everything is ready to copy-paste!

**Your VPS is working perfectly!** ✅
