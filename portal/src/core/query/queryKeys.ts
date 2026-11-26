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

export const teacherKeys = {
  all: (email?: string | null) => ['teacher', (email || 'anon').toLowerCase()] as const,
  dashboard: (email?: string | null) => [...teacherKeys.all(email), 'dashboard'] as const,
  sessions: (email?: string | null) => [...teacherKeys.all(email), 'sessions'] as const,
  sessionRoster: (email?: string | null, sessionId?: string | null) =>
    [...teacherKeys.all(email), 'session-roster', sessionId ?? 'none'] as const,
  students: (email?: string | null, filters?: Record<string, string>) =>
    [...teacherKeys.all(email), 'students', filters ?? {}] as const,
  studentHistory: (email?: string | null, studentEmail?: string | null) =>
    [...teacherKeys.all(email), 'student-history', (studentEmail || '').toLowerCase()] as const,
  analytics: (email?: string | null, subject?: string) =>
    [...teacherKeys.all(email), 'analytics', subject || 'all'] as const,
  leaves: (email?: string | null, filters?: Record<string, string>) =>
    [...teacherKeys.all(email), 'leaves', filters ?? {}] as const,
  disputes: (email?: string | null, status?: string) =>
    [...teacherKeys.all(email), 'disputes', status || 'all'] as const,
  timetable: (email?: string | null) => [...teacherKeys.all(email), 'timetable'] as const,
  timetableConflicts: (email?: string | null) => [...teacherKeys.all(email), 'timetable-conflicts'] as const,
  notifications: (email?: string | null, filters?: Record<string, string | boolean>) =>
    [...teacherKeys.all(email), 'notifications', filters ?? {}] as const,
  announcements: (email?: string | null) => [...teacherKeys.all(email), 'announcements'] as const,
  kioskDiagnostics: (email?: string | null) => [...teacherKeys.all(email), 'kiosk-diagnostics'] as const,
  reportSummary: (email?: string | null, params?: Record<string, string>) =>
    [...teacherKeys.all(email), 'report-summary', params ?? {}] as const,
  nexaConversations: (email?: string | null) =>
    [...teacherKeys.all(email), 'nexa-conversations'] as const,
  profileExtras: (email?: string | null) => [...teacherKeys.all(email), 'profile-extras'] as const,
};
