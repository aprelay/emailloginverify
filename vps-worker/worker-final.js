import playwright from 'playwright';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000',
  apiToken: process.env.API_TOKEN || 'dev-token-change-in-production',
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000,
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TIMEOUT) || 30000
};

console.log('🚀 Worker Starting - Office365 ONLY');
console.log('📡 API:', CONFIG.apiEndpoint);
console.log('');

const api = axios.create({
  baseURL: CONFIG.apiEndpoint,
  headers: {
    'X-API-Token': CONFIG.apiToken,
    'Content-Type': 'application/json'
  }
});

const stats = { processed: 0, valid: 0, invalid: 0, errors: 0, startTime: Date.now() };

async function verifyOffice365(email) {
  const browser = await playwright.chromium.launch({
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    console.log(`  📧 Testing: ${email}`);
    
    await page.goto('https://login.microsoftonline.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    await page.click('input[type="submit"]');
    
    // Wait for page to respond
    await page.waitForTimeout(5000);
    
    const pageText = (await page.content()).toLowerCase();
    const currentUrl = page.url();
    
    // ONLY check for the specific "username may be incorrect" error
    const hasUsernameError = pageText.includes("this username may be incorrect") || 
                            pageText.includes("username may be incorrect");
    
    await browser.close();

    // If we see "username may be incorrect" = STRONG BOUNCE (invalid)
    if (hasUsernameError) {
      return { result: 'strong_bounce', details: 'Account does not exist - username incorrect' };
    }
    
    // Everything else that gets past the email page = VALID
    // This includes:
    // - Password field shown
    // - Account picker (multiple accounts)
    // - Redirects to login.live.com
    // - Any other page that's NOT the email entry error
    return { result: 'valid', details: 'Account exists - passed email verification' };

  } catch (error) {
    await browser.close();
    return { result: 'error', error_message: error.message };
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
    else if (result.result === 'error') stats.errors++;
    console.log(`  ✅ ${result.result} - ${result.details || ''}`);
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
  }
}

async function workerLoop() {
  process.stdout.write('.');
  try {
    const response = await api.get('/api/worker/next');
    if (response.data.success && response.data.job) {
      await processJob(response.data.job);
    }
  } catch (error) {
    if (error.response) {
      console.error(`\n❌ API Error: ${error.response.status}`);
    }
  }
  setTimeout(workerLoop, CONFIG.pollInterval);
}

console.log('✅ Worker initialized');
console.log('⏳ Polling...\n');
workerLoop();
