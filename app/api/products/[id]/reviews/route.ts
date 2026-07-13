import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../../lib/apiConfig';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_API_BASE_URL}/api/products/${encodeURIComponent(id)}/reviews`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy get reviews', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_API_BASE_URL}/api/products/${encodeURIComponent(id)}/reviews`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
      body: await req.text(),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy submit review', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
