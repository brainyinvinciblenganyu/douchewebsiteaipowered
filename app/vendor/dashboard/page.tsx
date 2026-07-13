'use client';

import Link from 'next/link';
import RequireAuth from '../../../components/RequireAuth';
import VendorNav from '../../../components/VendorNav';
import { aiStatus, purchaseRequests, inventory } from '../../../lib/mockData';
import { ArrowRight, Layers, Sparkles, Truck, Zap } from 'lucide-react';

const stats = [
  { label: 'Products Uploaded', value: 34, icon: Layers },
  { label: 'Processing', value: 5, icon: Zap },
  { label: '3D Models Ready', value: 27, icon: Sparkles },
  { label: 'Purchase Requests', value: 18, icon: Truck },
];

export default function VendorDashboardPage() {
  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="max-w-7xl mx-auto px-6 py-16">
        <VendorNav />
        <section className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Vendor dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Sell smarter with AI 3D product workflows.</h1>
              <p className="mt-4 text-blue-100 max-w-2xl">Track product generation, purchase requests, inventory, and analytics from one polished workspace.</p>
            </div>
            <Link href="/vendor/products" className="inline-flex items-center gap-2 rounded-2xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900">
              View your products
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[32px] border border-blue-300/50 bg-blue-500/30 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-blue-700">
                  <stat.icon size={20} />
                </div>
                <p className="mt-5 text-3xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-6 shadow-xl shadow-slate-900/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-blue-200">AI generation overview</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Latest processing requests</h2>
                </div>
                <Link href="/vendor/ai-generation" className="text-sm font-semibold text-blue-100">View all</Link>
              </div>
              <div className="mt-8 space-y-4">
                {aiStatus.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{item.productName}</p>
                        <p className="mt-1 text-sm text-blue-200">{item.stage}</p>
                      </div>
                      <p className="text-sm font-semibold text-blue-100">{item.eta}</p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-300/50">
                      <div className="h-full rounded-full bg-[#ffdb00]" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-6 shadow-xl shadow-slate-900/5">
              <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Recent purchase requests</p>
              <div className="mt-6 space-y-4">
                {purchaseRequests.slice(0, 4).map((request) => (
                  <div key={request.id} className="rounded-3xl border border-blue-300/50 bg-blue-500/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{request.productName}</p>
                        <p className="text-sm text-blue-200">{request.vendorName}</p>
                      </div>
                      <span className="rounded-full bg-emerald-300/50 px-3 py-1 text-xs font-semibold text-white">{request.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-blue-200">Qty {request.quantity} · {request.requestedAt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-[32px] border border-blue-200/50 bg-blue-600 p-6 shadow-xl shadow-slate-900/5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Inventory snapshot</p>
              <Link href="/vendor/inventory" className="text-sm font-semibold text-blue-100">See all</Link>
            </div>
            <div className="mt-8 space-y-4">
              {inventory.slice(0, 4).map((item) => (
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
        </section>
        </main>
      </div>
    </RequireAuth>
  );
}