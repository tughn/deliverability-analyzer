/**
 * Cloudflare Email Worker with Built-in Analysis
 * Handles email receiving, analysis, and result storage in KV
 */

export default {
  async email(message, env, ctx) {
    try {
      console.log(`📧 Processing email from ${message.from} to ${message.to}`);

      // Extract test ID from email address
      const emailMatch = message.to.match(/test-([a-zA-Z0-9]+)@/);
      const testId = emailMatch ? emailMatch[1] : null;

      if (!testId) {
        console.error('❌ No test ID found in email address');
        return;
      }

      // Parse email headers
      const headers = {};
      for (const [key, value] of message.headers) {
        headers[key.toLowerCase()] = value;
      }

      // Read email content
      const rawEmail = await streamToArrayBuffer(message.raw);
      const emailText = new TextDecoder().decode(rawEmail);

      // Perform lightweight analysis
      const analysis = await analyzeEmail(message, headers, emailText, env);

      // Store results in KV (24-hour TTL)
      const result = {
        testId,
        from: message.from,
        to: message.to,
        subject: headers['subject'] || 'No Subject',
        analysis,
        timestamp: new Date().toISOString()
      };

      await env.EMAIL_RESULTS.put(
        `test:${testId}`,
        JSON.stringify(result),
        { expirationTtl: 86400 } // 24 hours
      );

      console.log(`✅ Analysis complete for test ${testId}`);

      // Optionally notify the webhook (for logging/monitoring)
      if (env.WEBHOOK_URL) {
        await notifyWebhook(env.WEBHOOK_URL, result);
      }

    } catch (error) {
      console.error('❌ Email worker error:', error);
    }
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // API endpoint to retrieve results
    if (url.pathname.startsWith('/api/results/')) {
      const testId = url.pathname.split('/').pop();

      if (request.method === 'GET') {
        const result = await env.EMAIL_RESULTS.get(`test:${testId}`);

        if (!result) {
          return new Response(JSON.stringify({ error: 'Test results not found' }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          });
        }

        return new Response(result, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'email-analysis-worker' }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Analyze email with lightweight checks
 */
async function analyzeEmail(message, headers, emailText, env) {
  const analysis = {
    spfPass: false,
    dkimPass: false,
    dmarcPass: false,
    spamScore: 0,
    spamIndicators: [],
    recommendations: [],
    headers: {},
    details: {}
  };

  // Check SPF
  const spfResult = checkSPF(headers);
  analysis.spfPass = spfResult.pass;
  analysis.details.spf = spfResult.details;
  if (!spfResult.pass) {
    analysis.spamScore += 2;
    analysis.spamIndicators.push('SPF check failed');
    analysis.recommendations.push('Configure SPF records for your domain');
  }

  // Check DKIM
  const dkimResult = checkDKIM(headers);
  analysis.dkimPass = dkimResult.pass;
  analysis.details.dkim = dkimResult.details;
  if (!dkimResult.pass) {
    analysis.spamScore += 2;
    analysis.spamIndicators.push('DKIM signature missing or invalid');
    analysis.recommendations.push('Enable DKIM signing for your email');
  }

  // Check DMARC
  const dmarcResult = checkDMARC(headers);
  analysis.dmarcPass = dmarcResult.pass;
  analysis.details.dmarc = dmarcResult.details;
  if (!dmarcResult.pass) {
    analysis.spamScore += 1;
    analysis.spamIndicators.push('DMARC check failed');
    analysis.recommendations.push('Set up DMARC policy for your domain');
  }

  // Content-based spam checks
  const contentChecks = analyzeContent(headers, emailText);
  analysis.spamScore += contentChecks.score;
  analysis.spamIndicators.push(...contentChecks.indicators);
  analysis.recommendations.push(...contentChecks.recommendations);

  // Header analysis
  const headerChecks = analyzeHeaders(headers);
  analysis.spamScore += headerChecks.score;
  analysis.spamIndicators.push(...headerChecks.indicators);
  analysis.recommendations.push(...headerChecks.recommendations);
  analysis.headers = headerChecks.important;

  // Overall assessment
  if (analysis.spamScore === 0) {
    analysis.assessment = 'Excellent - Very likely to reach inbox';
  } else if (analysis.spamScore <= 2) {
    analysis.assessment = 'Good - Likely to reach inbox';
  } else if (analysis.spamScore <= 5) {
    analysis.assessment = 'Fair - May reach spam folder';
  } else {
    analysis.assessment = 'Poor - Likely to be marked as spam';
  }

  return analysis;
}

/**
 * Check SPF authentication
 */
function checkSPF(headers) {
  const authResults = headers['authentication-results'] || '';
  const received = headers['received-spf'] || '';

  const spfPass = authResults.includes('spf=pass') || received.includes('pass');
  const spfFail = authResults.includes('spf=fail') || received.includes('fail');
  const spfSoftfail = authResults.includes('spf=softfail') || received.includes('softfail');

  return {
    pass: spfPass,
    details: spfPass ? 'SPF passed' : spfFail ? 'SPF failed' : spfSoftfail ? 'SPF softfail' : 'No SPF record found'
  };
}

/**
 * Check DKIM signature
 */
function checkDKIM(headers) {
  const authResults = headers['authentication-results'] || '';
  const dkimSignature = headers['dkim-signature'] || '';

  const dkimPass = authResults.includes('dkim=pass');
  const hasDkim = dkimSignature.length > 0;

  return {
    pass: dkimPass,
    details: dkimPass ? 'DKIM signature valid' : hasDkim ? 'DKIM signature present but not validated' : 'No DKIM signature'
  };
}

/**
 * Check DMARC alignment
 */
function checkDMARC(headers) {
  const authResults = headers['authentication-results'] || '';

  const dmarcPass = authResults.includes('dmarc=pass');
  const dmarcFail = authResults.includes('dmarc=fail');

  return {
    pass: dmarcPass,
    details: dmarcPass ? 'DMARC passed' : dmarcFail ? 'DMARC failed' : 'No DMARC policy found'
  };
}

/**
 * Analyze email content for spam indicators
 */
function analyzeContent(headers, emailText) {
  const indicators = [];
  const recommendations = [];
  let score = 0;

  const subject = headers['subject'] || '';
  const contentLower = emailText.toLowerCase();

  // Check for spam trigger words
  const spamWords = ['viagra', 'cialis', 'lottery', 'winner', 'claim now', 'click here', 'act now', 'limited time'];
  const foundSpamWords = spamWords.filter(word => contentLower.includes(word));

  if (foundSpamWords.length > 0) {
    score += foundSpamWords.length;
    indicators.push(`Contains spam trigger words: ${foundSpamWords.join(', ')}`);
    recommendations.push('Avoid using spam trigger words in your email');
  }

  // Check for excessive capitalization in subject
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
  if (capsRatio > 0.5 && subject.length > 5) {
    score += 1;
    indicators.push('Excessive capitalization in subject line');
    recommendations.push('Use normal capitalization in subject line');
  }

  // Check for excessive exclamation marks
  const exclamationCount = (subject.match(/!/g) || []).length;
  if (exclamationCount > 1) {
    score += 1;
    indicators.push('Excessive exclamation marks in subject');
    recommendations.push('Limit exclamation marks in subject line');
  }

  // Check for excessive links
  const linkCount = (emailText.match(/https?:\/\//g) || []).length;
  if (linkCount > 10) {
    score += 2;
    indicators.push('Excessive number of links');
    recommendations.push('Reduce the number of links in your email');
  }

  // Check for URL shorteners (common in spam)
  const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co'];
  const hasShorteners = shorteners.some(shortener => contentLower.includes(shortener));
  if (hasShorteners) {
    score += 1;
    indicators.push('Contains URL shorteners');
    recommendations.push('Use full URLs instead of URL shorteners');
  }

  // Check for empty or very short content
  if (emailText.trim().length < 50) {
    score += 1;
    indicators.push('Email content is very short');
    recommendations.push('Add more meaningful content to your email');
  }

  return { score, indicators, recommendations };
}

/**
 * Analyze email headers
 */
function analyzeHeaders(headers) {
  const indicators = [];
  const recommendations = [];
  let score = 0;

  const important = {
    from: headers['from'] || 'Unknown',
    returnPath: headers['return-path'] || 'Not set',
    messageId: headers['message-id'] || 'Not set',
    date: headers['date'] || 'Not set'
  };

  // Check for missing Return-Path
  if (!headers['return-path']) {
    score += 1;
    indicators.push('Missing Return-Path header');
    recommendations.push('Ensure Return-Path header is set');
  }

  // Check for missing Message-ID
  if (!headers['message-id']) {
    score += 1;
    indicators.push('Missing Message-ID header');
    recommendations.push('Ensure Message-ID header is present');
  }

  // Check for suspicious From/Return-Path mismatch
  if (headers['from'] && headers['return-path']) {
    const fromDomain = extractDomain(headers['from']);
    const returnPathDomain = extractDomain(headers['return-path']);

    if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
      score += 0.5;
      indicators.push('From domain differs from Return-Path domain');
      recommendations.push('Align From and Return-Path domains when possible');
    }
  }

  // Check for proper Date header
  if (!headers['date']) {
    score += 0.5;
    indicators.push('Missing Date header');
    recommendations.push('Include Date header in email');
  }

  return { score, indicators, recommendations, important };
}

/**
 * Extract domain from email address
 */
function extractDomain(email) {
  const match = email.match(/@([^\s>]+)/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Notify webhook of results (optional)
 */
async function notifyWebhook(webhookUrl, result) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    });
  } catch (error) {
    console.error('Webhook notification failed:', error);
  }
}

/**
 * Convert ReadableStream to ArrayBuffer
 */
async function streamToArrayBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}
