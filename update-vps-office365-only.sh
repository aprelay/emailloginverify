#!/bin/bash

# Update VPS Worker to Office365 Only
# Run this on your VPS: bash update-office365-only.sh

echo "🔄 Updating Worker to Office365 Only..."
echo ""

cd /opt/email-verifier

# Backup current worker
cp worker.js worker.js.backup
echo "✅ Backed up current worker.js"

# Create new Office365-only worker
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
console.log('🔍 Verification: Office365 ONLY');
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
    const currentUrl = page.url();
    await browser.close();
    if (passwordField) return { result: 'valid', details: 'Account exists - password field displayed' };
    if (hasError) return { result: 'strong_bounce', details: 'Account does not exist' };
    if (currentUrl.includes('login.live.com')) return { result: 'valid', details: 'Account exists - redirected' };
    return { result: 'invalid', details: 'Could not verify account existence' };
  } catch (error) {
    await browser.close();
    return { result: 'error', error_message: error.message, details: 'Automation error' };
  }
}

async function processJob(job) {
  console.log(`\n🔍 Job #${job.id}: ${job.email}`);
  try {
    const result = await verifyOffice365(job.email);
    await api.post('/api/worker/result', { id: job.id, ...result });
    stats.processed++;
    if (result.result === 'valid') stats.valid++;
    else if (result.result === 'strong_bounce') stats.invalid++;
    else stats.errors++;
    console.log(`  ✅ Result: ${result.result}`);
    if (result.details) console.log(`  📝 ${result.details}`);
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
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
  console.log(`\n📊 Uptime: ${uptime}s | Processed: ${stats.processed} | Valid: ${stats.valid} | Bounces: ${stats.invalid} | Errors: ${stats.errors}`);
}

process.on('SIGINT', () => { console.log('\n🛑 Shutting down...'); printStats(); process.exit(0); });
setInterval(printStats, 60000);

console.log('✅ Worker initialized (Office365 Only)');
console.log('⏳ Polling for jobs...\n');
workerLoop();
EOFWORKER

echo "✅ Created new Office365-only worker.js"
echo ""

# Restart PM2
echo "🔄 Restarting PM2 worker..."
pm2 restart email-verifier

echo ""
echo "✅ Update complete!"
echo ""
echo "Check status: pm2 status"
echo "View logs: pm2 logs email-verifier"
EOFWORKER

chmod +x update-office365-only.sh

echo "✅ Update script created!"
echo ""
echo "📋 To update your VPS worker, run this on your VPS:"
echo ""
echo "curl -sSL [URL-TO-THIS-SCRIPT] | bash"
echo ""
echo "Or manually:"
echo "1. SSH to VPS: ssh root@72.62.166.160"
echo "2. Copy the worker.js content above"
echo "3. Save to: /opt/email-verifier/worker.js"
echo "4. Restart: pm2 restart email-verifier"
