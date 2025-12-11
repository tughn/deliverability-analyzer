require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
const { promisify } = require('util');
const { simpleParser } = require('mailparser');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render.com
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3001', 'https://*.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(pattern).test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'message/rfc822', limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_SECRET_KEY;

  // In development, allow requests without API key
  if (process.env.NODE_ENV !== 'production' && !validApiKey) {
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }

  next();
};

// Health check endpoint (no auth required)
app.get('/api/health', async (req, res) => {
  try {
    // Test SpamAssassin is working
    const { stdout } = await execAsync('spamassassin --version');
    const version = stdout.split('\n')[0];

    res.json({
      status: 'healthy',
      service: 'spamassassin-service',
      spamassassin: version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// SpamAssassin analysis endpoint
app.post('/api/analyze', authenticateApiKey, async (req, res) => {
  try {
    const { emailContent, headers, subject, from, to } = req.body;

    if (!emailContent) {
      return res.status(400).json({
        error: 'Missing required field: emailContent'
      });
    }

    // Construct full email message for SpamAssassin
    let fullEmail = '';

    // Add headers if provided
    if (headers) {
      if (typeof headers === 'object') {
        // Convert headers object to email header format
        for (const [key, value] of Object.entries(headers)) {
          fullEmail += `${key}: ${value}\n`;
        }
      } else {
        fullEmail += headers + '\n';
      }
    } else {
      // Create minimal headers
      fullEmail += `From: ${from || 'sender@example.com'}\n`;
      fullEmail += `To: ${to || 'recipient@example.com'}\n`;
      fullEmail += `Subject: ${subject || 'No Subject'}\n`;
      fullEmail += `Date: ${new Date().toUTCString()}\n`;
    }

    fullEmail += '\n' + emailContent;

    // Run SpamAssassin with optimizations for speed
    // --local-tests-only skips network tests (DNS, RBL checks) for faster processing
    const { stdout, stderr } = await execAsync('spamassassin --local-tests-only', {
      input: fullEmail,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 60000 // 60 second timeout (increased for slow CPU)
    });

    // Parse SpamAssassin output
    const result = parseSpamAssassinOutput(stdout);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('SpamAssassin analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze email',
      details: error.message
    });
  }
});

// Parse SpamAssassin output
function parseSpamAssassinOutput(output) {
  const lines = output.split('\n');

  // Extract spam score and threshold
  const scoreMatch = output.match(/score=([\d.-]+)\s+required=([\d.]+)/);
  const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
  const threshold = scoreMatch ? parseFloat(scoreMatch[2]) : 5.0;
  const isSpam = score >= threshold;

  // Extract tests/rules triggered
  const tests = [];
  let inTestsSection = false;

  for (const line of lines) {
    // Start of tests section
    if (line.includes('Content analysis details:')) {
      inTestsSection = true;
      continue;
    }

    // Parse test lines (format: "pts rule name    description")
    if (inTestsSection && line.trim()) {
      const testMatch = line.match(/^\s*([-\d.]+)\s+(\S+)\s+(.+)$/);
      if (testMatch) {
        tests.push({
          score: parseFloat(testMatch[1]),
          rule: testMatch[2],
          description: testMatch[3].trim()
        });
      }
    }
  }

  // Calculate confidence level
  let confidence = 'low';
  const absScore = Math.abs(score);
  if (absScore > 10) confidence = 'very_high';
  else if (absScore > 5) confidence = 'high';
  else if (absScore > 2) confidence = 'medium';

  // Generate recommendations
  const recommendations = generateRecommendations(tests, score, isSpam);

  return {
    isSpam,
    score,
    threshold,
    confidence,
    tests,
    testsTriggered: tests.length,
    recommendations,
    rawOutput: output
  };
}

// Generate recommendations based on test results
function generateRecommendations(tests, score, isSpam) {
  const recommendations = [];

  if (isSpam) {
    recommendations.push({
      type: 'critical',
      message: 'This email is classified as spam and likely to be blocked by most email providers.'
    });
  }

  // Check for specific issues
  const ruleTypes = tests.map(t => t.rule);

  if (ruleTypes.some(r => r.includes('SPF'))) {
    recommendations.push({
      type: 'warning',
      message: 'SPF validation issues detected. Ensure your SPF record is properly configured.'
    });
  }

  if (ruleTypes.some(r => r.includes('DKIM'))) {
    recommendations.push({
      type: 'warning',
      message: 'DKIM signature issues detected. Verify your DKIM signing configuration.'
    });
  }

  if (ruleTypes.some(r => r.includes('BAYES'))) {
    recommendations.push({
      type: 'info',
      message: 'Bayesian analysis indicates spam-like content patterns. Review your email content.'
    });
  }

  if (ruleTypes.some(r => r.includes('URI') || r.includes('URL'))) {
    recommendations.push({
      type: 'warning',
      message: 'Suspicious URLs detected. Ensure all links are legitimate and use HTTPS.'
    });
  }

  if (score > 0 && score < 2) {
    recommendations.push({
      type: 'success',
      message: 'Low spam score. Your email looks good but can be improved further.'
    });
  } else if (score <= 0) {
    recommendations.push({
      type: 'success',
      message: 'Excellent! Your email has a negative spam score, indicating high quality.'
    });
  }

  return recommendations;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'SpamAssassin Analysis API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      analyze: 'POST /api/analyze (requires API key)'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SpamAssassin service listening on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 API Key protection: ${process.env.API_SECRET_KEY ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
