 'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useBackendAuth as useAuth } from './BackendAuthProvider';
import ThemeToggle from './ThemeToggle';

// Links are computed inside the component (role-aware) so UI is consistent after login.





export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="nav-shell sticky top-0 z-50 w-full px-6 py-4 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3">
          <div className="rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] p-3 shadow-[0_10px_30px_rgba(17,24,39,0.06)] transition-transform group-hover:scale-[1.02]">
            <div className="h-5 w-5 rounded-full border border-white/70 bg-white" />
          </div>
          <div>
            <p className="text-base font-semibold uppercase tracking-[0.24em] text-[var(--color-foreground)]">Douche</p>
            <p className="text-sm text-[var(--color-foreground-muted)]">AI customized Commerce</p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-[var(--color-foreground-muted)] lg:flex">
          {(
            [
              { href: '/', label: 'Home' },
              { href: '/products', label: 'Products' },
              ...(user?.role === 'vendor' ? [{ href: '/vendor/dashboard', label: 'Vendor' }] : []),
              ...(user?.role === 'customer' ? [{ href: '/vr', label: 'VR Showroom' }] : []),
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ]
          ).map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);


            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`transition hover:text-[var(--color-foreground)] ${isActive ? 'font-semibold text-[var(--color-primary)]' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-surface-alt)] lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/cart" className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-surface-alt)]">
            <ShoppingCart size={18} />
          </Link>
          {user ? (
            <div className="hidden items-center gap-3 lg:flex">
              <Link href={user.role === 'vendor' ? '/vendor/dashboard' : '/recommendations'} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-surface-alt)]">
                {user.name}
              </Link>
              <button onClick={logout} className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-surface-alt)]" aria-label="Log out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="hidden lg:block">
              <Link href="/auth/login" className="btn-primary inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold">
                <User size={18} className="mr-2" />
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-[420px]' : 'max-h-0'}`}>
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-6 py-4 text-sm text-[var(--color-foreground-muted)] shadow-sm">
          <div className="space-y-3">
            {(
              [
                { href: '/', label: 'Home' },
                { href: '/products', label: 'Products' },
                ...(user?.role === 'vendor' ? [{ href: '/vendor/dashboard', label: 'Vendor' }] : []),
                ...(user?.role === 'customer' ? [{ href: '/vr', label: 'VR Showroom' }] : []),
                { href: '/about', label: 'About' },
                { href: '/contact', label: 'Contact' },
              ]
            ).map((item) => (

              <Link
                key={item.href}
                href={item.href}

                onClick={() => setMenuOpen(false)}
                className={`block rounded-2xl px-3 py-3 transition hover:bg-[var(--color-surface-alt)] ${pathname === item.href ? 'bg-[var(--color-surface-alt)] text-[var(--color-foreground)]' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-surface-alt)]"
            >
              Cart
            </Link>

            {user ? (
              <>
                <Link
                  href={user.role === 'vendor' ? '/vendor/dashboard' : '/recommendations'}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-surface-alt)]"
                >
                  {user.name}
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] shadow-sm transition hover:bg-[var(--color-surface-alt)]"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="btn-primary inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
              >
                <User size={18} className="mr-2" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
