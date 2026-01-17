#!/bin/bash

# Automated VPS Setup Script
# This will set up everything on your VPS: 72.62.166.160

VPS_IP="72.62.166.160"
VPS_USER="root"
VPS_PASS="Newmoney012A@"

echo "🚀 Automated VPS Setup Starting..."
echo "📡 VPS IP: $VPS_IP"
echo ""

# Create the complete setup script
cat > /tmp/vps_setup_complete.sh << 'SETUPSCRIPT'
#!/bin/bash
set -e

echo "🚀 Email Verifier - Complete VPS Setup"
echo "======================================="
echo ""

# Update system
echo "📦 Updating system packages..."
apt update -qq && apt upgrade -y -qq

# Install Node.js 18
echo "📦 Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

echo "✅ Node.js: $(node --version)"
echo "✅ NPM: $(npm --version)"

# Create directory
echo "📁 Creating application directory..."
mkdir -p /opt/email-verifier
cd /opt/email-verifier

# Create package.json
echo "📝 Creating package.json..."
cat > package.json << 'EOFPKG'
{
  "name": "email-verifier-worker",
  "version": "1.0.0",
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
echo "📝 Creating .env configuration..."
cat > .env << 'EOFENV'
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=5000
HEADLESS=true
TIMEOUT=30000
EOFENV

# Create worker.js
echo "📝 Creating worker.js..."
cat > worker.js << 'EOFWORKER'
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
console.log('🔍 Method: Email Existence Check');
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
    console.log(\`  📧 Testing Office365: \${email}\`);
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
    return { result: 'error', error_message: error.message };
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
    console.log(\`  📧 Testing Gmail: \${email}\`);
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
    return { result: 'error', error_message: error.message };
  }
}

async function processJob(job) {
  console.log(\`\\n🔍 Job #\${job.id}: \${job.email} (\${job.provider})\`);
  try {
    const result = job.provider === 'office365' ? await verifyOffice365(job.email) : await verifyGmail(job.email);
    await api.post('/api/worker/result', { id: job.id, ...result });
    stats.processed++;
    if (result.result === 'valid') stats.valid++;
    else if (result.result === 'strong_bounce') stats.invalid++;
    else stats.errors++;
    console.log(\`  ✅ Result: \${result.result}\`);
  } catch (error) {
    console.error(\`  ❌ Error: \${error.message}\`);
  }
}

async function workerLoop() {
  process.stdout.write('.');
  try {
    const response = await api.get('/api/worker/next');
    if (response.data.success && response.data.job) await processJob(response.data.job);
  } catch (error) {
    if (error.response) console.error(\`\\n❌ API Error: \${error.response.status}\`);
  }
  setTimeout(workerLoop, CONFIG.pollInterval);
}

function printStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
  console.log(\`\\n📊 Uptime: \${uptime}s | Processed: \${stats.processed} | Valid: \${stats.valid} | Bounces: \${stats.invalid} | Errors: \${stats.errors}\`);
}

process.on('SIGINT', () => { console.log('\\n🛑 Shutting down...'); printStats(); process.exit(0); });
setInterval(printStats, 60000);

console.log('✅ Worker initialized\\n⏳ Polling for jobs...\\n');
workerLoop();
EOFWORKER

# Install Node packages
echo "📦 Installing Node.js packages..."
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers (2-3 minutes)..."
npm run install-browsers

# Install system dependencies
echo "📦 Installing system dependencies..."
apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Start worker
echo "🚀 Starting worker..."
pm2 delete email-verifier 2>/dev/null || true
pm2 start worker.js --name email-verifier

# Save PM2 configuration
pm2 save

# Setup auto-start
pm2 startup systemd -u root --hp /root

echo ""
echo "================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Worker Status:"
pm2 status
echo ""
echo "View logs with: pm2 logs email-verifier"
echo ""
echo "Web Interface: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai"
echo ""
SETUPSCRIPT

chmod +x /tmp/vps_setup_complete.sh

echo ""
echo "📝 Setup script created!"
echo ""
echo "Now connecting to VPS and running setup..."
echo ""
echo "⚠️  This will take about 5-10 minutes"
echo ""

# Upload and execute the script
scp -o StrictHostKeyChecking=no /tmp/vps_setup_complete.sh root@${VPS_IP}:/root/setup.sh
ssh -o StrictHostKeyChecking=no root@${VPS_IP} 'bash /root/setup.sh'

echo ""
echo "✅ All done! Worker should be running now!"
