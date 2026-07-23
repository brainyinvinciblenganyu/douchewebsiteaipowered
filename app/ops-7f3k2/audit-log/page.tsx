'use client';

import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminGate from '../../../components/AdminGate';
import { usePolling } from '../../../lib/hooks/usePolling';

const POLL_INTERVAL_MS = 8000;

type AuditEntry = {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function AuditLogContent() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const loadEntries = async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const res = await fetch('/api/admin/audit-log', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      if (!hasLoadedOnce.current) setEntries([]);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  usePolling(loadEntries, POLL_INTERVAL_MS);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-[#111827]">Audit log</h1>
        <p className="mt-1 text-sm text-slate-600">Every login and sensitive admin action, attributed to who did it.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#D1D5DB] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#0058A3]" size={24} />
          </div>
        ) : entries.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">No activity recorded yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#D1D5DB] text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Admin</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Target</th>
                <th className="px-5 py-3 font-semibold">IP</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D5DB]">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-5 py-4 text-[#111827]">{entry.adminEmail || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {entry.targetType ? `${entry.targetType}: ${entry.targetId?.slice(0, 8) ?? ''}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{entry.ip || '—'}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default function AdminAuditLogPage() {
  return (
    <AdminGate>
      <AuditLogContent />
    </AdminGate>
  );
}
