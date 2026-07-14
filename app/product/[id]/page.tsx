'use client';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import ModelViewer from '../../../components/ModelViewer';
import ProductReviews, { StarRow } from '../../../components/ProductReviews';
import RequireAuth from '../../../components/RequireAuth';
import { trackEvent } from '../../../lib/track';

type Product = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  price?: number;
  currency?: string;
  vendor_user_id?: string | null;
  asset_name?: string | null;
  asset_type?: string | null;
  asset_size?: number | null;
  asset_file?: any;
  status?: string;
  created_at?: string;
};

type RatingSummary = { average: number; count: number };

function getModelUrl(product: Product | null): string {
  if (product?.asset_name) return `/models/${product.asset_name}`;
  return '/models/chair.glb';
}

export default function ProductPage() {
  return (
    <RequireAuth>
      <ProductPageContent />
    </RequireAuth>
  );
}

function ProductPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const [userRole, setUserRole] = useState<'customer' | 'vendor' | null>(null);
  const [productsGrid, setProductsGrid] = useState<Product[]>([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({ average: 0, count: 0 });

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        const role = (data?.user?.role as string | undefined) ?? null;
        if (!mounted) return;
        if (role === 'customer' || role === 'vendor') setUserRole(role);
        else setUserRole(null);
      } catch {
        if (!mounted) return;
        setUserRole(null);
      }
    }

    void loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      setLoading(true);
      setError(null);

      if (!id) {
        if (mounted) {
          setProduct(null);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/products/${encodeURIComponent(String(id))}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();

        const p = (data && (data.product ?? data)) as Product;
        if (mounted) setProduct(p);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load product');
          setProduct(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    async function loadGridForCustomer() {
      if (userRole !== 'customer') return;

      setGridLoading(true);
      try {
        const res = await fetch('/api/products', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));

        const list = Array.isArray(data?.products) ? data.products : [];
        const normalized: Product[] = list.map((p: Record<string, unknown>) => ({
          id: String(p.id ?? ''),
          name: String(p.name ?? 'Untitled product'),
          description: (p.description as string | null | undefined) ?? null,
          category: typeof p.category === 'string' ? p.category : (p.category as any) ?? null,
          tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
          price: Number(p.price ?? 0),
          currency: typeof p.currency === 'string' ? p.currency : 'FCFA',
          vendor_user_id: (p.vendor_user_id as string | null | undefined) ?? null,
          asset_name:
            typeof p.asset_name === 'string'
              ? p.asset_name
              : typeof p.model === 'string'
                ? p.model
                : (p.asset_name as any) ?? null,
          asset_type: (p.asset_type as string | null | undefined) ?? null,
          asset_size: (typeof p.asset_size === 'number' ? p.asset_size : null) as any,
          asset_file: p.asset_file as any,
          status: (p.status as string | null | undefined) ?? undefined,
          created_at: (p.created_at as string | undefined) ?? undefined,
        }));

        if (mounted) setProductsGrid(normalized.filter((p) => p.id && p.id !== String(id)));
      } catch {
        if (mounted) setProductsGrid([]);
      } finally {
        if (mounted) setGridLoading(false);
      }
    }

    void loadGridForCustomer();
    return () => {
      mounted = false;
    };
  }, [userRole, id]);

  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!product) return;
    const wishlist: string[] = JSON.parse(localStorage.getItem('douche_wishlist') || '[]');
    setIsWishlisted(wishlist.includes(product.id));
  }, [product]);

  useEffect(() => {
    if (product) {
      trackEvent({
        eventType: 'view',
        productId: product.id,
        category: product.category,
        brand: product.vendor_user_id,
      });
    }
  }, [product]);

  const modelUrl = useMemo(() => getModelUrl(product), [product]);

  const toggleWishlist = () => {
    if (!product) return;
    const wishlist: string[] = JSON.parse(localStorage.getItem('douche_wishlist') || '[]');

    let updated: string[];
    let type: 'wishlist_add' | 'wishlist_remove';

    if (wishlist.includes(product.id)) {
      updated = wishlist.filter((wId) => wId !== product.id);
      type = 'wishlist_remove';
      setIsWishlisted(false);
    } else {
      updated = [...wishlist, product.id];
      type = 'wishlist_add';
      setIsWishlisted(true);
    }

    localStorage.setItem('douche_wishlist', JSON.stringify(updated));
    trackEvent({
      eventType: type,
      productId: product.id,
      category: product.category,
      brand: product.vendor_user_id,
    });
  };

  const addToCart = () => {
    if (!product) return;

    const savedCart = localStorage.getItem('douche_cart');
    const cartItems: { id: string; name: string; price: number; model: string; quantity: number }[] =
      savedCart ? JSON.parse(savedCart) : [];

    const existingItemIndex = cartItems.findIndex((item) => item.id === product.id);

    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price ?? 0,
        model: product.asset_name || 'chair.glb',
        quantity: 1,
      });
    }

    localStorage.setItem('douche_cart', JSON.stringify(cartItems));

    trackEvent({
      eventType: 'cart_add',
      productId: product.id,
      category: product.category,
      brand: product.vendor_user_id,
    });

    setAdded(true);
    router.push('/cart');
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 animate-pulse font-semibold">Loading product...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
        <h1 className="text-3xl font-bold text-gray-700">{error ?? 'Product not found'}</h1>
        <Link href="/products">
          <button className="bg-[#0058a3] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
            Back to Products
          </button>
        </Link>
      </main>
    );
  }

  const tags = Array.isArray(product.tags) ? product.tags : [];

  return (
    <div className="bg-slate-50 text-slate-950">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-sky-50" />
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/products" className="transition hover:text-[#0058a3]">
            Products
          </Link>
          {product.category && (
            <>
              <ChevronRight size={14} />
              <Link
                href={`/search?category=${encodeURIComponent(product.category)}`}
                className="transition hover:text-[#0058a3]"
              >
                {product.category}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="truncate text-slate-900">{product.name}</span>
        </nav>

        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>

        <div className="mt-6 grid gap-10 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-blue-400/30 bg-blue-600 p-8 shadow-2xl shadow-blue-900/20">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] overflow-hidden border border-blue-400/30 bg-white shadow-sm">
                <div className="h-[520px] w-full relative">
                  <ModelViewer modelUrl={modelUrl} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#ffdb00]">Product details</p>
                  <h1 className="mt-4 text-4xl font-bold text-white">{product.name}</h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {ratingSummary.count > 0 ? (
                      <a href="#reviews" className="flex items-center gap-2 transition hover:opacity-80">
                        <StarRow value={ratingSummary.average} size={17} />
                        <span className="text-sm font-bold text-white">
                          {ratingSummary.average.toFixed(1)}
                        </span>
                        <span className="text-sm font-semibold text-blue-100">
                          ({ratingSummary.count} {ratingSummary.count === 1 ? 'review' : 'reviews'})
                        </span>
                      </a>
                    ) : (
                      <a href="#reviews" className="text-sm font-semibold text-blue-100 transition hover:text-[#ffdb00]">
                        No reviews yet — be the first
                      </a>
                    )}
                    {product.category && (
                      <>
                        <span className="text-blue-300">•</span>
                        <span className="text-sm font-semibold text-blue-100">{product.category}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-3xl bg-blue-500/40 px-4 py-2 text-sm font-bold text-white"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.status && (
                    <span className="rounded-3xl bg-blue-500/40 px-4 py-2 text-sm font-bold text-white capitalize">
                      {product.status}
                    </span>
                  )}
                </div>

                <div className="rounded-[32px] border border-blue-400/30 bg-blue-500/40 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-3xl font-bold text-white">
                      {product.currency} {Number(product.price ?? 0).toLocaleString()}
                    </p>
                    <span className="rounded-3xl bg-[#ffdb00] px-4 py-2 text-sm font-bold text-blue-950">
                      Available
                    </span>
                  </div>
                  <p className="mt-3 font-medium text-blue-100">
                    Experience immersive 3D preview and add this item to your cart.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
                  <button
                    onClick={addToCart}
                    className={`flex items-center justify-center gap-2 rounded-3xl px-6 py-4 text-sm font-bold transition ${
                      added ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-[#ffdb00] text-blue-950 hover:bg-[#e6c600]'
                    }`}
                  >
                    <ShoppingBag size={18} />
                    {added ? 'Added to Cart' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className={`flex items-center justify-center rounded-3xl border p-4 transition ${
                      isWishlisted
                        ? 'border-rose-300 bg-rose-500/20 text-rose-200'
                        : 'border-blue-400/30 bg-blue-500/30 text-blue-100 hover:bg-blue-500/50'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={20} className={isWishlisted ? 'fill-rose-300 text-rose-300' : ''} />
                  </button>
                  <Link
                    href="/cart"
                    className="rounded-3xl border border-blue-400/30 bg-blue-500/30 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-500/50 inline-flex items-center justify-center"
                  >
                    Review in cart
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-blue-400/30 pt-6">
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <ShieldCheck size={18} className="text-[#ffdb00]" />
                    <p className="text-xs font-bold text-blue-100">Secure checkout</p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <Truck size={18} className="text-[#ffdb00]" />
                    <p className="text-xs font-bold text-blue-100">Fast delivery</p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <RotateCcw size={18} className="text-[#ffdb00]" />
                    <p className="text-xs font-bold text-blue-100">Easy returns</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[32px] border border-blue-400/30 bg-blue-500/40 p-6">
                <h2 className="text-xl font-bold text-white">Description</h2>
                <p className="mt-4 leading-relaxed font-medium text-blue-100">
                  {product.description || 'No description provided for this product.'}
                </p>
              </div>

              <div className="rounded-[32px] border border-blue-400/30 bg-blue-500/40 p-6">
                <h2 className="text-xl font-bold text-white">Details</h2>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-blue-200">Category</p>
                    <p className="mt-2 text-base font-bold text-white">{product.category || '—'}</p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-blue-200">Price</p>
                    <p className="mt-2 text-base font-bold text-white">
                      {product.currency} {Number(product.price ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-blue-200">Model file</p>
                    <p className="mt-2 text-base font-bold text-white break-all">
                      {product.asset_name || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div id="reviews" className="mt-10 scroll-mt-24">
              <ProductReviews
                productId={product.id}
                isLoggedIn={Boolean(userRole)}
                onSummaryChange={setRatingSummary}
              />
            </div>
          </article>

          {userRole === 'customer' && (
            <section className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-2xl shadow-slate-900/5">
              <h2 className="text-xl font-semibold text-slate-950 mb-4">All products</h2>
              {gridLoading ? (
                <p className="text-slate-600">Loading products...</p>
              ) : productsGrid.length === 0 ? (
                <p className="text-slate-600">No products available yet.</p>
              ) : (
                <div className="grid gap-4">
                  {productsGrid.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-[#0058a3]/30 hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                          <ModelViewer modelUrl={p.asset_name ? `/models/${p.asset_name}` : '/models/chair.glb'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-1">{p.category || 'Product'}</p>
                          <p className="text-sm font-semibold text-[#0058a3] mt-2">
                            {p.currency} {Number(p.price ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {userRole === 'vendor' && (
            <aside className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-2xl shadow-slate-900/5">
              <p className="text-slate-600">Vendor view</p>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
