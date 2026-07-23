import crypto from 'crypto';
import type { Request, Response } from 'express';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_TTL_SECONDS = Number(process.env.ADMIN_SESSION_TTL_SECONDS || '5400'); // 90 min
const SETUP_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 min — window to scan the QR code and enter a code

type SessionPayload = {
  type: 'session';
  userId: string;
  lastAuthAt: number;
  exp: number;
};

type SetupPayload = {
  type: 'totp-setup';
  userId: string;
  secret: string;
  exp: number;
};

function getSecret(): string {
  return process.env.AUTH_SESSION_SECRET || 'dev-session-secret-change-me';
}

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload: unknown): string {
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${base64url(sig)}`;
}

function verify<T extends { exp: number }>(token: string): T | null {
  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return null;

    const expectedSig = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest();
    const expectedSigB64 = base64url(expectedSig);

    const a = Buffer.from(sigB64);
    const b = Buffer.from(expectedSigB64);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json) as T;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(res: Response, params: { userId: string; lastAuthAt: number }): void {
  const payload: SessionPayload = {
    type: 'session',
    userId: params.userId,
    lastAuthAt: params.lastAuthAt,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  res.cookie(SESSION_COOKIE_NAME, sign(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearAdminSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function getAdminSession(req: Request): { userId: string; lastAuthAt: number } | null {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) return null;
  const payload = verify<SessionPayload>(token);
  if (!payload || payload.type !== 'session') return null;
  return { userId: payload.userId, lastAuthAt: payload.lastAuthAt };
}

// Short-lived token carrying a freshly generated TOTP secret between the two
// legs of enrollment (/admin-login -> /admin-login/confirm-2fa-setup). Keeps
// the server stateless — the secret isn't persisted until the admin proves
// they scanned it by submitting a valid code.
export function signSetupToken(params: { userId: string; secret: string }): string {
  const payload: SetupPayload = {
    type: 'totp-setup',
    userId: params.userId,
    secret: params.secret,
    exp: Date.now() + SETUP_TOKEN_TTL_MS,
  };
  return sign(payload);
}

export function verifySetupToken(token: string): { userId: string; secret: string } | null {
  const payload = verify<SetupPayload>(token);
  if (!payload || payload.type !== 'totp-setup') return null;
  return { userId: payload.userId, secret: payload.secret };
}

export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 hex chars
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}
