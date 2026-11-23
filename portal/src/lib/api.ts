import { getToken } from './auth';

const BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Thin fetch wrapper around the Node/Express gateway API (port 8000).
 * Attaches the Bearer token, parses the backend's `{ detail }` error shape,
 * and surfaces generic messages to clients (per CLAUDE.md security rules).
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Service unavailable. Please try again shortly.', 0);
  }

  if (!res.ok) {
    let detail = 'Request failed. Please try again.';
    try {
      const body = await res.json();
      if (body && typeof body.detail === 'string') detail = body.detail;
    } catch {
      /* keep generic message — never leak raw server errors */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{
        access_token: string;
        role: string;
        full_name?: string;
        user_id?: string;
        email?: string;
        profilePhotoUrl?: string;
      }>('/auth/login-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: {
      email: string;
      password: string;
      full_name: string;
      role: string;
    }) =>
      apiFetch<{
        access_token: string;
        role: string;
        full_name?: string;
        user_id?: string;
        email?: string;
        profilePhotoUrl?: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    profile: () => apiFetch('/auth/profile'),
  },
  attendance: {
    dashboard: () => apiFetch('/attendance/dashboard'),
    heatmap: () => apiFetch('/attendance/heatmap'),
  },
  sessions: {
    active: () => apiFetch('/sessions/active'),
  },
  teacher: {
    dashboard: () => apiFetch('/teacher/dashboard'),
    sessions: () => apiFetch('/teacher/sessions'),
    students: (search = '') =>
      apiFetch(`/teacher/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    analytics: () => apiFetch('/teacher/analytics'),
    reportSummary: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch(`/teacher/reports/summary${qs ? `?${qs}` : ''}`);
    },
    exportReport: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      const url = `${BASE_URL}/teacher/reports/export${qs ? `?${qs}` : ''}`;
      const token = getToken();
      return fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    broadcast: (title: string, message: string, priority = 'Normal') =>
      apiFetch('/teacher/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, priority }),
      }),
    // Session lifecycle (teacher-scoped, complements /sessions/*)
    startSession: (teacherEmail: string, subject: string, room = 'Main Hall', durationMinutes = 60) =>
      apiFetch('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({
          teacher_email: teacherEmail,
          subject,
          room,
          duration_minutes: durationMinutes,
        }),
      }),
    timetable: {
      list: () => apiFetch('/teacher/timetable'),
      create: (body: Record<string, string>) =>
        apiFetch('/teacher/timetable', { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Record<string, string>) =>
        apiFetch(`/teacher/timetable/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      remove: (id: string) => apiFetch(`/teacher/timetable/${id}`, { method: 'DELETE' }),
    },
    stopSession: (sessionId: string) =>
      apiFetch('/sessions/stop', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      }),
    qrToken: (sessionId: string) => apiFetch(`/sessions/${sessionId}/qr-token`),
  },
  leave: {
    pending: () => apiFetch('/leave/admin/pending'),
    action: (leaveId: string, status: string, remarks: string) =>
      apiFetch('/leave/action', {
        method: 'PATCH',
        body: JSON.stringify({ leave_id: leaveId, status, remarks }),
      }),
  },
};
