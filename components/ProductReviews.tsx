'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MessageSquare, PenLine } from 'lucide-react';

type Review = {
  id: string;
  userId: string | null;
  authorName: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
};

type Summary = {
  average: number;
  count: number;
};

export function StarRow({
  value,
  size = 16,
  className = '',
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const fillPercent = (clamped / 5) * 100;

  return (
    <span className={`relative inline-flex ${className}`} aria-hidden>
      <span className="flex gap-0.5 text-slate-300">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} className="fill-slate-200 text-slate-200" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400"
        style={{ width: `${fillPercent}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={size} className="fill-amber-400 text-amber-400 shrink-0" />
        ))}
      </span>
    </span>
  );
}

function StarPicker({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          className="transition hover:scale-110 focus:outline-none"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            size={size}
            className={star <= active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

export default function ProductReviews({
  productId,
  isLoggedIn,
  onSummaryChange,
}: {
  productId: string;
  isLoggedIn: boolean;
  onSummaryChange?: (summary: Summary) => void;
}) {
  const [summary, setSummary] = useState<Summary>({ average: 0, count: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;

        const loadedSummary = {
          average: Number(data?.summary?.average ?? 0),
          count: Number(data?.summary?.count ?? 0),
        };
        setSummary(loadedSummary);
        onSummaryChange?.(loadedSummary);
        setReviews(Array.isArray(data?.reviews) ? data.reviews : []);

        const mine = data?.myReview ?? null;
        setMyReview(mine);
        if (mine) {
          setRating(mine.rating);
          setTitle(mine.title ?? '');
          setBody(mine.body ?? '');
        }
      } catch {
        if (!mounted) return;
        setSummary({ average: 0, count: 0 });
        setReviews([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const submitReview = async () => {
    if (rating < 1) {
      setError('Select a star rating before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title: title.trim() || undefined, body: body.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to submit review');
      }

      const data = await res.json();
      const updatedSummary = data.summary ?? summary;
      setSummary(updatedSummary);
      onSummaryChange?.(updatedSummary);
      setMyReview(data.review ?? null);
      setReviews((prev) => {
        const withoutMine = prev.filter((r) => r.userId !== data.review?.userId);
        return [{ ...data.review, authorName: data.review.authorName ?? 'You' }, ...withoutMine];
      });
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <MessageSquare size={20} className="text-[#0058a3]" />
        <h2 className="text-xl font-semibold text-slate-950">Ratings &amp; reviews</h2>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading reviews…</p>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
          {/* Summary column */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-5xl font-bold text-slate-950">{summary.average.toFixed(1)}</p>
              <div className="mt-2 flex justify-center">
                <StarRow value={summary.average} size={20} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {summary.count === 0
                  ? 'No ratings yet'
                  : `${summary.count} ${summary.count === 1 ? 'rating' : 'ratings'}`}
              </p>
            </div>

            {summary.count > 0 && (
              <div className="space-y-2">
                {distribution.map((d) => (
                  <div key={d.star} className="flex items-center gap-3 text-sm">
                    <span className="w-10 shrink-0 text-slate-600">{d.star} star</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-slate-500">{d.count}</span>
                  </div>
                ))}
              </div>
            )}

            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <PenLine size={16} />
                {myReview ? 'Edit your review' : 'Write a review'}
              </button>
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
                <Link href="/auth/login" className="font-semibold text-[#0058a3] hover:underline">
                  Log in
                </Link>{' '}
                to rate and review this product.
              </p>
            )}

            {showForm && (
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Your rating
                  </p>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Review title (optional)"
                  maxLength={120}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-[#0058a3]"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share details about your experience (optional)"
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-[#0058a3]"
                />
                {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={submitting}
                    className="flex-1 rounded-2xl bg-[#0058a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : myReview ? 'Update review' : 'Submit review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reviews list column */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">No reviews yet</p>
                <p className="mt-1 text-sm text-slate-500">Be the first to share your experience.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <StarRow value={review.rating} size={15} />
                      {review.title && <p className="font-semibold text-slate-950">{review.title}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{timeAgo(review.createdAt)}</span>
                  </div>
                  {review.body && <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.body}</p>}
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {review.authorName || 'Verified buyer'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
