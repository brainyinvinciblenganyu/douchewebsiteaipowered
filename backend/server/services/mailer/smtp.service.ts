import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

export function isMailerConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}): Promise<void> {
  if (!isMailerConfigured()) {
    throw new Error('Gmail credentials are not configured (GMAIL_USER / GMAIL_APP_PASSWORD)');
  }

  await getTransporter().sendMail({
    from: process.env.GMAIL_USER,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    replyTo: params.replyTo,
  });
}

export async function sendAdminNotificationEmail(params: {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}): Promise<void> {
  await sendMail({
    to: process.env.GMAIL_USER as string,
    subject: `New contact form message: ${params.subject}`,
    text: `From: ${params.fromName} <${params.fromEmail}>\n\n${params.message}`,
    replyTo: params.fromEmail,
  });
}

export async function sendCustomerAutoReply(params: {
  toEmail: string;
  toName: string;
}): Promise<void> {
  await sendMail({
    to: params.toEmail,
    subject: 'We received your message',
    text: `Hi ${params.toName || 'there'},\n\nThanks for reaching out to Douche. We've received your message and will get back to you soon.\n\n— The Douche team`,
  });
}
