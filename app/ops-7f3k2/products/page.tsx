'use client';

import { useRef, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import AdminGate from '../../../components/AdminGate';
import { handleReauthRequired } from '../../../lib/adminReauth';
import { usePolling } from '../../../lib/hooks/usePolling';

const POLL_INTERVAL_MS = 8000;

type PendingProduct = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  currency: string;
  vendorUserId: string | null;
  vendorName: string | null;
  vendorEmail: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function ProductsContent() {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const loadProducts = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const res = await fetch('/api/admin/products/pending', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      if (!hasLoadedOnce.current) setProducts([]);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  usePolling(loadProducts, POLL_INTERVAL_MS);

  const handleDecision = async (productId: string, decision: 'approve' | 'reject') => {
    setActingId(productId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(productId)}/${decision}`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (await handleReauthRequired(data)) return;
        setError(data.error || `Failed to ${decision} product`);
        return;
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      setError('Unable to reach the server');
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111827]">Product approvals</h1>
        <p className="mt-1 text-sm text-slate-600">New vendor products wait here until approved before appearing in the public catalog.</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-[#D1D5DB] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#0058A3]" size={24} />
          </div>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">No products awaiting review.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#D1D5DB] text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Vendor</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Price</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-4 font-semibold text-[#111827]">{p.name}</td>
                  <td className="px-5 py-4">
                    <p className="text-[#111827]">{p.vendorName || '—'}</p>
                    <p className="text-xs text-slate-500">{p.vendorEmail || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{p.category || '—'}</td>
                  <td className="px-5 py-4 text-slate-700">
                    {p.currency} {p.price.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleDecision(p.id, 'approve')}
                        disabled={actingId === p.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {actingId === p.id ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => void handleDecision(p.id, 'reject')}
                        disabled={actingId === p.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {actingId === p.id ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminGate>
      <ProductsContent />
    </AdminGate>
  );
}
