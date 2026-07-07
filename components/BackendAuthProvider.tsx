'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '../lib/mockData';
import { getAuthApiUrl } from '../lib/apiConfig';

interface AuthContextValue {
  user: UserProfile | null;
  isHydrated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string; user?: UserProfile }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMe(): Promise<UserProfile | null> {
  try {
    const res = await fetch(getAuthApiUrl('/me'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return null;

    const data = (await res.json().catch(() => ({}))) as { user?: unknown };
    if (!data.user) return null;

    const u = data.user as Record<string, unknown> | undefined;
    if (!u) return null;

    return {
      id: Number(u.id) || String(u.id),
      name: typeof u.name === 'string' ? u.name : 'User',
      email: typeof u.email === 'string' ? u.email : '',
      role: typeof u.role === 'string' ? (u.role as UserProfile['role']) : 'customer',
      membership: typeof u.membership === 'string' ? u.membership : 'Member',
      location: typeof u.location === 'string' ? u.location : '',
      preferences: Array.isArray(u.preferences) ? (u.preferences as string[]) : [],
      avatar: typeof u.avatar === 'string' ? u.avatar : '',
      bio: typeof u.bio === 'string' ? u.bio : '',
    } as UserProfile;
  } catch (error) {
    console.error('Auth session check failed', error);
    return null;
  }
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
    try {
      const res = await fetch(getAuthApiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.message || data.error || 'Login failed' };
      }

      const u = await fetchMe();
      setUser(u);
      return { success: true, user: u || undefined };
    } catch (error) {
      console.error('Auth login request failed', error);
      return { success: false, message: 'Unable to reach the backend. Make sure the backend is running on port 3001.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(getAuthApiUrl('/logout'), { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Auth logout request failed', error);
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isHydrated, login, logout }),
    [user, isHydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useBackendAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useBackendAuth must be used inside BackendAuthProvider');
  return context;
}

