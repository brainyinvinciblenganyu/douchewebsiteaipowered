'use client';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
// Navbar and Footer provided via app/layout.tsx
import { ArrowLeft, Heart, Star } from 'lucide-react';
import { products, reviews } from '../../../lib/mockData';
import ModelViewer from '../../../components/ModelViewer';
import { trackEvent } from '../../../lib/track';

export default function ProductPage() {
  const { id } = useParams();
  const product = useMemo(
    () => (id ? products.find((p) => p.id === Number(id)) || null : null),
    [id],
  );

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [ratingHover, setRatingHover] = useState<number | null>(null);

  // Sync wishlist status from localStorage on mount/product change
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
        brand: product.vendorName,
      });
    }
  }, [product]);

  const toggleWishlist = () => {
    if (!product) return;
    const wishlist: number[] = JSON.parse(localStorage.getItem('douche_wishlist') || '[]');
    let updated: number[];
    let type: 'wishlist_add' | 'wishlist_remove';

    if (wishlist.includes(product.id)) {
      updated = wishlist.filter((id) => id !== product.id);
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
      brand: product.vendorName,
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
      brand: product.vendorName,
    });
  };

  const addToCart = () => {
    if (!product) return;

    const savedCart = localStorage.getItem('douche_cart');
    const cartItems: { id: number; name: string; price: number; model: string; quantity: number }[] =
      savedCart ? JSON.parse(savedCart) : [];

    const existingItemIndex = cartItems.findIndex((item) => item.id === product.id);

    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity += 1;
    } else {
      cartItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        model: product.model,
        quantity: 1,
      });
    }

    localStorage.setItem('douche_cart', JSON.stringify(cartItems));

    // Track cart addition interaction
    trackEvent({
      eventType: 'cart_add',
      productId: product.id,
      category: product.category,
      brand: product.vendorName,
    });

    alert('Product added to cart successfully!');
  };

  if (!product) {
    return (
      <>
        <main className="p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-700 mb-4">Product not found</h1>
          <Link href="/products">
            <button className="bg-[#0058a3] text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition">
              Back to Products
            </button>
          </Link>
        </main>
      </>
    );
  }

  const productReviews = reviews.filter((review) => review.productId === product?.id);

  return (
    <div className="bg-slate-50 text-slate-950">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-sky-50" />
      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-100"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className="mt-8 grid gap-10 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-2xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/90">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] overflow-hidden border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="h-[520px] w-full relative">
                  <ModelViewer modelUrl={`/models/${product.model}`} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#0058a3]">Product details</p>
                  <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">{product.name}</h1>
                  <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{product.shortDescription}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-200">{product.category}</span>
                  <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-200">{product.vendorName}</span>
                  <span className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-200">{product.rating} ★</span>
                </div>

                <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-3xl font-semibold text-slate-950 dark:text-white">{product.currency} {product.price.toLocaleString()}</p>
                    <span className="rounded-3xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">Available</span>
                  </div>
                  <p className="mt-3 text-slate-600 dark:text-slate-400">Experience immersive 3D preview and request this item directly through our purchase request system.</p>
                </div>

                {/* Interactive Rating Component */}
                <div className="rounded-3xl border border-slate-200/60 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
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
                              : 'text-slate-300 dark:text-slate-600'
                          }
                        />
                      </button>
                    ))}
                    {userRating && (
                      <span className="ml-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        ({userRating}★ rated)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
                  <button
                    onClick={addToCart}
                    className="rounded-3xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className={`flex items-center justify-center rounded-3xl border p-4 transition ${
                      isWishlisted
                        ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/40 dark:bg-rose-950/30'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart size={20} className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''} />
                  </button>
                  <Link href="/cart" className="rounded-3xl border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900/80 inline-flex items-center justify-center">
                    Review in cart
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Description</h2>
                <p className="mt-4 text-slate-600 dark:text-slate-400">{product.description}</p>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Specifications</h2>
                <div className="mt-4 grid gap-4">
                  {Object.entries(product.specs).map(([label, value]) => (
                    <div key={label} className="rounded-3xl bg-white p-4 dark:bg-slate-950/90">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
                      <p className="mt-2 text-base font-semibold text-slate-950 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-[32px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Customer reviews</h2>
              <div className="mt-6 space-y-4">
                {productReviews.map((review) => (
                  <div key={review.id} className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950/90">
                    <p className="font-semibold text-slate-950 dark:text-white">{review.title}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{review.body}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>{review.author}</span>
                      <span>{review.rating} ★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </main>
      
    </div>
  );
}
