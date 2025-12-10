# Railway Deployment Guide

## Step-by-Step Deployment to Railway

### 1. Prepare Your Repository

First, initialize git and push to GitHub:

```bash
cd spamassassin-service
git init
git add .
git commit -m "Initial commit: SpamAssassin service"
```

Create a new repository on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/deliverability-analyzer.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Railway

1. **Go to Railway Dashboard**: https://railway.app/dashboard

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `deliverability-analyzer` repository
   - Railway will detect the Dockerfile automatically

3. **Configure Root Directory**:
   - Go to Settings → Build
   - Set "Root Directory" to `spamassassin-service`
   - Save changes

4. **Set Environment Variables**:
   - Go to Variables tab
   - Add these variables:

   ```
   NODE_ENV=production
   API_SECRET_KEY=<generate-with-command-below>
   ALLOWED_ORIGINS=https://*.vercel.app,https://yourdomain.com
   RATE_LIMIT_MAX=100
   ```

   **Generate API_SECRET_KEY**:
   Run this command locally and copy the output:
   ```bash
   openssl rand -hex 32
   ```

   **IMPORTANT**: Save this API key somewhere safe! You'll need it to configure the Next.js app.

5. **Deploy**:
   - Railway will automatically start building
   - Wait for deployment to complete (~5-10 minutes first time)
   - Check logs for any errors

6. **Get Your Service URL**:
   - Go to Settings → Domains
   - Copy the Railway-provided URL (e.g., `https://spamassassin-service-production-xxxx.up.railway.app`)
   - Or add a custom domain

### 3. Test Your Deployment

Test the health endpoint:
```bash
curl https://your-railway-url.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "spamassassin-service",
  "spamassassin": "SpamAssassin version ...",
  "timestamp": "..."
}
```

Test the analyze endpoint:
```bash
curl -X POST https://your-railway-url.railway.app/api/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "emailContent": "This is a test email",
    "subject": "Test",
    "from": "test@example.com"
  }'
```

### 4. Monitor Your Service

- **Logs**: Check Railway dashboard → Deployments → Logs
- **Metrics**: Monitor CPU and RAM usage in Railway dashboard
- **Health**: Set up UptimeRobot (free) to ping `/api/health` every 5 minutes

### 5. Update Environment Variables in Next.js

Once deployed, you'll need to add these to your Vercel project:

```env
SPAMASSASSIN_API_URL=https://your-railway-url.railway.app
SPAMASSASSIN_API_KEY=your-api-secret-key
```

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Ensure Dockerfile is correct
- Verify root directory is set to `spamassassin-service`

### Service Crashes
- Check if API_SECRET_KEY is set
- Verify SpamAssassin installed correctly (check build logs)
- Increase memory if needed (Railway settings)

### CORS Errors
- Ensure ALLOWED_ORIGINS includes your Vercel domain
- Use wildcard for Vercel previews: `https://*.vercel.app`

### API Key Not Working
- Regenerate API key: `openssl rand -hex 32`
- Update in both Railway and Vercel
- Ensure header is `X-API-Key` (case-sensitive)

## Cost Monitoring

Railway free tier:
- $5 credit per month
- ~500 hours execution time
- Should be sufficient for moderate traffic

To reduce costs:
- Enable "Sleep when inactive" if you don't need 24/7 uptime
- Monitor usage in Railway dashboard
- Optimize SpamAssassin configuration if needed

## Security Checklist

- ✅ API_SECRET_KEY is strong (32+ characters)
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Using HTTPS (Railway provides this automatically)
- ✅ Running as non-root user in container
- ✅ Environment variables not in code

## Next Steps

After successful deployment:
1. ✅ Save your Railway URL
2. ✅ Save your API_SECRET_KEY
3. ✅ Configure Next.js app to use this service
4. ✅ Set up monitoring
5. ✅ Test with real emails
