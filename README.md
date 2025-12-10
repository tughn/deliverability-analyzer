# Deliverability Analyzer

**[Live Demo →](https://deliverability-analyzer.vercel.app)**

A comprehensive email deliverability testing tool powered by SpamAssassin. Test your email's spam score, validate SPF/DKIM/DMARC records, and get detailed analysis reports.

## Features

- 🛡️ **SpamAssassin Analysis** - Industry-standard spam detection and scoring
- ✅ **Email Authentication** - SPF, DKIM, and DMARC validation
- ⚡ **Instant Results** - Real-time analysis and detailed reports

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Node.js, Express, SpamAssassin
- **Deployment**: Vercel (Frontend) + Railway (Backend)
- **100% Free Hosting**

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for SpamAssassin service)

### Local Development

#### Frontend (Next.js)

```bash
cd nextjs-app
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

#### Backend (SpamAssassin Service)

```bash
cd spamassassin-service
docker build -t spamassassin-service .
docker run -p 3001:3000 -e API_KEY=your-secret-key spamassassin-service
```

### Environment Variables

#### SpamAssassin Service (.env)

```
API_KEY=your-secret-api-key
PORT=3000
```

#### Next.js App (.env.local)

```
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_API_KEY=your-secret-api-key
```

## Deployment

### Railway (Backend)

1. Create new project on Railway
2. Deploy from GitHub repository
3. Set environment variable: `API_KEY`
4. Railway will auto-detect Dockerfile and deploy

### Vercel (Frontend)

1. Import project on Vercel
2. Set root directory to `nextjs-app`
3. Add environment variables
4. Deploy

## License

MIT
