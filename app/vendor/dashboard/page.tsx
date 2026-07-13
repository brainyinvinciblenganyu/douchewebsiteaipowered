'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RequireAuth from '../../../components/RequireAuth';
import VendorNav from '../../../components/VendorNav';
import { useBackendAuth } from '../../../components/BackendAuthProvider';
import { ArrowRight, Layers, Loader2, Sparkles, Truck, Zap } from 'lucide-react';

type VendorProduct = {
  id: string;
  name: string;
  category: string | null;
  status: string;
  price: number;
  currency: string;
  stockQuantity: number;
  createdAt: string;
  available3D: boolean;
};

type VendorOrder = {
  id: string;
  status: string;
  currency: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
};

export default function VendorDashboardPage() {
  return (
    <RequireAuth role="vendor">
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { user } = useBackendAuth();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
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

        const [productsRes, ordersRes] = await Promise.all([
          fetch(`/api/products?vendor_user_id=${encodeURIComponent(String(user!.id))}`, { cache: 'no-store' }),
          fetch('/api/orders', { cache: 'no-store' }),
        ]);

        const productsData = await productsRes.json().catch(() => ({}));
        const ordersData = await ordersRes.json().catch(() => ({}));

        if (!mounted) return;

        const rawProducts = Array.isArray(productsData.products) ? productsData.products : [];
        setProducts(
          rawProducts.map((p: Record<string, unknown>) => ({
            id: String(p.id ?? ''),
            name: String(p.name ?? 'Untitled product'),
            category: typeof p.category === 'string' ? p.category : null,
            status: typeof p.status === 'string' ? p.status : 'published',
            price: Number(p.price ?? 0),
            currency: typeof p.currency === 'string' ? p.currency : 'FCFA',
            stockQuantity: Number(p.stock_quantity ?? 0),
            createdAt: typeof p.created_at === 'string' ? p.created_at : new Date().toISOString(),
            available3D: Boolean(p.asset_name || p.asset_type || p.asset_data || p.asset_file),
          })),
        );

        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load vendor dashboard data', err);
        setError('Unable to load your live dashboard right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const readyCount = products.filter((p) => p.available3D).length;
  const processingCount = products.length - readyCount;

  const stats = [
    { label: 'Products Uploaded', value: products.length, icon: Layers },
    { label: 'Processing', value: processingCount, icon: Zap },
    { label: '3D Models Ready', value: readyCount, icon: Sparkles },
    { label: 'Purchase Requests', value: orders.length, icon: Truck },
  ];

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const recentRequests = orders
    .slice(0, 6)
    .flatMap((order) =>
      order.items.map((item, idx) => ({
        key: `${order.id}-${idx}`,
        productName: item.productName,
        quantity: item.quantity,
        status: order.status,
        createdAt: order.createdAt,
      })),
    )
    .slice(0, 4);

  const inventorySnapshot = [...products].sort((a, b) => a.stockQuantity - b.stockQuantity).slice(0, 4);

  return (
      <div className="min-h-screen bg-transparent">
        <main className="max-w-7xl mx-auto px-6 py-16">
        <VendorNav />
        <section className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Vendor dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Sell smarter with AI 3D product workflows.</h1>
              <p className="mt-4 text-blue-100 max-w-2xl">Track product generation, purchase requests, inventory, and analytics from one polished workspace.</p>
            </div>
            <Link href="/vendor/products" className="inline-flex items-center gap-2 rounded-2xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900">
              View your products
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-10 flex items-center justify-center gap-3 rounded-[32px] border border-blue-300/50 bg-blue-500/30 px-6 py-16 text-sm text-blue-100">
              <Loader2 className="animate-spin" size={18} />
              Syncing with the database...
            </div>
          ) : error ? (
            <div className="mt-10 rounded-[32px] border border-blue-300/50 bg-blue-500/30 px-6 py-16 text-center text-sm text-blue-100">
              {error}
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[32px] border border-blue-300/50 bg-blue-500/30 p-6 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-blue-700">
                      <stat.icon size={20} />
                    </div>
                    <p className="mt-5 text-3xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm text-blue-200">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-6 shadow-xl shadow-slate-900/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Live catalog</p>
                      <h2 className="mt-3 text-2xl font-semibold text-white">Recent product uploads</h2>
                    </div>
                    <Link href="/vendor/products" className="text-sm font-semibold text-blue-100">View all</Link>
                  </div>
                  <div className="mt-8 space-y-4">
                    {recentProducts.length === 0 ? (
                      <p className="text-sm text-blue-200">No products uploaded yet. Publish your first product to see it appear here instantly.</p>
                    ) : (
                      recentProducts.map((item) => (
                        <div key={item.id} className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{item.name}</p>
                              <p className="mt-1 text-sm text-blue-200">{item.category || 'Uncategorized'} &middot; {item.currency} {item.price.toLocaleString()}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.available3D ? 'bg-emerald-300/50 text-white' : 'bg-amber-300/50 text-white'}`}>
                              {item.available3D ? 'Ready' : 'Processing'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-6 shadow-xl shadow-slate-900/5">
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Recent purchase requests</p>
                  <div className="mt-6 space-y-4">
                    {recentRequests.length === 0 ? (
                      <p className="text-sm text-blue-200">No purchase requests yet.</p>
                    ) : (
                      recentRequests.map((request) => (
                        <div key={request.key} className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-white">{request.productName}</p>
                            <span className="rounded-full bg-emerald-300/50 px-3 py-1 text-xs font-semibold capitalize text-white">{request.status}</span>
                          </div>
                          <p className="mt-3 text-sm text-blue-200">Qty {request.quantity} &middot; {new Date(request.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12 rounded-[32px] border border-blue-200/50 bg-blue-600 p-6 shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Inventory snapshot</p>
                  <Link href="/vendor/inventory" className="text-sm font-semibold text-blue-100">See all</Link>
                </div>
                <div className="mt-8 space-y-4">
                  {inventorySnapshot.length === 0 ? (
                    <p className="text-sm text-blue-200">No products in your inventory yet.</p>
                  ) : (
                    inventorySnapshot.map((item) => (
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
            </>
          )}
        </section>
        </main>
      </div>
  );
}
