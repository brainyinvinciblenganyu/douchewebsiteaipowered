import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      cookie: req.headers.get('cookie') || '',
    },
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

export async function PATCH(req: NextRequest) {
  const body = await req.text();

  const backendRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: req.headers.get('cookie') || '',
    },
    body,
  });

  const text = await backendRes.text();
  return new NextResponse(text, {
    status: backendRes.status,
    headers: {
      'content-type': backendRes.headers.get('content-type') || 'application/json',
    },
  });
}

