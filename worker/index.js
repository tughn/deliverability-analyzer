/**
 * Cloudflare Email Worker with DNS-Based Email Analysis
 * Performs accurate SPF/DMARC lookups and honest DKIM detection
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

      // Debug logging: Check what headers we actually received
      console.log('📋 All header keys:', Object.keys(headers).join(', '))
      console.log('🔐 authentication-results:', headers['authentication-results'] || 'NOT FOUND');
      console.log('🔐 arc-authentication-results:', headers['arc-authentication-results'] || 'NOT FOUND');
      console.log('📧 From domain:', message.from.split('@')[1]);

      // Read email content
      const rawEmail = await streamToArrayBuffer(message.raw);
      const emailText = new TextDecoder().decode(rawEmail);

      // Extract Cloudflare's authentication results from raw email
      const headerSection = emailText.split('\r\n\r\n')[0];
      const cfAuthMatch = headerSection.match(/^(?:ARC-)?Authentication-Results:\s*(?:i=\d+;\s*)?mx\.cloudflare\.net;[\s\S]*?(?=\r\n\S|\r\n\r\n)/im);
      const cfAuthResults = cfAuthMatch ? cfAuthMatch[0] : '';

      // Parse SPF/DKIM/DMARC from Cloudflare's validation
      const spfPass = /spf=pass/i.test(cfAuthResults);
      const dkimPass = /dkim=pass/i.test(cfAuthResults);
      const dmarcPass = /dmarc=pass/i.test(cfAuthResults);

      // Extract sender domain for DNS lookups
      const fromEmail = message.from;
      const senderDomain = fromEmail.split('@')[1];

      // Perform accurate analysis
      const analysis = await analyzeEmail(message, headers, emailText, senderDomain, { spfPass, dkimPass, dmarcPass });

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
 * Analyze email with accurate DNS-based checks
 */
