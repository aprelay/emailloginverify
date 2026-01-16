# 🚀 Quick VPS Setup - One Page Reference

## Your VPS
```
IP: 142.171.246.247
User: root
Pass: 1ayY46X18k
```

## ⚡ Fast Setup (Copy & Paste)

### 1. Upload Files (Run on sandbox/local machine)
```bash
cd /home/user/webapp
scp -r vps-worker/* root@142.171.246.247:/opt/email-verifier/
# Password: 1ayY46X18k
```

### 2. SSH to VPS
```bash
ssh root@142.171.246.247
# Password: 1ayY46X18k
```

### 3. Run Automated Setup
```bash
cd /opt/email-verifier
chmod +x setup-vps.sh
./setup-vps.sh
```

### 4. Check Status
```bash
pm2 status
pm2 logs email-verifier
```

## ✅ Test It

1. Open: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
2. Enter emails:
   ```
   test@outlook.com
   demo@gmail.com
   ```
3. Click "Start Verification"
4. Watch logs on VPS: `pm2 logs email-verifier`

## 🔧 Useful Commands

```bash
pm2 status                    # Check status
pm2 logs email-verifier       # View logs
pm2 restart email-verifier    # Restart
pm2 stop email-verifier       # Stop
nano .env                     # Edit config
free -h                       # Check RAM
```

## 🐛 If Something Breaks

```bash
# Restart worker
pm2 restart email-verifier

# Check logs
pm2 logs email-verifier --lines 50

# Test API connection
curl https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai/api/stats
```

---

**That's it!** Total time: ~5 minutes

📖 For detailed guide: See `COMPLETE_VPS_SETUP.md`
