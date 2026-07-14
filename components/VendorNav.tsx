'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/vendor/dashboard', label: 'Dashboard', forceBlue: true },
  { href: '/vendor/products', label: 'Products', forceBlue: true },
  { href: '/vendor/orders', label: 'Orders' },
];

export default function VendorNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              tab.forceBlue
                ? `rounded-2xl px-4 py-3 text-sm font-bold text-white transition ${
                    active ? 'bg-[#003d70]' : 'bg-[#0058a3] hover:opacity-90'
                  }`
                : `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'bg-white text-blue-800'
                      : 'border border-blue-300/50 bg-blue-500/30 text-blue-100 hover:bg-blue-500/50'
                  }`
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
