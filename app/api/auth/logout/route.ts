import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../backend/server/auth/session';

export async function POST() {
  const res = NextResponse.json({ status: 'success' });
  clearSessionCookie(res);
  return res;
}

