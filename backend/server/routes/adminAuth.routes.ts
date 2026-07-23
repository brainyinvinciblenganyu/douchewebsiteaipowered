import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import QRCode from 'qrcode';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import { verifyPassword } from '../../../lib/auth/password.js';
import {
  findUserByEmail,
  recordAdminLoginAttempt,
  countRecentFailedAttempts,
  consumeRecoveryCode,
  enableTotp,
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

const TOTP_ISSUER = process.env.TOTP_ISSUER || 'Douche Admin';
// Allows a code from one time-step before/after the current one — a small,
// standard amount of clock/latency slack without meaningfully weakening the
// 30-second window.
const EPOCH_TOLERANCE_SECONDS = 30;

router.post('/admin-login', loginLimiter, async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  const recoveryCode = typeof req.body?.recoveryCode === 'string' ? req.body.recoveryCode.trim() : '';
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

    // Recovery code path — for when the authenticator app/device is unavailable.
    if (recoveryCode) {
      const ok = await consumeRecoveryCode(user.id, hashRecoveryCode(recoveryCode));
      if (!ok) {
        await recordAdminLoginAttempt({ identifier: email, ip, succeeded: false });
        return res.status(401).json(GENERIC_ERROR);
      }

      await recordAdminLoginAttempt({ identifier: email, ip, succeeded: true });
      setAdminSessionCookie(res, { userId: user.id, lastAuthAt: Date.now() });
      await recordAuditLog({ adminId: user.id, action: 'admin_login_recovery_code', ip: ip ?? undefined });
      return res.status(200).json({ status: 'success' });
    }

    if (!user.totp_enabled || !user.totp_secret) {
      // First login: no authenticator app registered yet — issue a fresh
      // secret and QR code. Nothing is persisted until confirm-2fa-setup
      // proves the admin actually scanned it (a valid 6-digit code back).
      const secret = generateSecret();
      const uri = generateURI({ issuer: TOTP_ISSUER, label: user.email, secret });
      const qrDataUri = await QRCode.toDataURL(uri);
      const setupToken = signSetupToken({ userId: user.id, secret });

      await recordAdminLoginAttempt({ identifier: email, ip, succeeded: true });
      return res.status(200).json({ setupRequired: true, qrDataUri, secret, setupToken });
    }

    if (!code) {
      return res.status(200).json({ totpRequired: true });
    }

    const result = await verifyTotp({ secret: user.totp_secret, token: code, epochTolerance: EPOCH_TOLERANCE_SECONDS });
    if (!result.valid) {
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

  const challenge = verifySetupToken(setupToken);
  if (!challenge || !code) {
    return res.status(400).json({ error: 'Setup session expired, please log in again' });
  }

  try {
    const result = await verifyTotp({ secret: challenge.secret, token: code, epochTolerance: EPOCH_TOLERANCE_SECONDS });
    if (!result.valid) {
      return res.status(400).json({ error: 'Invalid code. Please try again.' });
    }

    const recoveryCodes = generateRecoveryCodes();
    await enableTotp({ userId: challenge.userId, secret: challenge.secret, recoveryCodes: recoveryCodes.map(hashRecoveryCode) });

    setAdminSessionCookie(res, { userId: challenge.userId, lastAuthAt: Date.now() });
    await recordAuditLog({ adminId: challenge.userId, action: 'admin_totp_enabled', ip: req.ip });

    return res.status(200).json({ status: 'success', recoveryCodes });
  } catch (error) {
    console.error('TOTP setup error', error);
    return res.status(400).json({ error: 'Could not verify this code. Please try again.' });
  }
});

export default router;
