# Email Verifier - Office365 & Gmail Email Existence Verification

A production-ready email verification system that checks if Office365 and Gmail email accounts **exist** by testing login page responses. **No passwords required** - just email addresses!

## 🎯 Project Overview

**Goal**: Verify if email addresses exist by attempting to enter them on Office365/Gmail login pages and analyzing the response.

**How It Works**: 
- User submits email addresses (NO passwords needed)
- System attempts to enter email on login page
- If password field appears → Email EXISTS (Valid)
- If "account not found" error → Email DOESN'T EXIST (Strong Bounce)

**Architecture**:
- **Cloudflare Pages Frontend**: Web UI for submitting emails and viewing results
- **Cloudflare Workers API**: Queue management and result storage
- **Cloudflare D1 Database**: SQLite-based storage for queue and results
- **VPS Worker Service**: Playwright-based automation for email existence checks

## 🌐 URLs

- **Development**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
- **Production**: (Deploy to Cloudflare Pages - see deployment guide)
- **GitHub**: (Push to your repository)

## 📊 Data Architecture

### Database Tables

**1. verification_queue**
- Stores email verification jobs (email only, no password)
- Status: pending → processing → completed
- Result: valid | invalid | strong_bounce | error

**2. verification_results**
- Historical record of successful verifications
- Queryable for reporting and analytics

**3. api_tokens**
- Secure authentication for VPS workers
- Token-based access control

### Data Flow

```
User → Frontend → API → D1 Queue → VPS Worker → Playwright → Login Page Test → Result → D1 → Frontend
```

