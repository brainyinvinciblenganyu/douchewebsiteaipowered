import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../../../lib/apiConfig';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/admin/vendors/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to update vendor status', error);
    return NextResponse.json({ error: 'Failed to update vendor status' }, { status: 500 });
  }
}
