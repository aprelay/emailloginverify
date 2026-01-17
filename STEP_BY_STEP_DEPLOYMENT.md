# 📝 Step-by-Step Deployment Guide

## Part 1: Push to GitHub from Your Computer

### Step 1: Download the Project
1. **Click this link**: https://www.genspark.ai/api/files/s/bYjwqAX1
2. **Save as**: `emailloginverify-cloudflare-ready.tar.gz`
3. **Save to**: Your Downloads folder

### Step 2: Extract the Files

**On Windows:**
1. Download and install **7-Zip** from: https://www.7-zip.org/
2. Right-click on `emailloginverify-cloudflare-ready.tar.gz`
3. Click: **7-Zip** → **Extract Here**
4. Right-click on `emailloginverify-cloudflare-ready.tar` (the extracted file)
5. Click: **7-Zip** → **Extract Here** again
6. You should now have a folder called `webapp`

**On Mac:**
1. Double-click the downloaded `.tar.gz` file
2. It will automatically extract to a `webapp` folder

**On Linux:**
```bash
cd ~/Downloads
tar -xzf emailloginverify-cloudflare-ready.tar.gz
```

### Step 3: Open Terminal/Command Prompt

**On Windows:**
1. Press **Windows Key + R**
2. Type: `cmd` and press Enter
3. OR: Search for "Command Prompt" in Start menu

**On Mac:**
1. Press **Cmd + Space**
2. Type: `terminal` and press Enter

**On Linux:**
1. Press **Ctrl + Alt + T**

### Step 4: Navigate to the Project Folder

**On Windows:**
```cmd
cd C:\Users\%USERNAME%\Downloads\webapp
```

**On Mac/Linux:**
```bash
cd ~/Downloads/webapp
```

### Step 5: Install Git (if not installed)

Check if Git is installed:
```bash
git --version
```

If you see an error, install Git:
- **Windows**: https://git-scm.com/download/win
- **Mac**: `brew install git` OR download from https://git-scm.com/download/mac
- **Linux**: `sudo apt-get install git`

### Step 6: Configure Git
```bash
git config --global user.name "aprelay"
git config --global user.email "your-email@example.com"
```

### Step 7: Connect to GitHub Repository
```bash
git remote add origin https://github.com/aprelay/emailloginverify.git
```

### Step 8: Commit and Push
```bash
# Stage all files
git add .

# Commit with message
git commit -m "Complete email verifier with optimizations"

# Push to GitHub (you'll be prompted for username and token)
git push -u origin main
```

When prompted:
- **Username**: `aprelay`
- **Password**: Use your **Personal Access Token** (NOT your GitHub password)

---

## Part 2: Deploy to Cloudflare Pages

### Step 1: Install Node.js (if not installed)

Check if Node.js is installed:
```bash
node --version
```

If you see an error, install Node.js:
1. Go to: https://nodejs.org/
2. Download the **LTS** version (recommended)
3. Run the installer
4. Restart your terminal/command prompt

### Step 2: Set Cloudflare API Token

**On Windows (Command Prompt):**
```cmd
set CLOUDFLARE_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN_HERE
```

**On Windows (PowerShell):**
```powershell
$env:CLOUDFLARE_API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN_HERE"
```

**On Mac/Linux:**
```bash
export CLOUDFLARE_API_TOKEN="YOUR_CLOUDFLARE_API_TOKEN_HERE"
```

⚠️ **Replace `YOUR_CLOUDFLARE_API_TOKEN_HERE` with your actual token!**

### Step 3: Install Dependencies
```bash
npm install
```

This will take 2-3 minutes. You'll see lots of packages being installed.

### Step 4: Create Cloudflare D1 Database
```bash
npx wrangler d1 create webapp-production
```

**IMPORTANT**: Copy the `database_id` from the output!

Example output:
```
[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "abc123-def456-ghi789"  ← COPY THIS!
```

### Step 5: Update Configuration File

Open the file: `wrangler.jsonc`

