'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import RequireAuth from '../../../components/RequireAuth';
import { useBackendAuth } from '../../../components/BackendAuthProvider';
import { Plus, ArrowRight, Loader2 } from 'lucide-react';

type ProductRow = {
  id: string;
  name: string;
  category: string;
  available3D: boolean;
  price: number;
  currency: string;
};

export default function VendorProductsClient() {
  const { user } = useBackendAuth();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const justCreated = searchParams.get('created') === '1';

  useEffect(() => {
    if (!user?.id) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products?vendor_user_id=${encodeURIComponent(String(user.id))}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load products');
        }

        const data = await response.json();
        const rows = Array.isArray(data.products) ? data.products : [];

        if (!isMounted) return;

        setProducts(
          rows.map((product: Record<string, unknown>) => ({
            id: String(product.id ?? ''),
            name: String(product.name ?? 'Untitled product'),
            category: typeof product.category === 'string' ? product.category : 'Uncategorized',
            available3D: Boolean(product.asset_name || product.asset_type || product.asset_data || product.asset_file),
            price: Number(product.price ?? 0),
            currency: String(product.currency ?? 'FCFA'),
          })),
        );
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load vendor products', err);
        setError('Unable to load your live catalog right now.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Load only once (no polling) to avoid rapid refresh loops.
    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [user?.id, justCreated]);

  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-7xl px-6 py-16">
          <section className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Product management</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Manage your live product catalog and 3D uploads.</h1>
              </div>
              <Link href="/vendor/products/new" className="inline-flex items-center gap-2 rounded-2xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900">
                <Plus size={16} />
                Add new product
              </Link>
            </div>

            {justCreated ? (
              <div className="mt-6 rounded-2xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-50">
                Product published to your live catalog.
              </div>
            ) : null}

            <div className="mt-10 overflow-hidden rounded-[32px] border border-blue-300/50 bg-blue-500/30 shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm text-blue-100">
                  <Loader2 className="animate-spin" size={18} />
                  Syncing with the database...
                </div>
              ) : error ? (
                <div className="px-6 py-10 text-sm text-blue-100">{error}</div>
              ) : products.length === 0 ? (
                <div className="px-6 py-10 text-sm text-blue-100">
                  No products yet. Publish your first product to see it appear here instantly.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-blue-200/50">
                  <thead className="bg-blue-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">3D Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Price</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-200/50 bg-blue-600">
                    {products.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-500/50">
                        <td className="px-6 py-5 text-sm font-semibold text-white">{item.name}</td>
                        <td className="px-6 py-5 text-sm text-blue-200">{item.category}</td>
                        <td className="px-6 py-5 text-sm text-blue-200">{item.available3D ? 'Ready' : 'Processing'}</td>
                        <td className="px-6 py-5 text-sm font-semibold text-white">{item.currency} {item.price.toLocaleString()}</td>
                        <td className="px-6 py-5 text-right text-sm text-blue-200">
                          <Link href={`/vendor/products/${item.id}/edit`} className="inline-flex items-center gap-2 text-blue-100 hover:text-white">
                            Manage
                            <ArrowRight size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
