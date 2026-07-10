~import { NextResponse } from 'next/server';
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
      body: isMultipart ? (await req.formData()) : await req.text(),
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy create product', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');
    const backendUrl = `${BACKEND_API_BASE_URL}/api/products/${encodeURIComponent(productId ?? '')}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
        'set-cookie': response.headers.get('set-cookie') || '',
      },
    });
  } catch (error) {
    console.error('Failed to proxy delete product', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');

    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    const backendUrl = `${BACKEND_API_BASE_URL}/api/products/${encodeURIComponent(productId ?? '')}`;

    const response = await fetch(backendUrl, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        cookie: req.headers.get('cookie') || '',
        ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
      },
      body: isMultipart ? (await req.formData()) : await req.text(),
    });

    const data = await response.json().catch(async () => JSON.parse(await response.text()));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy update product', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

