'use client';

/**
 * Centralized, tenant- & user-scoped React Query key factory.
 * Every student query key includes the normalized user email so cached data
 * never leaks across students, institutions, or authentication sessions.
 */
export const studentKeys = {
  all: (email?: string | null) => ['student', (email || 'anon').toLowerCase()] as const,
  dashboard: (email?: string | null) => [...studentKeys.all(email), 'dashboard'] as const,
  attendance: (email?: string | null, filters?: Record<string, string | number>) =>
    [...studentKeys.all(email), 'attendance', filters ?? {}] as const,
  disputes: (email?: string | null) => [...studentKeys.all(email), 'disputes'] as const,
  heatmap: (email?: string | null, days?: number) =>
    [...studentKeys.all(email), 'heatmap', days ?? 30] as const,
  analytics: (email?: string | null, target?: number) =>
    [...studentKeys.all(email), 'analytics', target ?? 75] as const,
  timetable: (email?: string | null) => [...studentKeys.all(email), 'timetable'] as const,
  leaves: (email?: string | null) => [...studentKeys.all(email), 'leaves'] as const,
  notifications: (
    email?: string | null,
    filters?: { type?: string; unread?: boolean; search?: string }
  ) => [...studentKeys.all(email), 'notifications', filters ?? {}] as const,
  activeSession: (email?: string | null) =>
    [...studentKeys.all(email), 'active-session'] as const,
  biometricStatus: (email?: string | null) =>
    [...studentKeys.all(email), 'biometric-status'] as const,
  profileExtras: (email?: string | null) =>
    [...studentKeys.all(email), 'profile-extras'] as const,
  nexaConversations: (email?: string | null) =>
    [...studentKeys.all(email), 'nexa-conversations'] as const,
};
