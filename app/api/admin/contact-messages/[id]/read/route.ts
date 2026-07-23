import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../../../lib/apiConfig';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/admin/contact-messages/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error('Failed to mark contact message read', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
