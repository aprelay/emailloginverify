# 🔧 VPS Update Commands - Copy & Paste

## Step 1: SSH to VPS

**Copy this command:**
```bash
ssh root@72.62.166.160
```

**When prompted for password, type:**
```
Newmoney012A@
```

---

## Step 2: Update .env File

**Copy and paste this ENTIRE block (all lines at once):**

```bash
cat > /opt/email-verifier/.env << 'EOFENV'
API_ENDPOINT=https://emailloginverify.pages.dev
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=1000
HEADLESS=true
TIMEOUT=15000
CONCURRENT_JOBS=5
EOFENV
```

**Press Enter**

---

## Step 3: Verify .env File

**Copy and paste:**
```bash
cat /opt/email-verifier/.env
```

**You should see:**
```
API_ENDPOINT=https://emailloginverify.pages.dev
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=1000
HEADLESS=true
TIMEOUT=15000
CONCURRENT_JOBS=5
```

---

## Step 4: Restart Worker

**Copy and paste:**
```bash
pm2 restart email-verifier
```

---

## Step 5: Check Logs

**Copy and paste:**
```bash
pm2 logs email-verifier --lines 20 --nostream
```

**You should see:**
```
🚀 Worker Starting - Office365 ONLY (FAST MODE)
📡 API: https://emailloginverify.pages.dev
⚡ Concurrent Jobs: 5
✅ Worker initialized (FAST MODE)
⏳ Starting...
```

---

## 🎯 All Commands in One Block (Easiest!)

**After you SSH in, copy and paste this entire block:**

```bash
cat > /opt/email-verifier/.env << 'EOFENV'
API_ENDPOINT=https://emailloginverify.pages.dev
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=1000
HEADLESS=true
TIMEOUT=15000
CONCURRENT_JOBS=5
EOFENV

echo "✅ .env file updated:"
cat /opt/email-verifier/.env
echo ""
echo "🔄 Restarting worker..."
pm2 restart email-verifier
sleep 3
echo "📊 Worker logs:"
pm2 logs email-verifier --lines 20 --nostream
```

---

## ✅ Success Checklist

After running the commands, you should see:
- [x] `.env` file shows new URL: `https://emailloginverify.pages.dev`
- [x] Worker restarted successfully
- [x] Logs show: `API: https://emailloginverify.pages.dev`
- [x] No errors in the logs

---

## 🆘 If You See Errors

**"pm2: command not found"**
```bash
npm install -g pm2
```

**"No such file or directory"**
```bash
mkdir -p /opt/email-verifier
```

**Worker keeps crashing**
```bash
pm2 logs email-verifier --err --lines 50
```
Copy the error and show me!

---

## 🎉 After Updating VPS

**Test your app:**
1. Open: https://emailloginverify.pages.dev
2. Paste test emails
3. Click "Start Verification"
4. Watch results appear!

**But first, make sure you added the D1 binding in Cloudflare Dashboard!**

---

Good luck! Let me know if you need help! 🚀
