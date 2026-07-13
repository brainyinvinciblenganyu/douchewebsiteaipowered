'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RequireAuth from '../../../components/RequireAuth';
import { useBackendAuth } from '../../../components/BackendAuthProvider';
import { ArrowLeft, Boxes, Loader2 } from 'lucide-react';

type InventoryItem = {
  id: string;
  name: string;
  status: string;
  stockQuantity: number;
};

export default function VendorInventoryPage() {
  return (
    <RequireAuth role="vendor">
      <InventoryContent />
    </RequireAuth>
  );
}

function InventoryContent() {
  const { user } = useBackendAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/products?vendor_user_id=${encodeURIComponent(String(user!.id))}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to load products');

        const data = await res.json();
        const rows = Array.isArray(data.products) ? data.products : [];

        if (!mounted) return;

        setItems(
          rows
            .map((p: Record<string, unknown>) => ({
              id: String(p.id ?? ''),
              name: String(p.name ?? 'Untitled product'),
              status: typeof p.status === 'string' ? p.status : 'published',
              stockQuantity: Number(p.stock_quantity ?? 0),
            }))
            .sort((a: InventoryItem, b: InventoryItem) => a.stockQuantity - b.stockQuantity),
        );
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load inventory', err);
        setError('Unable to load your live inventory right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
            <Link href="/vendor/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Inventory</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Keep stock levels visible and actionable.</h1>
                <p className="mt-4 max-w-2xl text-blue-100">Live stock levels for every product in your catalog, sorted so what needs restocking shows up first.</p>
              </div>
              <div className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5">
                <div className="flex items-center gap-3 text-white">
                  <Boxes size={18} />
                  <span className="font-semibold">Live stock snapshot</span>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm text-blue-100">
                  <Loader2 className="animate-spin" size={18} />
                  Syncing with the database...
                </div>
              ) : error ? (
                <div className="px-6 py-10 text-center text-sm text-blue-100">{error}</div>
              ) : items.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-blue-100">
                  No products yet.{' '}
                  <Link href="/vendor/products/new" className="font-semibold text-white underline">
                    Publish your first product
                  </Link>{' '}
                  to see it appear here instantly.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                    <div>
                      <p className="font-semibold text-white">{item.name}</p>
                      <p className="text-sm text-blue-200 capitalize">{item.status}</p>
                    </div>
                    <p className={`text-sm font-semibold ${item.stockQuantity === 0 ? 'text-amber-200' : 'text-blue-100'}`}>
                      {item.stockQuantity === 0 ? 'Out of stock' : `${item.stockQuantity} in stock`}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
  );
}
