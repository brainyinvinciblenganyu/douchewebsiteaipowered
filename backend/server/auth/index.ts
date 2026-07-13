import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { createSessionRecord, createUser, findUserByEmail, findUserById, revokeSessionRecord } from '../db/queries.js';
import { hashPassword, verifyPassword } from '../../../lib/auth/password.js';
import { clearSessionCookie, getSessionFromRequest, setSessionCookie } from '../../../lib/auth/session.js';

const authRouter = Router();

const SESSION_TTL_SECONDS = Number(process.env.AUTH_SESSION_TTL_SECONDS || '2592000');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['customer', 'vendor']),
  name: z.string().min(1).optional(),
  company_name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const email = parsed.email.trim().toLowerCase();

    // Helpful debug logs to identify 401 causes (user not found vs password mismatch)
    console.log('--- LOGIN REQUEST ---');
    console.log('login email:', email);

    const user = await findUserByEmail(email);

    if (!user) {
      console.warn('login failed: user not found for email');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await verifyPassword(parsed.password, user.password_hash);
    if (!ok) {
      console.warn('login failed: password mismatch');
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const sessionRecord = await createSessionRecord(user.id, SESSION_TTL_SECONDS);
    setSessionCookie(res, { userId: user.id, sessionId: sessionRecord?.id });
    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }

    console.error('login error', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('--- REGISTER REQUEST RECEIVED ---');
    console.log('Request Body:', req.body);
    const parsed = registerSchema.parse(req.body);
    console.log('Parsed Zod Schema:', parsed);
    const existing = await findUserByEmail(parsed.email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
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

    const sessionRecord = await createSessionRecord(user.id, SESSION_TTL_SECONDS);
    setSessionCookie(res, { userId: user.id, sessionId: sessionRecord?.id });
    return res.status(201).json({ status: 'success' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }

    console.error('register error', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
    if (!session) {
      return res.status(200).json({ user: null });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        membership: null,
        location: user.location,
        preferences: [],
        avatar: null,
        bio: null,
      },
    });
  } catch (error) {
    console.error('me error', error);
    return res.status(500).json({ error: 'Failed' });
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
    if (session?.sessionId) {
      await revokeSessionRecord(session.sessionId);
    }
    clearSessionCookie(res);
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('logout error', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

export default authRouter;

