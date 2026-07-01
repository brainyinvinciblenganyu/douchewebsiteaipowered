import Link from 'next/link';
import { ArrowRight, Sparkles, Users2 } from 'lucide-react';

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Join the team</p>
            <h1 className="text-4xl font-semibold text-slate-950 dark:text-white">Help shape the future of AI-powered commerce.</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Douche is building immersive, intelligent storefronts for modern brands and vendors. We are looking for curious builders, designers, and product thinkers.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-6 dark:border-slate-700/80 dark:bg-slate-900/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                <Sparkles size={20} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Product designers</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Create elegant, high-conversion shopping journeys with immersive storytelling.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-slate-50 p-6 dark:border-slate-700/80 dark:bg-slate-900/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                <Users2 size={20} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">Frontend engineers</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Build rich, responsive storefronts that connect discovery, checkout, and 3D experiences.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Contact us
              <ArrowRight size={16} />
            </Link>
            <Link href="/about" className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              Learn more about Douche
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
