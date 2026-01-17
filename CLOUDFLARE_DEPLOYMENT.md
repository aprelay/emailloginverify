# Deploy to Cloudflare Pages - Complete Guide

## Your Cloudflare API Token
```
Q5lv6UKkYCl2rbYD2lQ7mLEGbMc-vBARPXY831eO
```

**IMPORTANT: Keep this token secure!**

---

## Step 1: Set Environment Variable

On your local computer (not VPS), set the API token:

### Windows (PowerShell):
```powershell
$env:CLOUDFLARE_API_TOKEN="Q5lv6UKkYCl2rbYD2lQ7mLEGbMc-vBARPXY831eO"
```

### Mac/Linux:
```bash
export CLOUDFLARE_API_TOKEN="Q5lv6UKkYCl2rbYD2lQ7mLEGbMc-vBARPXY831eO"
```

---

## Step 2: Verify Authentication

```bash
npx wrangler whoami
```

You should see your Cloudflare account info.

---

## Step 3: Create Production D1 Database

```bash
cd /path/to/webapp
npx wrangler d1 create webapp-production
```

**Save the output!** It will look like:
```
✅ Successfully created DB 'webapp-production'

[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id`!

---

## Step 4: Update wrangler.jsonc

Edit `wrangler.jsonc` and add the D1 configuration:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "webapp",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "PUT-YOUR-DATABASE-ID-HERE"
    }
  ]
}
```

---

## Step 5: Apply Migrations to Production

```bash
npx wrangler d1 migrations apply webapp-production --remote
```

This will run both migrations:
- `0001_initial_schema.sql` - Creates tables
- `0002_add_performance_indexes.sql` - Adds indexes

---

## Step 6: Build the Project

```bash
npm run build
```

This creates the `dist/` folder with:
- `_worker.js` - Your compiled app
- `_routes.json` - Routing config
- `static/` - Your static files

---

## Step 7: Create Cloudflare Pages Project

```bash
npx wrangler pages project create webapp --production-branch main
```

---

## Step 8: Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist --project-name webapp
```

**Save the deployment URL!** It will be something like:
```
✨ Deployment complete! Take a peek over at https://xxxxxxxx.webapp.pages.dev
```

---

## Step 9: Update VPS Worker

SSH to your VPS:
```bash
ssh root@72.62.166.160
```
Password: `Newmoney012A@`

Update the `.env` file:
```bash
nano /opt/email-verifier/.env
```

Change the API endpoint to your new Cloudflare Pages URL:
```
API_ENDPOINT=https://xxxxxxxx.webapp.pages.dev
API_TOKEN=dev-token-change-in-production
POLL_INTERVAL=1000
HEADLESS=true
TIMEOUT=15000
CONCURRENT_JOBS=5
```

Save and restart:
```bash
pm2 restart email-verifier
pm2 logs email-verifier
```

---

## Step 10: Test It!

1. Open your Cloudflare Pages URL in browser
2. Submit a few test emails
3. Watch the VPS logs process them
4. Check results on the dashboard

---

## Troubleshooting

### If database migration fails:
```bash
# Check if database exists
npx wrangler d1 list

# Try migration again
npx wrangler d1 migrations apply webapp-production --remote
```

### If deployment fails:
```bash
# Check if project exists
npx wrangler pages project list

# Delete and recreate
npx wrangler pages project delete webapp
npx wrangler pages project create webapp --production-branch main
npx wrangler pages deploy dist --project-name webapp
```

### If VPS worker can't connect:
```bash
# Test the API manually
curl https://your-url.pages.dev/api/stats

# Check VPS worker logs
pm2 logs email-verifier --lines 50
```

---

## Benefits You'll Get

✅ **Instant loading** - No more slow sandbox  
✅ **Bulk submissions work** - 1000 emails in seconds  
✅ **Global CDN** - Fast worldwide  
✅ **Auto-scaling** - Handles any load  
✅ **99.99% uptime** - Cloudflare reliability  
✅ **Free SSL** - HTTPS automatic  
✅ **Custom domain ready** - Add your domain anytime  

---

## Custom Domain (Optional)

After deployment, you can add a custom domain:

```bash
npx wrangler pages domain add yourdomain.com --project-name webapp
```

Then add CNAME in your DNS:
```
CNAME: yourdomain.com → webapp.pages.dev
```

---

## Environment Variables (Optional)

If you need to add secrets:

```bash
# Add API token as secret
npx wrangler pages secret put API_TOKEN --project-name webapp
# Enter: dev-token-change-in-production

# List secrets
npx wrangler pages secret list --project-name webapp
```

---

## Summary of Commands

```bash
# 1. Set token
export CLOUDFLARE_API_TOKEN="Q5lv6UKkYCl2rbYD2lQ7mLEGbMc-vBARPXY831eO"

# 2. Create database
npx wrangler d1 create webapp-production

# 3. Update wrangler.jsonc with database_id

# 4. Run migrations
npx wrangler d1 migrations apply webapp-production --remote

# 5. Build
npm run build

# 6. Create project
npx wrangler pages project create webapp --production-branch main

# 7. Deploy
npx wrangler pages deploy dist --project-name webapp

# 8. Update VPS .env with new URL

# 9. Restart VPS worker
pm2 restart email-verifier
```

---

## What to Do Next

1. **Download the project** from sandbox if needed
2. **Run the commands** on your local machine
3. **Deploy to Cloudflare**
4. **Update VPS worker**
5. **Test and enjoy!**

---

**Your email verifier will be 10x faster on Cloudflare Pages!** 🚀

No more sandbox timeouts or slow loading!
