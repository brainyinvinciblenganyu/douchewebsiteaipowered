'use client';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
// Navbar and Footer provided via app/layout.tsx
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { products, reviews } from '../../../lib/mockData';

export default function ProductPage() {
  const { id } = useParams();
  const product = useMemo(
    () => (id ? products.find((p) => p.id === Number(id)) || null : null),
    [id],
  );

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
                  <Image src={product.images?.[0] || '/models/.keep'} alt={product.name} fill className="object-cover" />
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={addToCart}
                    className="rounded-3xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Add to Cart
                  </button>
                  <Link href="/cart" className="rounded-3xl border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900/80">
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
