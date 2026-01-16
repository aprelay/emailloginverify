# VPS Worker - Email Verification Service

This is the worker service that runs on your VPS to perform actual email verification using Playwright.

## Installation

### Prerequisites
- Node.js 18+ installed
- VPS with at least 2GB RAM
- Ubuntu 22.04 or similar Linux distribution

### Setup Steps

1. **Upload worker files to your VPS:**
```bash
scp -r vps-worker/* user@your-vps-ip:/opt/email-verifier/
```

2. **SSH into your VPS:**
```bash
ssh user@your-vps-ip
cd /opt/email-verifier
```

3. **Install dependencies:**
```bash
npm install
```

4. **Install Playwright browsers:**
```bash
npm run install-browsers
```

5. **Configure environment:**
```bash
cp .env.example .env
nano .env
```

Update the following variables:
- `API_ENDPOINT`: Your Cloudflare Pages URL (e.g., https://your-app.pages.dev)
- `API_TOKEN`: Get this from your database (check api_tokens table)
- `HEADLESS`: Set to `true` for production
- `PROXY_SERVER`: (Optional) Add proxy for better success rate

6. **Test the worker:**
```bash
npm start
```

## Running as a Service (systemd)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/email-verifier.service
```

Add the following content:

```ini
[Unit]
Description=Email Verification Worker
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/email-verifier
ExecStart=/usr/bin/node worker.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/email-verifier.log
StandardError=append:/var/log/email-verifier-error.log

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable email-verifier
sudo systemctl start email-verifier
sudo systemctl status email-verifier
```

## Managing the Service

```bash
# Check status
sudo systemctl status email-verifier

# View logs
sudo journalctl -u email-verifier -f

# Restart service
sudo systemctl restart email-verifier

# Stop service
sudo systemctl stop email-verifier
```

## Using PM2 (Alternative)

If you prefer PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start worker.js --name email-verifier

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

## Proxy Configuration (Recommended)

For better success rates and to avoid IP blocks, use a residential proxy:

1. **Purchase proxy service** (recommended providers):
   - BrightData (formerly Luminati)
   - Oxylabs
   - Smartproxy

2. **Configure in .env:**
```env
PROXY_SERVER=http://proxy.example.com:8080
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password
```

## Troubleshooting

### Worker can't connect to API
- Check if API_ENDPOINT is correct and accessible
- Verify API_TOKEN matches the one in your database
- Check firewall settings on VPS and Cloudflare

### Browser launch fails
- Install required dependencies:
```bash
sudo apt-get update
sudo apt-get install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2
```

### High memory usage
- Reduce concurrent processing (worker processes one job at a time by default)
- Increase VPS RAM
- Use headless mode (HEADLESS=true)

## Performance Tips

1. **Use multiple workers**: Run multiple instances on different VPS servers
2. **Rotate proxies**: Use proxy rotation for better IP reputation
3. **Adjust poll interval**: Modify POLL_INTERVAL based on queue size
4. **Monitor logs**: Check logs regularly for errors and issues

## Security Notes

- Keep API_TOKEN secure and never commit to git
- Use HTTPS for API_ENDPOINT in production
- Regularly rotate API tokens
- Monitor for suspicious activity
