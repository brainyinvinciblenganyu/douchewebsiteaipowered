'use client';

import Link from 'next/link';
import RequireAuth from '../../../components/RequireAuth';
import { products } from '../../../lib/mockData';
import { Plus, ArrowRight } from 'lucide-react';

export default function VendorProductsPage() {
  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Product management</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">Manage your product catalog and 3D uploads.</h1>
            </div>
            <Link href="/vendor/products/new" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              <Plus size={16} />
              Add new product
            </Link>
          </div>

          <div className="mt-10 overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-50 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/80">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">3D Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Price</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-950">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/80">
                    <td className="px-6 py-5 text-sm font-semibold text-slate-950 dark:text-white">{product.name}</td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{product.category}</td>
                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">{product.available3D ? 'Ready' : 'Processing'}</td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-950 dark:text-white">{product.currency} {product.price.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right text-sm text-slate-600 dark:text-slate-400">
                      <Link href={`/vendor/products/${product.id}/edit`} className="inline-flex items-center gap-2 text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300">
                        Manage
                        <ArrowRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </main>
      </div>
    </RequireAuth>
  );
}
