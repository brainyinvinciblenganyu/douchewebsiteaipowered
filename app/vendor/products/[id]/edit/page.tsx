import { Suspense } from 'react';
import ProductEditClient from './ProductEditClient';

export default function ProductEditPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 text-sm text-blue-100">
              Loading product...
            </div>
          </div>
        </div>
      }
    >
      <ProductEditClient />
    </Suspense>
  );
}

