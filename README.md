# Deliverability Analyzer

A lightweight email deliverability testing tool. Test your email's spam score, validate SPF/DKIM/DMARC records, and get instant analysis reports - all for free.

**Domain**: deliverabilityanalyzer.xyz (Namecheap)

## Features

- ✅ **SPF/DKIM/DMARC Validation** - Email authentication checks
- 📊 **Spam Score Analysis** - Content-based spam detection
- 🔍 **Header Analysis** - Email header inspection
- ⚡ **Instant Results** - Real-time analysis
- 🆓 **100% Free** - Cloudflare Workers + Vercel free tiers
- 🌐 **No Backend Required** - Serverless architecture

## Architecture

### Simple & Lightweight
- **Frontend**: Next.js on Vercel (Free tier)
- **Email Worker**: Cloudflare Workers (Free tier - 100k requests/day)
- **Storage**: Cloudflare KV (Free tier - 100k reads/day, 24-hour TTL)
- **Domain**: deliverabilityanalyzer.xyz (Namecheap)

### How It Works
1. User visits website, gets unique test email address: `test-abc123@deliverabilityanalyzer.xyz`
2. User sends email from their system to the test address
3. Cloudflare Email Routing catches the email
4. Cloudflare Worker analyzes email (SPF, DKIM, DMARC, content, headers)
5. Results stored in KV with 24-hour expiration
6. User views results on website

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (free)
- Namecheap domain (deliverabilityanalyzer.xyz)

### Local Development

#### 1. Install Dependencies

```bash
# Install frontend dependencies
cd nextjs-app
npm install

# Install worker dependencies
cd ../worker
npm install
```

#### 2. Set Up Cloudflare KV (One-time setup)

```bash
cd worker

# Login to Cloudflare
npx wrangler login

# Create KV namespace for production
npx wrangler kv:namespace create EMAIL_RESULTS

# Create KV namespace for development
npx wrangler kv:namespace create EMAIL_RESULTS --preview
```

This will output namespace IDs. Update `worker/wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "EMAIL_RESULTS", id = "YOUR_PRODUCTION_ID", preview_id = "YOUR_PREVIEW_ID" }
]
```

#### 3. Run Locally

**Terminal 1 - Frontend:**
```bash
cd nextjs-app
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Terminal 2 - Worker:**
```bash
cd worker
npm run dev
```

Worker runs on [http://localhost:8787](http://localhost:8787)

#### 4. Test the Worker API

```bash
# Test health check
curl http://localhost:8787/health

# Test results endpoint (will return 404 until you receive an email)
curl http://localhost:8787/api/results/test123
```

### Testing Email Flow Locally

Since email routing requires a real domain, local email testing is limited. You can:

1. **Test the API directly** by posting mock data to the worker
2. **Deploy to Cloudflare** (free) and test with real emails
3. **Use Cloudflare Email Routing dashboard** to test email rules

## Deployment

### Step 1: Deploy Cloudflare Worker

```bash
cd worker

