'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '../../../../../components/RequireAuth';
import { useBackendAuth } from '../../../../../components/BackendAuthProvider';
import ModelViewer from '../../../../../components/ModelViewer';
import { ArrowRight, Delete, Edit3, Loader2 } from 'lucide-react';

type ProductCard = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  price?: number;
  currency?: string;
  asset_name?: string | null;
  asset_type?: string | null;
  asset_file?: string | null;
  asset_data?: string | null;
  available3D?: boolean;
  status?: string;
  created_at?: string;
};

export default function ProductEditClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useBackendAuth();

  const productId = useMemo(() => String(params?.id ?? ''), [params]);

  const [product, setProduct] = useState<ProductCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !productId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Reuse the existing vendor products endpoint (list) and find the product client-side.
        // There isn't currently a dedicated GET /api/products/:id in the repo.
        const res = await fetch(`/api/products?vendor_user_id=${encodeURIComponent(String(user!.id))}`, {
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('Failed to load products');
        const data = await res.json();
        const rows: ProductCard[] = Array.isArray(data.products) ? data.products : [];

        const found = rows.find((p) => String((p as any).id) === productId);
        if (!found) {
          if (!mounted) return;
          setError('Product not found in your catalog.');
          return;
        }

        if (!mounted) return;
        setProduct({
          ...(found as any),
          id: String((found as any).id),
          available3D: Boolean(
            (found as any).asset_name ||
              (found as any).asset_type ||
              (found as any).asset_data ||
              (found as any).asset_file
          ),
          price: Number((found as any).price ?? 0),
          currency: String((found as any).currency ?? 'FCFA'),
        });
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setError('Unable to load this product right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [productId, user?.id]);

  async function handleDelete() {
    if (!product) return;

    // Backend currently only supports create/list. This is a real request that expects
    // a delete endpoint; until the backend implements it, you'll see an error toast/alert.
    const res = await fetch(`/api/products?product_id=${encodeURIComponent(product.id)}`, {
      method: 'DELETE',
    }).catch(() => null);

    if (!res) {
      alert('Delete failed: backend not reachable.');
      return;
    }

    if (!res.ok) {
      const msg = await res.text().catch(() => 'Delete failed');
      alert(`Delete failed: ${msg}`);
      return;
    }

    router.replace('/vendor/products');
  }

  async function handleEdit() {
    if (!product) return;

    // Prefill the create/edit wizard with the current product.
    // We pass the product id, and ProductNewPage will load it and prefill local draft state.
    router.push(`/vendor/products/new?copy=${encodeURIComponent(product.id)}`);
  }


  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Vendor product</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Product details</h1>
            </div>
            <Link
              href="/vendor/products"
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200/50 bg-blue-600/20 px-5 py-3 text-sm font-semibold text-blue-100 hover:bg-blue-600/30"
            >
              Back to list
              <ArrowRight size={16} />
            </Link>
          </div>

          <section className="rounded-[32px] border border-blue-300/50 bg-blue-500/30 p-10 shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center gap-3 px-6 py-10 text-sm text-blue-100">
                <Loader2 className="animate-spin" size={18} />
                Syncing with the database...
              </div>
            ) : error ? (
              <div className="px-6 py-10 text-sm text-blue-100">{error}</div>
            ) : !product ? (
              <div className="px-6 py-10 text-sm text-blue-100">No product loaded.</div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="overflow-hidden rounded-[32px] border border-blue-200/40 bg-blue-600/20 p-4">
                    <div className="relative h-[320px] w-full overflow-hidden rounded-[24px] bg-blue-600/10">
                      {product.asset_name ? (
                        <ModelViewer modelUrl={`/models/${product.asset_name}`} />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-blue-100">No 3D asset yet.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">{product.category ?? 'Uncategorized'}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">{product.status ?? 'published'}</span>
                    {product.available3D ? (
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">3D Ready</span>
                    ) : (
                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100">Processing</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="rounded-[28px] border border-blue-200/40 bg-blue-600/20 p-6">
                    <h2 className="text-2xl font-semibold text-white">{product.name}</h2>
                    {product.description ? (
                      <p className="mt-3 text-sm leading-7 text-blue-100/90">{product.description}</p>
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-blue-100/90">No description.</p>
                    )}

                    <div className="mt-6 text-sm text-blue-100">
                      <p className="text-xs uppercase tracking-[0.22em] text-blue-200">Price</p>
                      <p className="mt-2 text-2xl font-semibold">{product.currency ?? 'FCFA'} {Number(product.price ?? 0).toLocaleString()}</p>
                    </div>

                    <div className="mt-8 grid gap-3">
                      <button
                        type="button"
                        onClick={() => void handleEdit()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
                      >
                        <Edit3 size={16} />
                        Edit / upload new version
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
                      >
                        <Delete size={16} />
                        Delete
                      </button>

                      <div className="text-xs leading-5 text-blue-100/70">
                        Note: delete/edit are placeholders until backend update/delete endpoints are added.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}

