'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
// Navbar and Footer provided via app/layout.tsx
import Link from 'next/link';
import { Search } from 'lucide-react';
import { categories, products } from '../../../lib/mockData';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categoryOptions = useMemo(
    () => ['All', ...Array.from(new Set(categories.map((category) => category.name)))],
    [],
  );

const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          product.name.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesQuery && matchesCategory;
      }),
    [searchQuery, selectedCategory],
  );

  return (
    <div className="bg-[#f4f7fb] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-100 via-white to-sky-50" />
      <main className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <section className="mb-12 rounded-[32px] border border-slate-200/70 bg-white/95 p-10 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/90">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#0058a3]">Curated product discovery</p>
              <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Browse premium products with intelligent search and 3D previews.</h1>
              <p className="mt-4 text-slate-600 dark:text-slate-300 leading-7">Explore our catalog of AI-ready listings, filter with smart search, and open any product to see its immersive 3D preview.</p>
            </div>
            <div className="rounded-[28px] bg-slate-100 p-6 shadow-xl shadow-slate-900/5 dark:bg-slate-900/90">
              <label className="sr-only" htmlFor="product-search">
                Search products
              </label>
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                <Search size={20} className="text-slate-500 dark:text-slate-400" />
                <input
                  id="product-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, category, or tag"
                  className="w-full bg-transparent text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="category-filter">
                  Filter by category
                </label>
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {filteredProducts.length === 0 ? (
          <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-16 text-center shadow-xl shadow-slate-900/5 dark:border-slate-700/70 dark:bg-slate-950/80">
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">No results found</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Try a broader search term like &ldquo;Furniture&rdquo;, &ldquo;Fashion&rdquo;, or &ldquo;3D&rdquo;.</p>
          </section>
        ) : (
          <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group">
                <div className="flex h-full flex-col overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/95 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/70 dark:bg-slate-950/80">
                  <div className="relative h-72 overflow-hidden bg-slate-100">
                    <Image
                      src={product.images[0]}
                      alt={`Image of ${product.name}`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />

                    <span className="absolute left-4 top-4 rounded-full bg-[#0058a3] px-3 py-1 text-xs font-semibold uppercase text-white shadow-sm">3D ready</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{product.category}</p>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{product.name}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{product.shortDescription}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-semibold text-slate-950 dark:text-white">
                        {product.currency} {product.price.toLocaleString()}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{product.rating} ★</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

