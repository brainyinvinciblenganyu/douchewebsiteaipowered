'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import TabIndicator from './TabIndicator';
import Brainy from './Brainy';
import PageTransition from './PageTransition';

const ADMIN_PATH_PREFIX = '/ops-7f3k2';

// The admin panel has its own gate + nav (see AdminGate.tsx) and shouldn't
// show the public customer/vendor chrome (Home/Products/Cart/Login nav,
// footer, chat widget) — none of that belongs to an internal admin tool.
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith(ADMIN_PATH_PREFIX);

  if (isAdminRoute) {
    return (
      <>
        <main className="main-content">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <TabIndicator />
      <main className="main-content">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <Brainy />
    </>
  );
}
