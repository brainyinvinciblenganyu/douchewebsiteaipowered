import { Router, type Request, type Response } from 'express';
import {
  listEmailConversations,
  getEmailThread,
  insertEmailMessage,
  emailMessageExistsByMessageId,
  markEmailThreadRead,
} from '../../../lib/db/queries.js';
import { sendMail, isMailerConfigured } from '../services/mailer/smtp.service.js';
import { fetchRecentInboundEmails, isImapConfigured } from '../services/mailer/imap.service.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// Auth is handled by the shared admin panel login (see admin.routes.ts,
// mounted at /api/admin/login) — every route in this file requires that
// same admin_session cookie.
router.use(requireAdmin);

router.get('/conversations', async (_req: Request, res: Response) => {
  try {
    const conversations = await listEmailConversations();
    res.json({ conversations });
  } catch (error) {
    console.error('Failed to list email conversations', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

router.get('/thread/:email', async (req: Request, res: Response) => {
  try {
    const email = decodeURIComponent(String(req.params.email)).trim().toLowerCase();
    const messages = await getEmailThread(email);
    await markEmailThreadRead(email);
    res.json({ messages });
  } catch (error) {
    console.error('Failed to load email thread', error);
    res.status(500).json({ error: 'Failed to load thread' });
  }
});

router.post('/send', async (req: Request, res: Response) => {
  const to = String(req.body?.to ?? '').trim();
  const subject = String(req.body?.subject ?? '(no subject)');
  const body = String(req.body?.body ?? '');

  if (!to || !body) {
    return res.status(400).json({ error: 'Recipient and message body are required' });
  }

  if (!isMailerConfigured()) {
    return res.status(503).json({ error: 'Email sending is not configured' });
  }

  try {
    await sendMail({ to, subject, text: body });
    const message = await insertEmailMessage({
      contactEmail: to,
      direction: 'outbound',
      subject,
      bodyText: body,
      source: 'admin_reply',
    });
    res.status(200).json({ message });
  } catch (error) {
    console.error('Failed to send email', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

router.post('/sync', async (_req: Request, res: Response) => {
  if (!isImapConfigured()) {
    return res.status(503).json({ error: 'Email receiving is not configured' });
  }

  try {
    const emails = await fetchRecentInboundEmails();
    let imported = 0;

    for (const email of emails) {
      if (email.messageId) {
        const exists = await emailMessageExistsByMessageId(email.messageId);
        if (exists) continue;
      }

      await insertEmailMessage({
        contactEmail: email.fromEmail,
        contactName: email.fromName,
        direction: 'inbound',
        subject: email.subject,
        bodyText: email.text,
        bodyHtml: email.html,
        messageId: email.messageId,
        source: 'imap',
        isRead: false,
      });
      imported += 1;
    }

    res.status(200).json({ imported });
  } catch (error) {
    console.error('Failed to sync inbound email', error);
    res.status(500).json({ error: 'Failed to check for new emails' });
  }
});

export default router;