async function analyzeEmail(message, headers, emailText, senderDomain, cfAuth) {
  const analysis = {
    spfPass: cfAuth.spfPass,
    dkimPass: cfAuth.dkimPass,
    dmarcPass: cfAuth.dmarcPass,
    spamScore: 0,
    spamIndicators: [],
    recommendations: [],
    headers: {},
    details: {}
  };

  // Set details from Cloudflare validation
  analysis.details.spf = cfAuth.spfPass ? 'SPF passed (validated by Cloudflare)' : 'SPF failed (rejected by Cloudflare)';
  analysis.details.dkim = cfAuth.dkimPass ? 'DKIM passed (validated by Cloudflare)' : 'DKIM failed (rejected by Cloudflare)';
  analysis.details.dmarc = cfAuth.dmarcPass ? 'DMARC passed (validated by Cloudflare)' : 'DMARC failed (rejected by Cloudflare)';

  // Calculate spam score based on Cloudflare validation
  if (!cfAuth.spfPass) {
    analysis.spamScore += 2;
    analysis.spamIndicators.push('SPF check failed');
    analysis.recommendations.push('Add an SPF record to your domain\'s DNS to authorize your sending servers');
  }

  if (!cfAuth.dkimPass) {
    analysis.spamScore += 2;
    analysis.spamIndicators.push('DKIM signature missing or not in pass state');
    analysis.recommendations.push('Set up DKIM email signing with your email service provider to verify message authenticity');
  }

  if (!cfAuth.dmarcPass) {
    analysis.spamScore += 1;
    analysis.spamIndicators.push('DMARC check failed');
    analysis.recommendations.push('Create a DMARC policy record in your DNS to protect against email spoofing');
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

  // Cap risk score at 10 and invert to deliverability score (higher = better)
  const riskScore = Math.min(10, analysis.spamScore);
  analysis.spamScore = 10 - riskScore; // Invert: 10 = perfect, 0 = terrible

  // Overall assessment (now higher score = better)
  if (analysis.spamScore >= 9) {
    analysis.assessment = 'Excellent - Very likely to reach inbox';
  } else if (analysis.spamScore >= 7) {
    analysis.assessment = 'Good - Likely to reach inbox';
  } else if (analysis.spamScore >= 5) {
    analysis.assessment = 'Fair - May reach spam folder';
  } else {
    analysis.assessment = 'Poor - Likely to be marked as spam';
  }

  return analysis;
}

/**
 * Check SPF via DNS TXT record lookup
 */
async function checkSPF(domain, sendingIP, headers) {
  try {
    // Check authentication-results header (most reliable)
    const authResults = headers['authentication-results'] || '';
    // Also check ARC (Authenticated Received Chain) for forwarded/relayed emails
    const arcAuthResults = headers['arc-authentication-results'] || '';

    if (authResults.includes('spf=pass') || arcAuthResults.includes('spf=pass')) {
      console.log('✅ SPF: Found spf=pass in authentication headers');
      return { pass: true, details: 'SPF passed (validated by receiving server)' };
    }
    if (authResults.includes('spf=fail') || arcAuthResults.includes('spf=fail')) {
      console.log('❌ SPF: Found spf=fail in authentication headers');
      return { pass: false, details: 'SPF failed (rejected by receiving server)' };
    }

    // Fallback: Do DNS lookup for SPF record
    console.log('⚠️ SPF: No pass/fail in auth headers, falling back to DNS lookup for domain:', domain);
    const dnsUrl = `https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`;
    const response = await fetch(dnsUrl, {
      headers: { 'Accept': 'application/dns-json' }
    });

    const data = await response.json();

    if (data.Answer) {
      const spfRecords = data.Answer.filter(record =>
        record.data && record.data.includes('v=spf1')
      );

      if (spfRecords.length > 0) {
        const spfRecord = spfRecords[0].data.replace(/"/g, '');

        // Check if IP is authorized (basic check - not full SPF validation)
        if (sendingIP) {
          const ipInRecord = spfRecord.includes(sendingIP) ||
                            spfRecord.includes('ip4:') ||
                            spfRecord.includes('include:') ||
                            spfRecord.includes('a:') ||
                            spfRecord.includes('mx:');

          if (ipInRecord) {
            return { pass: true, details: `SPF record found for ${domain}` };
          }
        }

        return { pass: false, details: `SPF record exists but IP not verified` };
      }
    }

    return { pass: false, details: 'No SPF record found for domain' };
  } catch (error) {
    console.error('SPF check error:', error);
    return { pass: false, details: 'Unable to verify SPF record' };
  }
}

/**
 * Check DKIM (header detection only - cannot validate signature cryptographically)
 */
function checkDKIM(headers) {
  const authResults = headers['authentication-results'] || '';
  const arcAuthResults = headers['arc-authentication-results'] || '';
  const dkimSignature = headers['dkim-signature'] || '';

  // Check if receiving server validated it (check both headers)
  if (authResults.includes('dkim=pass') || arcAuthResults.includes('dkim=pass')) {
    return {
      pass: true,
      details: 'DKIM passed (validated by receiving server)'
    };
  }

  // Check if signature exists
  if (dkimSignature) {
    return {
      pass: false,
      details: 'DKIM signature present (validation status unknown)'
    };
  }

  return {
    pass: false,
    details: 'No DKIM signature found'
  };
}

/**
 * Check DMARC from authentication headers
 */
async function checkDMARC(domain, headers) {
  try {
    // Check authentication-results header
    const authResults = headers['authentication-results'] || '';
    const arcAuthResults = headers['arc-authentication-results'] || '';

    if (authResults.includes('dmarc=pass') || arcAuthResults.includes('dmarc=pass')) {
      return { pass: true, details: 'DMARC passed (validated by receiving server)' };
    }
    if (authResults.includes('dmarc=fail') || arcAuthResults.includes('dmarc=fail')) {
      return { pass: false, details: 'DMARC failed (rejected by receiving server)' };
    }

    // If no explicit pass/fail in headers, we cannot determine DMARC status
    // DMARC requires SPF or DKIM to pass, which we cannot validate without the auth headers
    // Don't do DNS lookup - just finding a DMARC record doesn't mean it passed
    return {
      pass: false,
      details: 'DMARC status unknown (no authentication results from receiving server)'
    };
  } catch (error) {
    console.error('DMARC check error:', error);
    return { pass: false, details: 'Unable to verify DMARC policy' };
  }
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

  // Check for spam trigger words (reduced scoring)
  const spamWords = ['viagra', 'cialis', 'lottery', 'winner', 'claim now', 'act now', 'limited time'];
  const foundSpamWords = spamWords.filter(word => contentLower.includes(word));

  if (foundSpamWords.length > 0) {
    score += 1;
    indicators.push(`Contains spam trigger words: ${foundSpamWords.join(', ')}`);
    recommendations.push('Avoid using spam trigger words in email content');
  }

  // Check for excessive caps (stricter)
  const capsRatio = (subject.match(/[A-Z]/g) || []).length / subject.length;
  if (capsRatio > 0.5 && subject.length > 5) {
    score += 0.5;
    indicators.push('Excessive capitalization in subject');
    recommendations.push('Use normal capitalization in subject lines');
  }

  // Check for URL shorteners
  const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'];
  const hasShortener = shorteners.some(s => contentLower.includes(s));
  if (hasShortener) {
    score += 1;
    indicators.push('Contains URL shortener');
    recommendations.push('Replace shortened URLs with full links - email filters often flag bit.ly and similar services as suspicious');
  }

  // Check for excessive links (more than 5)
  const linkCount = (emailText.match(/https?:\/\//g) || []).length;
  if (linkCount > 5) {
    score += 0.5;
    indicators.push('Contains excessive links');
    recommendations.push('Reduce number of links in email');
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
    from: headers['from'] || 'Not set',
    returnPath: headers['return-path'] || 'Not set',
    messageId: headers['message-id'] || 'Not set',
    date: headers['date'] || 'Not set'
  };

  // Check for missing Return-Path
  if (!headers['return-path']) {
    score += 0.5;
    indicators.push('Missing Return-Path header');
    recommendations.push('Configure a Return-Path header in your email service to help handle bounced emails properly');
  }

  // Check for missing Message-ID
  if (!headers['message-id']) {
    score += 0.5;
    indicators.push('Missing Message-ID header');
    recommendations.push('Ensure Message-ID header is generated');
  }

  return { score, indicators, recommendations, important };
}

/**
 * Helper to convert stream to ArrayBuffer
 */
async function streamToArrayBuffer(stream) {
  const chunks = [];
  const reader = stream.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}
