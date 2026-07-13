'use client';

import Link from 'next/link';
import RequireAuth from '../../../components/RequireAuth';
import { aiStatus } from '../../../lib/mockData';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function VendorAIGenerationPage() {
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
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">AI generation</p>
                <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">Monitor your 3D generation pipeline.</h1>
                <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">Every request is staged with realistic progress states so vendors can understand what is rendering, ready, or needs attention.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                  <Sparkles size={18} />
                  <span className="font-semibold">3D generation is live</span>
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              {aiStatus.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">{item.productName}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.stage}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.eta}</p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-[#0058a3]" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
