'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { products } from '../../../lib/mockData';
import RequireAuth from '../../../components/RequireAuth';

export default function RecommendationsPage() {
  const featured = products.slice(0, 4);

  return (
    <RequireAuth role="customer">
      <div className="min-h-screen bg-transparent">
        <main className="max-w-7xl mx-auto px-6 py-14">
          {/* Hero Section */}
          <section className="mb-16 rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Personalized Profile
                </p>

                <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100">
                  Tailored product recommendations just for you
                </h1>

                <p className="max-w-2xl text-slate-600 dark:text-slate-400">
                  Your browsing history and AI preference model surface products that match your taste, from premium furniture to immersive 3D collections.
                </p>
              </div>

              <Link
                href="/products"
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3"
              >
                Browse Full Catalog
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>

          {/* Recommendations */}
          <section className="grid gap-6 lg:grid-cols-2">
            {featured.map((product) => (
              <article
                key={product.id}
                className="rounded-[32px] border border-slate-200/70 bg-white/95 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-2xl transition-transform hover:-translate-y-1 dark:border-slate-700/70 dark:bg-slate-950/80"
              >
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                      {product.category}
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold text-brand">{product.name}</h2>
                  </div>

                  <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-white">
                    {product.currency} {product.price.toLocaleString()}
                  </div>
                </div>

                <p className="mb-5 text-slate-600 dark:text-slate-400">{product.shortDescription}</p>

                <div className="mb-6 flex flex-wrap gap-3">
                  {product.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/product/${product.id}`}
                  className="inline-flex items-center gap-2 font-semibold text-[#0058a3] transition hover:opacity-80"
                >
                  View Product
                  <Sparkles size={18} />
                </Link>
              </article>
            ))}
          </section>

          {/* AI Recommendation Banner */}
          <section className="mt-16 rounded-[32px] bg-brand p-10 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold">AI Recommendations Improve Over Time</h2>

                <p className="mt-3 max-w-3xl text-blue-100">
                  Every interaction helps our recommendation engine understand your preferences better, delivering smarter and more personalized product suggestions each time you visit.
                </p>
              </div>

              <Link
                href="/products"
                className="btn-outline-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition hover:bg-slate-100"
              >
                Explore Products
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}

