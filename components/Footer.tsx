import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 py-14 text-[var(--color-foreground)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-[var(--color-white)] shadow-[0_10px_30px_rgba(17,24,39,0.06)]">
              D
            </div>
            <div>
              <p className="text-base font-semibold">Douche</p>
              <p className="text-sm text-[var(--color-foreground-muted)]">AI-powered personalized commerce</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--color-foreground-muted)]">
            Discover premium products with intelligent recommendations, 3D previews, and vendor-supplied digital experiences.
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[var(--color-foreground-muted)]">Explore</p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/products" className="transition hover:text-[var(--color-foreground)]">Products</Link>
            </li>
            <li>
              <Link href="/recommendations" className="transition hover:text-[var(--color-foreground)]">Recommendations</Link>
            </li>
            <li>
              <Link href="/vendor/dashboard" className="transition hover:text-[var(--color-foreground)]">Vendor Dashboard</Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-[var(--color-foreground)]">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[var(--color-foreground-muted)]">Company</p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/about" className="transition hover:text-[var(--color-foreground)]">About</Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-[var(--color-foreground)]">Contact</Link>
            </li>
            <li>
              <Link href="/faq" className="transition hover:text-[var(--color-foreground)]">FAQ</Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-[var(--color-foreground)]">Terms</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[var(--color-foreground-muted)]">Contact</p>
          <div className="space-y-3 text-sm text-[var(--color-foreground-muted)]">
            <p>support@douche.com</p>
            <p>info@douche.com</p>
            <p>Yaoundé, Cameroon</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 px-6 pt-8 text-center text-sm text-[var(--color-foreground-muted)]">
        <p>&copy; {new Date().getFullYear()} Douche. All rights reserved.</p>
      </div>
    </footer>
  );
}
