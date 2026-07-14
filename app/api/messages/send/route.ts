import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../lib/apiConfig';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to send email', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
