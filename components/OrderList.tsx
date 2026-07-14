'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useBackendAuth } from './BackendAuthProvider';

export type OrderItem = {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  vendorUserId: string | null;
};

export type Order = {
  id: string;
  userId: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-emerald-100 text-emerald-900',
  shipped: 'bg-sky-100 text-sky-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-rose-100 text-rose-900',
  paid: 'bg-emerald-100 text-emerald-900',
};

export default function OrderList({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const { user } = useBackendAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/orders', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        if (isMounted) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch {
        if (isMounted) setError('Unable to load orders right now.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleDrop = async (orderId: string) => {
    if (!confirm('Drop this order? This cannot be undone.')) return;

    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || 'Unable to drop this order right now.');
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
    } catch {
      alert('Unable to drop this order right now.');
    } finally {
      setCancellingId(null);
    }
  };

  const isLight = variant === 'light';
  const cardClass = isLight
    ? 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'
    : 'rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5';
  const labelClass = isLight ? 'font-semibold text-slate-950' : 'font-semibold text-white';
  const mutedClass = isLight ? 'text-sm text-slate-500' : 'mt-1 text-sm text-blue-200';
  const dividerClass = isLight ? 'divide-y divide-slate-100' : 'divide-y divide-blue-200/40';
  const itemNameClass = isLight ? 'text-slate-900' : 'text-white';
  const itemMetaClass = isLight ? 'text-slate-500' : 'text-blue-200';
  const totalLabelClass = isLight ? 'text-sm text-slate-500' : 'text-sm text-blue-200';
  const totalValueClass = isLight ? 'text-sm font-semibold text-slate-950' : 'text-sm font-semibold text-white';
  const totalBorderClass = isLight ? 'border-t border-slate-100' : 'border-t border-blue-200/40';
  const emptyClass = isLight ? 'px-6 py-10 text-sm text-slate-500' : 'px-6 py-10 text-sm text-blue-100';

  if (loading) {
    return <p className={emptyClass}>Loading orders...</p>;
  }

  if (error) {
    return <p className={emptyClass}>{error}</p>;
  }

  if (orders.length === 0) {
    return <p className={emptyClass}>No orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order, index) => (
        <div key={order.id} className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={labelClass}>Order #{index + 1}</p>
              <p className={mutedClass}>{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[order.status] || 'bg-slate-100 text-slate-900'}`}>
              {order.status}
            </span>
          </div>

          <div className={`mt-4 ${dividerClass}`}>
            {order.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className={itemNameClass}>{item.productName}</span>
                <span className={itemMetaClass}>
                  x{item.quantity} &middot; {order.currency} {Number(item.unitPrice).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className={`mt-3 flex items-center justify-between pt-3 ${totalBorderClass}`}>
            <span className={totalLabelClass}>Total</span>
            <span className={totalValueClass}>
              {order.currency} {Number(order.totalAmount).toLocaleString()}
            </span>
          </div>

          {user?.role === 'customer' && order.status === 'pending' && (
            <button
              type="button"
              onClick={() => handleDrop(order.id)}
              disabled={cancellingId === order.id}
              className={`mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isLight
                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border-rose-300/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20'
              }`}
            >
              <X size={14} />
              {cancellingId === order.id ? 'Dropping...' : 'Drop order'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
