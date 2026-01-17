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
    
    // Wait longer for the page to fully load and show errors
    await page.waitForTimeout(5000);
    
    const pageText = (await page.content()).toLowerCase();
    const currentUrl = page.url();
    
    // Check for error messages indicating account doesn't exist
    const errorPatterns = [
      "account doesn't exist",
      "account does not exist",
      "couldn't find your account",
      "could not find your account",
      "that microsoft account doesn't exist",
      "that microsoft account does not exist",
      "we couldn't find an account",
      "we could not find an account",
      "this username may be incorrect",
      "username may be incorrect",
      "enter a valid email address",
      "make sure you typed it correctly"
    ];
    
    let hasError = false;
    let matchedPattern = '';
    for (const pattern of errorPatterns) {
      if (pageText.includes(pattern)) {
        hasError = true;
        matchedPattern = pattern;
        break;
      }
    }
    
    // Check for error element with specific IDs/classes
    const errorElement = await page.$('#usernameError, .error, [role="alert"]');
    const errorText = errorElement ? await errorElement.textContent() : '';
    
    // Check if password field exists (account is valid)
    const passwordField = await page.$('input[type="password"]');

    await browser.close();

    if (hasError) {
      return { result: 'strong_bounce', details: `Account does not exist: ${matchedPattern}` };
    } else if (errorElement && errorText.toLowerCase().includes('incorrect')) {
      return { result: 'strong_bounce', details: 'Username may be incorrect' };
    } else if (passwordField) {
      return { result: 'valid', details: 'Account exists - password field shown' };
    } else if (currentUrl.includes('login.live.com') || currentUrl.includes('account.live.com')) {
      return { result: 'valid', details: 'Account exists - redirected to login' };
    } else {
      return { result: 'invalid', details: 'Could not verify - no clear indicator' };
    }
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
