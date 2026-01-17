# ⚡ Quick Command Reference

## 🎯 Essential Commands (Copy & Paste)

### 1️⃣ Navigate to Project
```bash
# Windows
cd C:\Users\%USERNAME%\Downloads\webapp

# Mac/Linux
cd ~/Downloads/webapp
```

### 2️⃣ Push to GitHub
```bash
git config --global user.name "aprelay"
git config --global user.email "your-email@example.com"
git remote add origin https://github.com/aprelay/emailloginverify.git
git add .
git commit -m "Initial deployment"
git push -u origin main
```

### 3️⃣ Deploy to Cloudflare (One Command at a Time!)

**Set API Token (Windows CMD):**
```cmd
set CLOUDFLARE_API_TOKEN=YOUR_TOKEN_HERE
```

**Set API Token (Mac/Linux):**
```bash
export CLOUDFLARE_API_TOKEN="YOUR_TOKEN_HERE"
```

**Install:**
```bash
npm install
```

**Create Database:**
```bash
npx wrangler d1 create webapp-production
```
→ **COPY the database_id and update wrangler.jsonc!**

**Apply Migrations:**
```bash
npx wrangler d1 migrations apply webapp-production --remote
```

**Build:**
```bash
npm run build
```

**Create Project:**
```bash
npx wrangler pages project create emailloginverify --production-branch main
```

**Deploy:**
```bash
npx wrangler pages deploy dist --project-name emailloginverify
```

### 4️⃣ Update VPS
```bash
ssh root@72.62.166.160
# Password: Newmoney012A@

nano /opt/email-verifier/.env
# Change API_ENDPOINT to your Cloudflare URL

pm2 restart email-verifier
pm2 logs email-verifier
```

---

## 🔗 Important Links

- **Download Project**: https://www.genspark.ai/api/files/s/bYjwqAX1
- **GitHub Repo**: https://github.com/aprelay/emailloginverify
- **Node.js Download**: https://nodejs.org/
- **Git Download**: https://git-scm.com/downloads
- **7-Zip (Windows)**: https://www.7-zip.org/
- **Cloudflare Dashboard**: https://dash.cloudflare.com/

---

## 📋 Checklist

Copy this and check off as you go:

```
[ ] 1. Downloaded tar.gz file
[ ] 2. Extracted to webapp folder
[ ] 3. Opened terminal/command prompt
[ ] 4. Navigated to webapp folder (cd command)
[ ] 5. Installed Git
[ ] 6. Installed Node.js
[ ] 7. Pushed to GitHub (git push)
[ ] 8. Set CLOUDFLARE_API_TOKEN
[ ] 9. Ran npm install
[ ] 10. Created D1 database
[ ] 11. Updated wrangler.jsonc with database_id
[ ] 12. Applied migrations
[ ] 13. Built project (npm run build)
[ ] 14. Created Cloudflare project
[ ] 15. Deployed to Cloudflare
[ ] 16. Updated VPS .env file
[ ] 17. Restarted worker on VPS
[ ] 18. Tested web UI
```

---

## 🎯 The Fastest Path (Under 15 Minutes)

If you already have Git and Node.js installed:

```bash
# 1. Extract and navigate
cd ~/Downloads/webapp

# 2. Push to GitHub
git config --global user.name "aprelay"
git remote add origin https://github.com/aprelay/emailloginverify.git
git add . && git commit -m "Deploy" && git push -u origin main

# 3. Deploy to Cloudflare
export CLOUDFLARE_API_TOKEN="YOUR_TOKEN"
npm install
npx wrangler d1 create webapp-production
# → Update wrangler.jsonc with database_id!
npx wrangler d1 migrations apply webapp-production --remote
npm run build
npx wrangler pages project create emailloginverify --production-branch main
npx wrangler pages deploy dist --project-name emailloginverify

# 4. Update VPS
ssh root@72.62.166.160
nano /opt/email-verifier/.env  # Update API_ENDPOINT
pm2 restart email-verifier
```

Done! 🎉

---

## ❓ Stuck? Check This:

**Command not found?**
- `git` → Install from https://git-scm.com/downloads
- `node` or `npm` → Install from https://nodejs.org/
- `npx` → Comes with npm (install Node.js)

**Wrong directory?**
```bash
pwd           # Shows current directory
ls            # Shows files in current directory
cd webapp     # Move into webapp folder
```

**Forgot to set token?**
```bash
# Check if set (Mac/Linux)
echo $CLOUDFLARE_API_TOKEN

# Check if set (Windows)
echo %CLOUDFLARE_API_TOKEN%
```

**Need to start over?**
```bash
cd ~/Downloads
rm -rf webapp
# Extract tar.gz again and restart
```
