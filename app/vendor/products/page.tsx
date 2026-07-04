'use client';

import Link from 'next/link';
import RequireAuth from '../../../components/RequireAuth';
import { products } from '../../../lib/mockData';
import { getVendorDrafts } from '../../../lib/vendorDrafts';
import { Plus, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type DraftRow = {
  id: string;
  name: string;
  category: string;
  available3D: boolean;
  price: number;
  currency: string;
  isDraft: true;
};

type ProductRow = typeof products[number] & { isDraft?: false };

export default function VendorProductsPage() {
  const [drafts, setDrafts] = useState<DraftRow[]>([]);

  useEffect(() => {
    const allDrafts = getVendorDrafts();
    const publishedDrafts: DraftRow[] = allDrafts
      .filter((d) => d.isPublished)
      .map((d) => ({
        id: d.id,
        name: d.metadata.name,
        category: d.metadata.category,
        available3D: d.previewVersions.length > 0,
        price: d.pricing.price,
        currency: d.pricing.currency,
        isDraft: true as const,
      }));
    setDrafts(publishedDrafts);
  }, []);

  const allProducts: Array<ProductRow | DraftRow> = [...products, ...drafts];

  return (
    <RequireAuth role="vendor">
      <div className="min-h-screen bg-transparent">
        <main className="max-w-7xl mx-auto px-6 py-16">
        <section className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Product management</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Manage your product catalog and 3D uploads.</h1>
            </div>
            <Link href="/vendor/products/new" className="inline-flex items-center gap-2 rounded-2xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900">
              <Plus size={16} />
              Add new product
            </Link>
          </div>

          <div className="mt-10 overflow-hidden rounded-[32px] border border-blue-300/50 bg-blue-500/30 shadow-sm">
            <table className="min-w-full divide-y divide-blue-200/50">
              <thead className="bg-blue-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">3D Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Price</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200/50 bg-blue-600">
                {allProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-500/50">
                    <td className="px-6 py-5 text-sm font-semibold text-white">{item.name}</td>
                    <td className="px-6 py-5 text-sm text-blue-200">{item.category}</td>
                    <td className="px-6 py-5 text-sm text-blue-200">{item.available3D ? 'Ready' : 'Processing'}</td>
                    <td className="px-6 py-5 text-sm font-semibold text-white">{item.currency} {item.price.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right text-sm text-blue-200">
                      <Link href={`/vendor/products/${item.id}/edit`} className="inline-flex items-center gap-2 text-blue-100 hover:text-white">
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