1. User submits email addresses (just emails, no passwords!)
2. API validates and adds to verification_queue (status: pending)
3. VPS worker polls queue for pending jobs
4. Worker launches headless browser and enters email on login page
5. Result classification:
   - **valid**: Password field appeared (account exists)
   - **strong_bounce**: "Account not found" error (doesn't exist)
   - **invalid**: Could not determine
   - **error**: Technical issue during verification
6. Result stored in database and displayed in UI

## 🚀 Features

### Completed Features
✅ Office365 email existence verification
✅ Gmail email existence verification
✅ **No passwords required** - just email addresses
✅ Real-time status dashboard with statistics
✅ Bulk email submission (paste multiple emails)
✅ Queue-based processing system
✅ VPS worker with Playwright automation
✅ API token authentication for workers
✅ Strong bounce detection
✅ Auto-refresh results (5-second interval)
✅ Clean, responsive UI with Tailwind CSS
✅ RESTful API for worker integration
✅ Duplicate detection (won't queue same email twice)

### Features Not Yet Implemented
⏳ Multi-threaded worker support (currently single-threaded)
⏳ Proxy rotation for better success rate
⏳ CAPTCHA solving integration
⏳ Export results to CSV/Excel
⏳ Scheduled batch verification
⏳ Email notification on completion
⏳ Advanced filtering and search
⏳ Historical analytics and reporting

## 📝 API Endpoints

### Frontend APIs

**POST /api/verify**
- Submit emails for verification
- Body: `{ emails: ["email1@domain.com", "email2@domain.com"] }`
- Returns: Queue status and job IDs

**GET /api/status**
- Get all verification results
- Returns: Array of verification records (last 100)

**GET /api/stats**
- Get summary statistics
- Returns: Total, pending, valid, bounces, errors

**DELETE /api/clear**
- Clear all verification data (testing only)

### Worker APIs (Authentication Required)

**GET /api/worker/next**
- Get next pending job from queue
- Headers: `X-API-Token: your-token`
- Returns: Job object with email and provider

**POST /api/worker/result**
- Submit verification result
- Headers: `X-API-Token: your-token`
- Body: `{ id, result, error_message, details }`

**GET /api/worker/stats**
- Get worker statistics
- Headers: `X-API-Token: your-token`

## 🛠️ Tech Stack

- **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript
- **Backend**: Hono (TypeScript), Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Worker**: Node.js, Playwright
- **Deployment**: Cloudflare Pages, VPS (for worker)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account
- **VPS with 2GB+ RAM** (for worker - any standard VPS, no special port 25 needed)

### Local Development

1. **Clone and install:**
```bash
cd /home/user/webapp
npm install
```

2. **Setup database:**
```bash
npm run db:migrate:local
npm run db:seed
```

3. **Build and start:**
```bash
npm run build
pm2 start ecosystem.config.cjs
```

4. **Access the app:**
- Local: http://localhost:3000
- Sandbox: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai

### VPS Worker Setup

See detailed instructions in `vps-worker/README.md`.

**Quick start:**
```bash
cd vps-worker
npm install
npm run install-browsers
cp .env.example .env
# Edit .env with your configuration
npm start
```

## 🖥️ VPS Provider Options

### What You Need
- **Standard VPS** (not specialized for email - any provider works!)
- **NO port 25 required** (we're not sending emails)
- **2GB+ RAM** for browser automation
- **2+ CPU cores** recommended
- **Ubuntu 22.04 LTS** or similar

### Recommended VPS Providers

| Provider | Starting Price | Best For | Link |
|----------|---------------|----------|------|
| **Contabo** | $4.99/mo | Budget-friendly, high specs | contabo.com |
| **Hetzner** | €4.51/mo | European data centers, great price/performance | hetzner.com |
| **DigitalOcean** | $6/mo | Easy to use, good documentation | digitalocean.com |
| **Vultr** | $6/mo | Global locations, hourly billing | vultr.com |
| **Linode (Akamai)** | $5/mo | Reliable, good support | linode.com |
| **OVH** | €3.50/mo | Very cheap, EU-based | ovh.com |
| **Hostinger** | $4.99/mo | Budget option | hostinger.com |
| **AWS Lightsail** | $5/mo | AWS ecosystem integration | aws.amazon.com/lightsail |
| **Google Cloud** | ~$5/mo | Google infrastructure | cloud.google.com |

### Recommended Choice

**For Best Value**: Contabo or Hetzner (most specs for price)  
**For Ease of Use**: DigitalOcean or Vultr (better UI/UX)  
**For Global Reach**: Vultr (most data center locations)  

### What VPS Specs to Get

**Minimum (Small batches)**:
- 2GB RAM
- 2 vCPU cores
- 20GB SSD
- Ubuntu 22.04 LTS

**Recommended (Medium-large batches)**:
- 4GB RAM
- 4 vCPU cores
- 40GB SSD
- Ubuntu 22.04 LTS

**Advanced (Multiple workers)**:
- 8GB+ RAM
- 6+ vCPU cores
- 80GB+ SSD
- Can run 2-3 worker instances in parallel

## 📖 User Guide

### How to Use

1. **Access the web interface** at your application URL

2. **Enter email addresses** in the text area (one per line):
```
user@outlook.com
another@gmail.com
test@hotmail.com
someone@live.com
```

**NO PASSWORDS NEEDED!** Just email addresses.

3. **Click "Start Verification"** to queue the emails

4. **Monitor progress** in real-time:
   - Statistics cards show overall metrics
   - Results table shows individual email status
   - Auto-refreshes every 5 seconds

5. **View results**:
   - **Valid**: Account exists ✅
   - **Strong Bounce**: Account doesn't exist 🚫
   - **Invalid**: Could not determine ❓
   - **Error**: Technical issue during verification ⚠️

### Understanding Results

- **Valid**: The email account exists (password field appeared on login page)
- **Strong Bounce**: The email account doesn't exist (got "account not found" error)
- **Invalid**: Could not definitively determine (might be blocked, timeout, etc.)
- **Error**: Automation failed (timeout, CAPTCHA, network issue)

### Tips

- **Only use for legitimate purposes** (testing your own accounts, bulk verification with permission)
- Start VPS worker before submitting jobs
- Check worker logs if jobs get stuck in "processing"
- Use proxy for better success rates with large batches
- Clear data between test runs

## 🔐 Security & Legal Notes

- **NO passwords stored or transmitted** - only email addresses
- **Default API Token**: `dev-token-change-in-production`
- **Change token in production** via database update
- **Never commit credentials** to git
- **Use HTTPS** for production API endpoint
- **Comply with TOS**: Only test emails you have permission to verify
- **Respect rate limits**: Don't overwhelm login servers

## 🐛 Troubleshooting

### Jobs stuck in "processing"
- Check VPS worker is running
- Check worker logs for errors
- Verify API_ENDPOINT and API_TOKEN in worker .env
- Restart worker: `pm2 restart email-verifier`

### Worker can't connect to API
- Ensure API is accessible from VPS
- Check firewall rules
- Verify CORS is enabled
- Test with curl from VPS

### Browser automation fails
- Install required Linux dependencies (see VPS worker README)
- Use headless mode
- Add proxy if IP is blocked
- Check worker logs for specific errors

### High "invalid" rate
- Gmail/Office365 may detect automation
- Use residential proxies
- Add random delays
- Rotate user agents
- Use multiple VPS workers with different IPs

## 📈 Recommended Next Steps

1. **Deploy to production**:
   - Create Cloudflare D1 database
   - Deploy to Cloudflare Pages
   - Update API endpoint in worker

2. **Setup VPS worker**:
   - Get a VPS (Contabo, Hetzner, DigitalOcean, etc.)
   - Install dependencies
   - Setup systemd service or PM2
   - Configure proxy for better success rate (optional)

3. **Add features**:
   - Multi-threaded worker (parallel processing)
   - Export results to CSV
   - Email notifications
   - CAPTCHA solving integration
   - Historical analytics dashboard

4. **Optimize performance**:
   - Add multiple VPS workers
   - Implement proxy rotation
   - Add caching for results
   - Rate limiting per domain

5. **Enhance reliability**:
   - Add retry logic for failed jobs
   - Implement dead letter queue
   - Add monitoring/alerting
   - Setup backup VPS workers

## 📄 License

This is a development tool for email verification. Use responsibly and only with emails you have permission to verify.

## 🆘 Support

For issues or questions:
1. Check worker logs: `pm2 logs email-verifier`
2. Review VPS worker README.md
3. Verify database migrations applied
4. Test API endpoints with curl

---

**Last Updated**: 2026-01-16  
**Status**: ✅ Active - Ready for VPS worker deployment  
**Method**: Email existence check (no passwords required)
