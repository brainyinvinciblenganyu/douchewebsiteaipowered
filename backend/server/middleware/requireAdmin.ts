import type { NextFunction, Request, Response } from 'express';
import { getAdminSession } from '../services/admin/adminAuth.js';
import { findUserById } from '../../../lib/db/queries.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminUser?: { id: string; email: string; lastAuthAt: number };
    }
  }
}

// Every failure returns 404, not 401/403 — routes behind this middleware
// should look like they don't exist to anyone who isn't a verified admin.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = getAdminSession(req);
  if (!session) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Re-checked against the DB on every request (not trusted from the signed
  // token alone) so a demoted/deleted admin's still-valid short-lived
  // session stops working immediately, not just after it expires.
  const user = await findUserById(session.userId);
  if (!user || user.role !== 'admin' || !user.is_active) {
    return res.status(404).json({ error: 'Not found' });
  }

  req.adminUser = { id: user.id, email: user.email, lastAuthAt: session.lastAuthAt };
  next();
}
