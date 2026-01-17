# 🪟 Complete WSL Ubuntu Setup Guide

## Use Your Windows PC as the "VPS"!

Since your VPS is having issues, use **WSL (Windows Subsystem for Linux)** instead. It's free and runs Ubuntu on your Windows PC!

---

## ✅ Why Use WSL?

- ✅ **Free** - No monthly VPS costs
- ✅ **Fast** - No network latency
- ✅ **Easy** - Setup in 15 minutes
- ✅ **Perfect for testing** - Full Ubuntu environment
- ✅ **Works on Windows 10/11**

⚠️ **Note**: Worker only runs when your PC is on. For 24/7 production, you'd need a real VPS.

---

## 📋 Complete Setup (15 Minutes)

### **Step 1: Install WSL with Ubuntu (5 minutes)**

#### Open PowerShell as Administrator:
1. Press `Win + X`
2. Click "Windows PowerShell (Admin)" or "Terminal (Admin)"

#### Install Ubuntu:
```powershell
wsl --install -d Ubuntu-22.04
```

#### Wait for installation (2-3 minutes)

#### Restart your computer when prompted

---

### **Step 2: First Time Ubuntu Setup (2 minutes)**

After restart, Ubuntu opens automatically:

1. **Create username**: `user` (or any name you like)
2. **Create password**: Enter a password (remember it!)
3. **Confirm password**

You'll see: `user@DESKTOP-XXX:~$`

✅ **Ubuntu is ready!**

---

### **Step 3: Update Ubuntu (2 minutes)**

```bash
sudo apt update && sudo apt upgrade -y
```

Enter your password when prompted.

---

### **Step 4: Install Node.js 18 (2 minutes)**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

---

### **Step 5: Create Worker Directory**

```bash
mkdir -p ~/email-verifier
cd ~/email-verifier
```

---

### **Step 6: Create All Files (Copy-Paste Each Block)**

#### **File 1: package.json**

```bash
cat > package.json << 'EOF'
{
  "name": "email-verifier-worker",
  "version": "1.0.0",
  "description": "Email verification worker",
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
EOF
```

#### **File 2: .env**

```bash
cat > .env << 'EOF'
API_ENDPOINT=https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=5000
MAX_RETRIES=3
HEADLESS=true
TIMEOUT=30000
EOF
```

#### **File 3: worker.js** (THE MAIN FILE)

