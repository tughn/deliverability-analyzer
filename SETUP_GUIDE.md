# Quick Setup Guide

Follow these steps to get your Deliverability Analyzer running from scratch.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Domain: deliverabilityanalyzer.xyz (owned on Namecheap)
- [ ] Cloudflare account (free) - https://cloudflare.com
- [ ] GitHub account (for deployment)
- [ ] Vercel account (free) - https://vercel.com

---

## Phase 1: Local Setup & Testing

### Step 1: Install Dependencies (5 minutes)

```bash
# Navigate to project root
cd deliverability-analyzer

# Install frontend dependencies
cd nextjs-app
npm install

# Install worker dependencies
cd ../worker
npm install
```

### Step 2: Set Up Cloudflare CLI (5 minutes)

```bash
cd worker

# Login to Cloudflare (opens browser)
npx wrangler login
```

### Step 3: Create KV Namespaces (2 minutes)

```bash
# Still in worker directory

# Create production namespace
npx wrangler kv:namespace create EMAIL_RESULTS

# Create preview namespace for local dev
npx wrangler kv:namespace create EMAIL_RESULTS --preview
```

**Copy the output IDs** and update `worker/wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "EMAIL_RESULTS", id = "PASTE_PRODUCTION_ID_HERE", preview_id = "PASTE_PREVIEW_ID_HERE" }
]
```

### Step 4: Test Locally (5 minutes)

Open 2 terminals:

**Terminal 1 - Worker:**
```bash
cd worker
npm run dev
# Should see: "Ready on http://localhost:8787"
```

**Terminal 2 - Frontend:**
```bash
cd nextjs-app
npm run dev
# Should see: "Ready on http://localhost:3000"
```

**Test the Worker:**
```bash
# In a 3rd terminal
curl http://localhost:8787/health
# Should return: {"status":"ok","service":"email-analysis-worker"}
```

Visit http://localhost:3000 - you should see the landing page.

---

## Phase 2: Deploy to Production (100% Free)

### Step 5: Deploy Cloudflare Worker (5 minutes)

```bash
cd worker
npm run deploy
```

**Important**: Copy the worker URL from output:
```
https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev
```

Save this URL - you'll need it for Vercel.

### Step 6: Connect Domain to Cloudflare (15 minutes)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click "Add a Site"
3. Enter: `deliverabilityanalyzer.xyz`
4. Choose FREE plan
5. Cloudflare will scan your DNS records
6. Click "Continue"
7. **Copy the 2 nameservers** shown (e.g., `alan.ns.cloudflare.com`, `nina.ns.cloudflare.com`)

Now go to Namecheap:
1. Login to Namecheap
2. Go to Domain List → deliverabilityanalyzer.xyz → Manage
3. Find "Nameservers" section
4. Select "Custom DNS"
5. Paste the 2 Cloudflare nameservers
6. Save changes
7. Wait 5-30 minutes for DNS propagation

### Step 7: Enable Cloudflare Email Routing (5 minutes)

Back in Cloudflare Dashboard:
1. Select your domain: `deliverabilityanalyzer.xyz`
2. In left sidebar, go to **Email Routing**
3. Click "Get Started" or "Enable Email Routing"
4. Click "Configure" and follow the wizard (it auto-configures MX records)
5. Once enabled, go to **Email Routing → Routing Rules**
6. Click "Create Rule"
7. Configure:
   - **Type**: Catch-all address
   - **Action**: Send to Worker
   - **Worker**: Select `deliverability-analyzer-worker`
8. Click "Save"

### Step 8: Deploy to Vercel (10 minutes)

#### Option A: Via Vercel CLI

```bash
cd nextjs-app
npm i -g vercel
vercel
```

Follow the prompts, then:
```bash
# Add environment variable
vercel env add NEXT_PUBLIC_WORKER_URL

# Paste your worker URL when prompted:
# https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev

# Redeploy with new env var
vercel --prod
```

#### Option B: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `nextjs-app`
   - **Framework Preset**: Next.js (auto-detected)
   - **Environment Variables**:
     ```
     NEXT_PUBLIC_WORKER_URL = https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev
     ```
