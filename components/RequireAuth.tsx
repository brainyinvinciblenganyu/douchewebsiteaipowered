'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { useBackendAuth } from './BackendAuthProvider';

interface RequireAuthProps {
  children: React.ReactNode;
  role?: 'customer' | 'vendor';
  fallbackPath?: string;
}

export default function RequireAuth({ children, role, fallbackPath }: RequireAuthProps) {
  const router = useRouter();
  const { user, isHydrated } = useBackendAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (role && user.role !== role) {
      router.replace(fallbackPath || (role === 'vendor' ? '/vendor/dashboard' : '/recommendations'));
    }
  }, [fallbackPath, isHydrated, role, router, user]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <p className="text-sm font-semibold text-slate-600">Preparing your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-[#0058a3]">Access required</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Please sign in to continue.</h2>
          <p className="mt-3 text-slate-600">You need to be logged in to view this page.</p>
          <Link
            href="/auth/login"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#0058a3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1c6fb0]"
          >
            <LogIn size={18} />
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center shadow-lg">
          <p className="text-sm uppercase tracking-[0.24em] text-[#0058a3]">Restricted access</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">This workspace is for {role} accounts.</h2>
          <p className="mt-3 text-slate-600">Sign in with an account that has {role} access to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
