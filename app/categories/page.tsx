'use client';

import Link from 'next/link';
import { categories } from '../../lib/mockData';
import { ArrowRight } from 'lucide-react';
import PageHero from '../../components/PageHero';

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <main className="max-w-7xl mx-auto px-6 py-16">
        <PageHero className="mb-16">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Browse categories</p>
            <h1 className="text-4xl font-semibold text-white">Explore curated category collections</h1>
            <p className="text-sky-100">Find premium collections, AI-driven product groupings, and categories designed to match your interests.</p>
          </div>
        </PageHero>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="group overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-950/95 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/70 dark:bg-slate-950/90">
              <div className="relative h-64 overflow-hidden">
                <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                <div className="absolute left-6 bottom-6 text-white">
                  <p className="text-sm uppercase tracking-[0.3em] opacity-85">{category.name}</p>
                  <h2 className="mt-3 text-2xl font-semibold">{category.description}</h2>
                </div>
              </div>
              <div className="space-y-4 p-6 bg-white dark:bg-slate-950">
                <p className="text-slate-600 dark:text-slate-400">{category.name} collections curated for modern living and immersive shopping experiences.</p>
                <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300">
                  Browse products
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
