# Exact Deployment Steps for deliverabilityanalyzer.xyz

Follow these steps **in order** to deploy your deliverability analyzer.

---

## ✅ What I've Already Done

- Removed SpamAssassin backend service (Railway/Render)
- Removed unnecessary documentation files
- Created lightweight Cloudflare Worker with email analysis
- Updated Next.js webhook to work with new architecture
- Added Cloudflare KV storage support
- Created local development setup with Wrangler
- Updated README with complete documentation

---

## 🚀 What You Need To Do

### PART 1: Local Setup (Do This First)

#### 1. Install Worker Dependencies

```bash
cd worker
npm install
```

#### 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser. Login with your Cloudflare account.

#### 3. Create KV Namespaces

```bash
# Create production KV namespace
npx wrangler kv:namespace create EMAIL_RESULTS
```

Output will look like:
```
{ binding = "EMAIL_RESULTS", id = "abc123xyz..." }
```

**Copy the ID!**

```bash
# Create preview KV namespace (for local testing)
npx wrangler kv:namespace create EMAIL_RESULTS --preview
```

Output will look like:
```
{ binding = "EMAIL_RESULTS", preview_id = "def456uvw..." }
```

**Copy the preview_id!**

#### 4. Update wrangler.toml

Open `worker/wrangler.toml` and replace:

```toml
kv_namespaces = [
  { binding = "EMAIL_RESULTS", id = "YOUR_KV_NAMESPACE_ID", preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID" }
]
```

With your actual IDs:

```toml
kv_namespaces = [
  { binding = "EMAIL_RESULTS", id = "abc123xyz...", preview_id = "def456uvw..." }
]
```

#### 5. Test Worker Locally

Open Terminal 1:
```bash
cd worker
npm run dev
```

Should see: `⎔ Ready on http://localhost:8787`

Open Terminal 2, test it:
```bash
curl http://localhost:8787/health
```

Should return:
```json
{"status":"ok","service":"email-analysis-worker"}
```

If that works, **press Ctrl+C in Terminal 1** to stop the worker.

---

### PART 2: Deploy Worker to Cloudflare

#### 6. Deploy Worker

```bash
cd worker
npm run deploy
```

Output will show your worker URL:
```
Published deliverability-analyzer-worker
  https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev
```

**Copy this URL! You'll need it for Vercel.**

#### 7. Test Worker in Production

```bash
curl https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev/health
```

Should return the same health check response.

---

### PART 3: Connect Domain to Cloudflare

#### 8. Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com/
2. Click **"Add a Site"**
3. Enter: `deliverabilityanalyzer.xyz`
4. Click **"Add site"**
5. Choose **FREE** plan
6. Click **"Continue"**
7. Cloudflare will scan your DNS records - click **"Continue"**
8. You'll see 2 nameservers like:
   ```
   alan.ns.cloudflare.com
   nina.ns.cloudflare.com
   ```
   **Copy these nameservers!**

#### 9. Update Namecheap DNS

1. Login to Namecheap: https://www.namecheap.com/myaccount/login/
2. Go to **Domain List**
3. Find `deliverabilityanalyzer.xyz` → Click **"Manage"**
4. Scroll to **"Nameservers"** section
5. Select **"Custom DNS"**
6. Paste the 2 Cloudflare nameservers:
   - Nameserver 1: `alan.ns.cloudflare.com` (your actual one)
   - Nameserver 2: `nina.ns.cloudflare.com` (your actual one)
7. Click **"Save"** (green checkmark)
8. **Wait 5-30 minutes** for DNS propagation

Go back to Cloudflare dashboard - you'll see a message like "Checking nameservers..."

Refresh the page every few minutes until you see "Great news! Cloudflare is now protecting your site"

---

### PART 4: Configure Email Routing

#### 10. Enable Email Routing in Cloudflare

1. In Cloudflare dashboard, make sure `deliverabilityanalyzer.xyz` is selected
2. In left sidebar, click **"Email Routing"**
3. Click **"Get Started"** or **"Enable Email Routing"**
4. Click **"Automatic setup"** (Cloudflare will add MX records)
5. Click **"Configure"** and follow wizard
6. You may need to verify you own the domain - follow the instructions
7. Once enabled, you'll see "Email Routing is enabled ✓"

#### 11. Create Catch-All Rule

1. Still in Email Routing, click **"Routing Rules"** tab
2. Click **"Create Rule"**
3. Configure:
   - **Match type**: Select **"Catch-all address"**
   - **Action**: Select **"Send to Worker"**
   - **Worker**: Select **"deliverability-analyzer-worker"**
4. Click **"Save"**

You should see the rule listed with status "Active"

---

### PART 5: Deploy Frontend to Vercel