Find this section:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "webapp-production",
    "database_id": "PUT-YOUR-DATABASE-ID-HERE"
  }
]
```

Replace `PUT-YOUR-DATABASE-ID-HERE` with the `database_id` you copied in Step 4.

Save the file.

### Step 6: Apply Database Migrations
```bash
npx wrangler d1 migrations apply webapp-production --remote
```

This creates the database tables in production.

### Step 7: Build the Project
```bash
npm run build
```

This will take 10-20 seconds. Output should end with:
```
✓ built in XXXms
```

### Step 8: Deploy to Cloudflare Pages

**First time deployment:**
```bash
npx wrangler pages project create emailloginverify --production-branch main
```

**Deploy:**
```bash
npx wrangler pages deploy dist --project-name emailloginverify
```

You'll see output like:
```
✨ Success! Uploaded 3 files (2.53 sec)

✨ Deployment complete! Take a peek over at
   https://abc123.emailloginverify.pages.dev
```

**🎉 COPY THAT URL! That's your live application!**

---

## Part 3: Update VPS Worker

### Step 1: SSH to VPS
```bash
ssh root@72.62.166.160
```
Password: `Newmoney012A@`

### Step 2: Update Worker Configuration
```bash
nano /opt/email-verifier/.env
```

Update the `API_ENDPOINT` line to your Cloudflare URL:
```
API_ENDPOINT=https://abc123.emailloginverify.pages.dev
```

Press **Ctrl + X**, then **Y**, then **Enter** to save.

### Step 3: Restart Worker
```bash
pm2 restart email-verifier
```

### Step 4: Check Logs
```bash
pm2 logs email-verifier --lines 20
```

You should see:
```
🚀 Worker Starting - Office365 ONLY (FAST MODE)
📡 API: https://abc123.emailloginverify.pages.dev
✅ Worker initialized
⏳ Polling...
```

---

## 🎯 Testing Your Deployment

1. **Open your Cloudflare URL** in a browser
2. **Paste test emails** (one per line):
   ```
   test1@example.com
   test2@example.com
   test3@example.com
   ```
3. **Click**: "Start Verification"
4. **Watch**: Results appear in real-time
5. **Test**: Click "Export Valid" and "Export Invalid" buttons

---

## ✅ Success Checklist

- [ ] Project extracted from tar.gz
- [ ] Node.js installed (`node --version` works)
- [ ] Git installed (`git --version` works)
- [ ] Code pushed to GitHub
- [ ] Cloudflare API token set
- [ ] Dependencies installed (`npm install`)
- [ ] D1 database created
- [ ] `wrangler.jsonc` updated with database_id
- [ ] Migrations applied
- [ ] Project built (`npm run build`)
- [ ] Deployed to Cloudflare Pages
- [ ] VPS worker updated with new URL
- [ ] Worker restarted and running
- [ ] Web UI accessible and working

---

## 🆘 Common Issues

### Issue: "git: command not found"
**Solution**: Install Git from https://git-scm.com/downloads

### Issue: "node: command not found"
**Solution**: Install Node.js from https://nodejs.org/

### Issue: "npm ERR! code ENOENT"
**Solution**: Make sure you're in the correct directory (cd into `webapp` folder)

### Issue: "Authentication failed" when pushing to GitHub
**Solution**: Use your Personal Access Token as the password, NOT your GitHub password

### Issue: "wrangler: command not found"
**Solution**: Run `npm install` first

### Issue: Database deployment fails
**Solution**: Make sure you copied the correct `database_id` to `wrangler.jsonc`

---

## 📞 Need Help?

If you get stuck at any step:
1. **Copy the error message** (the red text)
2. **Note which step** you were on
3. **Ask for help** with both pieces of information

---

## 🚀 You're Ready!

Follow these steps in order, and you'll have your email verifier live on Cloudflare Pages in about 30 minutes!

**Your repository**: https://github.com/aprelay/emailloginverify
**Your VPS**: 72.62.166.160

Good luck! 🎉
