'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { categories, products } from '../../lib/mockData';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categoryOptions = useMemo(
    () => ['All', ...Array.from(new Set(categories.map((category) => category.name)))],
    [],
  );

  const results = useMemo(() => {
    const lower = query.toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(lower) ||
        product.category.toLowerCase().includes(lower) ||
        product.tags.some((tag) => tag.toLowerCase().includes(lower));
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, selectedCategory]);

  return (
    <div className="min-h-screen bg-transparent">
      <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Discover products</p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Search the catalog with intelligent filters.</h1>
            <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_220px]">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <Search size={20} className="text-slate-500 dark:text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for products, categories, or 3D models"
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#0058a3] focus:ring-2 focus:ring-[#0058a3]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-6">
          {query || selectedCategory !== 'All' ? (
            results.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {results.map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="group overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/95 p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-950/80">
                    <div className="mb-4 text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{product.category}</div>
                    <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{product.name}</h2>
                    <p className="mt-3 text-slate-600 dark:text-slate-400">{product.shortDescription}</p>
                    <div className="mt-6 flex items-center justify-between text-slate-900 dark:text-slate-100">
                      <span className="font-semibold">{product.currency} {product.price.toLocaleString()}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{product.rating} ?</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border border-slate-200/70 bg-white/95 p-12 text-center shadow-xl shadow-slate-900/5 dark:border-slate-700/70 dark:bg-slate-950/80">
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">No results matched your search.</h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400">Try a different keyword or category to find what you're looking for.</p>
              </div>
            )
          ) : (
            <div className="rounded-[32px] border border-slate-200/70 bg-white/95 p-12 text-center shadow-xl shadow-slate-900/5 dark:border-slate-700/70 dark:bg-slate-950/80">
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Start typing a product name or choose a category.</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">Search by product name, category, or AI recommendation tags.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
