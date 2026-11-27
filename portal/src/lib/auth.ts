'use client';

import { UserProfile, UserRole } from './types';

const TOKEN_KEY = 'sf_token';
const ROLE_KEY = 'sf_role';
const USER_KEY = 'sf_user';

const VALID_ROLES = new Set<string>(['student', 'teacher', 'admin', 'parent', 'super_admin']);

export function setAuthCookies(token: string, role: UserRole, user: UserProfile) {
  const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Lax${secureFlag}`;
  document.cookie = `${ROLE_KEY}=${role}; path=/; max-age=86400; SameSite=Lax${secureFlag}`;
  document.cookie = `${USER_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax${secureFlag}`;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSafeRedirectPath(from: string | null | undefined, fallback: string): string {
  if (!from || typeof from !== 'string') return fallback;
  const trimmed = from.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://smartface.local';
    const resolved = new URL(trimmed, base);
    if (resolved.origin !== base) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

export function isValidUserRole(role: string | null | undefined): role is UserRole {
  return Boolean(role && VALID_ROLES.has(role));
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
