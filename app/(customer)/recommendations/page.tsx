'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import RequireAuth from '../../../components/RequireAuth';
import { motion } from 'framer-motion';

interface RecommendationItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string;
  model: string;
  images: string[];
  shortDescription: string;
  reason: string;
  score: number;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isAiPowered, setIsAiPowered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecs() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/recommendations');
        if (!res.ok) {
          throw new Error(`Failed to load recommendations: ${res.statusText}`);
        }
        const data = await res.json();
        setRecommendations(data.recommendations || []);
        setIsAiPowered(data.isAiPowered || false);
      } catch (err: any) {
        console.error('Error fetching recommendations:', err);
        setError(err.message || 'Something went wrong while fetching recommendations.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecs();
  }, []);

  return (
    <RequireAuth role="customer">
      <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950/20 py-14">
        <main className="max-w-7xl mx-auto px-6">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 rounded-[32px] bg-gradient-to-r from-[#0058a3] to-blue-600 p-10 text-white shadow-2xl shadow-[#0058a3]/25 md:p-12"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                  {isAiPowered ? (
                    <>
                      <Sparkles size={14} className="animate-pulse text-white" />
                      AI Preference Model Active
                    </>
                  ) : (
                    'Personalized Recommendations'
                  )}
                </div>

                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  Tailored product recommendations just for you
                </h1>

                <p className="max-w-2xl text-sky-100">
                  Our hybrid intelligence scores candidates based on your browsing habits, cart actions, and purchases, while Google Gemini refines the selection and explains the matches.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0058a3] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-[1px] hover:opacity-90"
              >
                Browse Full Catalog
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.section>

          {/* Loading State */}
          {isLoading && (
            <section className="grid gap-6 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="animate-pulse rounded-[32px] border border-slate-200/50 bg-white/60 p-6 dark:border-slate-800/50 dark:bg-slate-950/40"
                >
                  <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
                  <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 mb-6" />
                  <div className="h-16 w-full rounded bg-slate-200 dark:bg-slate-800 mb-6" />
                  <div className="h-10 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </section>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[32px] border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20"
            >
              <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Unable to load recommendations</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">{error}</p>
            </motion.section>
          )}

          {/* Empty State */}
          {!isLoading && !error && recommendations.length === 0 && (
            <motion.section 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-lg dark:border-slate-800 dark:bg-slate-950/80"
            >
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">No matches found yet.</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Start browsing products, adding to your cart, or rating items to build your preferences profile!
              </p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-6 py-3 font-semibold"
              >
                Go to Catalog
                <ArrowRight size={18} />
              </Link>
            </motion.section>
          )}

          {/* Recommendations List */}
          {!isLoading && !error && recommendations.length > 0 && (
            <section className="grid gap-6 lg:grid-cols-2">
              {recommendations.map((product, idx) => (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="group relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 p-6 shadow-md shadow-slate-900/5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl dark:border-slate-800/70 dark:bg-slate-950/70"
                >
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                        {product.category}
                      </p>
                      <h2 className="mt-1.5 text-2xl font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0058a3] dark:group-hover:text-[#5cc7ff] transition-colors">
                        {product.name}
                      </h2>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4.5 py-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
                      {product.currency} {product.price.toLocaleString()}
                    </div>
                  </div>

                  <p className="mb-5 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                    {product.shortDescription}
                  </p>

                  {/* AI Explanation Reason Box */}
                  <div className="mb-6 rounded-2xl border border-[#0058a3]/15 bg-[#0058a3]/5 p-4 dark:border-[#0058a3]/25 dark:bg-[#0058a3]/10">
                    <div className="flex gap-2.5 items-start">
                      <Sparkles size={16} className="text-[#0058a3] dark:text-[#5cc7ff] mt-0.5 shrink-0 animate-pulse" />
                      <p className="text-xs text-[#003d70] dark:text-[#8fd4ff] font-medium leading-relaxed">
                        {product.reason}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/product/${product.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0058a3] dark:text-[#5cc7ff] transition hover:opacity-85 hover:underline"
                  >
                    Explore Product Details
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.article>
              ))}
            </section>
          )}

          {/* Information Banner */}
          <section className="mt-16 rounded-[32px] bg-gradient-to-r from-slate-900 to-slate-950 p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent)]" />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between relative z-10">
              <div>
                <h2 className="text-3xl font-bold">Recommendations Refine As You Shop</h2>
                <p className="mt-3.5 max-w-3xl text-slate-300 leading-relaxed">
                  Every product view, click, cart addition, and purchase updates your personal AI profile, letting Google Gemini craft even more precise and personalized suggestions.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0058a3] text-white px-6 py-3.5 text-sm font-bold shadow-sm transition hover:opacity-90 hover:shadow-lg"
              >
                Start Exploring
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}
