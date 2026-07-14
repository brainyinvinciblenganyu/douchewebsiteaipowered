import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../../../lib/apiConfig';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/admin/products/${encodeURIComponent(id)}/approve`, {
      method: 'PATCH',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to approve product', error);
    return NextResponse.json({ error: 'Failed to approve product' }, { status: 500 });
  }
}
