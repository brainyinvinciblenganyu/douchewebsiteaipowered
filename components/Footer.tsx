import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-2 border-t-[#ffdb00] bg-gradient-to-b from-[#0058a3] to-[#003d70] py-14 text-white">

      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffdb00] text-[#0058a3] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              D
            </div>
            <div>
              <p className="text-base font-semibold">Douche</p>
              <p className="text-sm text-white/70">AI-powered personalized commerce</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-white/70">
            Discover premium products with intelligent recommendations, 3D previews, and vendor-supplied digital experiences.
          </p>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#ffdb00]">Explore</p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/products" className="text-white/80 transition hover:text-white">Products</Link>
            </li>
            <li>
              <Link href="/recommendations" className="text-white/80 transition hover:text-white">Recommendations</Link>
            </li>
            <li>
              <Link href="/vendor/dashboard" className="text-white/80 transition hover:text-white">Vendor Dashboard</Link>
            </li>
            <li>
              <Link href="/contact" className="text-white/80 transition hover:text-white">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#ffdb00]">Company</p>
          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/about" className="text-white/80 transition hover:text-white">About</Link>
            </li>
            <li>
              <Link href="/contact" className="text-white/80 transition hover:text-white">Contact</Link>
            </li>
            <li>
              <Link href="/faq" className="text-white/80 transition hover:text-white">FAQ</Link>
            </li>
            <li>
              <Link href="/terms" className="text-white/80 transition hover:text-white">Terms</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#ffdb00]">Contact</p>
          <div className="space-y-3 text-sm text-white/80">
            <p>support@douche.com</p>
            <p>info@douche.com</p>
            <p>Yaoundé, Cameroon</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 px-6 pt-8 text-center text-sm text-white/60">
        <p>&copy; {new Date().getFullYear()} Douche. All rights reserved.</p>
      </div>
    </footer>
  );
}
