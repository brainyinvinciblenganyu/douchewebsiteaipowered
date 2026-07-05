import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createUser, findUserByEmail } from '../../../../backend/server/db/queries';
import { hashPassword } from '../../../../backend/server/auth/password';
import { setSessionCookie } from '../../../../backend/server/auth/session';


const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['customer', 'vendor']),
  name: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);

    const existing = await findUserByEmail(parsed.email);
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const password_hash = await hashPassword(parsed.password);

    const user = await createUser({
      email: parsed.email.trim().toLowerCase(),
      password_hash,
      role: parsed.role,
      name: parsed.name,
      company_name: parsed.company_name,
      location: parsed.location,
    });

    const res = NextResponse.json({ status: 'success' }, { status: 201 });
    setSessionCookie(res, { userId: user.id });
    return res;
  } catch (e) {
    const anyErr = e as { name?: string; message?: string };
    if (anyErr?.name === 'ZodError') {
      return NextResponse.json({ error: anyErr.message }, { status: 400 });
    }
    console.error('register error', e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}



