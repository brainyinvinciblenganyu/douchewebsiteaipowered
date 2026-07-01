'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import RequireAuth from '../../../../../components/RequireAuth';
import { products } from '../../../../../lib/mockData';
import { ArrowLeft, PencilLine } from 'lucide-react';

export default function EditVendorProductPage({ params }: { params: { id: string } }) {
  const product = products.find((item) => item.id === Number(params.id));

  if (!product) {
    notFound();
  }

  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-[32px] border border-slate-200/70 bg-white/95 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
            <Link href="/vendor/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <ArrowLeft size={16} />
              Back to catalog
            </Link>
            <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Edit product</p>
                <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">{product.name}</h1>
                <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">This mock editor shows how vendor actions would look for updating product details, pricing, and 3D availability.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/80">
                <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                  <PencilLine size={18} />
                  <span className="font-semibold">{product.available3D ? '3D preview ready' : '3D preview pending'}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