# Deploy to Cloudflare
npm run deploy
```

This will output your worker URL: `https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev`

### Step 2: Configure Cloudflare Email Routing

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain: `deliverabilityanalyzer.xyz`
3. Navigate to **Email Routing** → **Routing Rules**
4. Click **Create Rule**
5. Configure:
   - **Match type**: Catch-all address
   - **Action**: Send to Worker
   - **Worker**: Select `deliverability-analyzer-worker`
6. Save rule

### Step 3: Deploy Next.js to Vercel

```bash
cd nextjs-app

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or deploy via [Vercel Dashboard](https://vercel.com):
1. Import GitHub repository
2. Set root directory: `nextjs-app`
3. Add environment variable:
   ```
   NEXT_PUBLIC_WORKER_URL=https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev
   ```
4. Deploy

### Step 4: Configure Domain DNS (Namecheap)

1. Go to Namecheap DNS settings for `deliverabilityanalyzer.xyz`
2. Add Cloudflare nameservers (from Cloudflare dashboard)
3. Wait for DNS propagation (up to 24 hours)

### Step 5: Update Worker with Webhook URL (Optional)

Edit `worker/wrangler.toml`:

```toml
[vars]
WEBHOOK_URL = "https://your-vercel-app.vercel.app/api/webhook/email"
```

Redeploy:
```bash
npm run deploy
```

## Project Structure

```
deliverability-analyzer/
├── nextjs-app/              # Next.js frontend
│   ├── app/
│   │   ├── api/
│   │   │   ├── results/[testId]/  # Fetch results from worker
│   │   │   └── webhook/email/     # Receive notifications (optional)
│   │   ├── page.tsx               # Landing page
│   │   └── layout.tsx
│   ├── components/                # React components
│   └── package.json
├── worker/                  # Cloudflare Email Worker
│   ├── index.js            # Worker code with email analysis
│   ├── wrangler.toml       # Worker configuration
│   └── package.json
└── README.md
```

## Email Analysis Features

The worker performs these lightweight checks:

### 1. Authentication Checks
- ✅ **SPF**: Sender Policy Framework validation
- ✅ **DKIM**: DomainKeys Identified Mail signature verification
- ✅ **DMARC**: Domain-based Message Authentication alignment

### 2. Content Analysis
- Spam trigger words detection
- Excessive capitalization check
- Excessive punctuation (!!!) detection
- URL shortener detection
- Link count analysis
- Content length validation

### 3. Header Analysis
- Return-Path header validation
- Message-ID presence check
- Date header validation
- From/Return-Path domain alignment

### 4. Spam Scoring

Each check contributes to an overall spam score:
- **0 points**: Excellent - Very likely to reach inbox
- **1-2 points**: Good - Likely to reach inbox
- **3-5 points**: Fair - May reach spam folder
- **6+ points**: Poor - Likely to be marked as spam

## Environment Variables

### Next.js App (.env.local)

```bash
# Cloudflare Worker URL (after deployment)
NEXT_PUBLIC_WORKER_URL=https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev
```

### Cloudflare Worker (wrangler.toml)

```toml
[vars]
# Optional: Webhook URL for notifications
WEBHOOK_URL = "https://your-vercel-app.vercel.app/api/webhook/email"
```

## Troubleshooting

### Issue: Emails not being received

**Check:**
1. Cloudflare Email Routing is enabled for your domain
2. Catch-all rule is configured to send to your worker
3. DNS records are properly configured (MX records)
4. Worker is deployed and running

**Test:**
```bash
# Check worker health
curl https://your-worker.workers.dev/health

# View worker logs
cd worker
npm run tail
```

### Issue: Results not found

**Check:**
1. Test ID is correct (check email address format: `test-abc123@domain.xyz`)
2. Email was actually sent and received by Cloudflare
3. KV namespace is properly configured in wrangler.toml
4. Results expire after 24 hours

### Issue: Worker deployment fails

**Check:**
1. You're logged in: `npx wrangler login`
2. KV namespace IDs are correct in wrangler.toml
3. You have Cloudflare Workers enabled on your account

## Cost Breakdown (Free Tier)

- **Cloudflare Workers**: 100,000 requests/day (FREE)
- **Cloudflare KV**: 100,000 reads/day, 1,000 writes/day (FREE)
- **Vercel**: Hobby plan with unlimited websites (FREE)
- **Domain**: deliverabilityanalyzer.xyz (~$10-15/year on Namecheap)

**Total monthly cost: $0** (excluding domain registration)

## Limitations

- Results stored for 24 hours only (KV TTL)
- Free tier limits: 100k requests/day (Cloudflare)
- No persistent database (results are temporary)
- Basic spam analysis (not as comprehensive as SpamAssassin)

## Roadmap

- [ ] Add blacklist (DNSBL) checking
- [ ] Implement real-time WebSocket updates
- [ ] Add email preview/rendering
- [ ] Historical test results (with persistent storage)
- [ ] Export results as PDF/CSV
- [ ] Custom domain support

## License

MIT

## Support

For issues or questions, please create an issue on GitHub or contact support.
