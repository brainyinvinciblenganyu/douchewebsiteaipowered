import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../../lib/apiConfig';

export async function GET(req: Request, { params }: { params: Promise<{ email: string }> }) {
  try {
    const { email } = await params;
    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/messages/thread/${encodeURIComponent(email)}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to load email thread', error);
    return NextResponse.json({ error: 'Failed to load thread' }, { status: 500 });
  }
}
