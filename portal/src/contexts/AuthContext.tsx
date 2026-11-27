'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole } from '@/lib/types';
import { setAuthCookies, clearAuth, getStoredUser, getRole, isAuthenticated, getRoleRedirectPath } from '@/lib/auth';
import { api, ApiError, resolveMediaUrl } from '@/lib/api';
import { queryClient } from '@/core/query/queryClient';

interface AuthContextValue {
  user: UserProfile | null;
  role: UserRole | null;
  authed: boolean;
  loading: boolean;
  login: (role: UserRole) => void;
  loginWithCredentials: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; role?: UserRole; mfaRequired?: boolean; mfaToken?: string; error?: string }>;
  loginWithToken: (data: { access_token: string; role?: string; full_name?: string; email?: string; user_id?: string; profilePhotoUrl?: string }) => void;
  register: (data: { email: string; password: string; full_name: string; role: UserRole }) => Promise<{ success: boolean; error?: string }>;
  updateUser: (partial: Partial<UserProfile>) => void;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapApiUserToProfile(raw: any, fallbackRole: UserRole = 'student'): UserProfile {
  const userRole = (raw?.role?.toLowerCase() as UserRole) || fallbackRole;
  const photo = resolveMediaUrl(raw?.profilePhotoUrl || raw?.avatar_url || '');
  return {
    id: raw?.id || raw?._id || raw?.user_id || '',
    name: raw?.full_name || raw?.name || (raw?.email ? raw.email.split('@')[0] : 'User'),
    email: raw?.email || '',
    role: userRole,
    avatar: photo,
    department: raw?.department || undefined,
    rollNo: raw?.roll_number || raw?.student_id || raw?.usn || undefined,
    student_id: raw?.student_id || undefined,
    roll_number: raw?.roll_number || undefined,
    usn: raw?.usn || undefined,
    course: raw?.course || undefined,
    semester: raw?.semester || undefined,
    section: raw?.section || undefined,
    college: raw?.college || undefined,
    college_id: raw?.college_id || undefined,
    academic_year: raw?.academic_year || undefined,
    email_verified: Boolean(raw?.email_verified),
    biometric_registered: Boolean(raw?.biometric_registered),
    phone: raw?.phone || undefined,
    dob: raw?.dob || undefined,
    gender: raw?.gender || undefined,
    address: raw?.address || undefined,
    language_preference: raw?.language_preference || undefined,
    theme_preference: raw?.theme_preference || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated()) return;
    try {
      const data = await api.auth.profile();
      if (data && data.email) {
        const currentRole = (data.role?.toLowerCase() as UserRole) || getRole() || 'student';
        const profile = mapApiUserToProfile(data, currentRole);
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sf_token') : null;
        if (token) {
          setAuthCookies(token, currentRole, profile);
        }
        setUser(profile);
        setRole(currentRole);
      }
    } catch {
      /* keep stored user when offline or transient failure */
    }
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    const r = getRole();
    const isAuthed = isAuthenticated();
    setUser(stored);
    setRole(r);
    setAuthed(isAuthed);
    setLoading(false);
    if (isAuthed) {
      refreshProfile();
    }
  }, [refreshProfile]);

  const updateUser = useCallback((partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...partial };
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sf_token') : null;
      if (token) {
        setAuthCookies(token, merged.role, merged);
      }
      return merged;
    });
  }, []);

  const login = useCallback(
    async (selectedRole: UserRole) => {
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/demo-env/launch-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ environmentId: 'apex_tech', role: selectedRole }),
          });
          const data = await res.json();
          if (data && data.token) {
            const userRole = (data.persona?.role?.toLowerCase() as UserRole) || selectedRole;
            const profile = mapApiUserToProfile(
              { email: data.persona?.email, full_name: data.persona?.name },
              userRole
            );
            queryClient.clear();
            setAuthCookies(data.token, userRole, profile);
            setUser(profile);
            setRole(userRole);
            setAuthed(true);
            router.push(getRoleRedirectPath(userRole));
          }
        } catch (err) {
          console.error('Demo login unavailable:', err);
        }
      },
      [router]
  );

  const loginWithCredentials = useCallback(
      async (
        email: string,
        password: string,
        rememberMe = false
      ): Promise<{ success: boolean; role?: UserRole; mfaRequired?: boolean; mfaToken?: string; error?: string }> => {
        const normalized = email.trim().toLowerCase();

        try {
          const data = await api.auth.login(normalized, password, rememberMe);
          if (data && data.mfa_required && data.mfa_token) {
            return { success: false, mfaRequired: true, mfaToken: data.mfa_token };
          }
          if (data && data.access_token) {
            const userRole = (data.role?.toLowerCase() as UserRole) || 'student';
            const profile = mapApiUserToProfile(
              { ...data, email: data.email || normalized, full_name: data.full_name || email.split('@')[0] },
              userRole
            );
            queryClient.clear();
            setAuthCookies(data.access_token, userRole, profile);
            setUser(profile);
            setRole(userRole);
            setAuthed(true);
            refreshProfile();
            return { success: true, role: userRole };
          }
          return { success: false, error: 'Unable to sign in. Check your credentials and try again.' };
        } catch (err: unknown) {
          const msg = err instanceof ApiError ? err.message : 'Unable to sign in. Check your credentials and try again.';
          return { success: false, error: msg };
        }
      },
        [refreshProfile]
  );

  const register = useCallback(
    async (regData: { email: string; password: string; full_name: string; role: UserRole }): Promise<{ success: boolean; hasToken?: boolean; error?: string }> => {
      try {
        const data = await api.auth.register(regData);
        if (data && data.access_token) {
          const userRole = (data.role?.toLowerCase() as UserRole) || regData.role;
          const profile = mapApiUserToProfile(
            { ...data, email: data.email || regData.email, full_name: data.full_name || regData.full_name },
            userRole
          );
          setAuthCookies(data.access_token, userRole, profile);
          setUser(profile);
          setRole(userRole);
          setAuthed(true);
          return { success: true, hasToken: true };
        }
        return { success: true, hasToken: false };
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
        return { success: false, error: msg };
      }
    },
    []
  );

  const loginWithToken = useCallback(
    (tokenData: { access_token: string; role?: string; full_name?: string; email?: string; user_id?: string; profilePhotoUrl?: string }) => {
      const userRole = (tokenData.role?.toLowerCase() as UserRole) || 'student';
      const profile = mapApiUserToProfile(tokenData, userRole);
      queryClient.clear();
      setAuthCookies(tokenData.access_token, userRole, profile);
      setUser(profile);
      setRole(userRole);
      setAuthed(true);
      refreshProfile();
      router.push(getRoleRedirectPath(userRole));
    },
    [router, refreshProfile]
  );

  const logout = useCallback(() => {
    api.auth.logout().catch(() => { });
    clearAuth();
    queryClient.clear();
    setUser(null);
    setRole(null);
    setAuthed(false);
    router.push('/auth/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, role, authed, loading, login, loginWithCredentials, loginWithToken, register, updateUser, refreshProfile, logout }}>
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
      updateUser: () => { },
      refreshProfile: async () => { },
      logout: () => { },
    };
  }
  return ctx;
}
