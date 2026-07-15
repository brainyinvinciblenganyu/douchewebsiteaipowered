'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, User as UserIcon } from 'lucide-react';
import RequireAuth from '../../components/RequireAuth';
import { useBackendAuth } from '../../components/BackendAuthProvider';
import PageHero from '../../components/PageHero';

const MAX_AVATAR_BYTES = 1_500_000;

function ProfileForm() {
  const { user, refreshUser } = useBackendAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setLocation(user.location || '');
    setAvatarPreview(user.avatar || '');
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image is too large. Please choose a photo under 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result));
      setAvatarChanged(true);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload: Record<string, unknown> = { name, location };
      if (user?.role === 'vendor') payload.company_name = companyName;
      if (avatarChanged) payload.avatar_data = avatarPreview;

      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
        return;
      }

      await refreshUser();
      setAvatarChanged(false);
      setSaved(true);
    } catch {
      setError('Unable to reach the server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageHero>
      <p className="text-sm uppercase tracking-[0.3em] text-sky-100">Your account</p>
      <h1 className="mt-3 text-4xl font-semibold text-white">Profile</h1>
      <p className="mt-3 text-sky-100">Update your details and profile picture.</p>

      <form onSubmit={handleSave} className="mt-8 max-w-xl space-y-5 rounded-2xl bg-white/95 p-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#0058a3]/20 bg-slate-100"
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <UserIcon size={28} />
              </div>
            )}
          </button>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-slate-50"
            >
              <Upload size={14} />
              Upload photo
            </button>
            <p className="mt-1 text-xs text-slate-500">JPG or PNG, under 1.5MB.</p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#111827]">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-transparent focus:ring-2 focus:ring-[#0058a3]"
          />
        </div>

        {user?.role === 'vendor' && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#111827]">Company name</label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-transparent focus:ring-2 focus:ring-[#0058a3]"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold text-[#111827]">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#111827] outline-none focus:border-transparent focus:ring-2 focus:ring-[#0058a3]"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-700">Profile updated.</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0058a3] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : null}
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </PageHero>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <ProfileForm />
      </main>
    </RequireAuth>
  );
}
