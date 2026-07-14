import type { NextFunction, Request, Response } from 'express';

const FRESHNESS_WINDOW_MS = 15 * 60 * 1000; // 15 min

// Applied after requireAdmin (so req.adminUser is already set) to sensitive,
// mutating admin actions (approve/reject a product, suspend a vendor, ...).
// If the admin authenticated too long ago, ask the frontend to re-prompt for
// password/TOTP rather than silently allowing the action.
export function requireFreshAdminSession(req: Request, res: Response, next: NextFunction) {
  const lastAuthAt = req.adminUser?.lastAuthAt ?? 0;
  if (Date.now() - lastAuthAt > FRESHNESS_WINDOW_MS) {
    return res.status(401).json({ reauthRequired: true, error: 'Please re-authenticate to continue' });
  }
  next();
}
