'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminGate from '../../../components/AdminGate';
import { usePolling } from '../../../lib/hooks/usePolling';

const POLL_INTERVAL_MS = 8000;

type Transaction = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  itemCount: number;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const loadTransactions = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const res = await fetch('/api/admin/transactions', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch {
      if (!hasLoadedOnce.current) setTransactions([]);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  usePolling(loadTransactions, POLL_INTERVAL_MS);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111827]">Transactions</h1>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#D1D5DB] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#0058A3]" size={24} />
          </div>
        ) : transactions.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">No orders yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#D1D5DB] text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{t.id.slice(0, 8)}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#111827]">{t.customerName || 'Guest'}</p>
                    <p className="text-xs text-slate-500">{t.customerEmail || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{t.itemCount}</td>
                  <td className="px-5 py-4 font-semibold text-[#111827]">
                    {t.currency} {t.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        STATUS_STYLES[t.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminTransactionsPage() {
  return (
    <AdminGate>
      <TransactionsContent />
    </AdminGate>
  );
}
