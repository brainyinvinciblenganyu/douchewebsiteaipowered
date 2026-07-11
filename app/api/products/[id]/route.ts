import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../lib/apiConfig';

type BackendProduct = {
  product?: any;
  products?: any;
  id?: string;
  name?: string;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_API_BASE_URL}/api/products/${encodeURIComponent(id)}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = (await response.json().catch(() => ({}))) as BackendProduct;
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy get product', error);
    return NextResponse.json({ error: 'Failed to get product' }, { status: 500 });
  }
}

