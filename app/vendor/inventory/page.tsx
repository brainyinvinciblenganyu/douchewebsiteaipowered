'use client';

import Link from 'next/link';
import RequireAuth from '../../../components/RequireAuth';
import { inventory } from '../../../lib/mockData';
import { ArrowLeft, Boxes } from 'lucide-react';

export default function VendorInventoryPage() {
  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-[32px] border border-slate-200/70 bg-white/95 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
            <Link href="/vendor/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Inventory</p>
                <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">Keep stock levels visible and actionable.</h1>
                <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">This mock inventory view helps vendors understand what needs replenishment, what is healthy, and what is currently unavailable.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                  <Boxes size={18} />
                  <span className="font-semibold">Live stock snapshot</span>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              {inventory.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/70 dark:bg-slate-900/80">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{item.productName}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.status}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.stock} in stock</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
