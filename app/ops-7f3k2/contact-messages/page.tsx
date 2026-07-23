'use client';

import { useRef, useState } from 'react';
import { Loader2, Mail, MailOpen } from 'lucide-react';
import AdminGate from '../../../components/AdminGate';
import { handleReauthRequired } from '../../../lib/adminReauth';
import { usePolling } from '../../../lib/hooks/usePolling';

const POLL_INTERVAL_MS = 8000;

type ContactMessage = {
  id: string;
  contactEmail: string;
  contactName: string | null;
  subject: string | null;
  bodyText: string | null;
  isRead: boolean;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function ContactMessagesContent() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const loadMessages = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const res = await fetch('/api/admin/contact-messages', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      if (!hasLoadedOnce.current) setMessages([]);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  usePolling(loadMessages, POLL_INTERVAL_MS);

  const toggleOpen = async (message: ContactMessage) => {
    const nextOpen = openId === message.id ? null : message.id;
    setOpenId(nextOpen);
    if (nextOpen && !message.isRead) {
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m)));
      try {
        const res = await fetch(`/api/admin/contact-messages/${encodeURIComponent(message.id)}/read`, {
          method: 'PATCH',
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (await handleReauthRequired(data)) return;
          setError(data.error || 'Failed to mark message as read');
        }
      } catch {
        setError('Unable to reach the server');
      }
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111827]">Contact messages</h1>
        <p className="mt-1 text-sm text-slate-600">
          Messages submitted through the public Contact page.
          {unreadCount > 0 && ` ${unreadCount} unread.`}
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="rounded-2xl border border-[#D1D5DB] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#0058A3]" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-[#D1D5DB]">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => void toggleOpen(m)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-[#F5F7FA]"
                >
                  <span className="mt-0.5 text-[#0058A3]">
                    {m.isRead ? <MailOpen size={18} /> : <Mail size={18} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className={`text-sm ${m.isRead ? 'font-medium text-[#111827]' : 'font-bold text-[#111827]'}`}>
                        {m.contactName || m.contactEmail}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(m.createdAt)}</p>
                    </div>
                    <p className="text-xs text-slate-500">{m.contactEmail}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{m.subject || '(no subject)'}</p>
                    {openId === m.id && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{m.bodyText}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function AdminContactMessagesPage() {
  return (
    <AdminGate>
      <ContactMessagesContent />
    </AdminGate>
  );
}
