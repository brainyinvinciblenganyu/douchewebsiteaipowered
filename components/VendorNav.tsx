'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/vendor/dashboard', label: 'Dashboard' },
  { href: '/vendor/products', label: 'Products' },
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
            className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              active
                ? 'bg-white text-blue-800'
                : 'border border-blue-300/50 bg-blue-500/30 text-blue-100 hover:bg-blue-500/50'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
