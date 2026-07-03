'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Building2, Loader2, ShieldCheck, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';

type Role = 'customer' | 'vendor';

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-300">{message}</p>;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function RegisterPage() {
  const router = useRouter();
  const { login, user } = useAuth();

  const [role, setRole] = useState<Role>('customer');

  // customer
  const [name, setName] = useState('');

  // vendor
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(() => (role === 'vendor' ? 'Create a vendor account' : 'Create a customer account'), [role]);
  const subtitle = useMemo(
    () =>
      role === 'vendor'
        ? 'Set up your storefront to upload 3D products and manage purchase requests.'
        : 'Create an account to get personalized 3D recommendations and manage your cart.',
    [role],
  );

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'vendor' ? '/vendor/dashboard' : '/recommendations');
    }
  }, [router, user]);

  const validate = () => {
    setError(null);
    setMessage(null);

    if (role === 'customer') {
      if (!name.trim()) return setError('Name is required.'), false;
    } else {
      if (!companyName.trim()) return setError('Company name is required.'), false;
      if (!location.trim()) return setError('Location is required.'), false;
    }

    if (!email.trim()) return setError('Email is required.'), false;
    if (!isValidEmail(email)) return setError('Enter a valid email address.'), false;

    if (password.length < 6) return setError('Password must be at least 6 characters.'), false;
    if (password !== confirmPassword) return setError('Passwords do not match.'), false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // UI-only “functional” behavior in this codebase:
    // - Auth is demo-based (localStorage) and only accepts predefined demo credentials.
    // - We map the registration role to the expected demo email.
    // - The register form remains role-based as requested.

    const expected = role === 'vendor' ? 'samuel@kokora.com' : 'aisha@douche.com';
    const expectedPassword = role === 'vendor' ? 'vendor123' : 'customer123';

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await login(expected, expectedPassword);
      if (!result.success) {
        setError(result.message || 'Registration failed.');
        return;
      }

      setMessage('Account created. Redirecting…');
      router.replace(result.user?.role === 'vendor' ? '/vendor/dashboard' : '/recommendations');
    } catch {
      setError('Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) return null;

  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[32px] border border-slate-200/70 bg-white/90 p-10 shadow-xl shadow-slate-900/5 backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-950/80">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Role-based registration</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">{title}</h1>
          <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400">{subtitle}</p>

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
              <span className="text-sm text-slate-700 dark:text-slate-300">Sign up to unlock personalized AI shopping</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              <Sparkles size={18} className="text-sky-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Interactive 3D preview & recommendations</span>
            </div>
          </div>

          <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-sky-600">
              Sign in
            </Link>
          </p>
        </section>

        <section className="flex-1 rounded-[32px] border border-slate-200/70 bg-slate-950/95 p-8 text-white shadow-2xl shadow-slate-950/20">
          <h2 className="text-2xl font-semibold">Create your account</h2>
          <p className="mt-3 text-slate-300">{role === 'vendor' ? 'Vendor details' : 'Customer details'}</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {role === 'customer' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Aisha"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="companyName">
                    Company name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Kokora Collective"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Buea, Cameroon"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
                    required
                  />
                </div>
              </div>
            )}

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
              />
              <FieldError message={error && error.toLowerCase().includes('email') ? error : null} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none ring-0"
                  required
                />
              </div>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Demo note</p>
              <p className="mt-1">This project uses demo accounts. Register will sign you in to the selected role’s demo account.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Creating…
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

