import { NextResponse } from 'next/server';
import { z } from 'zod';

import { findUserByEmail } from '../../../../backend/server/db/queries';
import { verifyPassword } from '../../../../backend/server/auth/password';
import { setSessionCookie } from '../../../../backend/server/auth/session';


const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const email = parsed.email.trim().toLowerCase();
    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await verifyPassword(parsed.password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true }, { status: 200 });
    setSessionCookie(res, { userId: user.id });
    return res;
  } catch (e) {
    const anyErr = e as { name?: string; message?: string };
    if (anyErr?.name === 'ZodError') {
      return NextResponse.json({ error: anyErr.message }, { status: 400 });
    }
    console.error('login error', e);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}



