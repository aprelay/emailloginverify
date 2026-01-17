# 🔄 Update VPS to Office365 Only

## Changes Made:
✅ Removed Gmail verification completely
✅ ALL emails now treated as Office365
✅ Only tests Office365/Microsoft login pages

---

## 📋 Update Your VPS Worker

### **Step 1: SSH to Your VPS**

```bash
ssh root@72.62.166.160
```
Password: `Newmoney012A@`

---

### **Step 2: Update worker.js**

Copy and paste this ENTIRE command block:

```bash
cd /opt/email-verifier && \
cp worker.js worker.js.backup && \
cat > worker.js << 'EOFWORKER'
import playwright from 'playwright';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const CONFIG={apiEndpoint:process.env.API_ENDPOINT||'http://localhost:3000',apiToken:process.env.API_TOKEN||'dev-token-change-in-production',pollInterval:parseInt(process.env.POLL_INTERVAL)||5e3,headless:process.env.HEADLESS!=='false',timeout:parseInt(process.env.TIMEOUT)||3e4,proxy:process.env.PROXY_SERVER?{server:process.env.PROXY_SERVER,username:process.env.PROXY_USERNAME,password:process.env.PROXY_PASSWORD}:null};console.log('🚀 Worker Starting - Office365 ONLY\n📡 API:',CONFIG.apiEndpoint,'\n');const api=axios.create({baseURL:CONFIG.apiEndpoint,headers:{'X-API-Token':CONFIG.apiToken,'Content-Type':'application/json'}});const stats={processed:0,valid:0,invalid:0,errors:0,startTime:Date.now()};async function verifyOffice365(e){const t=await playwright.chromium.launch({headless:CONFIG.headless,proxy:CONFIG.proxy,args:['--no-sandbox','--disable-setuid-sandbox']});try{const o=await t.newContext({viewport:{width:1280,height:720},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}),s=await o.newPage();console.log(`  📧 Testing: ${e}`),await s.goto('https://login.microsoftonline.com/',{waitUntil:'domcontentloaded',timeout:CONFIG.timeout}),await s.waitForSelector('input[type="email"]',{timeout:CONFIG.timeout}),await s.fill('input[type="email"]',e),await s.click('input[type="submit"]'),await s.waitForTimeout(3e3);const a=(await s.content()).toLowerCase(),r=a.includes("account doesn't exist")||a.includes("couldn't find your account"),n=await s.$('input[type="password"]'),i=s.url();return await t.close(),n?{result:'valid',details:'Account exists'}:r?{result:'strong_bounce',details:'Account does not exist'}:i.includes('login.live.com')?{result:'valid',details:'Account exists'}:{result:'invalid',details:'Could not verify'}}catch(o){return await t.close(),{result:'error',error_message:o.message}}}async function processJob(e){console.log(`\n🔍 Job #${e.id}: ${e.email}`);try{const t=await verifyOffice365(e.email);await api.post('/api/worker/result',{id:e.id,...t}),stats.processed++,'valid'===t.result?stats.valid++:'strong_bounce'===t.result?stats.invalid++:stats.errors++,console.log(`  ✅ ${t.result}`),t.details&&console.log(`  📝 ${t.details}`)}catch(t){console.error(`  ❌ ${t.message}`)}}async function workerLoop(){process.stdout.write('.');try{const e=await api.get('/api/worker/next');e.data.success&&e.data.job&&await processJob(e.data.job)}catch(e){e.response&&console.error(`\n❌ API Error: ${e.response.status}`)}setTimeout(workerLoop,CONFIG.pollInterval)}function printStats(){const e=Math.floor((Date.now()-stats.startTime)/1e3);console.log(`\n📊 ${e}s | Processed: ${stats.processed} | Valid: ${stats.valid} | Bounces: ${stats.invalid} | Errors: ${stats.errors}`)}process.on('SIGINT',()=>{console.log('\n🛑 Shutdown'),printStats(),process.exit(0)}),setInterval(printStats,6e4),console.log('✅ Office365 Only\n⏳ Polling...\n'),workerLoop();
EOFWORKER
echo "✅ Updated to Office365-only worker"
```

---

### **Step 3: Restart Worker**

```bash
pm2 restart email-verifier
```

---

### **Step 4: Verify It's Working**

```bash
pm2 logs email-verifier --lines 10 --nostream
```

You should see:
```
🚀 Worker Starting - Office365 ONLY
📡 API: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
✅ Office365 Only
⏳ Polling...
```

---

## ✅ Test It Now!

### **Submit your emails in the web interface:**

```
a.gavrilovic@diahem.com
a.hart@tiffany.com
a.khavulya@mlgpllc.com
a.marzella@winebow.com
a.singh@dpskc.com
```

All will be verified as **Office365 emails** (no more Gmail detection)!

---

## 🎯 What Changed:

**Before:**
- ❌ System detected domains and separated Gmail vs Office365
- ❌ Your emails were incorrectly marked as "gmail"

**Now:**
- ✅ ALL emails treated as Office365
- ✅ Only tests Microsoft/Office365 login pages
- ✅ No Gmail verification at all

---

## 📊 Expected Results:

When you submit `a.gavrilovic@diahem.com`:

**VPS Logs:**
```
🔍 Job #1: a.gavrilovic@diahem.com
  📧 Testing: a.gavrilovic@diahem.com
  ✅ valid
  📝 Account exists
```

**Web Interface:**
- Provider: Office365 ✅
- Result: Valid or Strong Bounce
- No more "Gmail" labels!

---

## 🔧 Quick Commands:

```bash
# Restart worker
pm2 restart email-verifier

# View logs
pm2 logs email-verifier

# Check status
pm2 status
```

---

**Run the update now and test with your emails!** 🚀
