import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../lib/apiConfig';

export async function GET(req: Request) {
  try {
    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/orders`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to load orders', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
