# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Access the Application

**Development URL**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai

Open this URL in your browser to see the email verification interface.

###Step 2: Setup VPS Worker

You need a **standard VPS** to run the worker that performs email existence checks.

#### **What You Need:**
- **Standard VPS** (NOT specialized email VPS)
- **NO port 25 required** (we're not sending emails, just checking login pages)
- **2GB+ RAM** for browser automation
- **Ubuntu 22.04 LTS** or similar

#### **Recommended VPS Providers:**

| Provider | Price | Why Choose |
|----------|-------|------------|
| **Contabo** | $4.99/mo | Best value - high specs for price |
| **Hetzner** | €4.51/mo | Great performance, EU-based |
| **DigitalOcean** | $6/mo | Easy to use, beginner-friendly |
| **Vultr** | $6/mo | Many global locations |
| **Linode** | $5/mo | Reliable, good support |

Get any standard VPS from these providers. You don't need anything special - just a regular VPS with 2GB+ RAM.

#### **Setup Instructions:**

1. **Get a VPS and SSH into it:**
```bash
ssh root@YOUR-VPS-IP
```

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
mkdir -p /opt/email-verifier
cd /opt/email-verifier
```

3. **Copy worker files from your local machine:**
```bash
# On your computer (not VPS)
cd /home/user/webapp
scp -r vps-worker/* root@YOUR-VPS-IP:/opt/email-verifier/
```

4. **Install dependencies on VPS:**
```bash
# Back on VPS
cd /opt/email-verifier
npm install
npm run install-browsers

# Install system dependencies
apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2
```

5. **Configure worker:**
```bash
cp .env.example .env
nano .env
```

Update `.env`:
```env
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
HEADLESS=true
POLL_INTERVAL=5000
```

6. **Start worker:**
```bash
# Quick test
node worker.js

# Or use PM2 for production
npm install -g pm2
pm2 start worker.js --name email-verifier
pm2 save
pm2 startup  # Enable auto-start on reboot
```

You should see:
```
🚀 Email Verification Worker Starting...
📡 API Endpoint: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
🔍 Verification Method: Email Existence Check (No Password Required)
✅ Worker initialized successfully
⏳ Starting worker loop...
```

### Step 3: Test the System

1. **Open the web interface**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai

2. **Enter test emails** (just emails, NO passwords!):
```
test@outlook.com
demo@gmail.com
someone@hotmail.com
user@live.com
```

3. **Click "Start Verification"**

4. **Watch the results** appear in real-time as the VPS worker processes them

## 🎯 How It Works

**Simple Process:**
1. You submit email addresses (no passwords)
2. Worker opens login page (Office365 or Gmail)
3. Worker enters the email address
4. Worker checks response:
   - Password field appears → **Email EXISTS** (Valid)
   - "Account not found" error → **Email DOESN'T EXIST** (Strong Bounce)

**NO PASSWORDS NEEDED!** Just check if accounts exist.

## ⚠️ Important Notes

### For Testing in Sandbox
- Use the sandbox URL: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
- Default API token: `dev-token-change-in-production`
- Sandbox will expire after inactivity

### For Production Deployment
- Follow `DEPLOYMENT.md` for complete production setup
- Deploy to Cloudflare Pages for permanent URL
- Create production D1 database
- Change API token to secure random string
- Use residential proxy for better success rate (optional)

### VPS Requirements
- **Standard VPS only** - NOT specialized email VPS
- **NO port 25 needed** - we're not sending emails
- **2GB+ RAM** - for running headless Chrome browser
- **Any provider works** - DigitalOcean, Vultr, Contabo, Hetzner, etc.

## 📊 Expected Results

After the VPS worker processes an email, you'll see one of these results:

- ✅ **Valid**: Email account exists (password field appeared)
- 🚫 **Strong Bounce**: Email account doesn't exist ("account not found" error)
- ❓ **Invalid**: Could not determine (might be blocked, timeout)
- ⚠️ **Error**: Technical issue (timeout, CAPTCHA, network problem)

## 🔧 Troubleshooting

### Worker not processing jobs?
1. Check worker is running: `pm2 status` or `ps aux | grep worker`
2. Check worker logs: `pm2 logs email-verifier`
3. Verify API_ENDPOINT is correct in worker .env
4. Test connection: `curl https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai/api/stats`

### Jobs stuck in "processing"?
- Restart worker: `pm2 restart email-verifier`
- Check for errors in worker logs: `pm2 logs email-verifier --lines 50`
- Verify VPS has enough RAM: `free -h` (should show 2GB+)

### High "invalid" or "error" rate?
- Add proxy configuration in worker .env (see below)
- Increase timeout value in .env
- Check worker logs for specific errors
- Gmail/Office365 may detect automation - use proxy to avoid this

### Adding a Proxy (Optional - for better success rate)
```bash
# Edit .env on VPS
nano .env

# Add these lines:
PROXY_SERVER=http://your-proxy-server:port
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password

# Restart worker
pm2 restart email-verifier
```

**Recommended Proxy Providers:**
- BrightData (brightdata.com) - Best quality, residential proxies
- Oxylabs (oxylabs.io) - Good balance of price/quality
- Smartproxy (smartproxy.com) - Budget-friendly option

## 📚 Documentation

- **README.md**: Complete project overview and features
- **DEPLOYMENT.md**: Step-by-step production deployment guide
- **vps-worker/README.md**: Detailed VPS worker setup instructions

## 🎯 Next Steps

1. ✅ Test with VPS worker
2. ✅ Verify results appear correctly
3. 📝 Read DEPLOYMENT.md for production setup
4. 🚀 Deploy to Cloudflare Pages (optional)
5. 🔐 Configure secure API token (for production)
6. 🌐 Add proxy for better success rate (optional)

---

**Questions?** Check the troubleshooting sections in README.md and DEPLOYMENT.md

**Remember:** This checks if email accounts EXIST, not if credentials are valid. No passwords required!
