import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import QRCode from 'qrcode';
import { verifyPassword } from '../../../lib/auth/password.js';
import {
  findUserByEmail,
  recordAdminLoginAttempt,
  countRecentFailedAttempts,
  enableTotp,
  consumeRecoveryCode,
  recordAuditLog,
} from '../../../lib/db/queries.js';
import {
  setAdminSessionCookie,
  signSetupToken,
  verifySetupToken,
  generateRecoveryCodes,
  hashRecoveryCode,
} from '../services/admin/adminAuth.js';

const router = Router();

// A pbkdf2 hash of an unrelated random string, in the exact format
// verifyPassword expects. Used so a login attempt for a non-existent email
// still runs a full pbkdf2 comparison — otherwise "no such user" would return
// faster than "wrong password", leaking which emails have admin accounts.
const DUMMY_HASH = 'pbkdf2$210000$8f2b6a1c9d3e4f5a6b7c8d9e0f1a2b3c$0000000000000000000000000000000000000000000000000000000000000000';

const GENERIC_ERROR = { error: 'Invalid credentials' };

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

function isNumericTotpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

router.post('/admin-login', loginLimiter, async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  const ip = req.ip ?? null;

  if (!email || !password) {
    return res.status(400).json(GENERIC_ERROR);
  }

  try {
    const { byIdentifier, byIp } = await countRecentFailedAttempts({ identifier: email, ip, windowMinutes: 15 });
    if (byIdentifier >= 5 || byIp >= 10) {
      await recordAdminLoginAttempt({ identifier: email, ip, succeeded: false });
      return res.status(401).json(GENERIC_ERROR);
    }

    const user = await findUserByEmail(email);
    const passwordOk = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

    if (!user || !passwordOk || user.role !== 'admin' || !user.is_active) {
      await recordAdminLoginAttempt({ identifier: email, ip, succeeded: false });
      return res.status(401).json(GENERIC_ERROR);
    }

    if (!user.totp_enabled) {
      // First login: issue a fresh (unsaved) TOTP secret for enrollment.
      const secret = generateSecret();
      const otpauthUri = generateURI({ issuer: 'Douche Admin', label: user.email, secret });
      const qrDataUri = await QRCode.toDataURL(otpauthUri);
      const setupToken = signSetupToken({ userId: user.id, secret });

      await recordAdminLoginAttempt({ identifier: email, ip, succeeded: true });
      return res.status(200).json({ setupRequired: true, setupToken, qrDataUri, secret });
    }

    if (!code) {
      return res.status(200).json({ totpRequired: true });
    }

    let totpOk = false;
    if (isNumericTotpCode(code)) {
      const result = await verifyTotp({ secret: user.totp_secret as string, token: code });
      totpOk = result.valid;
    } else {
      totpOk = await consumeRecoveryCode(user.id, hashRecoveryCode(code));
    }

    if (!totpOk) {
      await recordAdminLoginAttempt({ identifier: email, ip, succeeded: false });
      return res.status(401).json(GENERIC_ERROR);
    }

    await recordAdminLoginAttempt({ identifier: email, ip, succeeded: true });
    setAdminSessionCookie(res, { userId: user.id, lastAuthAt: Date.now() });
    await recordAuditLog({ adminId: user.id, action: 'admin_login', ip: ip ?? undefined });

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Admin login error', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

router.post('/admin-login/confirm-2fa-setup', async (req: Request, res: Response) => {
  const setupToken = String(req.body?.setupToken ?? '');
  const code = String(req.body?.code ?? '').trim();

  const setup = verifySetupToken(setupToken);
  if (!setup) {
    return res.status(400).json({ error: 'Setup session expired, please log in again' });
  }

  if (!isNumericTotpCode(code)) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  const verifyResult = await verifyTotp({ secret: setup.secret, token: code });
  if (!verifyResult.valid) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  try {
    const recoveryCodes = generateRecoveryCodes();
    await enableTotp({
      userId: setup.userId,
      secret: setup.secret,
      recoveryCodes: recoveryCodes.map(hashRecoveryCode),
    });

    setAdminSessionCookie(res, { userId: setup.userId, lastAuthAt: Date.now() });
    await recordAuditLog({ adminId: setup.userId, action: 'admin_2fa_enrolled', ip: req.ip });

    return res.status(200).json({ status: 'success', recoveryCodes });
  } catch (error) {
    console.error('2FA setup confirmation error', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
