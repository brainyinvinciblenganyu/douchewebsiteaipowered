'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { products } from '../../lib/mockData';

export default function ProductsPage() {
  const list = useMemo(() => products, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-slate-950">Products</h1>
        <p className="mt-3 text-slate-600">Browse premium items with 3D previews.</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
            >
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src={p.images?.[0] || '/models/.keep'}
                  alt={p.name}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="mt-4">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{p.category}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{p.name}</h2>
                <p className="mt-2 text-sm font-semibold text-sky-700">FCFA {p.price.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

