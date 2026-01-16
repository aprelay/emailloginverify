# Email Verifier - Office365 & Gmail Login-Based Verification

A production-ready email verification system that tests Office365 and Gmail accounts by attempting actual logins using headless browser automation.

## 🎯 Project Overview

**Goal**: Verify email credentials by performing real login attempts to Office365 and Gmail, classifying any authentication failures as "strong bounce".

**Architecture**:
- **Cloudflare Pages Frontend**: Web UI for submitting emails and viewing results
- **Cloudflare Workers API**: Queue management and result storage
- **Cloudflare D1 Database**: SQLite-based storage for queue and results
- **VPS Worker Service**: Playwright-based automation for login verification

## 🌐 URLs

- **Development**: https://3000-imtedrcc3jhvfnihsn366-0e616f0a.sandbox.novita.ai
- **Production**: (Deploy to Cloudflare Pages - see deployment guide)
- **GitHub**: (Push to your repository)

## 📊 Data Architecture

### Database Tables

**1. verification_queue**
- Stores email verification jobs
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
User → Frontend → API → D1 Queue → VPS Worker → Playwright → Login Test → Result → D1 → Frontend
```

1. User submits email:password pairs via web interface
2. API validates and adds to verification_queue (status: pending)
3. VPS worker polls queue for pending jobs
4. Worker launches headless browser and attempts login
5. Result classification:
   - **valid**: Successfully authenticated
   - **invalid**: Login rejected (wrong password)
   - **strong_bounce**: Account doesn't exist or blocked
   - **error**: Technical issue during verification
6. Result stored in database and displayed in UI

## 🚀 Features

### Completed Features
✅ Office365 email verification via login
✅ Gmail email verification via login
✅ Real-time status dashboard with statistics
✅ Bulk email submission (paste multiple email:password pairs)
✅ Queue-based processing system
✅ VPS worker with Playwright automation
✅ API token authentication for workers
✅ Strong bounce detection
✅ Auto-refresh results (5-second interval)
✅ Clean, responsive UI with Tailwind CSS
✅ RESTful API for worker integration

### Features Not Yet Implemented
⏳ Multi-threaded worker support (currently single-threaded)
⏳ Proxy rotation for better success rate
⏳ CAPTCHA solving integration
⏳ 2FA/MFA handling
⏳ Export results to CSV/Excel
⏳ Scheduled batch verification
⏳ Email notification on completion
⏳ Advanced filtering and search
⏳ Historical analytics and reporting

## 📝 API Endpoints

### Frontend APIs

**POST /api/verify**
- Submit emails for verification
- Body: `{ emails: [{ email, password }] }`
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
- Returns: Job object or null

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

## 📦 Project Structure

```
webapp/
├── src/
│   └── index.tsx              # Main Hono application
├── public/static/
│   └── app.js                 # Frontend JavaScript
├── vps-worker/
│   ├── worker.js              # VPS worker service
│   ├── package.json           # Worker dependencies
│   ├── .env.example           # Worker configuration
│   └── README.md              # Worker setup guide
├── migrations/
│   └── 0001_initial_schema.sql # Database schema
├── seed.sql                   # Initial data (API token)
├── ecosystem.config.cjs       # PM2 configuration
├── wrangler.jsonc             # Cloudflare configuration
└── package.json               # Dependencies
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account
- VPS with 2GB+ RAM (for worker)

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

See detailed instructions in `vps-worker/README.md`:

1. Upload worker files to VPS
2. Install dependencies and Playwright
3. Configure `.env` with API endpoint and token
4. Run as systemd service or PM2

**Quick start:**
```bash
cd vps-worker
npm install
npm run install-browsers
cp .env.example .env
# Edit .env with your configuration
npm start
```

## 📖 User Guide

### How to Use

1. **Access the web interface** at your application URL

2. **Enter email:password pairs** in the text area (one per line):
```
user@outlook.com:password123
another@gmail.com:securepass456
test@hotmail.com:mypassword
```

3. **Click "Start Verification"** to queue the emails

4. **Monitor progress** in real-time:
   - Statistics cards show overall metrics
   - Results table shows individual email status
   - Auto-refreshes every 5 seconds

5. **View results**:
   - **Valid**: Login successful ✅
   - **Invalid**: Wrong password ❌
   - **Strong Bounce**: Account doesn't exist or blocked 🚫
   - **Error**: Technical issue during verification ⚠️

### Understanding Results

- **Valid**: The email and password are correct, account is accessible
- **Invalid**: The email exists but password is wrong
- **Strong Bounce**: The email account doesn't exist, is disabled, or blocked
- **Error**: Automation failed (timeout, CAPTCHA, network issue)

### Tips

- Use real credentials only (for authorized testing)
- Start VPS worker before submitting jobs
- Check worker logs if jobs get stuck in "processing"
- Use proxy for better success rates with large batches
- Clear data between test runs

## 🔐 Security Notes

- **API Token**: Default token is `dev-token-change-in-production`
- **Change token in production** via database update
- **Never commit credentials** to git
- **Use HTTPS** for production API endpoint
- **Comply with TOS**: Only test accounts you own or have permission to test

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

### High failure rate
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
   - Configure production VPS
   - Install dependencies
   - Setup systemd service
   - Configure proxy for better success rate

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

This is a development tool. Use responsibly and only with accounts you own or have permission to test.

## 🆘 Support

For issues or questions:
1. Check worker logs: `pm2 logs email-verifier`
2. Check API logs: `pm2 logs email-verifier`
3. Review VPS worker README.md
4. Verify database migrations applied
5. Test API endpoints with curl

---

**Last Updated**: 2026-01-16
**Status**: ✅ Active - Ready for VPS worker deployment
