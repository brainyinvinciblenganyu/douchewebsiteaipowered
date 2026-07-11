import { Suspense } from 'react';
import VendorProductsClient from './VendorProductsClient';
import VendorNav from '../../../components/VendorNav';

export default function VendorProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="rounded-[32px] border border-blue-200/50 bg-blue-600 p-10 text-sm text-blue-100">
              Loading your catalog...
            </div>
          </div>
        </div>
      }
    >
      <VendorNav />
      <VendorProductsClient />
    </Suspense>
  );
}
