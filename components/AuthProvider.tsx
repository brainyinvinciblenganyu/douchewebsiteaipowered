'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { currentUser, vendorUser, type UserProfile } from '../lib/mockData';

interface AuthContextValue {
  user: UserProfile | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: UserProfile }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'douche_auth_user';

const demoCredentials: Record<string, string> = {
  [currentUser.email]: 'customer123',
  [vendorUser.email]: 'vendor123',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as UserProfile;
        setUser(parsed);
      }
    } catch {
      setUser(null);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const matchingUser = normalizedEmail === currentUser.email
      ? currentUser
      : normalizedEmail === vendorUser.email
        ? vendorUser
        : null;

    const expectedPassword = demoCredentials[normalizedEmail];

    if (!matchingUser || password !== expectedPassword) {
      return {
        success: false,
        message: 'Use the demo credentials shown below to sign in.',
      };
    }

    setUser(matchingUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchingUser));
    return { success: true, user: matchingUser };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, isHydrated, login, logout }), [user, isHydrated, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
