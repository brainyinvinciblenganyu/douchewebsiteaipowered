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
  stock_quantity?: number;
  asset_name?: string | null;
  asset_type?: string | null;
  asset_file?: string | null;
  asset_data?: string | null;
  image_data?: string | null;
  available3D?: boolean;
  status?: string;
  created_at?: string;
};

const MAX_IMAGE_BYTES = 2_000_000;

export default function ProductEditClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useBackendAuth();

  const productId = useMemo(() => String(params?.id ?? ''), [params]);

  const [product, setProduct] = useState<ProductCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
          stock_quantity: Number((found as any).stock_quantity ?? 0),
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

  async function handleImageFile(file: File) {
    if (!product) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large. Please choose a photo under ~1.5MB.');
      return;
    }

    setImageError(null);
    setSavingImage(true);

    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/products?product_id=${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: dataUri }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setImageError(data?.error || 'Failed to save image');
        return;
      }

      setProduct((prev) => (prev ? { ...prev, image_data: dataUri } : prev));
    } catch {
      setImageError('Unable to reach the server');
    } finally {
      setSavingImage(false);
    }
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

                  <div className="mt-6 rounded-[28px] border border-blue-200/40 bg-blue-600/20 p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Static image</h3>
                    <p className="mt-2 text-xs text-blue-100/80">
                      Optionally attach a plain 2D photo alongside your 3D model — useful as a quick thumbnail.
                    </p>

                    {product.image_data && (
                      <div className="mt-4 h-40 w-40 overflow-hidden rounded-2xl border border-blue-200/40 bg-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.image_data} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    )}

                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">
                      {savingImage ? <Loader2 className="animate-spin" size={16} /> : null}
                      {savingImage ? 'Saving...' : product.image_data ? 'Replace image' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={savingImage}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleImageFile(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {imageError && <p className="mt-2 text-xs text-red-200">{imageError}</p>}
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

                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-blue-100">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-blue-200">Price</p>
                        <p className="mt-2 text-2xl font-semibold">{product.currency ?? 'FCFA'} {Number(product.price ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-blue-200">Stock</p>
                        <p className="mt-2 text-2xl font-semibold">{Number(product.stock_quantity ?? 0)}</p>
                      </div>
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

