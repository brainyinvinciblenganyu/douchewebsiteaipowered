'use client';

import { useMemo } from 'react';
import Link from 'next/link';
// Navbar and Footer are provided globally via app/layout.tsx
import { categories, products, vendors } from '../lib/mockData';
import { ArrowRight, Globe, Sparkles, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import ModelViewer from '../components/ModelViewer';
import PageHero from '../components/PageHero';

const stats = [
  { label: 'Personalized matches', value: '148+', icon: Sparkles },
  { label: '3D models generated', value: '82%', icon: TrendingUp },
  { label: 'Vendors onboarded', value: '24', icon: Users },
  { label: 'Safe requests', value: '100%', icon: ShieldCheck },
];

export default function Home() {
  const heroProduct = useMemo(() => products[0], []);
  const trendingCategories = useMemo(() => categories.slice(0, 3), []);

  return (
    <div className="bg-transparent">
    <main className="mx-auto max-w-7xl px-6 py-14">
        <PageHero className="mb-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.25fr_0.95fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
                <Sparkles size={16} />
                Intelligent recommendations powered by quiet AI
              </div>
              <div className="space-y-6">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white">
                  Premium commerce, reimagined with immersive 3D and calm intelligence.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-sky-100">
                  Discover curated products tailored to your taste, view interactive previews, and move from inspiration to request with a refined experience that feels modern and effortless.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/products" className="inline-flex items-center rounded-2xl bg-[#0058a3] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-[1px] hover:opacity-90">
                  Browse catalog
                  <ArrowRight size={18} className="ml-2" />
                </Link>
                <Link href="/vendor/dashboard" className="inline-flex items-center rounded-2xl bg-[#0058a3] px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:-translate-y-[1px] hover:opacity-90">
                  Explore vendor tools
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0058a3]">
                      <stat.icon size={20} />
                    </div>
                    <p className="mt-5 text-3xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm text-sky-100">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 overflow-hidden rounded-[36px] bg-white/95 p-6 shadow-xl">
              <div className="overflow-hidden rounded-[32px] border border-slate-100/80 bg-slate-900/5">
                <div className="relative h-[420px] w-full overflow-hidden lg:h-[500px]">
                  <ModelViewer modelUrl={`/models/${heroProduct.model}`} />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Featured 3D product</p>
                <h2 className="text-3xl font-semibold text-slate-950">{heroProduct.name}</h2>
                <p className="text-slate-600">{heroProduct.shortDescription}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{heroProduct.category}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{heroProduct.vendorName}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{heroProduct.rating} ★</span>
                </div>
              </div>
            </div>
          </div>
        </PageHero>

        <section className="mb-20 grid gap-6 lg:grid-cols-2">
          <article className="surface-card rounded-[32px] p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Personalization</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Quiet AI that learns from every visit.</h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">As you browse, the platform refines suggestions based on your engagement so every experience feels more personal over time.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { title: 'Behavior tracking', text: 'Analyze product views and favorites to create smarter recommendations.' },
                { title: 'Vendor intelligence', text: 'Surface products from vendors that align with your preferences.' },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-200/70 bg-slate-50/90 p-5 dark:border-slate-700/70 dark:bg-slate-900/80">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card rounded-[32px] p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">AI 3D generation</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white">Automatic 3D previews for every eligible product.</h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">Vendors upload images and our AI transforms them into interactive 3D assets—no manual modeling required.</p>
            <div className="mt-8 space-y-4">
              {['Upload images', 'AI model generation', 'Vendor preview', 'Publish product'].map((step, index) => (
                <div key={step} className="rounded-3xl border border-slate-200/80 bg-slate-50/90 p-5 dark:border-slate-700/80 dark:bg-slate-900/85">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Step {index + 1}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mb-20">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Trending categories</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Collections shaping premium commerce.</h2>
            </div>
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              See all categories
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {trendingCategories.map((category) => (
              <article key={category.id} className="brand-panel group overflow-hidden rounded-[32px] p-8 shadow-2xl shadow-slate-950/20 transition hover:-translate-y-1">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10">
                  <Globe size={24} />
                </div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{category.name}</p>
                <h3 className="mt-4 text-2xl font-semibold">{category.description}</h3>
                <p className="mt-5 text-sm leading-7 text-slate-300">Discover premium products designed for modern interiors, wearables, and tech experiences.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Trusted merchants</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Vendors shaping the AI commerce experience.</h2>
            </div>
            <Link href="/vendor/dashboard" className="inline-flex items-center gap-2 rounded-2xl bg-[#0058a3] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
              View vendor tools
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="surface-card rounded-[32px] p-6">
                <div className="flex items-center gap-4">
                  <img src={vendor.avatar} alt={vendor.name} className="h-14 w-14 rounded-3xl object-cover" />
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{vendor.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.tagline}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>{vendor.products} products</span>
                  <span>{vendor.rating} ★</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PageHero className="mb-20">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Explore the experience</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Jump into the full commerce journey.</h2>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { href: '/products', title: 'Shop the catalog', text: 'Browse premium products with 3D previews and smart search.' },
              { href: '/recommendations', title: 'See your matches', text: 'Open AI-guided recommendations tailored to your interests.' },
              { href: '/categories', title: 'Explore collections', text: 'Find curated categories for fashion, interiors, and tech.' },
              { href: '/vendor/dashboard', title: 'Vendor tools', text: 'Manage 3D product workflows, inventory, and purchase requests as a vendor.' },
              { href: '/vr', title: 'Enter the VR showroom', text: 'Experience immersive product exploration in a virtual environment.' },
              { href: '/contact', title: 'Talk to the team', text: 'Reach out for support, partnerships, or product questions.' },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="rounded-[28px] border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/15">
                <p className="text-sm font-semibold text-white">{link.title}</p>
                <p className="mt-2 text-sm leading-6 text-sky-100">{link.text}</p>
              </Link>
            ))}
          </div>
        </PageHero>

        <section className="rounded-[32px] border border-slate-200/70 bg-slate-950/95 p-12 text-white shadow-2xl shadow-slate-950/20 backdrop-blur-2xl dark:border-slate-700/70">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Ready to elevate your storefront?</p>
              <h2 className="mt-4 text-4xl font-semibold">Create better purchase journeys with AI-backed product experiences.</h2>
              <p className="mt-5 max-w-xl leading-7 text-slate-300">Whether you’re browsing as a customer or selling as a vendor, Douche makes discovery, preview, and order handling feel premium and effortless.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['AI-powered recommendations', 'Interactive 3D viewing', 'Vendor 3D upload flow', 'Request-based checkout'].map((feature) => (
                <div key={feature} className="rounded-3xl border border-white/10 bg-slate-900/75 p-6">
                  <p className="font-semibold text-white">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
