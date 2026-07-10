import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../lib/apiConfig';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams.toString();
    const backendUrl = `${BACKEND_API_BASE_URL}/api/products${searchParams ? `?${searchParams}` : ''}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy list products', error);
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    const backendUrl = `${BACKEND_API_BASE_URL}/api/products`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: isMultipart ? undefined : { 'Content-Type': 'application/json' },
      body: isMultipart ? await req.formData() : await req.text(),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy create product', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
