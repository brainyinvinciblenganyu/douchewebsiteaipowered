'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail, X } from 'lucide-react';
import RequireAuth from '../../../components/RequireAuth';
import VendorNav from '../../../components/VendorNav';

type VendorCustomer = {
  id: string;
  name: string | null;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function MessageModal({ customer, onClose }: { customer: VendorCustomer; onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/vendor/customers/message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: customer.email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        return;
      }

      setSent(true);
    } catch {
      setError('Unable to reach the server');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">Message {customer.name || customer.email}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="mt-6">
            <p className="text-sm text-emerald-700">Message sent to {customer.email}.</p>
            <button
              onClick={onClose}
              className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#0058a3] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="mt-4 space-y-3">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              required
              className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-transparent focus:ring-2 focus:ring-[#0058a3]"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              rows={5}
              required
              className="w-full resize-none rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-transparent focus:ring-2 focus:ring-[#0058a3]"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0058a3] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CustomersContent() {
  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VendorCustomer | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/vendor/customers', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="mt-8 rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
      <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Customers</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Everyone who bought your products.</h1>
      <p className="mt-4 max-w-2xl text-blue-100">Reach out directly by email to any customer who has ordered from you.</p>

      <div className="mt-8 overflow-x-auto rounded-2xl bg-white/95">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#0058a3]" size={24} />
          </div>
        ) : customers.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">No customers yet — once someone orders your products, they'll show up here.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Orders</th>
                <th className="px-5 py-3 font-semibold">Total spent</th>
                <th className="px-5 py-3 font-semibold">Last order</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#111827]">{c.name || 'Customer'}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{c.orderCount}</td>
                  <td className="px-5 py-4 text-slate-700">{c.totalSpent.toLocaleString()}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(c.lastOrderAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelected(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0058a3]/30 px-3 py-2 text-xs font-semibold text-[#0058a3] hover:bg-[#0058a3]/5"
                    >
                      <Mail size={14} />
                      Message
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && <MessageModal customer={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

export default function VendorCustomersPage() {
  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-7xl px-6 py-16">
          <VendorNav />
          <CustomersContent />
        </main>
      </div>
    </RequireAuth>
  );
}
