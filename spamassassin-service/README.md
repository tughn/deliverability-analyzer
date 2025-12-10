# SpamAssassin Service

A containerized SpamAssassin API service for email spam analysis.

## Features

- 🔍 Full SpamAssassin spam analysis
- 🛡️ API key authentication
- ⚡ Rate limiting protection
- 🔒 CORS security
- 📊 Detailed spam scoring and rules
- 💡 Actionable recommendations

## API Endpoints

### Health Check
```
GET /api/health
```

### Analyze Email
```
POST /api/analyze
Headers:
  X-API-Key: your-api-key
  Content-Type: application/json

Body:
{
  "emailContent": "email body text",
  "subject": "Email subject",
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "headers": {} // optional full headers
}
```

## Local Development

### Prerequisites
- Docker
- Node.js 18+

### Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Generate a secure API key:
```bash
openssl rand -hex 32
```

4. Update `.env` with your API key

### Run with Docker

Build:
```bash
docker build -t spamassassin-service .
```

Run:
```bash
docker run -p 3000:3000 --env-file .env spamassassin-service
```

Test:
```bash
curl http://localhost:3000/api/health
```

## Deployment to Railway

1. Create new project in Railway
2. Connect this repository
3. Set environment variables in Railway dashboard:
   - `API_SECRET_KEY`
   - `ALLOWED_ORIGINS`
   - `NODE_ENV=production`
4. Deploy!

Railway will automatically detect the Dockerfile and build the container.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment | No (default: development) |
| `API_SECRET_KEY` | API authentication key | Yes (production) |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | No |
| `RATE_LIMIT_MAX` | Max requests per 15 min window | No (default: 100) |

## Security

- API key authentication required in production
- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Helmet.js security headers
- Non-root user in container
- Request size limits (10MB)

## Response Format

```json
{
  "success": true,
  "result": {
    "isSpam": false,
    "score": 1.2,
    "threshold": 5.0,
    "confidence": "low",
    "tests": [
      {
        "score": 0.5,
        "rule": "RULE_NAME",
        "description": "Rule description"
      }
    ],
    "testsTriggered": 3,
    "recommendations": [
      {
        "type": "success",
        "message": "Your email looks good!"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## License

MIT
