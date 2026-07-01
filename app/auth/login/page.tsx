'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'vendor' ? '/vendor/dashboard' : '/recommendations');
    }
  }, [router, user]);

  if (user) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const result = await login(email, password);
    if (result.success) {
      setMessage('Login successful. Redirecting...');
      router.replace(result.user?.role === 'vendor' ? '/vendor/dashboard' : '/recommendations');
    } else {
      setMessage(result.message || 'Login failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center">
        <section className="flex-1 rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Secure access</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Sign in to continue your personalized shopping journey.</h1>
          <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Log in to save your preferences, track your requests, and open the full AI-powered commerce experience.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              <ShieldCheck size={18} className="text-sky-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Protected vendor and customer accounts</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              <Sparkles size={18} className="text-sky-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Personalized recommendations and saved carts</span>
            </div>
          </div>
        </section>

        <section className="flex-1 rounded-[32px] border border-slate-200/70 bg-slate-950/95 p-8 text-white shadow-2xl shadow-slate-950/20">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-3 text-slate-300">Use your email and password to sign in.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0" required />
            </div>
            {message ? <p className={`text-sm ${message.includes('successful') ? 'text-emerald-300' : 'text-rose-300'}`}>{message}</p> : null}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Demo credentials</p>
              <p>Customer: aisha@douche.com · customer123</p>
              <p>Vendor: samuel@kokora.com · vendor123</p>
            </div>
            <button disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            New here? <Link href="/contact" className="text-sky-300">Contact the team</Link> to get onboarding help.
          </p>
        </section>
      </main>
    </div>
  );
}
