'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '@/lib/types';
import { DEMO_PROFILES } from '@/lib/demo-data';
import { setAuthCookies, clearAuth, getStoredUser, getRole, isAuthenticated, DEMO_ACCOUNTS } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';

interface AuthContextValue {
  user: UserProfile | null;
  role: UserRole | null;
  authed: boolean;
  loading: boolean;
  login: (role: UserRole) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithToken: (data: { access_token: string; role?: string; full_name?: string; email?: string; user_id?: string; profilePhotoUrl?: string }) => void;
  register: (data: { email: string; password: string; full_name: string; role: UserRole }) => Promise<{ success: boolean; error?: string }>;
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

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      const normalized = email.trim().toLowerCase();

      // 1. Try real backend authentication
      try {
        const data = await api.auth.login(normalized, password);
        if (data && data.access_token) {
          const userRole = (data.role?.toLowerCase() as UserRole) || 'student';
          const profile: UserProfile = {
            id: data.user_id || 'usr_' + Math.random().toString(36).slice(2, 9),
            name: data.full_name || email.split('@')[0],
            email: data.email || normalized,
            role: userRole,
            avatar: data.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          };
          setAuthCookies(data.access_token, userRole, profile);
          setUser(profile);
          setRole(userRole);
          setAuthed(true);
          return { success: true };
        }
      } catch (err: unknown) {
        // Fallback to local demo accounts if API failed or offline
        const match = (Object.entries(DEMO_ACCOUNTS) as [UserRole, { email: string; password: string; name: string }][]).find(
          ([, acc]) => acc.email === normalized && acc.password === password
        );
        if (match) {
          const [selectedRole] = match;
          const fullProfile = DEMO_PROFILES[selectedRole];
          const token = `demo_${selectedRole}_${Math.random().toString(36).slice(2, 18)}`;
          setAuthCookies(token, selectedRole, fullProfile);
          setUser(fullProfile);
          setRole(selectedRole);
          setAuthed(true);
          return { success: true };
        }

        const msg = err instanceof ApiError ? err.message : 'Invalid credentials. Please check your email and password.';
        return { success: false, error: msg };
      }

      // Check demo accounts if login returned unexpected shape
      const match = (Object.entries(DEMO_ACCOUNTS) as [UserRole, { email: string; password: string; name: string }][]).find(
        ([, acc]) => acc.email === normalized && acc.password === password
      );
      if (match) {
        const [selectedRole] = match;
        const fullProfile = DEMO_PROFILES[selectedRole];
        const token = `demo_${selectedRole}_${Math.random().toString(36).slice(2, 18)}`;
        setAuthCookies(token, selectedRole, fullProfile);
        setUser(fullProfile);
        setRole(selectedRole);
        setAuthed(true);
        return { success: true };
      }

      return { success: false, error: 'Invalid credentials. Please check your email and password.' };
    },
    []
  );

  const register = useCallback(
    async (regData: { email: string; password: string; full_name: string; role: UserRole }): Promise<{ success: boolean; error?: string }> => {
      try {
        const data = await api.auth.register(regData);
        if (data && data.access_token) {
          const userRole = (data.role?.toLowerCase() as UserRole) || regData.role;
          const profile: UserProfile = {
            id: data.user_id || 'usr_' + Math.random().toString(36).slice(2, 9),
            name: data.full_name || regData.full_name,
            email: data.email || regData.email,
            role: userRole,
            avatar: data.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          };
          setAuthCookies(data.access_token, userRole, profile);
          setUser(profile);
          setRole(userRole);
          setAuthed(true);
          return { success: true };
        }
        return { success: true };
      } catch (err: unknown) {
        // Fallback for demo environment if backend unreachable
        if (err instanceof ApiError && err.status === 0) {
          const fullProfile = DEMO_PROFILES[regData.role];
          const token = `demo_${regData.role}_${Math.random().toString(36).slice(2, 18)}`;
          setAuthCookies(token, regData.role, fullProfile);
          setUser(fullProfile);
          setRole(regData.role);
          setAuthed(true);
          return { success: true };
        }
        const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
        return { success: false, error: msg };
      }
    },
    []
  );

  const loginWithToken = useCallback(
    (tokenData: { access_token: string; role?: string; full_name?: string; email?: string; user_id?: string; profilePhotoUrl?: string }) => {
      const userRole = (tokenData.role?.toLowerCase() as UserRole) || 'student';
      const profile: UserProfile = {
        id: tokenData.user_id || 'usr_' + Math.random().toString(36).slice(2, 9),
        name: tokenData.full_name || (tokenData.email ? tokenData.email.split('@')[0] : 'User'),
        email: tokenData.email || '',
        role: userRole,
        avatar: tokenData.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      };
      setAuthCookies(tokenData.access_token, userRole, profile);
      setUser(profile);
      setRole(userRole);
      setAuthed(true);
      router.push(`/${userRole}`);
    },
    [router]
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setRole(null);
    setAuthed(false);
    router.push('/auth/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, role, authed, loading, login, loginWithCredentials, loginWithToken, register, logout }}>
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
      loginWithCredentials: async () => ({ success: false }),
      loginWithToken: () => { },
      register: async () => ({ success: false }),
      logout: () => { },
    };
  }
  return ctx;
}
