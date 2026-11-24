'use client';

import { UserProfile, UserRole } from './types';

const TOKEN_KEY = 'sf_token';
const ROLE_KEY = 'sf_role';
const USER_KEY = 'sf_user';

export const DEMO_ACCOUNTS: Record<
  UserRole,
  { email: string; password: string; name: string }
> = {
  student: { email: 'bob@smartface.pro', password: 'Student@2026', name: 'Bob Dylan' },
  teacher: { email: 'teacher@smartface.pro', password: 'Teacher@2026', name: 'Prof. Marcus Vance' },
  admin: { email: 'admin@smartface.pro', password: 'Admin@2026', name: 'System Administrator' },
  parent: { email: 'parent@smartface.pro', password: 'Parent@2026', name: 'Robert Cooper' },
  super_admin: { email: 'superadmin@smartface.pro', password: 'SuperAdmin@2026', name: 'Dr. Evelyn Cross' },
};

export function setAuthCookies(token: string, role: UserRole, user: UserProfile) {
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `${ROLE_KEY}=${role}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `${USER_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  [TOKEN_KEY, ROLE_KEY, USER_KEY].forEach((k) => {
    document.cookie = `${k}=; path=/; max-age=0`;
    localStorage.removeItem(k);
  });
}

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  if (typeof document === 'undefined') return null;
  const r = localStorage.getItem(ROLE_KEY);
  return (r as UserRole) || null;
}

export function getStoredUser(): UserProfile | null {
  if (typeof document === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function decodeTokenRole(): UserRole | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role as UserRole;
  } catch {
    return null;
  }
}

export function getRoleRedirectPath(role: UserRole | string | null | undefined): string {
  if (role === 'super_admin') return '/admin/super-admin';
  return role ? `/${role}` : '/student';
}
