'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import AdminGate from '../../../components/AdminGate';

type Conversation = {
  contactEmail: string;
  contactName: string | null;
  lastSubject: string | null;
  lastPreview: string | null;
  lastDirection: 'inbound' | 'outbound';
  lastCreatedAt: string;
  unreadCount: number;
};

type EmailMessage = {
  id: string;
  contactEmail: string;
  contactName: string | null;
  direction: 'inbound' | 'outbound';
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  createdAt: string;
};

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function InboxContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [thread, setThread] = useState<EmailMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/messages/conversations', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    void loadConversations();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/messages/sync', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncError(data.error || 'Failed to check for new emails');
        return;
      }
      await loadConversations();
    } catch {
      setSyncError('Unable to reach the server');
    } finally {
      setSyncing(false);
    }
  };

  const openConversation = async (email: string) => {
    setSelectedEmail(email);
    setLoadingThread(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/messages/thread/${encodeURIComponent(email)}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setThread(Array.isArray(data.messages) ? data.messages : []);
      setConversations((prev) => prev.map((c) => (c.contactEmail === email ? { ...c, unreadCount: 0 } : c)));
    } catch {
      setThread([]);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !replyBody.trim()) return;

    setSending(true);
    setSendError(null);

    const lastSubject = thread[thread.length - 1]?.subject;
    const subject = lastSubject ? (lastSubject.startsWith('Re:') ? lastSubject : `Re: ${lastSubject}`) : 'Message from Douche';

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedEmail, subject, body: replyBody }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSendError(data.error || 'Failed to send email');
        return;
      }

      setThread((prev) => [...prev, data.message]);
      setReplyBody('');
      void loadConversations();
    } catch {
      setSendError('Unable to reach the server');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-[#111827]">Email inbox</h1>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#F5F7FA] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {syncing ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          Check for new emails
        </button>
      </div>

      {syncError && <p className="mb-4 text-sm text-red-600">{syncError}</p>}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-[#D1D5DB] bg-white shadow-sm">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#0058A3]" size={22} />
            </div>
          ) : conversations.length === 0 ? (
            <p className="p-6 text-sm text-slate-600">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-[#D1D5DB]">
              {conversations.map((c) => (
                <li key={c.contactEmail}>
                  <button
                    onClick={() => void openConversation(c.contactEmail)}
                    className={`block w-full px-5 py-4 text-left transition hover:bg-[#F5F7FA] ${
                      selectedEmail === c.contactEmail ? 'bg-[#F5F7FA]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[#111827]">{c.contactName || c.contactEmail}</p>
                      {c.unreadCount > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0058A3] px-1.5 text-xs font-semibold text-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-slate-500">{c.contactEmail}</p>
                    <p className="mt-1 truncate text-xs text-slate-600">{c.lastSubject || c.lastPreview || ''}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{formatTimestamp(c.lastCreatedAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-h-[480px] flex-col rounded-2xl border border-[#D1D5DB] bg-white shadow-sm">
          {!selectedEmail ? (
            <div className="flex flex-1 items-center justify-center p-10 text-sm text-slate-500">
              Select a conversation to view messages.
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {loadingThread ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-[#0058A3]" size={22} />
                  </div>
                ) : (
                  thread.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                          m.direction === 'outbound' ? 'bg-[#0058A3] text-white' : 'border border-[#D1D5DB] bg-[#F5F7FA] text-[#111827]'
                        }`}
                      >
                        {m.subject && <p className="mb-1 text-xs font-semibold opacity-80">{m.subject}</p>}
                        <p className="whitespace-pre-wrap">{m.bodyText || ''}</p>
                        <p className={`mt-2 text-[11px] ${m.direction === 'outbound' ? 'text-sky-100' : 'text-slate-400'}`}>
                          {formatTimestamp(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleReply} className="border-t border-[#D1D5DB] p-4">
                {sendError && <p className="mb-2 text-sm text-red-600">{sendError}</p>}
                <div className="flex gap-2">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Reply to ${selectedEmail}...`}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    className="inline-flex items-center justify-center rounded-lg bg-[#0058A3] px-5 text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminInboxPage() {
  return (
    <AdminGate>
      <InboxContent />
    </AdminGate>
  );
}
