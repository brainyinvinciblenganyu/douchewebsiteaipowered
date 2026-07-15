import { Router, type Request, type Response } from 'express';
import { getSessionFromRequest } from '../../../lib/auth/session.js';
import { findUserById, listCustomersForVendor } from '../../../lib/db/queries.js';
import { sendMail, isMailerConfigured } from '../services/mailer/smtp.service.js';

const router = Router();

async function requireVendor(req: Request, res: Response): Promise<string | null> {
  const session = getSessionFromRequest(req as Parameters<typeof getSessionFromRequest>[0]);
  if (!session?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const user = await findUserById(session.userId);
  if (!user || user.role !== 'vendor') {
    res.status(403).json({ error: 'Vendor access required' });
    return null;
  }

  return user.id;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const vendorUserId = await requireVendor(req, res);
    if (!vendorUserId) return;

    const customers = await listCustomersForVendor(vendorUserId);
    res.json({ customers });
  } catch (error) {
    console.error('Failed to list vendor customers', error);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

router.post('/message', async (req: Request, res: Response) => {
  try {
    const vendorUserId = await requireVendor(req, res);
    if (!vendorUserId) return;

    const to = String(req.body?.customerEmail ?? '').trim();
    const subject = String(req.body?.subject ?? '(no subject)');
    const message = String(req.body?.message ?? '').trim();

    if (!to || !message) {
      return res.status(400).json({ error: 'A recipient and message are required' });
    }

    if (!isMailerConfigured()) {
      return res.status(503).json({ error: 'Email is not configured yet. Set GMAIL_USER / GMAIL_APP_PASSWORD.' });
    }

    const vendor = await findUserById(vendorUserId);

    await sendMail({
      to,
      subject,
      text: `${message}\n\n— ${vendor?.name || vendor?.company_name || 'Your vendor'}`,
      replyTo: vendor?.email,
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Failed to send vendor message', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
