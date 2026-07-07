'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ModelViewer from '../../components/ModelViewer';

type ProductItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string | null;
  model?: string;
  asset_name?: string | null;
  asset_type?: string | null;
  asset_data?: string | null;
  asset_file?: string | null;
};

export default function ProductsPage() {
  const [list, setList] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        const productsFromApi = Array.isArray(data.products) ? data.products : [];
        setList(
          productsFromApi.map((product: Record<string, unknown>) => ({
            id: String(product.id ?? ''),
            name: String(product.name ?? 'Untitled product'),
            price: Number(product.price ?? 0),
            currency: String(product.currency ?? 'FCFA'),
            category: typeof product.category === 'string' ? product.category : null,
            model: typeof product.model === 'string' ? product.model : (typeof product.asset_name === 'string' ? product.asset_name : undefined),
            asset_name: typeof product.asset_name === 'string' ? product.asset_name : (typeof product.model === 'string' ? product.model : null),
            asset_type: typeof product.asset_type === 'string' ? product.asset_type : null,
            asset_data: typeof product.asset_data === 'string' ? product.asset_data : null,
            asset_file: typeof product.asset_file === 'string' ? product.asset_file : null,
          })),
        );
      } catch (error) {
        console.error('Failed to load products from backend', error);
        setList([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-slate-950">Products</h1>
        <p className="mt-3 text-slate-600">Browse premium items with 3D previews.</p>

        {loading ? (
          <p className="mt-10 text-slate-600">Loading products...</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.length === 0 ? (
              <p className="text-slate-600">No products available yet.</p>
            ) : (
              list.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1"
                >
                  <div className="relative h-64 w-full overflow-hidden rounded-2xl bg-slate-100">
                    <ModelViewer modelUrl={p.asset_name ? `/models/${p.asset_name}` : '/models/chair.glb'} />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{p.category || 'Product'}</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-950">{p.name}</h2>
                    <p className="mt-2 text-sm font-semibold text-sky-700">{p.currency} {p.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

