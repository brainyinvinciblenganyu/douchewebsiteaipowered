'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminGate from '../../../components/AdminGate';
import { handleReauthRequired } from '../../../lib/adminReauth';
import { usePolling } from '../../../lib/hooks/usePolling';

const POLL_INTERVAL_MS = 8000;

type Vendor = {
  id: string;
  email: string;
  name: string | null;
  companyName: string | null;
  location: string | null;
  isActive: boolean;
  productCount: number;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function VendorsContent() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const loadVendors = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const res = await fetch('/api/admin/vendors', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setVendors(Array.isArray(data.vendors) ? data.vendors : []);
    } catch {
      if (!hasLoadedOnce.current) setVendors([]);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  usePolling(loadVendors, POLL_INTERVAL_MS);

  const toggleStatus = async (vendor: Vendor) => {
    setUpdatingId(vendor.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendor.id)}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vendor.isActive }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (await handleReauthRequired(data)) return;
        setError(data.error || 'Failed to update vendor status');
        return;
      }

      setVendors((prev) => prev.map((v) => (v.id === vendor.id ? { ...v, isActive: !v.isActive } : v)));
    } catch {
      setError('Unable to reach the server');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111827]">Vendors</h1>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-[#D1D5DB] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#0058A3]" size={24} />
          </div>
        ) : vendors.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">No vendors yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#D1D5DB] text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Location</th>
                <th className="px-5 py-3 font-semibold">Products</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#111827]">{vendor.name || '—'}</p>
                    <p className="text-xs text-slate-500">{vendor.email}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{vendor.companyName || '—'}</td>
                  <td className="px-5 py-4 text-slate-700">{vendor.location || '—'}</td>
                  <td className="px-5 py-4 text-slate-700">{vendor.productCount}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        vendor.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {vendor.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(vendor.createdAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => void toggleStatus(vendor)}
                      disabled={updatingId === vendor.id}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${
                        vendor.isActive
                          ? 'border-red-200 text-red-700 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {updatingId === vendor.id ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : vendor.isActive ? (
                        'Suspend'
                      ) : (
                        'Reactivate'
                      )}
                    </button>
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

export default function AdminVendorsPage() {
  return (
    <AdminGate>
      <VendorsContent />
    </AdminGate>
  );
}