#### 12. Push to GitHub (if not already done)

```bash
# In project root
git init
git add .
git commit -m "Simplified architecture with Cloudflare Workers"
git branch -M main
git remote add origin https://github.com/tughn/deliverability-analyzer.git
git push -u origin main
```

#### 13. Deploy to Vercel via Dashboard

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repo: `tughn/deliverability-analyzer`
4. Configure project:
   - **Project Name**: `deliverability-analyzer`
   - **Framework Preset**: `Next.js` (should auto-detect)
   - **Root Directory**: Click **"Edit"** → Select **`nextjs-app`**
5. Click **"Environment Variables"**
6. Add variable:
   - **Name**: `NEXT_PUBLIC_WORKER_URL`
   - **Value**: `https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev`
   - Select all environments (Production, Preview, Development)
7. Click **"Deploy"**

Wait 2-3 minutes for build to complete.

#### 14. Copy Vercel URL

After deployment, you'll see:
```
🎉 Congratulations!
https://deliverability-analyzer.vercel.app
```

**Copy this URL!**

#### 15. Update Worker with Webhook URL (Optional)

Edit `worker/wrangler.toml`, uncomment and update:

```toml
[vars]
WEBHOOK_URL = "https://deliverability-analyzer.vercel.app/api/webhook/email"
```

Redeploy worker:
```bash
cd worker
npm run deploy
```

---

### PART 6: Test Everything

#### 16. Test the Full Flow

1. Visit your Vercel app: `https://deliverability-analyzer.vercel.app`
2. Click **"Generate Test Email"**
3. You'll get: `test-abc123@deliverabilityanalyzer.xyz`
4. Copy that email address
5. Open Gmail/Outlook and send a test email to that address
6. Wait 10-30 seconds
7. Go back to the website and check results

#### 17. Check Worker Logs (if results don't appear)

```bash
cd worker
npm run tail
```

Send another test email and watch the logs in real-time.

---

### PART 7: Configure Custom Domain (Optional)

#### 18. Point deliverabilityanalyzer.xyz to Vercel

1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Domains**
3. Click **"Add"**
4. Enter: `deliverabilityanalyzer.xyz`
5. Click **"Add"**
6. Vercel will show you DNS records to add

#### 19. Add DNS Records in Cloudflare

1. Go back to Cloudflare dashboard
2. Select `deliverabilityanalyzer.xyz`
3. Go to **DNS** → **Records**
4. Add the records Vercel specified (usually):
   - **Type**: `A`
   - **Name**: `@`
   - **IPv4 address**: `76.76.21.21` (example, use Vercel's actual IP)
   - **Proxy status**: DNS only (gray cloud)
5. If Vercel also gave you a CNAME:
   - **Type**: `CNAME`
   - **Name**: `www`
   - **Target**: `cname.vercel-dns.com`
   - **Proxy status**: DNS only (gray cloud)
6. Click **"Save"**

#### 20. Verify Domain in Vercel

Go back to Vercel → Domains. Wait 30-60 seconds, then refresh.

You should see: "Valid Configuration ✓"

Now visit: `https://deliverabilityanalyzer.xyz` - it should work!

---

## 🎯 Summary Checklist

After completing all steps, you should have:

- ✅ Cloudflare Worker deployed and working
- ✅ KV namespace created and configured
- ✅ Domain connected to Cloudflare
- ✅ Email routing enabled with catch-all rule
- ✅ Frontend deployed to Vercel
- ✅ Custom domain pointing to Vercel (optional)
- ✅ Full email flow working

---

## 🐛 Quick Troubleshooting

### "Worker not found" error
- Run: `cd worker && npm run deploy`

### Emails not received
- Check Email Routing is enabled in Cloudflare
- Check catch-all rule is active
- Check MX records: `nslookup -type=MX deliverabilityanalyzer.xyz`

### Results return 404
- Check worker logs: `cd worker && npm run tail`
- Verify test ID matches email address
- Make sure email was actually sent

### Frontend can't fetch results
- Verify `NEXT_PUBLIC_WORKER_URL` is set in Vercel
- Test worker URL directly with curl
- Check browser console for errors

---

## 📞 Get Help

If stuck, run these diagnostic commands:

```bash
# Check worker is deployed
curl https://deliverability-analyzer-worker.YOUR_SUBDOMAIN.workers.dev/health

# Check DNS
nslookup deliverabilityanalyzer.xyz
nslookup -type=MX deliverabilityanalyzer.xyz

# Check worker logs
cd worker
npm run tail

# List KV namespaces
npx wrangler kv:namespace list
```

---

**Total Cost**: $0/month (free tiers only) + ~$10-15/year for domain

**Setup Time**: About 30-45 minutes

Good luck! 🚀
