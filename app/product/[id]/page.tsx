'use client';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
// Navbar and Footer provided via app/layout.tsx
import { ArrowLeft, Heart, Star, ShoppingBag } from 'lucide-react';
import ModelViewer from '../../../components/ModelViewer';
import { trackEvent } from '../../../lib/track';
import { reviews } from '../../../lib/mockData';

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
  status?: string;
  created_at?: string;
};

function getModelUrl(product: Product | null): string {
  if (product?.asset_name) return `/models/${product.asset_name}`;
  return '/models/chair.glb';
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
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

        // backend returns { product } or a raw product object
        const p = (data && (data.product ?? data)) as Product;

        if (mounted) {
          setProduct(p);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Failed to load product');
          setProduct(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingHover, setRatingHover] = useState<number | null>(null);

  // Sync wishlist/rating status from localStorage on mount/product change
  useEffect(() => {
    if (!product) return;
    const wishlist = JSON.parse(localStorage.getItem('douche_wishlist') || '[]');
    setIsWishlisted(wishlist.includes(product.id));

    const ratings = JSON.parse(localStorage.getItem('douche_ratings') || '{}');
    if (ratings[product.id]) {
      setUserRating(ratings[product.id]);
    } else {
      setUserRating(null);
    }
  }, [product]);

  // Track product view interaction
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

  const handleRate = (stars: number) => {
    if (!product) return;
    setUserRating(stars);
    const ratings = JSON.parse(localStorage.getItem('douche_ratings') || '{}');
    ratings[product.id] = stars;
    localStorage.setItem('douche_ratings', JSON.stringify(ratings));

    trackEvent({
      eventType: 'rate',
      productId: product.id,
      rating: stars,
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
    setTimeout(() => setAdded(false), 2000);
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

  const productReviews = reviews.filter((review) => String(review.productId) === String(product.id));
  const tags = Array.isArray(product.tags) ? product.tags : [];

  return (
    <div className="bg-slate-50 text-slate-950">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-sky-50" />
      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className="mt-8 grid gap-10 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-2xl shadow-slate-900/5 backdrop-blur-2xl">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                <div className="h-[520px] w-full relative">
                  <ModelViewer modelUrl={modelUrl} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#0058a3]">Product details</p>
                  <h1 className="mt-4 text-4xl font-semibold text-slate-950">{product.name}</h1>
                  {product.category && (
                    <p className="mt-3 text-lg text-slate-600">{product.category}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {product.category && (
                    <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">{product.category}</span>
                  )}
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">{tag}</span>
                  ))}
                  {product.status && (
                    <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 capitalize">{product.status}</span>
                  )}
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-3xl font-semibold text-slate-950">
                      {product.currency} {Number(product.price ?? 0).toLocaleString()}
                    </p>
                    <span className="rounded-3xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">Available</span>
                  </div>
                  <p className="mt-3 text-slate-600">Experience immersive 3D preview and add this item to your cart.</p>
                </div>

                <div className="rounded-3xl border border-slate-200/60 bg-slate-50/50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 mb-3">Rate this product</p>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRate(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(null)}
                        className="transition hover:scale-115 text-amber-400 focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={
                            star <= (ratingHover ?? userRating ?? 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    ))}
                    {userRating && (
                      <span className="ml-4 text-sm font-semibold text-emerald-600">
                        ({userRating}★ rated)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
                  <button
                    onClick={addToCart}
                    className={`flex items-center justify-center gap-2 rounded-3xl px-6 py-4 text-sm font-semibold text-white transition ${
                      added ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-950 hover:bg-slate-800'
                    }`}
                  >
                    <ShoppingBag size={18} />
                    {added ? 'Added to Cart' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className={`flex items-center justify-center rounded-3xl border p-4 transition ${
                      isWishlisted
                        ? 'border-rose-200 bg-rose-50 text-rose-500'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={20} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
                  </button>
                  <Link href="/cart" className="rounded-3xl border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 inline-flex items-center justify-center">
                    Review in cart
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-950">Description</h2>
                <p className="mt-4 text-slate-600">{product.description || 'No description provided for this product.'}</p>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-950">Details</h2>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Category</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">{product.category || '—'}</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Price</p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {product.currency} {Number(product.price ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Model file</p>
                    <p className="mt-2 text-base font-semibold text-slate-950 break-all">{product.asset_name || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-[32px] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-semibold text-slate-950">Customer reviews</h2>
              {productReviews.length === 0 ? (
                <p className="mt-4 text-slate-600">No reviews yet for this product.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {productReviews.map((review) => (
                    <div key={review.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="font-semibold text-slate-950">{review.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{review.body}</p>
                      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                        <span>{review.author}</span>
                        <span>{review.rating} ★</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
