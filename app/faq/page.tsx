'use client';

import PageHero from '../../components/PageHero';

const faqs = [
  {
    question: 'How does AI personalize my product feed?',
    answer: 'Our system analyses your browsing behavior, preferences, and product interactions to surface the most relevant products for your taste.',
  },
  {
    question: 'Can I preview products in 3D before I buy?',
    answer: 'Yes. Most eligible products include an interactive 3D viewer so you can rotate, zoom and explore every detail before adding items to cart.',
  },
  {
    question: 'How does vendor AI 3D generation work?',
    answer: 'Vendors upload images, and our AI backend converts them into interactive 3D assets automatically—then they preview and publish the model to the catalog.',
  },
  {
    question: 'Is there a payment gateway?',
    answer: 'No. This platform uses purchase requests instead of checkout payments, so customers submit a request and vendors confirm the order.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <main className="max-w-6xl mx-auto px-6 py-16">
        <PageHero>
          <div className="max-w-3xl space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Support Center</p>
            <h1 className="text-4xl font-semibold text-white">Frequently asked questions</h1>
            <p className="text-sky-100">Get clarity on how personalized AI shopping, 3D product previews, and purchase request flows work on the platform.</p>
          </div>
        </PageHero>

        <section className="section-card mt-8 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:shadow-slate-950/20">
          <div className="grid gap-4">
            {faqs.map((item) => (
              <details key={item.question} className="rounded-3xl border border-slate-200/80 p-6 bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/80">
                <summary className="cursor-pointer text-lg font-semibold text-slate-900 dark:text-white">{item.question}</summary>
                <p className="mt-4 text-slate-600 dark:text-slate-300 leading-7">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
