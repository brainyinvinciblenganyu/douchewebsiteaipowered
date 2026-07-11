'use client';

import { useEffect, useState } from 'react';
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

export default function OrderList() {
  const { user } = useBackendAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <p className="px-6 py-10 text-sm text-blue-100">Loading orders...</p>;
  }

  if (error) {
    return <p className="px-6 py-10 text-sm text-blue-100">{error}</p>;
  }

  if (orders.length === 0) {
    return <p className="px-6 py-10 text-sm text-blue-100">No orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white">Order #{order.id.slice(0, 8)}</p>
              <p className="mt-1 text-sm text-blue-200">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-emerald-300/50 px-3 py-1 text-xs font-semibold capitalize text-white">
              {order.status}
            </span>
          </div>

          <div className="mt-4 divide-y divide-blue-200/40">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-white">{item.productName}</span>
                <span className="text-blue-200">
                  x{item.quantity} · {order.currency} {Number(item.unitPrice).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-blue-200/40 pt-3">
            <span className="text-sm text-blue-200">Total</span>
            <span className="text-sm font-semibold text-white">
              {order.currency} {Number(order.totalAmount).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
