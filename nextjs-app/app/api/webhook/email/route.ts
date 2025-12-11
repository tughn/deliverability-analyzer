import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface EmailWebhookPayload {
  from: string;
  to: string;
  subject: string;
  headers: Record<string, string>;
  text: string;
  html: string;
  raw: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EmailWebhookPayload = await request.json();

    console.log('📧 Received email webhook:', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject
    });

    // Extract test ID from the email address
    const emailMatch = payload.to.match(/test-([a-zA-Z0-9]+)@/);
    const testId = emailMatch ? emailMatch[1] : null;

    if (!testId) {
      return NextResponse.json(
        { error: 'Invalid email format - missing test ID' },
        { status: 400 }
      );
    }

    // Analyze the email with SpamAssassin
    const spamAssassinUrl = process.env.SPAMASSASSIN_API_URL || 'https://deliverability-analyzer.onrender.com';
    const apiKey = process.env.SPAMASSASSIN_API_KEY || '';

    const analysisResponse = await fetch(`${spamAssassinUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'x-api-key': apiKey })
      },
      body: JSON.stringify({
        emailContent: payload.raw || payload.text || payload.html || '',
        headers: payload.headers,
        subject: payload.subject,
        from: payload.from,
        to: payload.to
      })
    });

    if (!analysisResponse.ok) {
      throw new Error(`SpamAssassin API error: ${analysisResponse.statusText}`);
    }

    const analysisResult = await analysisResponse.json();

    // Store the result in a database or cache
    // For now, we'll just log it
    console.log('✅ SpamAssassin analysis complete:', {
      testId,
      score: analysisResult.result.score,
      isSpam: analysisResult.result.isSpam
    });

    // TODO: Store result in database/cache with testId as key
    // await storeAnalysisResult(testId, analysisResult);

    return NextResponse.json({
      success: true,
      testId,
      message: 'Email analyzed successfully',
      result: analysisResult.result
    });

  } catch (error) {
    console.error('❌ Email webhook error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    service: 'Email Analysis Webhook',
    status: 'active',
    endpoints: {
      POST: '/api/webhook/email - Receives email data from Cloudflare Email Worker'
    }
  });
}
