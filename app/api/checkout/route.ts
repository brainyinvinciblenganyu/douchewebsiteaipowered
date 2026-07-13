import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../lib/apiConfig';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
      // status is optional; backend defaults it if missing
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (e) {
    console.error('checkout error', e);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
