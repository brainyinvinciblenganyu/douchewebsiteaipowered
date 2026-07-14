import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL } from '../../../../lib/apiConfig';

export async function POST(req: Request) {
  try {
    const backendRes = await fetch(`${BACKEND_API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    const data = await backendRes.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: backendRes.status,
      headers: {
        'set-cookie': backendRes.headers.get('set-cookie') || '',
      },
    });
  } catch (error) {
    console.error('Failed to log out of admin panel', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
