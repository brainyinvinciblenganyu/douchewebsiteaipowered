import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { insertEmailMessage } from '../../../lib/db/queries.js';
import { sendAdminNotificationEmail, sendCustomerAutoReply, isMailerConfigured } from '../services/mailer/smtp.service.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = contactSchema.parse(req.body);
    const email = parsed.email.trim().toLowerCase();

    // Always store the message so it shows up in the admin inbox, even if
    // outbound email delivery below fails or isn't configured yet.
    await insertEmailMessage({
      contactEmail: email,
      contactName: parsed.name,
      direction: 'inbound',
      subject: parsed.subject,
      bodyText: parsed.message,
      source: 'contact_form',
      isRead: false,
    });

    if (isMailerConfigured()) {
      await sendAdminNotificationEmail({
        fromName: parsed.name,
        fromEmail: email,
        subject: parsed.subject,
        message: parsed.message,
      }).catch((error) => console.warn('Failed to send admin notification email', error));

      await sendCustomerAutoReply({
        toEmail: email,
        toName: parsed.name,
      }).catch((error) => console.warn('Failed to send customer auto-reply', error));
    } else {
      console.warn('Contact form submitted but email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD)');
    }

    res.status(200).json({ status: 'success' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Failed to process contact form submission', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
