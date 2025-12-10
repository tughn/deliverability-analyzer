# Deploy SpamAssassin Service to Railway - Step by Step

## Prerequisites
✅ Railway account created
✅ Code pushed to GitHub repo: https://github.com/tughn/deliverability-analyzer

## Step 1: Open Railway Dashboard
Go to: https://railway.app/dashboard

## Step 2: Create New Project
1. Click the **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. You may need to authorize Railway to access your GitHub
4. Select the repository: **tughn/deliverability-analyzer**

## Step 3: Configure the Service
Railway will detect your repository. Now configure it:

1. Click on your project (it will auto-deploy but we need to configure it first)
2. Click on the service that was created
3. Go to **Settings** tab

## Step 4: Set Root Directory
This is CRITICAL - Railway needs to know where the SpamAssassin service is:

1. In Settings, find **"Build"** section
2. Set **Root Directory** to: `spamassassin-service`
3. Click **Save**
4. Railway will auto-detect the Dockerfile

## Step 5: Generate API Secret Key
Open a terminal and run:
```bash
openssl rand -hex 32
```

Copy the output - you'll need it for the next step!

## Step 6: Set Environment Variables
1. Click on the **"Variables"** tab
2. Click **"New Variable"** and add each of these:

```
NODE_ENV=production
API_SECRET_KEY=<paste-the-key-you-generated>
ALLOWED_ORIGINS=https://*.vercel.app
RATE_LIMIT_MAX=100
```

**IMPORTANT**: Save the API_SECRET_KEY somewhere safe! You'll need it for Vercel.

## Step 7: Deploy
Railway will automatically start building and deploying:
- Watch the **"Deployments"** tab for progress
- First deployment takes ~5-10 minutes
- You'll see Docker building SpamAssassin

## Step 8: Get Your Service URL
1. Once deployed, go to **Settings** tab
2. Scroll to **"Domains"** section  
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://spamassassin-service-production-xxxx.up.railway.app`)

## Step 9: Test It Works
Open a terminal and test the health endpoint:

```bash
curl https://YOUR-RAILWAY-URL.railway.app/api/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "spamassassin-service",
  "spamassassin": "SpamAssassin version 3.4.6",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

✅ **If you see this, your SpamAssassin service is live!**

## Troubleshooting

### Build Fails
- Check **Deployments** → **Logs** for errors
- Ensure Root Directory is set to `spamassassin-service`
- Verify Dockerfile exists in that directory

### Service Crashes
- Check **Logs** tab
- Ensure all environment variables are set
- Check that API_SECRET_KEY is a valid string

### Can't Access URL
- Ensure domain was generated in Settings → Domains
- Check service is running (should show green status)

## What's Next?
Once this works, you'll use the Railway URL and API key to configure Vercel (Next.js app).

Save these for Vercel:
- ✅ Railway URL: `https://your-url.railway.app`
- ✅ API_SECRET_KEY: `the-key-you-generated`
