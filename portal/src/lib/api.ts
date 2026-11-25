import { getToken, setAuthCookies, getRole, getStoredUser } from './auth';

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

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/token/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.access_token) {
        const role = getRole() || 'student';
        const user = getStoredUser() || { id: 'me', name: 'User', email: '', role, avatar: '' };
        setAuthCookies(data.access_token, role, user);
        return data.access_token as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/**
 * Thin fetch wrapper around the Node/Express gateway API (port 8000).
 * Attaches the Bearer token, retries once on 401 via refresh-token rotation,
 * and surfaces generic messages to clients.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  _retried = false
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
  } catch {
    throw new ApiError('Service unavailable. Please try again shortly.', 0);
  }

  if (res.status === 401 && !_retried && !path.startsWith('/auth/login') && !path.startsWith('/auth/token/refresh')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, true);
    }
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
    logout: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),
    session: () => apiFetch<{ valid: boolean; user: Record<string, unknown> }>('/auth/session'),
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
    requestOtp: (email: string) =>
      apiFetch<{ success: boolean; message: string }>('/auth/login-otp/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    verifyOtp: (email: string, otp: string) =>
      apiFetch<{
        access_token: string;
        role: string;
        full_name?: string;
        user_id?: string;
        email?: string;
        profilePhotoUrl?: string;
      }>('/auth/login-otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),
    forgotPassword: (email: string) =>
      apiFetch<{ success: boolean; message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (data: { email: string; otp: string; new_password: string }) =>
      apiFetch<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  attendance: {
    dashboard: () => apiFetch('/attendance/dashboard'),
    heatmap: () => apiFetch('/attendance/heatmap'),
    student: (email: string) => apiFetch(`/attendance/student/${encodeURIComponent(email)}`),
    markQr: (sessionId: string, qrCode: string, lat?: number, lng?: number) =>
      apiFetch('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          qr_code: qrCode,
          latitude: lat,
          longitude: lng,
        }),
      }),
    markFace: (formData: FormData) =>
      apiFetch('/attendance/mark/face', {
        method: 'POST',
        body: formData,
      }),
    auditLogs: () => apiFetch('/attendance/audit-logs'),
  },
  ai: {
    chat: (message: string, language = 'en') =>
      apiFetch<{ success: boolean; reply: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, language }),
      }),
  },
  academic: {
    timetable: () => apiFetch('/academic/timetable'),
    holidays: () => apiFetch('/academic/holidays'),
    calendar: () => apiFetch('/academic/calendar'),
  },
  sessions: {
    active: () => apiFetch<{ is_active: boolean; session_id?: string; teacher_id?: string; subject?: string; start_time?: string; duration?: string }>('/sessions/active'),
  },
  student: {
    updateProfile: (data: { full_name?: string; phone?: string; avatar_url?: string }) =>
      apiFetch('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadAvatar: (formData: FormData) =>
      apiFetch<{ success: boolean; profilePhotoUrl?: string; avatar_url?: string }>('/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      }),
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
    student: (email: string) => apiFetch(`/leave/student/${encodeURIComponent(email)}`),
    apply: (data: { user_id: string; reason: string; start_date: string; end_date: string; category?: string }) =>
      apiFetch('/leave/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    action: (leaveId: string, status: string, remarks: string) =>
      apiFetch('/leave/action', {
        method: 'PATCH',
        body: JSON.stringify({ leave_id: leaveId, status, remarks }),
      }),
  },
  admin: {
    stats: () => apiFetch('/management/stats'),
    threats: () => apiFetch('/management/threats'),
    users: (search = '') =>
      apiFetch(`/management/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    auditLogs: () => apiFetch('/attendance/audit-logs'),
  },
  parent: {
    children: () => apiFetch<any[]>('/parent/children'),
    childStats: (email: string) => apiFetch<any>(`/parent/child/stats/${encodeURIComponent(email)}`),
    childAttendanceLogs: (email: string) =>
      apiFetch<any[]>(`/parent/child/attendance-logs/${encodeURIComponent(email)}`),
    childLeaves: (email: string) =>
      apiFetch<any[]>(`/parent/child/leaves/${encodeURIComponent(email)}`),
    submitAbsenceNotice: (data: { childEmail: string; reason: string; date?: string }) =>
      apiFetch<{ success: boolean; message: string }>('/parent/child/absence-notice', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    linkStudent: (data: { student_email?: string; student_id?: string }) =>
      apiFetch<{ success: boolean; message: string; student?: any }>('/parent/link-student', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  devices: {
    list: () => apiFetch<{ success: boolean; count: number; devices: any[] }>('/sessions/devices'),
    disconnect: (id: string) =>
      apiFetch<{ success: boolean; message: string }>(`/sessions/devices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    logoutAll: () =>
      apiFetch<{ success: boolean; message: string; revokedCount: number }>('/sessions/logout-all', {
        method: 'POST',
      }),
  },
  accuracy: {
    metrics: (hours = 168) =>
      apiFetch<{
        success: boolean;
        summary: {
          totalAttempts: number;
          successfulVerifications: number;
          successRate: number;
          overallAccuracy: number;
          estimatedFar: number;
          estimatedFrr: number;
          biometricEngine: string;
        };
        failureBreakdown: Record<string, number>;
        recentFailures: any[];
      }>(`/api/v1/accuracy/metrics?hours=${hours}`),
  },
  superAdmin: {
    colleges: async () => {
      const res = await apiFetch<{ success: boolean; count: number; colleges: any[] }>('/api/v1/super-admin/colleges');
      return {
        ...res,
        colleges: Array.isArray(res?.colleges)
          ? res.colleges.map((c) => ({
            ...c,
            activeStudents: typeof c.activeStudents === 'number'
              ? c.activeStudents
              : (typeof c.studentCount === 'number' ? c.studentCount : 0),
          }))
          : [],
      };
    },
    createCollege: (data: { name: string; code: string; plan?: string; adminEmail?: string }) =>
      apiFetch('/api/v1/super-admin/colleges', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    admins: () => apiFetch<{ success: boolean; count: number; admins: any[] }>('/api/v1/super-admin/admins'),
    globalAnalytics: () => apiFetch<{ success: boolean; platform: any }>('/api/v1/super-admin/global-analytics'),
    globalAttendance: () => apiFetch<{ success: boolean; recentScans: any[] }>('/api/v1/super-admin/global-attendance'),
    healthOverview: () => apiFetch<{ success: boolean; services: any }>('/api/v1/super-admin/health-overview'),
    securityDashboard: () => apiFetch<{ success: boolean; recentAlerts: any[]; activeSessionsCount: number }>('/api/v1/super-admin/security-dashboard'),
  },
  notifications: {
    list: () => apiFetch<any>('/notifications'),
  },
};
