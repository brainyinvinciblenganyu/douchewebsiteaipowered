import { NextResponse } from 'next/server';
import { BACKEND_API_BASE_URL as BACKEND_URL } from '../../../../lib/apiConfig';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const backendRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body: JSON.stringify(body),
  });

  const text = await backendRes.text();
  return new NextResponse(text, {
    status: backendRes.status,
    headers: {
      'content-type': backendRes.headers.get('content-type') || 'application/json',
      'set-cookie': backendRes.headers.get('set-cookie') || '',
    },
  });
}



