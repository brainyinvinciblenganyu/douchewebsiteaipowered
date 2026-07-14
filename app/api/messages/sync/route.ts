import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../lib/apiConfig';

export async function POST(req: Request) {
  try {
    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/messages/sync`, {
      method: 'POST',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to sync inbound email', error);
    return NextResponse.json({ error: 'Failed to check for new emails' }, { status: 500 });
  }
}
