# Email Deliverability Analyzer

A lightweight, serverless email deliverability testing tool that helps you verify email authentication and identify potential spam triggers. Built with Next.js and Cloudflare Workers for instant, reliable results.

**[Live Demo](https://deliverability-analyzer.vercel.app/)**

![Deliverability Score](https://img.shields.io/badge/Deliverability-10%2F10-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)

## Features

- **Email Authentication Verification**
  - SPF (Sender Policy Framework) validation
  - DKIM (DomainKeys Identified Mail) signature verification
  - DMARC (Domain-based Message Authentication) policy checks
  - Support for ARC (Authenticated Received Chain) headers

- **Content Analysis**
  - Spam trigger detection
  - URL shortener identification
  - Subject line analysis
  - Header completeness checks

- **Actionable Insights**
  - Clear deliverability score (0-10 scale, higher is better)
  - Specific recommendations for improvement
  - Real-time results with automatic polling
  - User-friendly explanations of technical issues

- **Modern Stack**
  - 100% serverless architecture (no backend costs)
  - Instant results in 5-10 seconds
  - Fully mobile-responsive design
  - Professional UI with smooth animations

## How It Works

1. **Generate Test Email**: The app creates a unique test email address (`test-abc123@deliverabilityanalyzer.xyz`)
2. **Send Your Email**: Send an email from your server/ESP to the generated address
3. **Cloudflare Receives**: Email is routed through Cloudflare Email Routing to a Worker
4. **Analysis**: Worker validates SPF/DKIM/DMARC via DNS lookups and authentication headers
5. **Store Results**: Analysis is stored in Cloudflare KV with a 24-hour TTL
6. **Display**: Results appear automatically on the frontend via polling

## Architecture

```
┌─────────────────┐
│   Your Email    │
│     Server      │
└────────┬────────┘
         │ Send email
         ▼
┌─────────────────┐
│   Cloudflare    │
│ Email Routing   │ ← Validates SPF/DKIM/DMARC
└────────┬────────┘
         │ Forward to Worker
         ▼
┌─────────────────┐
│  Worker (Edge)  │ ← Performs DNS lookups
│                 │   Analyzes content
│                 │   Stores in KV
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Next.js App   │ ← Polls for results
│   (Vercel)      │   Displays analysis
└─────────────────┘
```

## Quick Start

### Prerequisites

- Cloudflare account with Email Routing enabled
- Vercel account (or any Next.js hosting platform)
- Custom domain configured in Cloudflare

### 1. Clone the Repository

```bash
git clone https://github.com/tughn/deliverability-analyzer.git
cd deliverability-analyzer
```

### 2. Set Up Cloudflare Worker

```bash
cd worker
npm install
```

Create a KV namespace for storing results:

```bash
npx wrangler login
npx wrangler kv:namespace create EMAIL_RESULTS
```

Update `wrangler.toml` with your KV namespace ID:

```toml
[[kv_namespaces]]
binding = "EMAIL_RESULTS"
id = "your-namespace-id-here"
```

Deploy the worker:

```bash
npx wrangler deploy
```

### 3. Configure Cloudflare Email Routing

In your Cloudflare dashboard:

1. Navigate to **Email** → **Email Routing**
2. Add a catch-all routing rule:
   - **Match**: `test-*@yourdomain.com`
   - **Action**: Send to Worker
   - **Destination**: Select your deployed worker

### 4. Set Up Next.js Frontend

```bash
cd ../nextjs-app
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_WORKER_URL=https://your-worker.workers.dev
```

Update the email domain in `app/page.tsx` (line 76):

```typescript
const newEmail = `test-${newTestId}@yourdomain.com`;
```

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel deploy --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

## Configuration

### Customize Email Domain

Update the domain in `nextjs-app/app/page.tsx`:

```typescript
const newEmail = `test-${newTestId}@yourdomain.com`;
```

### Adjust KV Storage TTL

Modify result expiration time in `worker/index.js`:

```javascript
await env.EMAIL_RESULTS.put(
  `test:${testId}`,
  JSON.stringify(result),
  { expirationTtl: 86400 } // 24 hours (default)
);
```

### Email Routing Patterns

Customize the catch-all pattern in Cloudflare Email Routing:
- `test-*@domain.com` - Only route test emails (recommended)
- `analyzer-*@domain.com` - Custom prefix
- `*@subdomain.domain.com` - Subdomain routing

## Development

### Local Worker Development

```bash
cd worker
npx wrangler dev
```

Worker runs on `http://localhost:8787`

### Local Next.js Development

```bash
cd nextjs-app
npm run dev
```

Visit `http://localhost:3000` to test locally.

### View Worker Logs

```bash
cd worker
npx wrangler tail
```

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Backend**: Cloudflare Workers (JavaScript)
- **Storage**: Cloudflare KV
- **Email**: Cloudflare Email Routing
- **Hosting**: Vercel (frontend), Cloudflare Workers (backend)
- **Icons**: Lucide React
- **Styling**: Modern CSS with responsive design

## API Reference

### Worker Endpoints

#### `POST /email`
Receives incoming emails from Cloudflare Email Routing.

**Trigger**: Automatic (via Cloudflare Email Routing)

**Response**: 200 OK

---

#### `GET /results/:testId`
Retrieves analysis results for a specific test ID.

**Example Request**:
```bash
curl https://your-worker.workers.dev/results/mkl5rz...
```

**Example Response**:
```json
{
  "testId": "mkl5rz...",
  "from": "sender@example.com",
  "to": "test-mkl5rz...@yourdomain.com",
  "subject": "Test email",
  "analysis": {
    "spfPass": true,
    "dkimPass": true,
    "dmarcPass": true,
    "spamScore": 8.5,
    "spamIndicators": ["Contains URL shortener"],
    "recommendations": [
      "Replace shortened URLs with full links - email filters often flag bit.ly and similar services as suspicious"
    ],
    "details": {
      "spf": "SPF passed (validated by receiving server)",
      "dkim": "DKIM passed (validated by receiving server)",
      "dmarc": "DMARC passed (validated by receiving server)"
    },
    "assessment": "Good - Likely to reach inbox"
  },
  "timestamp": "2026-01-19T12:47:25.924Z"
}
```

## Scoring System

The deliverability score is calculated on a 0-10 scale (higher is better):

- **10/10**: Perfect - All checks passed
- **9/10**: Excellent - Very likely to reach inbox
- **7-8/10**: Good - Likely to reach inbox
- **5-6/10**: Fair - May reach spam folder
- **0-4/10**: Poor - Likely to be marked as spam

Deductions are made for:
- SPF failure: -2 points
- DKIM failure: -2 points
- DMARC failure: -1 point
- URL shorteners: -1 point
- Missing headers: -0.5 points each
- Spam triggers: Variable deductions

## Limitations

- **DKIM Validation**: Cannot cryptographically validate DKIM signatures in the worker (relies on receiving server validation from authentication headers)
- **Blacklist Checks**: Not included (would require external API calls)
- **Email Preview**: Raw email content is not displayed to users
- **Storage**: Results expire after 24 hours
- **Rate Limiting**: Not implemented (consider adding for production use)

## Use Cases

- **Email Developers**: Test email authentication before sending campaigns
- **System Administrators**: Verify SPF/DKIM/DMARC configuration
- **Marketing Teams**: Check email deliverability before mass sends
- **Security Teams**: Validate email authentication policies
- **DevOps**: Automated testing in CI/CD pipelines

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/tughn/deliverability-analyzer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tughn/deliverability-analyzer/discussions)

## Acknowledgments

- Built with [Cloudflare Workers](https://workers.cloudflare.com/)
- Powered by [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Deployed on [Vercel](https://vercel.com/)

---

**[Try it now →](https://deliverability-analyzer.vercel.app/)**

Built for better email deliverability
