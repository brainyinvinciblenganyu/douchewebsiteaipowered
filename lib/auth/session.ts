import crypto from 'crypto';

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'session';

type SessionPayload = {
  userId: string;
  sessionId?: string;
};

type CookieResponseLike = {
  cookie?: (name: string, value: string, options?: Record<string, unknown>) => void;
  cookies?: {
    set: (cookie: {
      name: string;
      value: string;
      httpOnly?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      secure?: boolean;
      path?: string;
      maxAge?: number;
    }) => void;
  };
};

type RequestLike = {
  cookies?: unknown;
};

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || 'dev-session-secret-change-me';
  return secret;
}

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
      if (sigB64 !== expectedSigB64) return null;
    }

    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: CookieResponseLike, session: SessionPayload) {
  const ttlSeconds = Number(process.env.AUTH_SESSION_TTL_SECONDS || '2592000');
  const token = signToken(session);

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ttlSeconds,
  };

  if (res.cookie) {
    res.cookie(COOKIE_NAME, token, cookieOptions);
    return;
  }

  if (res.cookies?.set) {
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      ...cookieOptions,
    });
  }
}

export function clearSessionCookie(res: CookieResponseLike) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  };

  if (res.cookie) {
    res.cookie(COOKIE_NAME, '', cookieOptions);
    return;
  }

  if (res.cookies?.set) {
    res.cookies.set({
      name: COOKIE_NAME,
      value: '',
      ...cookieOptions,
    });
  }
}

export function getSessionFromRequest(req: RequestLike): SessionPayload | null {
  const cookieStore = req.cookies;
  let token: string | undefined;

  if (cookieStore && typeof cookieStore === 'object' && 'get' in cookieStore && typeof cookieStore.get === 'function') {
    token = (cookieStore as { get?: (name: string) => { value?: string } | undefined }).get?.(COOKIE_NAME)?.value;
  } else if (cookieStore && typeof cookieStore === 'object') {
    token = (cookieStore as Record<string, string | undefined>)[COOKIE_NAME];
  }

  if (!token) return null;
  return verifyToken(token);
}
