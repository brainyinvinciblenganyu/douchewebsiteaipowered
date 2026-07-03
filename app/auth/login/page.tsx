'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { ArrowRight, Building2, Loader2, ShieldCheck, Sparkles, User } from 'lucide-react';

type Role = 'customer' | 'vendor';

function PasswordStrengthHint({ password }: { password: string }) {
  const strength = useMemo(() => {
    const p = password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    return Math.min(3, score);
  }, [password]);

  if (!password) return null;
  if (strength <= 1) return <p className="mt-1 text-[11px] text-rose-300">Use 6+ chars for better security.</p>;
  if (strength === 2) return <p className="mt-1 text-[11px] text-amber-200">Good. Consider adding numbers or uppercase.</p>;
  return <p className="mt-1 text-[11px] text-emerald-200">Strong password.</p>;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [role, setRole] = useState<Role>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'vendor' ? '/vendor/dashboard' : '/recommendations');
    }
  }, [router, user]);

  useEffect(() => {
    // Seed email/password placeholders based on selected role.
    // (Still uses the shared signin page.)
    if (!email && !password) {
      if (role === 'vendor') {
        setEmail('samuel@kokora.com');
        setPassword('vendor123');
      } else {
        setEmail('aisha@douche.com');
        setPassword('customer123');
      }
    }
  }, [role]);

  const demoText = useMemo(() => {
    return role === 'vendor'
      ? { label: 'Vendor demo', email: 'samuel@kokora.com', password: 'vendor123' }
      : { label: 'Customer demo', email: 'aisha@douche.com', password: 'customer123' };
  }, [role]);

  if (user) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    const result = await login(email, password);
    if (result.success) {
      setMessage('Login successful. Redirecting...');
      router.replace(result.user?.role === 'vendor' ? '/vendor/dashboard' : '/recommendations');
    } else {
      setError(result.message || 'Login failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Role-based sign in</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Welcome back</h1>
          <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            This is the same sign-in page for customers and vendors. Choose your role, then sign in with email & password.
          </p>

          <div className="mt-8 rounded-[28px] border border-slate-200/70 bg-slate-50/90 p-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  role === 'customer' ? 'bg-white text-slate-950 shadow' : 'bg-transparent text-slate-600 hover:bg-white/60'
                }`}
              >
                <User size={16} /> Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('vendor')}
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  role === 'vendor' ? 'bg-white text-slate-950 shadow' : 'bg-transparent text-slate-600 hover:bg-white/60'
                }`}
              >
                <Building2 size={16} /> Vendor
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              <ShieldCheck size={18} className="text-sky-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Protected role-based access</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              <Sparkles size={18} className="text-sky-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Personalized recommendations for customers</span>
            </div>
          </div>

          <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            New here?{' '}
            <Link href="/auth/register" className="font-semibold text-sky-600">
              Create an account
            </Link>
          </p>
        </section>

        <section className="flex-1 rounded-[32px] border border-slate-200/70 bg-slate-950/95 p-8 text-white shadow-2xl shadow-slate-950/20">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-3 text-slate-300">Role: {role === 'vendor' ? 'Vendor' : 'Customer'}</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
                required
                autoComplete={role === 'vendor' ? 'current-password' : 'current-password'}
              />
              <PasswordStrengthHint password={password} />
            </div>

            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-300">
              <p className="font-semibold text-white">{demoText.label}</p>
              <p>
                {demoText.email} · {demoText.password}
              </p>
            </div>

            <button
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            Need help?{' '}
            <Link href="/contact" className="text-sky-300">
              Contact the team
            </Link>{' '}
            for onboarding.
          </p>
        </section>
      </main>
    </div>
  );
}

