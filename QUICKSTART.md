# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Access the Application

**Development URL**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai

Open this URL in your browser to see the email verification interface.

### Step 2: Setup VPS Worker

You need a VPS to run the worker that performs actual login verification:

1. **Get a VPS** (DigitalOcean, Linode, Vultr - 2GB RAM minimum)

2. **Copy worker files to VPS**:
```bash
cd /home/user/webapp
scp -r vps-worker/* root@YOUR-VPS-IP:/opt/email-verifier/
```

3. **SSH to VPS and setup**:
```bash
ssh root@YOUR-VPS-IP
cd /opt/email-verifier

# Install dependencies
npm install
npm run install-browsers

# Configure
cp .env.example .env
nano .env
```

4. **Update .env file**:
```env
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
HEADLESS=true
POLL_INTERVAL=5000
```

5. **Start worker**:
```bash
# Quick test
node worker.js

# Or use PM2 for production
npm install -g pm2
pm2 start worker.js --name email-verifier
pm2 save
```

### Step 3: Test the System

1. **Open the web interface**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai

2. **Enter test emails** (format: email:password, one per line):
```
test@outlook.com:password123
demo@gmail.com:demopass456
```

3. **Click "Start Verification"**

4. **Watch the results** appear in real-time as the VPS worker processes them

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
- Use residential proxy for better success rate

## 📊 Expected Results

After the VPS worker processes an email, you'll see one of these results:

- ✅ **Valid**: Login successful - email and password are correct
- ❌ **Invalid**: Login failed - password is wrong
- 🚫 **Strong Bounce**: Account doesn't exist or is blocked
- ⚠️ **Error**: Technical issue (timeout, CAPTCHA, etc.)

## 🔧 Troubleshooting

### Worker not processing jobs?
1. Check worker is running: `pm2 status` or `ps aux | grep worker`
2. Check worker logs: `pm2 logs email-verifier`
3. Verify API_ENDPOINT is correct in worker .env
4. Test connection: `curl https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai/api/stats`

### Jobs stuck in "processing"?
- Restart worker: `pm2 restart email-verifier`
- Check for errors in worker logs
- Verify VPS has enough RAM (2GB minimum)

### High failure rate?
- Add proxy configuration in worker .env
- Increase timeout value
- Check worker logs for specific errors
- Gmail/Office365 may detect automation - use proxy

## 📚 Documentation

- **README.md**: Complete project overview and features
- **DEPLOYMENT.md**: Step-by-step production deployment guide
- **vps-worker/README.md**: Detailed VPS worker setup instructions

## 🎯 Next Steps

1. ✅ Test with VPS worker
2. ✅ Verify results appear correctly
3. 📝 Read DEPLOYMENT.md for production setup
4. 🚀 Deploy to Cloudflare Pages
5. 🔐 Configure secure API token
6. 🌐 Add proxy for better success rate

---

**Questions?** Check the troubleshooting sections in README.md and DEPLOYMENT.md
