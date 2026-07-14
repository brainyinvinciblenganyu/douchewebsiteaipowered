import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../../lib/apiConfig';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const backendUrl = `${BACKEND_API_BASE_URL}/api/orders/${encodeURIComponent(id)}/cancel`;

    const response = await fetch(backendUrl, {
      method: 'PATCH',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to proxy cancel order', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
