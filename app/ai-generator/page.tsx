'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AIGeneratorPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/vendor/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8f4ff] text-[#003d70]">
      <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-900/10">
        <h1 className="text-3xl font-semibold mb-4">Vendor dashboard now available</h1>
        <p className="text-slate-600 mb-6">The AI Lab page has been replaced with the vendor dashboard. Redirecting now...</p>
        <p className="text-sm text-slate-500">
          If you are not redirected automatically, <a href="/vendor/dashboard" className="font-semibold text-[#0058a3]">click here</a>.
        </p>
      </div>
    </div>
  );
}
