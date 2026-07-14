import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const MAX_MESSAGES_PER_SYNC = 50;

export type ParsedInboundEmail = {
  messageId: string | null;
  fromEmail: string;
  fromName: string | null;
  subject: string | null;
  text: string | null;
  html: string | null;
  date: Date | null;
};

export function isImapConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

// Fetches the most recent messages in INBOX (bounded window, not just unseen —
// dedup against already-imported messages happens by Message-Id in Postgres,
// so we don't rely on Gmail's \Seen flag as the source of truth).
export async function fetchRecentInboundEmails(): Promise<ParsedInboundEmail[]> {
  if (!isImapConfigured()) {
    throw new Error('Gmail credentials are not configured (GMAIL_USER / GMAIL_APP_PASSWORD)');
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER as string,
      pass: process.env.GMAIL_APP_PASSWORD as string,
    },
    logger: false,
  });

  const results: ParsedInboundEmail[] = [];

  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const total = client.mailbox && typeof client.mailbox === 'object' ? client.mailbox.exists : 0;
      if (!total) return results;

      const start = Math.max(1, total - MAX_MESSAGES_PER_SYNC + 1);
      const range = `${start}:*`;

      for await (const message of client.fetch(range, { source: true })) {
        if (!message.source) continue;
        const parsed = await simpleParser(message.source);

        const fromAddress = parsed.from?.value?.[0];
        if (!fromAddress?.address) continue;

        results.push({
          messageId: parsed.messageId ?? null,
          fromEmail: fromAddress.address,
          fromName: fromAddress.name || null,
          subject: parsed.subject ?? null,
          text: parsed.text ?? null,
          html: typeof parsed.html === 'string' ? parsed.html : null,
          date: parsed.date ?? null,
        });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }

  return results;
}
