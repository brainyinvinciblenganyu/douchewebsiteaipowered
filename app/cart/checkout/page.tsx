'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '../../../components/RequireAuth';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function CartCheckoutPage() {
  return (
    <RequireAuth>
      <CartCheckoutPageContent />
    </RequireAuth>
  );
}

function CartCheckoutPageContent() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('douche_cart');
    if (saved) {
      const parsed = JSON.parse(saved) as CartItem[];
      setCartItems(parsed);
    }
  }, []);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmit = () => {
    setSubmitted(true);
    window.localStorage.removeItem('douche_cart');
  };

  return (
    <div className="min-h-screen bg-transparent">
      <main className="max-w-6xl mx-auto px-6 py-16">
        <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Checkout request</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">Submit your purchase request</h1>
            </div>
            <div className="rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 dark:bg-slate-900 dark:text-slate-100">No payment required</div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              {cartItems.length === 0 ? (
                <div className="rounded-[32px] border border-slate-200/70 bg-slate-50 p-10 text-center dark:border-slate-700/70 dark:bg-slate-900/80">
                  <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Your cart is empty</h2>
                  <p className="mt-3 text-slate-600 dark:text-slate-400">Add products to your cart before submitting a request.</p>
                  <Link href="/products" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                    Browse products
                  </Link>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="rounded-[32px] border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-700/70 dark:bg-slate-950/80">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-950 dark:text-white">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">FCFA {item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <aside className="rounded-[32px] border border-slate-200/70 bg-slate-50 p-8 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Summary</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">FCFA {total.toLocaleString()}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 dark:bg-slate-950/90">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Submit a purchase request and your selected vendors will receive the order details for confirmation.</p>
                </div>
                <button
                  type="button"
                  disabled={cartItems.length === 0 || submitted}
                  onClick={handleSubmit}
                  className="w-full rounded-3xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitted ? 'Request Submitted' : 'Submit Purchase Request'}
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
