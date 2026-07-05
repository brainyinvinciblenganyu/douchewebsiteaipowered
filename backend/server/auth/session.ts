import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session';

export type SessionPayload = {
  userId: string;
};

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error('Missing AUTH_SESSION_SECRET');
  return secret;
}

// Simple signed token (HMAC) stored in an httpOnly cookie.
// Token format: base64(payload).hmac
function base64url(input: Buffer) {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signToken(payload: SessionPayload) {
  const secret = getSecret();
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64url(Buffer.from(payloadJson, 'utf8'));
  const sig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest();
  const sigB64 = base64url(sig);
  return `${payloadB64}.${sigB64}`;
}

function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;

    const secret = getSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadB64)
      .digest();
    const expectedSigB64 = base64url(expectedSig);

    if (!crypto.timingSafeEqual(Buffer.from(sigB64), Buffer.from(expectedSigB64))) {
      // timingSafeEqual above compares raw bytes of base64 strings, not decoded.
      // Keep it simple: constant-time compare by re-encoding.
      if (sigB64 !== expectedSigB64) return null;
    }

    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, session: SessionPayload) {
  const ttlSeconds = Number(process.env.AUTH_SESSION_TTL_SECONDS || '2592000');
  const token = signToken(session);

  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ttlSeconds,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

