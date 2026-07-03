'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const TABS: Array<{ href: string; label: string }> = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/recommendations', label: 'Recommendations' },
  { href: '/categories', label: 'Categories' },
  { href: '/vr', label: 'VR' },
  { href: '/vendor/dashboard', label: 'Vendor' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function TabIndicator() {
  const pathname = usePathname();

  const current = useMemo(() => {
    for (const t of TABS) {
      if (t.href === '/') {
        if (pathname === '/') return t;
      } else if (pathname?.startsWith(t.href)) {
        return t;
      }
    }
    return null;
  }, [pathname]);

  return (
    <div
      className="ml-auto hidden items-center gap-2 rounded-full bg-[#0058a3]/90 px-3 py-1 text-xs font-semibold text-white shadow-lg lg:flex"
      aria-live="polite"
    >
      <span className="h-2 w-2 rounded-full bg-white/90" />
      <span>Now viewing: {current?.label ?? 'Home'}</span>
    </div>
  );
}

