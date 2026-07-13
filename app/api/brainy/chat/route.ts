import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../lib/apiConfig';

export async function POST(req: Request) {
  try {
    const body = await req.text();

    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/brainy/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
      body,
    });

    if (!backendRes.ok || !backendRes.body) {
      const data = await backendRes.json().catch(() => ({ error: 'Brainy is unavailable right now.' }));
      return NextResponse.json(data, { status: backendRes.status || 502 });
    }

    // Pipe the backend's SSE stream straight through to the browser.
    return new Response(backendRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Brainy proxy error:', error);
    return NextResponse.json(
      { error: 'Unable to reach the backend. Make sure the backend is running on port 3001.' },
      { status: 502 },
    );
  }
}
