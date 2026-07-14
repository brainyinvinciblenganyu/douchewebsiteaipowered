import Link from 'next/link';
import { ArrowRight, Sparkles, Users2 } from 'lucide-react';
import PageHero from '../../components/PageHero';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <PageHero>
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Join the team</p>
            <h1 className="text-4xl font-semibold text-white">Help shape the future of AI-powered commerce.</h1>
            <p className="text-sky-100">
              Douche is building immersive, intelligent storefronts for modern brands and vendors. We are looking for curious builders, designers, and product thinkers.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                <Sparkles size={20} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">Product designers</h2>
              <p className="mt-2 text-sm text-sky-100">Create elegant, high-conversion shopping journeys with immersive storytelling.</p>
            </div>
            <div className="rounded-[28px] border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                <Users2 size={20} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">Frontend engineers</h2>
              <p className="mt-2 text-sm text-sky-100">Build rich, responsive storefronts that connect discovery, checkout, and 3D experiences.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0058a3] transition hover:-translate-y-[1px] hover:shadow-lg">
              Contact us
              <ArrowRight size={16} />
            </Link>
            <Link href="/about" className="inline-flex items-center rounded-2xl border-2 border-white px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-[1px] hover:bg-white hover:text-[#0058a3]">
              Learn more about Douche
            </Link>
          </div>
        </PageHero>
      </main>
    </div>
  );
}
