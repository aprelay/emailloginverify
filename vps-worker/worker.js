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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    
    console.log(`  📧 Testing Office365: ${email}`);
    
    // Navigate to Outlook login
    await page.goto('https://login.microsoftonline.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    
    // Click Next button
    await page.click('input[type="submit"]');
    
    // Wait for response (either password page or error)
    await page.waitForTimeout(3000);
    
    // Check for specific error messages indicating account doesn't exist
    const errorPatterns = [
      "account doesn't exist",
      "couldn't find your account",
      "that microsoft account doesn't exist",
      "we couldn't find an account",
      "this username may be incorrect",
      "enter a valid email address, phone number, or skype name"
    ];

    const pageContent = await page.content();
    const pageText = pageContent.toLowerCase();

    let hasAccountError = false;
    let errorMessage = '';

    for (const pattern of errorPatterns) {
      if (pageText.includes(pattern.toLowerCase())) {
        hasAccountError = true;
        errorMessage = pattern;
        break;
      }
    }

    // Check if we see password field (means account exists)
    const passwordField = await page.$('input[type="password"]');
    const currentUrl = page.url();

    await browser.close();

    if (passwordField) {
      // Password field appeared - account exists!
      return { result: 'valid', details: 'Account exists - password field displayed' };
    } else if (hasAccountError) {
      // Specific error message about account not existing
      return { result: 'strong_bounce', details: `Account doesn't exist: ${errorMessage}` };
    } else if (currentUrl.includes('login.live.com') || currentUrl.includes('account.live.com')) {
      // Redirected to password page
      return { result: 'valid', details: 'Account exists - redirected to password page' };
    } else {
      // Could not determine - might be invalid or blocked
      return { result: 'invalid', details: 'Could not verify account existence' };
    }

  } catch (error) {
    await browser.close();
    console.error(`  ❌ Error verifying Office365:`, error.message);
    return { 
      result: 'error', 
      error_message: error.message,
      details: 'Automation error during verification'
    };
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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    
    console.log(`  📧 Testing Gmail: ${email}`);
    
    // Navigate to Gmail login
    await page.goto('https://accounts.google.com/signin/v2/identifier', { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    
    // Click Next button
    const nextButton = await page.$('#identifierNext');
    if (nextButton) {
      await nextButton.click();
    } else {
      // Try alternative selector
      await page.click('button:has-text("Next")');
    }
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for error messages
    const errorPatterns = [
      "couldn't find your google account",
      "enter a valid email or phone number",
      "wrong email"
    ];

    const pageContent = await page.content();
    const pageText = pageContent.toLowerCase();

    let hasAccountError = false;
    let errorMessage = '';

    for (const pattern of errorPatterns) {
      if (pageText.includes(pattern.toLowerCase())) {
        hasAccountError = true;
        errorMessage = pattern;
        break;
      }
    }

    // Check if we reached password page
    const passwordField = await page.$('input[type="password"]');
    const currentUrl = page.url();

    await browser.close();

    if (passwordField) {
      // Password field appeared - account exists!
      return { result: 'valid', details: 'Account exists - password field displayed' };
    } else if (hasAccountError) {
      // Specific error about account not found
      return { result: 'strong_bounce', details: `Account doesn't exist: ${errorMessage}` };
    } else if (currentUrl.includes('/signin/v2/challenge') || currentUrl.includes('/signin/v2/pwd')) {
      // Redirected to password/challenge page
      return { result: 'valid', details: 'Account exists - redirected to password page' };
    } else {
      // Could not determine
      return { result: 'invalid', details: 'Could not verify account existence' };
    }

  } catch (error) {
    await browser.close();
    console.error(`  ❌ Error verifying Gmail:`, error.message);
    return { 
      result: 'error', 
      error_message: error.message,
      details: 'Automation error during verification'
    };
  }
}

// Process a single job
async function processJob(job) {
  console.log(`\n🔍 Processing Job #${job.id}`);
  console.log(`  Email: ${job.email}`);
  console.log(`  Provider: ${job.provider}`);

  let verificationResult;

  try {
    if (job.provider === 'office365') {
      verificationResult = await verifyOffice365(job.email);
    } else if (job.provider === 'gmail') {
      verificationResult = await verifyGmail(job.email);
    } else {
      verificationResult = {
        result: 'error',
        error_message: 'Unknown provider',
        details: `Provider ${job.provider} not supported`
      };
    }

    // Submit result to API
    await api.post('/api/worker/result', {
      id: job.id,
      ...verificationResult
    });

    // Update statistics
    stats.processed++;
    if (verificationResult.result === 'valid') stats.valid++;
    else if (verificationResult.result === 'strong_bounce' || verificationResult.result === 'invalid') stats.invalid++;
    else if (verificationResult.result === 'error') stats.errors++;

    console.log(`  ✅ Result: ${verificationResult.result}`);
    if (verificationResult.details) {
      console.log(`  📝 Details: ${verificationResult.details}`);
    }

  } catch (error) {
    console.error(`  ❌ Failed to process job:`, error.message);
    
    // Try to submit error result
    try {
      await api.post('/api/worker/result', {
        id: job.id,
        result: 'error',
        error_message: error.message,
        details: 'Worker processing error'
      });
    } catch (submitError) {
      console.error(`  ❌ Failed to submit error result:`, submitError.message);
    }
  }
}

// Main worker loop
async function workerLoop() {
  process.stdout.write('.');

  try {
    // Get next job from API
    const response = await api.get('/api/worker/next');
    
    if (response.data.success && response.data.job) {
      const job = response.data.job;
      await processJob(job);
    }
  } catch (error) {
    if (error.response) {
      console.error(`\n❌ API Error: ${error.response.status} - ${error.response.data.error}`);
    } else if (error.request) {
      console.error(`\n❌ Network Error: Cannot connect to API at ${CONFIG.apiEndpoint}`);
    } else {
      console.error(`\n❌ Error:`, error.message);
    }
  }

  // Schedule next poll
  setTimeout(workerLoop, CONFIG.pollInterval);
}

// Print statistics
function printStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
  console.log('\n\n📊 Statistics:');
  console.log(`  Uptime: ${uptime}s`);
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Valid (exists): ${stats.valid}`);
  console.log(`  Invalid (bounces): ${stats.invalid}`);
  console.log(`  Errors: ${stats.errors}`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down worker...');
  printStats();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down worker...');
  printStats();
  process.exit(0);
});

// Print stats every 60 seconds
setInterval(printStats, 60000);

// Start worker
console.log('✅ Worker initialized successfully');
console.log('⏳ Starting worker loop...');
console.log('⏳ Polling for new jobs...\n');
workerLoop();