4. Click "Deploy"
5. Wait for build to complete
6. Copy your Vercel URL (e.g., `https://deliverability-analyzer.vercel.app`)

### Step 9: Update Worker with Webhook URL (Optional - 2 minutes)

Edit `worker/wrangler.toml`:

```toml
[vars]
WEBHOOK_URL = "https://your-vercel-app.vercel.app/api/webhook/email"
```

Redeploy worker:
```bash
cd worker
npm run deploy
```

### Step 10: Configure Custom Domain on Vercel (Optional - 5 minutes)

1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add domain: `deliverabilityanalyzer.xyz`
4. Vercel will give you DNS records to add
5. Go back to Cloudflare Dashboard → DNS
6. Add the records Vercel specified (usually CNAME or A record)
7. Wait for DNS propagation (5-30 minutes)

---

## Phase 3: Testing Everything Works

### Test 1: Check Worker is Live

```bash
curl https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev/health
```

Should return: `{"status":"ok","service":"email-analysis-worker"}`

### Test 2: Check Website is Live

Visit your Vercel URL or custom domain. You should see the landing page.

### Test 3: Send a Test Email

1. On the website, click "Generate Test Email"
2. You'll get an address like: `test-abc123@deliverabilityanalyzer.xyz`
3. Send an email to that address from Gmail, Outlook, or your email service
4. Wait 10-30 seconds
5. Check the results page (or refresh)

**If results don't appear**, check:
- Cloudflare Email Routing is active
- Worker logs: `cd worker && npm run tail`
- Email was sent to correct address
- DNS propagation is complete

---

## Troubleshooting

### Worker deployment fails with "No namespace found"

**Fix**: Make sure you created KV namespaces and updated `wrangler.toml` with correct IDs.

```bash
cd worker
npx wrangler kv:namespace list
```

### Emails not being received

**Check:**
1. Cloudflare Email Routing is enabled (green checkmark)
2. MX records are configured (Cloudflare does this automatically)
3. Catch-all rule points to your worker
4. Domain DNS is using Cloudflare nameservers

**Test email routing:**
```bash
# Check MX records
nslookup -type=MX deliverabilityanalyzer.xyz
```

### Frontend can't fetch results

**Check:**
- `NEXT_PUBLIC_WORKER_URL` is set correctly in Vercel
- Worker URL is accessible (test with curl)
- CORS is enabled (already configured in worker code)

### Results always return 404

**Check:**
- Email was actually received by Cloudflare
- Test ID in email address matches the one you're checking
- KV namespace is configured correctly
- Check worker logs: `npm run tail` in worker directory

---

## Commands Cheat Sheet

```bash
# Worker commands
cd worker
npm run dev          # Run locally on :8787
npm run deploy       # Deploy to Cloudflare
npm run tail         # View live logs
npx wrangler login   # Login to Cloudflare

# Frontend commands
cd nextjs-app
npm run dev          # Run locally on :3000
npm run build        # Build for production
vercel               # Deploy to Vercel
vercel --prod        # Deploy to production

# Check worker health
curl http://localhost:8787/health                    # Local
curl https://your-worker.workers.dev/health          # Production

# Check results
curl http://localhost:8787/api/results/test123       # Local
curl https://your-worker.workers.dev/api/results/test123  # Production
```

---

## Next Steps After Setup

1. Test with different email providers (Gmail, Outlook, Yahoo)
2. Monitor worker logs to see analysis in action
3. Customize the spam scoring rules in `worker/index.js`
4. Add your own branding to the frontend
5. Set up monitoring/alerts (Cloudflare dashboard)

## Cost Monitor

Everything should be FREE on free tiers:
- Cloudflare Workers: 100k requests/day (FREE)
- Cloudflare KV: 100k reads, 1k writes/day (FREE)
- Vercel: Unlimited websites (FREE on Hobby plan)

You'll only pay for:
- Domain registration: ~$10-15/year (deliverabilityanalyzer.xyz)

---

## Need Help?

- Check logs: `cd worker && npm run tail`
- Review README.md for detailed info
- Check Cloudflare dashboard for email routing status
- Verify environment variables in Vercel dashboard

Good luck! 🚀
