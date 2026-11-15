'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '@/lib/types';
import { DEMO_PROFILES } from '@/lib/demo-data';
import { setAuthCookies, clearAuth, getStoredUser, getRole, isAuthenticated, DEMO_ACCOUNTS } from '@/lib/auth';

interface AuthContextValue {
  user: UserProfile | null;
  role: UserRole | null;
  authed: boolean;
  loading: boolean;
  login: (role: UserRole) => void;
  loginWithCredentials: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getStoredUser());
    setRole(getRole());
    setAuthed(isAuthenticated());
    setLoading(false);
  }, []);

  const login = useCallback(
    (selectedRole: UserRole) => {
      const profile = DEMO_PROFILES[selectedRole];
      const token = `demo_${selectedRole}_${Math.random().toString(36).slice(2, 18)}`;
      setAuthCookies(token, selectedRole, profile);
      setUser(profile);
      setRole(selectedRole);
      setAuthed(true);
      router.push(`/${selectedRole}`);
    },
    [router]
  );

  const loginWithCredentials = useCallback((email: string, password: string): boolean => {
    const normalized = email.trim().toLowerCase();
    const match = (Object.entries(DEMO_ACCOUNTS) as [UserRole, { email: string; password: string; name: string }][]).find(
      ([, acc]) => acc.email === normalized && acc.password === password
    );
    if (match) {
      const [selectedRole, profile] = match;
      const fullProfile = DEMO_PROFILES[selectedRole];
      const token = `demo_${selectedRole}_${Math.random().toString(36).slice(2, 18)}`;
      setAuthCookies(token, selectedRole, fullProfile);
      setUser(fullProfile);
      setRole(selectedRole);
      setAuthed(true);
      router.push(`/${selectedRole}`);
      return true;
    }
    return false;
  }, [router]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setRole(null);
    setAuthed(false);
    router.push('/auth/login');
  }, [router]);

  return (
      <AuthContext.Provider value={{ user, role, authed, loading, login, loginWithCredentials, logout }}>
        {children}
      </AuthContext.Provider>
      );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
      if (!ctx) {
    return {
        user: null,
      role: null,
      authed: false,
      loading: true,
      login: () => { },
      loginWithCredentials: () => false,
      logout: () => { },
    };
  }
      return ctx;
}
