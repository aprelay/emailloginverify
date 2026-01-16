# 🚀 VPS Setup - Manual Method

Since automated SCP upload didn't work from the sandbox, here's the manual method:

## 📋 Step-by-Step Manual Setup

### Method 1: Copy-Paste Files (Easiest)

#### Step 1: SSH into Your VPS
```bash
ssh root@142.171.246.247
```
Password: `1ayY46X18k`

#### Step 2: Install Node.js and Create Directory
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
node --version
npm --version

# Create directory
mkdir -p /opt/email-verifier
cd /opt/email-verifier
```

#### Step 3: Create package.json
```bash
cat > package.json << 'EOF'
{
  "name": "email-verifier-worker",
  "version": "1.0.0",
  "description": "VPS Worker for email verification using Playwright",
  "type": "module",
  "main": "worker.js",
  "scripts": {
    "start": "node worker.js",
    "install-browsers": "npx playwright install chromium",
    "test": "node worker.js --test"
  },
  "dependencies": {
    "playwright": "^1.48.0",
    "axios": "^1.7.0",
    "dotenv": "^16.4.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
```

#### Step 4: Create .env.example
```bash
cat > .env.example << 'EOF'
# VPS Worker Configuration

# API Endpoint (your Cloudflare Pages URL)
API_ENDPOINT=http://localhost:3000

# API Token (from your database)
API_TOKEN=dev-token-change-in-production

# Worker Configuration
POLL_INTERVAL=5000
MAX_RETRIES=3
HEADLESS=true
TIMEOUT=30000

# Proxy Configuration (OPTIONAL but recommended for better success rate)
# Get proxies from: BrightData, Oxylabs, Smartproxy, IPRoyal, Webshare
# PROXY_SERVER=http://proxy-server:port
# PROXY_USERNAME=username
# PROXY_PASSWORD=password
EOF
```

#### Step 5: Create worker.js (Main Worker File)

This is a long file. I'll provide it in parts:

```bash
cat > worker.js << 'EOFWORKER'
import playwright from 'playwright';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
  apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000',
  apiToken: process.env.API_TOKEN || 'dev-token-change-in-production',
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
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
console.log('🔄 Poll Interval:', CONFIG.pollInterval + 'ms');
console.log('🎭 Headless Mode:', CONFIG.headless);
console.log('🌐 Proxy:', CONFIG.proxy ? CONFIG.proxy.server : 'None');
console.log('');
console.log('🔍 Verification Method: Email Existence Check (No Password Required)');
console.log('');

// API Client
const api = axios.create({
  baseURL: CONFIG.apiEndpoint,
  headers: {
    'X-API-Token': CONFIG.apiToken,
    'Content-Type': 'application/json'
  }
});

// Statistics
const stats = {
  processed: 0,
  valid: 0,
  invalid: 0,
  errors: 0,
  startTime: Date.now()
};

// Verify Office365 email existence
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
    console.log(\`  📧 Testing Office365: \${email}\`);
    
    await page.goto('https://login.microsoftonline.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    await page.click('input[type="submit"]');
    await page.waitForTimeout(3000);
    
    const errorPatterns = [
      "account doesn't exist",
      "couldn't find your account",
      "that microsoft account doesn't exist"
    ];

    const pageContent = await page.content();
    const pageText = pageContent.toLowerCase();

    let hasAccountError = false;
    for (const pattern of errorPatterns) {
      if (pageText.includes(pattern.toLowerCase())) {
        hasAccountError = true;
        break;
      }
    }

    const passwordField = await page.$('input[type="password"]');
    await browser.close();

    if (passwordField) {
      return { result: 'valid', details: 'Account exists - password field displayed' };
    } else if (hasAccountError) {
      return { result: 'strong_bounce', details: 'Account does not exist' };
    } else {
      return { result: 'invalid', details: 'Could not verify account existence' };
    }

  } catch (error) {
    await browser.close();
    return { result: 'error', error_message: error.message, details: 'Automation error' };
  }
}

// Verify Gmail email existence
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
    console.log(\`  📧 Testing Gmail: \${email}\`);
    
    await page.goto('https://accounts.google.com/signin/v2/identifier', { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    
    const nextButton = await page.$('#identifierNext');
    if (nextButton) {
      await nextButton.click();
    }
    
    await page.waitForTimeout(3000);
    
    const errorPatterns = [
      "couldn't find your google account",
      "enter a valid email"
    ];

    const pageContent = await page.content();
    const pageText = pageContent.toLowerCase();

    let hasAccountError = false;
    for (const pattern of errorPatterns) {
      if (pageText.includes(pattern.toLowerCase())) {
        hasAccountError = true;
        break;
      }
    }

    const passwordField = await page.$('input[type="password"]');
    await browser.close();

    if (passwordField) {
      return { result: 'valid', details: 'Account exists - password field displayed' };
    } else if (hasAccountError) {
      return { result: 'strong_bounce', details: 'Account does not exist' };
    } else {
      return { result: 'invalid', details: 'Could not verify account existence' };
    }

  } catch (error) {
    await browser.close();
    return { result: 'error', error_message: error.message, details: 'Automation error' };
  }
}

// Process a single job
async function processJob(job) {
  console.log(\`\\n🔍 Processing Job #\${job.id}\`);
  console.log(\`  Email: \${job.email}\`);
  console.log(\`  Provider: \${job.provider}\`);

  let verificationResult;

  try {
    if (job.provider === 'office365') {
      verificationResult = await verifyOffice365(job.email);
    } else if (job.provider === 'gmail') {
      verificationResult = await verifyGmail(job.email);
    } else {
      verificationResult = { result: 'error', error_message: 'Unknown provider' };
    }

    await api.post('/api/worker/result', { id: job.id, ...verificationResult });

    stats.processed++;
    if (verificationResult.result === 'valid') stats.valid++;
    else if (verificationResult.result === 'strong_bounce') stats.invalid++;
    else if (verificationResult.result === 'error') stats.errors++;

    console.log(\`  ✅ Result: \${verificationResult.result}\`);

  } catch (error) {
    console.error(\`  ❌ Failed to process job:\`, error.message);
  }
}

// Main worker loop
async function workerLoop() {
  process.stdout.write('.');

  try {
    const response = await api.get('/api/worker/next');
    
    if (response.data.success && response.data.job) {
      await processJob(response.data.job);
    }
  } catch (error) {
    if (error.response) {
      console.error(\`\\n❌ API Error: \${error.response.status}\`);
    }
  }

  setTimeout(workerLoop, CONFIG.pollInterval);
}

// Print statistics
function printStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
  console.log('\\n\\n📊 Statistics:');
  console.log(\`  Uptime: \${uptime}s\`);
  console.log(\`  Processed: \${stats.processed}\`);
  console.log(\`  Valid: \${stats.valid}\`);
  console.log(\`  Invalid: \${stats.invalid}\`);
  console.log(\`  Errors: \${stats.errors}\`);
}

process.on('SIGINT', () => {
  console.log('\\n\\n🛑 Shutting down...');
  printStats();
  process.exit(0);
});

setInterval(printStats, 60000);

console.log('✅ Worker initialized successfully');
console.log('⏳ Starting worker loop...\\n');
workerLoop();
EOFWORKER
```

#### Step 6: Install Dependencies
```bash
npm install
npm run install-browsers

# Install system dependencies
apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2
```

#### Step 7: Configure Worker
```bash
cp .env.example .env
nano .env
```

Update with:
```env
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
HEADLESS=true
POLL_INTERVAL=5000
```

Save with `Ctrl+X`, `Y`, `Enter`

#### Step 8: Start Worker
```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start worker.js --name email-verifier

# Save configuration
pm2 save

# Setup auto-start
pm2 startup

# Check status
pm2 status
pm2 logs email-verifier
```

## ✅ Done!

Test it at: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai

---

## Alternative: Download Files Locally

If you want to upload from your computer:

1. Download these files from the sandbox
2. Use an SFTP client (FileZilla, WinSCP) to upload to VPS
3. Or use SCP from your computer:
   ```bash
   scp -r vps-worker/* root@142.171.246.247:/opt/email-verifier/
   ```

---

Let me know if you need any step clarified!
