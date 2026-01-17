import playwright from 'playwright';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000',
  apiToken: process.env.API_TOKEN || 'dev-token-change-in-production',
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 1000, // Reduced from 5000ms to 1000ms
  headless: process.env.HEADLESS !== 'false',
  timeout: parseInt(process.env.TIMEOUT) || 15000, // Reduced from 30000ms to 15000ms
  concurrentJobs: parseInt(process.env.CONCURRENT_JOBS) || 3 // Process 3 jobs at once
};

console.log('🚀 Worker Starting - Office365 ONLY (FAST MODE)');
console.log('📡 API:', CONFIG.apiEndpoint);
console.log('⚡ Concurrent Jobs:', CONFIG.concurrentJobs);
console.log('⚡ Poll Interval:', CONFIG.pollInterval + 'ms');
console.log('');

const api = axios.create({
  baseURL: CONFIG.apiEndpoint,
  headers: {
    'X-API-Token': CONFIG.apiToken,
    'Content-Type': 'application/json'
  }
});

const stats = { processed: 0, valid: 0, invalid: 0, errors: 0, startTime: Date.now() };

// Reuse browser instance for speed
let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await playwright.chromium.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browserInstance;
}

async function verifyOffice365(email) {
  const browser = await getBrowser();
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    
    await page.goto('https://login.microsoftonline.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    await page.waitForSelector('input[type="email"]', { timeout: CONFIG.timeout });
    await page.fill('input[type="email"]', email);
    await page.click('input[type="submit"]');
    
    // Reduced wait time from 5000ms to 2500ms
    await page.waitForTimeout(2500);
    
    const pageText = (await page.content()).toLowerCase();
    const hasUsernameError = pageText.includes("this username may be incorrect") || 
                            pageText.includes("username may be incorrect");
    
    await context.close(); // Close context, keep browser open

    if (hasUsernameError) {
      return { result: 'strong_bounce', details: 'Account does not exist' };
    }
    
    return { result: 'valid', details: 'Account exists' };

  } catch (error) {
    return { result: 'error', error_message: error.message };
  }
}

async function processJob(job) {
  try {
    const result = await verifyOffice365(job.email);
    await api.post('/api/worker/result', { id: job.id, ...result });
    
    stats.processed++;
    if (result.result === 'valid') stats.valid++;
    else if (result.result === 'strong_bounce') stats.invalid++;
    else if (result.result === 'error') stats.errors++;
    
    console.log(`✅ #${job.id}: ${job.email} → ${result.result}`);
  } catch (error) {
    console.error(`❌ #${job.id}: ${error.message}`);
  }
}

let activeJobs = 0;

async function workerLoop() {
  try {
    // Fetch multiple jobs if we have capacity
    while (activeJobs < CONFIG.concurrentJobs) {
      const response = await api.get('/api/worker/next');
      
      if (response.data.success && response.data.job) {
        activeJobs++;
        processJob(response.data.job).finally(() => {
          activeJobs--;
        });
      } else {
        break; // No more jobs available
      }
    }
  } catch (error) {
    // Silent fail to avoid log spam
  }
  
  setTimeout(workerLoop, CONFIG.pollInterval);
}

function printStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
  const rate = uptime > 0 ? Math.floor((stats.processed / uptime) * 60) : 0;
  console.log(`\n📊 Processed: ${stats.processed} | Valid: ${stats.valid} | Bounce: ${stats.invalid} | Errors: ${stats.errors} | Rate: ${rate}/min`);
}

setInterval(printStats, 30000); // Print stats every 30 seconds

process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down...');
  printStats();
  if (browserInstance) await browserInstance.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down...');
  printStats();
  if (browserInstance) await browserInstance.close();
  process.exit(0);
});

console.log('✅ Worker initialized (FAST MODE)');
console.log('⏳ Starting...\n');
workerLoop();
