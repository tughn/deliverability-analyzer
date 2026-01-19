import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface EmailAnalysisPayload {
  testId: string;
  from: string;
  to: string;
  subject: string;
  analysis: {
    spfPass: boolean;
    dkimPass: boolean;
    dmarcPass: boolean;
    spamScore: number;
    spamIndicators: string[];
    recommendations: string[];
    headers: Record<string, string>;
  };
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EmailAnalysisPayload = await request.json();

    console.log('📧 Received email analysis:', {
      testId: payload.testId,
      from: payload.from,
      to: payload.to,
      spamScore: payload.analysis.spamScore
    });

    // In a production app, you would store this in a database or KV store
    // For now, we just log it and return success
    // The Cloudflare Worker stores it in KV, so we don't need to duplicate storage here

    return NextResponse.json({
      success: true,
      testId: payload.testId,
      message: 'Analysis received successfully'
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
      POST: '/api/webhook/email - Receives analysis results from Cloudflare Email Worker'
    }
  });
}
