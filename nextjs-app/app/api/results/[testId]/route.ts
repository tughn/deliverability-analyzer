import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface RouteParams {
  params: {
    testId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { testId } = params;

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    // Get the Cloudflare Worker URL from environment
    // In production, this will fetch from the Cloudflare Worker's API endpoint
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787';

    const response = await fetch(`${workerUrl}/api/results/${testId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Test results not found' },
          { status: 404 }
        );
      }
      throw new Error(`Worker API error: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Results fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
