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
          <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
            <Link href="/vendor/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Inventory</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Keep stock levels visible and actionable.</h1>
                <p className="mt-4 max-w-2xl text-blue-100">This mock inventory view helps vendors understand what needs replenishment, what is healthy, and what is currently unavailable.</p>
              </div>
              <div className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5">
                <div className="flex items-center gap-3 text-white">
                  <Boxes size={18} />
                  <span className="font-semibold">Live stock snapshot</span>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              {inventory.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-4 rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                  <div>
                    <p className="font-semibold text-white">{item.productName}</p>
                    <p className="text-sm text-blue-200">{item.status}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-100">{item.stock} in stock</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}