'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '../lib/mockData';

interface AuthContextValue {
  user: UserProfile | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: UserProfile }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<UserProfile | null> {
  const res = await fetch('/api/auth/me', { method: 'GET' });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: unknown };
  if (!data.user) return null;

  // Map backend shape to existing frontend UserProfile type (best-effort)
  const u = data.user;
  return {
    id: Number(u.id) || u.id,
    name: u.name || 'User',
    email: u.email,
    role: u.role,
    membership: u.membership || 'Member',
    location: u.location || '',
    preferences: u.preferences || [],
    avatar: u.avatar || '',
    bio: u.bio || '',
  } as UserProfile;
}

export function BackendAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await fetchMe();
      setUser(u);
      setIsHydrated(true);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.message || data.error || 'Login failed' };
    }

    const u = await fetchMe();
    setUser(u);
    return { success: true, user: u || undefined };
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, isHydrated, login, logout }), [user, isHydrated, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useBackendAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useBackendAuth must be used inside BackendAuthProvider');
  return context;
}

