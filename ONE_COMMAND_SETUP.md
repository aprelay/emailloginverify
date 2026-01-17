# 🚀 ONE-COMMAND VPS SETUP

## Copy-Paste This Single Command on Your Computer

### **For Windows (PowerShell or CMD):**

```powershell
ssh root@72.62.166.160 "curl -sSL https://raw.githubusercontent.com/YOUR-REPO/main/vps-setup.sh | bash"
```

Password: `Newmoney012A@`

---

## OR Use This Complete Manual Command (Copy-Paste Everything)

**Connect to VPS first:**
```bash
ssh root@72.62.166.160
```
Password: `Newmoney012A@`

**Then copy-paste this ENTIRE block:**

```bash
# Complete automated setup - Copy-paste everything below
apt update && apt upgrade -y && \
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
apt install -y nodejs && \
mkdir -p /opt/email-verifier && \
cd /opt/email-verifier && \
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
cat > .env << 'EOFENV'
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=5000
HEADLESS=true
TIMEOUT=30000
EOFENV
npm install && \
npm run install-browsers && \
apt install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2 && \
npm install -g pm2
```

**Then create worker.js (copy this separately):**

```bash
cat > /opt/email-verifier/worker.js << 'EOFWORKER'
import playwright from 'playwright';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const CONFIG={apiEndpoint:process.env.API_ENDPOINT||'http://localhost:3000',apiToken:process.env.API_TOKEN||'dev-token-change-in-production',pollInterval:parseInt(process.env.POLL_INTERVAL)||5e3,headless:process.env.HEADLESS!=='false',timeout:parseInt(process.env.TIMEOUT)||3e4,proxy:process.env.PROXY_SERVER?{server:process.env.PROXY_SERVER,username:process.env.PROXY_USERNAME,password:process.env.PROXY_PASSWORD}:null};console.log('🚀 Worker Starting...\n📡 API:',CONFIG.apiEndpoint,'\n');const api=axios.create({baseURL:CONFIG.apiEndpoint,headers:{'X-API-Token':CONFIG.apiToken,'Content-Type':'application/json'}});const stats={processed:0,valid:0,invalid:0,errors:0,startTime:Date.now()};async function verifyOffice365(e){const t=await playwright.chromium.launch({headless:CONFIG.headless,proxy:CONFIG.proxy,args:['--no-sandbox','--disable-setuid-sandbox']});try{const o=await t.newContext({viewport:{width:1280,height:720},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}),s=await o.newPage();console.log(`  📧 Testing Office365: ${e}`),await s.goto('https://login.microsoftonline.com/',{waitUntil:'domcontentloaded',timeout:CONFIG.timeout}),await s.waitForSelector('input[type="email"]',{timeout:CONFIG.timeout}),await s.fill('input[type="email"]',e),await s.click('input[type="submit"]'),await s.waitForTimeout(3e3);const a=(await s.content()).toLowerCase(),r=a.includes("account doesn't exist")||a.includes("couldn't find your account"),n=await s.$('input[type="password"]');return await t.close(),n?{result:'valid',details:'Account exists'}:r?{result:'strong_bounce',details:'Account does not exist'}:{result:'invalid',details:'Could not verify'}}catch(o){return await t.close(),{result:'error',error_message:o.message}}}async function verifyGmail(e){const t=await playwright.chromium.launch({headless:CONFIG.headless,proxy:CONFIG.proxy,args:['--no-sandbox','--disable-setuid-sandbox']});try{const o=await t.newContext({viewport:{width:1280,height:720},userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}),s=await o.newPage();console.log(`  📧 Testing Gmail: ${e}`),await s.goto('https://accounts.google.com/signin/v2/identifier',{waitUntil:'domcontentloaded',timeout:CONFIG.timeout}),await s.waitForSelector('input[type="email"]',{timeout:CONFIG.timeout}),await s.fill('input[type="email"]',e);const a=await s.$('#identifierNext');a&&await a.click(),await s.waitForTimeout(3e3);const r=(await s.content()).toLowerCase(),n=r.includes("couldn't find your google account"),i=await s.$('input[type="password"]');return await t.close(),i?{result:'valid',details:'Account exists'}:n?{result:'strong_bounce',details:'Account does not exist'}:{result:'invalid',details:'Could not verify'}}catch(o){return await t.close(),{result:'error',error_message:o.message}}}async function processJob(e){console.log(`\n🔍 Job #${e.id}: ${e.email} (${e.provider})`);try{const t='office365'===e.provider?await verifyOffice365(e.email):await verifyGmail(e.email);await api.post('/api/worker/result',{id:e.id,...t}),stats.processed++,'valid'===t.result?stats.valid++:'strong_bounce'===t.result?stats.invalid++:stats.errors++,console.log(`  ✅ Result: ${t.result}`)}catch(t){console.error(`  ❌ Error: ${t.message}`)}}async function workerLoop(){process.stdout.write('.');try{const e=await api.get('/api/worker/next');e.data.success&&e.data.job&&await processJob(e.data.job)}catch(e){e.response&&console.error(`\n❌ API Error: ${e.response.status}`)}setTimeout(workerLoop,CONFIG.pollInterval)}function printStats(){const e=Math.floor((Date.now()-stats.startTime)/1e3);console.log(`\n📊 Uptime: ${e}s | Processed: ${stats.processed} | Valid: ${stats.valid} | Bounces: ${stats.invalid} | Errors: ${stats.errors}`)}process.on('SIGINT',()=>{console.log('\n🛑 Shutting down...'),printStats(),process.exit(0)}),setInterval(printStats,6e4),console.log('✅ Worker ready\n⏳ Polling...\n'),workerLoop();
EOFWORKER
```

**Finally, start the worker:**

```bash
cd /opt/email-verifier && \
pm2 start worker.js --name email-verifier && \
pm2 save && \
pm2 startup && \
pm2 logs email-verifier --lines 10
```

---

## ✅ That's It!

After running all these commands, your worker will be running!

Test at: **https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai**

---

## 🎯 Summary of What You Need to Do:

1. **Connect**: `ssh root@72.62.166.160` (password: `Newmoney012A@`)
2. **Copy-paste**: First command block (installs everything)
3. **Copy-paste**: Second command block (creates worker.js)
4. **Copy-paste**: Third command block (starts PM2)
5. **Done**: Go test it!

**Total time: ~10 minutes**
