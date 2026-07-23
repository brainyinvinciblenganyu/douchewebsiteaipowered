'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Loader2, LogOut, ShieldCheck, Copy, KeyRound } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/ops-7f3k2/vendors', label: 'Vendors' },
  { href: '/ops-7f3k2/transactions', label: 'Transactions' },
  { href: '/ops-7f3k2/products', label: 'Product Approvals' },
  { href: '/ops-7f3k2/contact-messages', label: 'Contact Messages' },
  { href: '/ops-7f3k2/audit-log', label: 'Audit Log' },
];

type Stage =
  | 'checking'
  | 'credentials'
  | 'setup'
  | 'totp'
  | 'recoveryCodeEntry'
  | 'recoveryCodes'
  | 'loggedIn';

export default function AdminGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>('checking');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [setupToken, setSetupToken] = useState('');
  const [qrDataUri, setQrDataUri] = useState('');
  const [secret, setSecret] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/session', { credentials: 'include' });
        setStage(res.ok ? 'loggedIn' : 'credentials');
      } catch {
        setStage('credentials');
      }
    })();
  }, []);

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }

      if (data.setupRequired) {
        setSetupToken(data.setupToken);
        setQrDataUri(data.qrDataUri);
        setSecret(data.secret);
        setStage('setup');
        return;
      }

      if (data.totpRequired) {
        setStage('totp');
        return;
      }

      setStage('loggedIn');
    } catch {
      setError('Unable to reach the server');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/confirm-2fa-setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken, code }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid code. Please try again.');
        return;
      }

      setRecoveryCodes(data.recoveryCodes || []);
      setCode('');
      setStage('recoveryCodes');
    } catch {
      setError('Unable to reach the server');
    } finally {
      setSubmitting(false);
    }
  };

  const submitTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid code');
        return;
      }

      setStage('loggedIn');
    } catch {
      setError('Unable to reach the server');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recoveryCode }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Invalid recovery code');
        return;
      }

      setStage('loggedIn');
    } catch {
      setError('Unable to reach the server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setEmail('');
    setPassword('');
    setCode('');
    setRecoveryCode('');
    setStage('credentials');
  };

  if (stage === 'checking') {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#0058A3]" size={28} />
      </main>
    );
  }

  if (stage === 'credentials') {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6">
        <form
          onSubmit={submitCredentials}
          className="w-full rounded-2xl border border-[#D1D5DB] bg-white p-8 shadow-lg shadow-slate-900/5"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Admin only</p>
          <h1 className="mt-3 text-2xl font-bold text-[#111827]">Admin sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with your admin email and password.</p>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
            className="mt-6 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="mt-3 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0058A3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {submitting ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </main>
    );
  }

  if (stage === 'setup') {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6">
        <form
          onSubmit={confirmSetup}
          className="w-full rounded-2xl border border-[#D1D5DB] bg-white p-8 shadow-lg shadow-slate-900/5"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">First-time setup</p>
          <h1 className="mt-3 text-2xl font-bold text-[#111827]">Set up two-step verification</h1>
          <p className="mt-2 text-sm text-slate-600">
            Scan this QR code with Google Authenticator (or any TOTP app), then enter the 6-digit code it shows.
          </p>

          {qrDataUri && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUri} alt="Scan with your authenticator app" className="mx-auto mt-5 h-48 w-48" />
          )}

          {secret && (
            <p className="mt-3 break-all rounded-lg bg-[#F5F7FA] p-3 text-center font-mono text-xs text-slate-600">
              Manual entry key: {secret}
            </p>
          )}

          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            autoFocus
            className="mt-5 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-center text-lg tracking-[0.3em] text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || code.length < 6}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0058A3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {submitting ? 'Verifying...' : 'Confirm'}
          </button>
        </form>
      </main>
    );
  }

  if (stage === 'totp') {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6">
        <form
          onSubmit={submitTotp}
          className="w-full rounded-2xl border border-[#D1D5DB] bg-white p-8 shadow-lg shadow-slate-900/5"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Verify it's you</p>
          <h1 className="mt-3 text-2xl font-bold text-[#111827]">Enter your 6-digit code</h1>
          <p className="mt-2 text-sm text-slate-600">Open your authenticator app to get the current code.</p>

          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            autoFocus
            className="mt-6 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-center text-lg tracking-[0.3em] text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || code.length < 6}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0058A3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
            {submitting ? 'Checking...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setCode('');
              setStage('recoveryCodeEntry');
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-slate-50"
          >
            <KeyRound size={16} />
            Use a recovery code instead
          </button>
        </form>
      </main>
    );
  }

  if (stage === 'recoveryCodeEntry') {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6">
        <form
          onSubmit={submitRecoveryCode}
          className="w-full rounded-2xl border border-[#D1D5DB] bg-white p-8 shadow-lg shadow-slate-900/5"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Lost your device?</p>
          <h1 className="mt-3 text-2xl font-bold text-[#111827]">Enter a recovery code</h1>
          <p className="mt-2 text-sm text-slate-600">Each code works once. You were shown these when you first set up two-step verification.</p>

          <input
            type="text"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            placeholder="XXXXX-XXXXX"
            autoFocus
            className="mt-6 w-full rounded-lg border border-[#D1D5DB] bg-white px-4 py-3 text-[#111827] outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#0058A3]"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !recoveryCode}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0058A3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
            {submitting ? 'Checking...' : 'Sign in with recovery code'}
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setRecoveryCode('');
              setStage('totp');
            }}
            className="mt-3 text-sm font-semibold text-[#0058A3] hover:underline"
          >
            Back to authenticator code
          </button>
        </form>
      </main>
    );
  }

  if (stage === 'recoveryCodes') {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-[#D1D5DB] bg-white p-8 shadow-lg shadow-slate-900/5">
          <p className="text-sm uppercase tracking-[0.3em] text-[#0058A3]">Save these now</p>
          <h1 className="mt-3 text-2xl font-bold text-[#111827]">Your recovery codes</h1>
          <p className="mt-2 text-sm text-slate-600">
            Each code can be used once to sign in if you lose access to your authenticator app. They will not be shown again.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[#F5F7FA] p-4 font-mono text-sm text-[#111827]">
            {recoveryCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(recoveryCodes.join('\n')).catch(() => {});
            }}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#F5F7FA]"
          >
            <Copy size={16} />
            Copy codes
          </button>

          <button
            onClick={() => setStage('loggedIn')}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0058A3] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1E40AF]"
          >
            I've saved these, continue
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex flex-wrap items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-[#0058A3] text-white' : 'border border-[#D1D5DB] bg-white text-[#111827] hover:bg-[#F5F7FA]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#F5F7FA]"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      {children}
    </div>
  );
}