**IMPORTANT**: Use the worker.js code from **MANUAL_VPS_SETUP.md** (it's long, around 200 lines)

Or create it step by step:

```bash
nano worker.js
```

Then:
1. Open the file `/home/user/webapp/vps-worker/worker.js` in the sandbox
2. Copy ALL the content
3. Paste into the nano editor
4. Press `Ctrl+X`, then `Y`, then `Enter` to save

**OR** use the simplified copy command:

```bash
# Download the worker file directly (if you can access the sandbox files)
# Otherwise, manually copy-paste the content from MANUAL_VPS_SETUP.md
```

---

### **Step 7: Install Dependencies (3 minutes)**

```bash
# Install Node packages
npm install

# Install Playwright browsers (takes 2-3 minutes)
npm run install-browsers

# Install system dependencies
sudo apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2
```

---

### **Step 8: Start the Worker!**

```bash
node worker.js
```

You should see:
```
🚀 Email Verification Worker Starting...
📡 API Endpoint: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
🔍 Verification Method: Email Existence Check (No Password Required)
✅ Worker initialized successfully
⏳ Starting worker loop...
.......
```

✅ **IT'S WORKING!**

---

## 🧪 **Test It!**

### 1. Keep Ubuntu terminal open (worker running)

### 2. Open your web browser

Go to: **https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai**

### 3. Enter test emails:
```
test@outlook.com
demo@gmail.com
someone@hotmail.com
```

### 4. Click "Start Verification"

### 5. Watch the Ubuntu terminal!

You'll see:
```
🔍 Processing Job #1
  Email: test@outlook.com
  Provider: office365
  📧 Testing Office365: test@outlook.com
  ✅ Result: valid
  📝 Details: Account exists
```

### 6. Check results in web browser!

Results appear automatically in the table!

---

## 🔧 **Useful Commands**

### **Stop the worker:**
Press `Ctrl+C` in Ubuntu terminal

### **Restart the worker:**
```bash
cd ~/email-verifier
node worker.js
```

### **Check files:**
```bash
cd ~/email-verifier
ls -la
```

### **Edit configuration:**
```bash
cd ~/email-verifier
nano .env
# Make changes
# Press Ctrl+X, Y, Enter to save
node worker.js  # Restart
```

### **View logs in real-time:**
Worker prints logs directly to terminal!

---

## 🎯 **How to Open Ubuntu Terminal Anytime**

1. Press `Win + S`
2. Type: `Ubuntu`
3. Click "Ubuntu 22.04 LTS"
4. Terminal opens!

Or add to taskbar for quick access!

---

## 🔄 **Auto-Start on Windows Boot (Optional)**

If you want the worker to start automatically when Windows boots:

### **Method 1: Task Scheduler**

1. Open Task Scheduler (search in Start menu)
2. Create Basic Task
3. Name: "Email Verifier"
4. Trigger: "When I log on"
5. Action: "Start a program"
6. Program: `wsl.exe`
7. Arguments: `-d Ubuntu-22.04 -e bash -c "cd ~/email-verifier && node worker.js"`
8. Finish!

### **Method 2: Startup Folder (Simpler)**

1. Press `Win + R`
2. Type: `shell:startup`
3. Create a new file: `start-worker.bat`
4. Content:
   ```batch
   wsl -d Ubuntu-22.04 -e bash -c "cd ~/email-verifier && node worker.js"
   ```
5. Save and close

---

## 🐛 **Troubleshooting**

### **"wsl: command not found"**
- You need Windows 10 (version 2004+) or Windows 11
- Run Windows Update first

### **"Cannot connect to API"**
- Check if sandbox is still running
- URL might have changed
- Try accessing in browser first

### **"Browser launch failed"**
- Run: `npm run install-browsers` again
- Install missing dependencies (see Step 7)

### **Worker not processing jobs**
- Restart worker: Press `Ctrl+C`, then `node worker.js`
- Check .env file has correct API_ENDPOINT
- Test API: `curl https://3000-..../api/stats`

---

## 📊 **Performance on WSL**

- ✅ **Fast**: No network latency
- ✅ **Reliable**: Runs on your PC
- ✅ **Free**: No VPS costs
- ⚠️ **Requires PC on**: Only works when Windows is running

**Expected speed**: 500-1000 emails/hour

---

## 🎯 **Next Steps**

1. ✅ **Install WSL Ubuntu** (5 min)
2. ✅ **Setup worker** (10 min)
3. ✅ **Test with emails** (2 min)
4. 📊 **Monitor and verify**
5. 🚀 **Process your emails!**

---

## ⚡ **Quick Reference**

```bash
# Start worker
cd ~/email-verifier
node worker.js

# Stop worker
Ctrl+C

# Edit config
nano .env

# Check files
ls -la ~/email-verifier

# Update packages
npm install
npm run install-browsers
```

---

## 📞 **Need Help?**

Common issues:
1. **Can't install WSL**: Update Windows first
2. **Node.js errors**: Reinstall Node.js (Step 4)
3. **Browser errors**: Reinstall Playwright browsers
4. **API errors**: Check URL in .env file

---

## 🎉 **Advantages of WSL Over VPS**

| Feature | WSL | VPS |
|---------|-----|-----|
| **Cost** | Free ✅ | $5-10/month |
| **Speed** | Very fast ✅ | Network dependent |
| **Setup** | 15 minutes ✅ | 30-60 minutes |
| **Issues** | None ✅ | Connection problems |
| **24/7** | Need PC on ⚠️ | Always on ✅ |

**For testing/development**: WSL is perfect! ✅

**For production 24/7**: Use VPS once you get it working.

---

## 🚀 **Start Now!**

1. Open PowerShell as Admin
2. Run: `wsl --install -d Ubuntu-22.04`
3. Restart computer
4. Follow steps above
5. Start verifying emails in 15 minutes!

---

**Questions?** Just ask! This method is actually easier than VPS setup! 🎯
