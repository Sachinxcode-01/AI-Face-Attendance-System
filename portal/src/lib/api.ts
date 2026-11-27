import { getToken, setAuthCookies, getRole, getStoredUser, clearAuth } from './auth';

export const BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/static/') || url.startsWith('/leave/')) {
    return `${BASE_URL}${url}`;
  }
  return url;
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
 * Supports request timeouts, safe retries with backoff for idempotent GETs,
 * Bearer token injection, 401 refresh-token rotation, and clean error reporting.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  _retried = false,
  _attempt = 0
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method || 'GET').toUpperCase();
  const isIdempotentGet = method === 'GET';
  const controller = new AbortController();
  const timeoutMs = 15000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (isIdempotentGet && _attempt < 2 && !(err instanceof DOMException && err.name === 'AbortError' && options.signal?.aborted)) {
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, _attempt)));
      return apiFetch<T>(path, options, _retried, _attempt + 1);
    }
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    throw new ApiError(
      isOffline ? 'You appear to be offline. Check your internet connection and retry.' : 'Service unavailable or timed out. Please try again.',
      0
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401 && !_retried && !path.startsWith('/auth/login') && !path.startsWith('/auth/token/refresh')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, true, _attempt);
    }
    if (typeof window !== 'undefined' && getToken()) {
      clearAuth();
    }
  }

  if (res.status >= 502 && res.status <= 504 && isIdempotentGet && _attempt < 2) {
    await new Promise((r) => setTimeout(r, 400 * Math.pow(2, _attempt)));
    return apiFetch<T>(path, options, _retried, _attempt + 1);
  }

  if (!res.ok) {
    let detail = 'Request failed. Please try again.';
    try {
      const body = await res.json();
      if (body && typeof body.detail === 'string') detail = body.detail;
      else if (body && typeof body.message === 'string') detail = body.message;
    } catch {
      /* keep generic message — never leak raw server errors */
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiDownload(path: string, fallbackFilename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    let detail = 'Download failed. Please try again.';
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch { }
    throw new ApiError(detail, res.status);
  }
  const blob = await res.blob();
  const disp = res.headers.get('content-disposition') || '';
  const match = disp.match(/filename="?([^";]+)"?/i);
  const filename = match ? match[1] : fallbackFilename;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
    profile: (signal?: AbortSignal) => apiFetch<any>('/auth/profile', { signal }),
    changePassword: (data: { current_password: string; new_password: string }) =>
      apiFetch<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateNotificationPreferences: (prefs: {
      email?: boolean;
      push?: boolean;
      in_app?: boolean;
      shortage_alerts?: boolean;
      reminder_minutes_before?: number;
      quiet_hours?: { enabled?: boolean; start?: string; end?: string };
    }) =>
      apiFetch<{ success: boolean; message: string; notification_preferences?: any }>('/auth/notification-preferences', {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      }),
    biometricStatus: (signal?: AbortSignal) =>
      apiFetch<{
        success: boolean;
        enrolled: boolean;
        biometric_registered: boolean;
        consent_given: boolean;
        consent_timestamp: string | null;
        vector_version: string | null;
        updated_at: string | null;
      }>('/auth/biometric-status', { signal }),
    registerBiometric: (formData: FormData) =>
      apiFetch<{ success: boolean; message: string; enrolled: boolean }>('/auth/register-biometric', {
        method: 'POST',
        body: formData,
      }),
    deleteBiometric: () =>
      apiFetch<{ success: boolean; message: string }>('/auth/biometric', { method: 'DELETE' }),
    exportPrivacyData: () => apiFetch<any>('/auth/privacy/export'),
    requestAccountDeletion: (reason?: string) =>
      apiFetch<{ success: boolean; message: string }>('/auth/privacy/delete-request', {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    requestOtp: (email: string) =>
      apiFetch<{ success: boolean; message: string }>('/auth/login-otp/send', {
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
    dashboard: (signal?: AbortSignal) => apiFetch<any>('/attendance/dashboard', { signal }),
    heatmap: (days = 30, signal?: AbortSignal) => apiFetch<any>(`/attendance/heatmap?days=${days}`, { signal }),
    student: (email: string, params: Record<string, string | number> = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
          if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
          return acc;
        }, {})
      ).toString();
      return apiFetch<any>(`/attendance/student/${encodeURIComponent(email)}${qs ? `?${qs}` : ''}`, { signal });
    },
    analytics: (email: string, target?: number, signal?: AbortSignal) =>
      apiFetch<any>(`/attendance/student/analytics/${encodeURIComponent(email)}${target != null ? `?target=${target}` : ''}`, { signal }),
    simulateForecast: (data: { target: number; attend_upcoming: number; miss_upcoming: number; subject?: string }) =>
      apiFetch<any>('/attendance/forecast/simulate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    disputes: {
      list: (signal?: AbortSignal) => apiFetch<{ disputes: any[] }>('/attendance/disputes', { signal }),
      create: (data: {
        session_id: string;
        subject?: string;
        reason_category?: string;
        reason: string;
        requested_status?: 'Present' | 'Excused' | 'Late';
        attendance_id?: string;
      }) =>
        apiFetch<{ success: boolean; id: string; dispute: any }>('/attendance/disputes', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      resolve: (id: string, data: { action: string; remarks?: string; updated_status?: string }) =>
        apiFetch<{ success: boolean; status: string; dispute: any }>(`/attendance/disputes/${encodeURIComponent(id)}/resolve`, {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
    batchMark: (data: {
      session_id: string;
      reason?: string;
      records: Array<{ student_email?: string; student_id?: string; usn?: string; status: string; reason?: string }>;
    }) =>
      apiFetch<{ success: boolean; updated_count: number; failed_count: number; updated: any[]; rejected: any[] }>('/attendance/mark/batch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    markFaceKiosk: (formData: FormData) =>
      apiFetch<any>('/attendance/mark/face/kiosk', {
        method: 'POST',
        body: formData,
      }),
    downloadReport: (email: string, params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      const fmt = params.format || 'csv';
      const ext = fmt === 'excel' ? 'xls' : fmt === 'html' ? 'html' : 'csv';
      return apiDownload(`/reports/student/${encodeURIComponent(email)}${qs ? `?${qs}` : ''}`, `attendance_report.${ext}`);
    },
    markQr: (sessionId: string, qrCode: string, lat?: number, lng?: number) =>
      apiFetch<any>('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          qr_code: qrCode,
          latitude: lat,
          longitude: lng,
        }),
      }),
    markFace: (formData: FormData) =>
      apiFetch<any>('/attendance/mark/face', {
        method: 'POST',
        body: formData,
      }),
    auditLogs: () => apiFetch('/attendance/audit-logs'),
  },
  ai: {
    chat: (message: string, language = 'en', opts: { conversationId?: string; history?: Array<{ role: string; content: string }>; currentRoute?: string; student_email?: string } = {}) =>
      apiFetch<{ success: boolean; conversationId: string; reply: string; message?: any; suggestedActions?: any[]; sources?: any[] }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, language, ...opts }),
      }),
    streamChat: async (
      message: string,
      language = 'en',
      opts: {
        conversationId?: string;
        history?: Array<{ role: string; content: string }>;
        currentRoute?: string;
        student_email?: string;
        signal?: AbortSignal;
        onDelta?: (text: string) => void;
        onStatus?: (status: { stage?: string; intent?: string }) => void;
        onDone?: (payload: any) => void;
      } = {}
    ) => {
      const token = getToken();
      const { signal, onDelta, onStatus, onDone, ...bodyOpts } = opts;
      const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        signal,
        body: JSON.stringify({ message, language, ...bodyOpts }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(err?.detail || 'Streaming request failed', res.status);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalPayload: any = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() || '';
        for (const frame of frames) {
          const eventLine = frame.split('\n').find((l) => l.startsWith('event:'));
          const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          const eventName = eventLine ? eventLine.slice(6).trim() : 'message';
          const parsed = JSON.parse(dataLine.slice(5).trim());
          if (eventName === 'delta' && parsed?.text) onDelta?.(parsed.text);
          else if (eventName === 'status') onStatus?.(parsed);
          else if (eventName === 'done') {
            finalPayload = parsed;
            onDone?.(parsed);
          } else if (eventName === 'error') {
            throw new ApiError(parsed?.detail || 'Stream error', 400);
          }
        }
      }
      return finalPayload;
    },
    conversations: (signal?: AbortSignal) => apiFetch<{ conversations: any[] }>('/ai/conversations', { signal }),
    updateConversation: (id: string, data: { title?: string; archived?: boolean }) =>
      apiFetch<{ success: boolean; conversation: any }>(`/ai/conversations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteConversation: (id: string) =>
      apiFetch<{ success: boolean }>(`/ai/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    confirmAction: (actionId: string) =>
      apiFetch<{ success: boolean; status: string; result?: any }>(`/ai/actions/${encodeURIComponent(actionId)}/confirm`, {
        method: 'POST',
      }),
    feedback: (data: { responseId: string; rating: 'helpful' | 'not_helpful'; category?: string; feedback?: string; currentRoute?: string }) =>
      apiFetch<{ success: boolean; feedbackId: string }>('/ai/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  academic: {
    timetable: () => apiFetch<any[]>('/academic/timetable'),
    timetableSummary: (signal?: AbortSignal) => apiFetch<any>('/academic/timetable/summary', { signal }),
    downloadTimetableIcs: () => apiDownload('/academic/timetable/export.ics', 'smartface_timetable.ics'),
    announcements: (params: Record<string, string> = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch<{ announcements: any[] }>(`/academic/announcements${qs ? `?${qs}` : ''}`, { signal });
    },
    holidays: () => apiFetch('/academic/holidays'),
    calendar: () => apiFetch('/academic/calendar'),
  },
  sessions: {
    active: (signal?: AbortSignal) => apiFetch<{
      is_active: boolean;
      session_id?: string;
      teacher_id?: string;
      subject?: string;
      room?: string;
      start_time?: string;
      duration?: string;
      geofence_enabled?: boolean;
      sessions?: any[];
    }>('/sessions/active', { signal }),
  },
  student: {
    updateProfile: (data: {
      full_name?: string;
      phone?: string;
      dob?: string;
      gender?: string;
      address?: string;
      language_preference?: string;
      theme_preference?: string;
      avatar_url?: string;
    }) =>
      apiFetch<{ success: boolean; message: string; user?: any }>('/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadAvatar: (formData: FormData) =>
      apiFetch<{ success: boolean; profilePhotoUrl?: string; avatar_url?: string; user?: any }>('/auth/upload-avatar', {
        method: 'POST',
        body: formData,
      }),
  },
  teacher: {
    dashboard: (signal?: AbortSignal) => apiFetch<any>('/teacher/dashboard', { signal }),
    sessions: (signal?: AbortSignal) => apiFetch<any[]>('/teacher/sessions', { signal }),
    sessionRoster: (sessionId: string, signal?: AbortSignal) =>
      apiFetch<any>(`/teacher/sessions/${encodeURIComponent(sessionId)}/roster`, { signal }),
    students: (search = '', signal?: AbortSignal) =>
      apiFetch<any[]>(`/teacher/students${search ? `?search=${encodeURIComponent(search)}` : ''}`, { signal }),
    studentsMeta: (params: Record<string, string> = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString();
      return apiFetch<any>(`/teacher/students/meta${qs ? `?${qs}` : ''}`, { signal });
    },
    studentHistory: (email: string, signal?: AbortSignal) =>
      apiFetch<any>(`/teacher/students/${encodeURIComponent(email)}/history`, { signal }),
    analytics: (subject?: string, signal?: AbortSignal) =>
      apiFetch<any>(`/teacher/analytics${subject && subject !== 'all' ? `?subject=${encodeURIComponent(subject)}` : ''}`, { signal }),
    logIntervention: (data: {
      student_email: string;
      subject?: string;
      risk_level?: string;
      action_taken?: 'note' | 'reminder_sent' | 'escalated' | 'counseling_scheduled';
      note: string;
      escalated_to?: string;
    }) =>
      apiFetch<{ success: boolean; intervention: any }>('/teacher/interventions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    sendAlert: (data: { student_email: string; title?: string; message: string; priority?: string }) =>
      apiFetch<{ success: boolean; recipient: string; parent_notified: boolean }>('/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    kioskDiagnostics: (signal?: AbortSignal) =>
      apiFetch<any>('/teacher/kiosk/diagnostics', { signal }),
    reportSummary: (params: Record<string, string>) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString();
      return apiFetch<any>(`/teacher/reports/summary${qs ? `?${qs}` : ''}`);
    },
    exportReportDownload: (params: Record<string, string>) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString();
      const fmt = (params.format || 'csv').toLowerCase();
      const ext = fmt === 'xlsx' || fmt === 'excel' ? 'xls' : (fmt === 'html' || fmt === 'pdf' ? 'html' : 'csv');
      return apiDownload(`/teacher/reports/export${qs ? `?${qs}` : ''}`, `teacher_attendance_report.${ext}`);
    },
    exportReport: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      const url = `${BASE_URL}/teacher/reports/export${qs ? `?${qs}` : ''}`;
      const token = getToken();
      return fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    },
    announcements: {
      list: (signal?: AbortSignal) => apiFetch<{ announcements: any[] }>('/teacher/announcements', { signal }),
      create: (data: Record<string, unknown>) =>
        apiFetch<{ success: boolean; announcement: any }>('/teacher/announcements', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      remove: (id: string) =>
        apiFetch<{ success: boolean }>(`/teacher/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    },
    broadcast: (title: string, message: string, priority = 'Normal', extra: Record<string, unknown> = {}) =>
      apiFetch('/teacher/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, priority, ...extra }),
      }),
    startSession: (
      teacherEmail: string,
      subject: string,
      room = 'Main Hall',
      durationMinutes = 60,
      options: Record<string, unknown> = {}
    ) =>
      apiFetch<{ session_id: string; status?: string; already_active?: boolean; message: string }>('/sessions/start', {
        method: 'POST',
        body: JSON.stringify({
          teacher_email: teacherEmail,
          subject,
          room,
          duration_minutes: durationMinutes,
          ...options,
        }),
      }),
    transitionSession: (
      sessionId: string,
      action: string,
      payload: { reason?: string; extend_minutes?: number; auto_mark_absent?: boolean } = {}
    ) =>
      apiFetch<any>(`/sessions/${encodeURIComponent(sessionId)}/transition`, {
        method: 'POST',
        body: JSON.stringify({ action, ...payload }),
      }),
    regenerateQr: (sessionId: string, rotationSeconds?: number) =>
      apiFetch<any>(`/sessions/${encodeURIComponent(sessionId)}/qr-regenerate`, {
        method: 'POST',
        body: JSON.stringify(rotationSeconds ? { rotation_seconds: rotationSeconds } : {}),
      }),
    timetable: {
      list: (signal?: AbortSignal) => apiFetch<any[]>('/teacher/timetable', { signal }),
      conflicts: (signal?: AbortSignal) => apiFetch<any>('/academic/timetable/conflicts', { signal }),
      create: (body: Record<string, unknown>) =>
        apiFetch('/teacher/timetable', { method: 'POST', body: JSON.stringify(body) }),
      update: (id: string, body: Record<string, unknown>) =>
        apiFetch(`/teacher/timetable/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
      remove: (id: string) => apiFetch(`/teacher/timetable/${id}`, { method: 'DELETE' }),
    },
    stopSession: (sessionId: string) =>
      apiFetch('/sessions/stop', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      }),
    qrToken: (sessionId: string) => apiFetch<any>(`/sessions/${sessionId}/qr-token`),
  },
  leave: {
    pending: () => apiFetch('/leave/admin/pending'),
    teacherList: (params: Record<string, string> = {}, signal?: AbortSignal) => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      ).toString();
      return apiFetch<{ leaves: any[]; total: number }>(`/leave/teacher${qs ? `?${qs}` : ''}`, { signal });
    },
    student: (email: string, signal?: AbortSignal) => apiFetch<any[]>(`/leave/student/${encodeURIComponent(email)}`, { signal }),
    apply: (data: {
      user_id: string;
      reason: string;
      start_date: string;
      end_date: string;
      category?: string;
      document_url?: string;
      document_name?: string;
    }) =>
      apiFetch<{ success?: boolean; message: string; id: string; leave?: any }>('/leave/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadDocument: (formData: FormData) =>
      apiFetch<{ success: boolean; document_url: string; document_name: string }>('/leave/upload-document', {
        method: 'POST',
        body: formData,
      }),
    withdraw: (leaveId: string) =>
      apiFetch<{ success: boolean; message: string; status: string }>(`/leave/${encodeURIComponent(leaveId)}/withdraw`, {
        method: 'PATCH',
      }),
    action: (leaveId: string, status: string, remarks: string) =>
      apiFetch('/leave/action', {
        method: 'PATCH',
        body: JSON.stringify({ leave_id: leaveId, status, remarks }),
      }),
  },
  admin: {
    stats: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
      return apiFetch<any>(`/management/stats${qs ? `?${qs}` : ''}`);
    },
    threats: () => apiFetch<any[]>('/management/threats'),
    calibration: {
      get: () => apiFetch<any>('/management/calibration'),
      update: (data: { similarity_threshold: number; liveness_required?: boolean; retention_days?: number }) =>
        apiFetch<any>('/management/calibration', { method: 'PATCH', body: JSON.stringify(data) }),
    },
    users: (params: string | Record<string, string | number> = '') => {
      if (typeof params === 'string') {
        return apiFetch<any>(`/management/users${params ? `?q=${encodeURIComponent(params)}` : ''}`);
      }
      const qs = new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
          if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
          return acc;
        }, {})
      ).toString();
      return apiFetch<any>(`/management/users${qs ? `?${qs}` : ''}`);
    },
    createUser: (data: Record<string, unknown>) =>
      apiFetch<any>('/management/users', { method: 'POST', body: JSON.stringify(data) }),
    updateUser: (id: string, data: Record<string, unknown>) =>
      apiFetch<any>(`/management/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    updateUserStatus: (id: string, status: string, reason?: string) =>
      apiFetch<any>(`/management/users/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    deleteUser: (id: string) =>
      apiFetch<any>(`/management/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    bulkPreview: (users: any[], default_role = 'student') =>
      apiFetch<any>('/management/users/bulk/preview', {
        method: 'POST',
        body: JSON.stringify({ users, default_role }),
      }),
    bulkImport: (users: any[], default_role = 'student') =>
      apiFetch<any>('/management/users/bulk', {
        method: 'POST',
        body: JSON.stringify({ users, default_role }),
      }),
    promoteStudents: (data: { student_ids: string[]; target_semester?: string; target_section?: string; target_academic_year?: string; archive_graduated?: boolean }) =>
      apiFetch<any>('/management/students/promote', { method: 'POST', body: JSON.stringify(data) }),
    exportStudentsCsv: () => apiDownload('/management/students/export', 'students_export.csv'),
    parents: {
      list: () => apiFetch<any>('/management/parents'),
      link: (parent_email: string, student_email: string) =>
        apiFetch<any>('/management/parents/link', { method: 'POST', body: JSON.stringify({ parent_email, student_email }) }),
      unlink: (parent_email: string, student_email: string) =>
        apiFetch<any>('/management/parents/unlink', { method: 'DELETE', body: JSON.stringify({ parent_email, student_email }) }),
    },
    departments: {
      list: () => apiFetch<any>('/management/departments'),
      create: (data: { name: string; code: string; hod_email?: string }) =>
        apiFetch<any>('/management/departments', { method: 'POST', body: JSON.stringify(data) }),
      remove: (id: string) => apiFetch<any>(`/management/departments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    },
    courses: {
      list: () => apiFetch<any>('/management/courses'),
      create: (data: { department_id: string; name: string; code: string; credits?: number }) =>
        apiFetch<any>('/management/courses', { method: 'POST', body: JSON.stringify(data) }),
    },
    sections: {
      list: () => apiFetch<any>('/management/sections'),
      create: (data: { course_id: string; name: string; semester: number; academic_year: string }) =>
        apiFetch<any>('/management/sections', { method: 'POST', body: JSON.stringify(data) }),
    },
    semesters: {
      list: () => apiFetch<any>('/management/semesters'),
      create: (data: { name: string; academic_year: string; start_date?: string; end_date?: string; status?: string }) =>
        apiFetch<any>('/management/semesters', { method: 'POST', body: JSON.stringify(data) }),
    },
    holidays: {
      list: () => apiFetch<any>('/management/holidays'),
      create: (data: { name: string; date: string; type?: string; description?: string }) =>
        apiFetch<any>('/management/holidays', { method: 'POST', body: JSON.stringify(data) }),
    },
    policy: {
      get: () => apiFetch<any>('/management/policy'),
      update: (data: Record<string, unknown>) =>
        apiFetch<any>('/management/policy', { method: 'PUT', body: JSON.stringify(data) }),
    },
    devices: {
      list: () => apiFetch<any>('/management/devices'),
      register: (data: { device_id: string; name: string; device_type?: string; campus?: string; classroom?: string }) =>
        apiFetch<any>('/management/devices', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Record<string, unknown>) =>
        apiFetch<any>(`/management/devices/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
      rotateCredential: (id: string) =>
        apiFetch<any>(`/management/devices/${encodeURIComponent(id)}/rotate-credential`, { method: 'POST' }),
    },
    biometrics: {
      list: () => apiFetch<any>('/management/biometrics'),
      eraseUser: (id: string) => apiFetch<any>(`/management/users/${encodeURIComponent(id)}/biometrics`, { method: 'DELETE' }),
    },
    disputes: (status = 'all') => apiFetch<any>(`/management/disputes?status=${encodeURIComponent(status)}`),
    leaves: (status = 'all') => apiFetch<any>(`/management/leaves?status=${encodeURIComponent(status)}`),
    announcements: {
      list: () => apiFetch<any>('/management/announcements'),
      create: (data: Record<string, unknown>) =>
        apiFetch<any>('/management/announcements', { method: 'POST', body: JSON.stringify(data) }),
    },
    broadcast: (data: { title: string; message: string; target_role?: string; department?: string; priority?: string }) =>
      apiFetch<any>('/management/notifications/broadcast', { method: 'POST', body: JSON.stringify(data) }),
    security: {
      logs: (status = 'all') => apiFetch<any[]>(`/security/logs?status=${encodeURIComponent(status)}`),
      updateIncident: (data: { log_id: string; status: string; assigned_to?: string; resolution_notes?: string; severity?: string }) =>
        apiFetch<any>('/security/acknowledge', { method: 'POST', body: JSON.stringify(data) }),
    },
    auditLogs: (module = 'all') => apiFetch<any>(`/management/audit-logs?module=${encodeURIComponent(module)}`),
    backups: () => apiFetch<any>('/management/backups'),
    settings: {
      get: () => apiFetch<any>('/management/settings'),
      update: (data: Record<string, unknown>) =>
        apiFetch<any>('/management/settings', { method: 'PUT', body: JSON.stringify(data) }),
    },
    riskCritical: () => apiFetch<any>('/management/risk/critical'),
    healthScore: () => apiFetch<any>('/management/health-score'),
    principalSummary: () => apiFetch<any>('/management/principal/summary'),
  },
  parent: {
        children: (signal?: AbortSignal) => apiFetch<any[]>('/parent/children', { signal }),
        relationships: (signal?: AbortSignal) => apiFetch<{ relationships: any[] }>('/parent/relationships', { signal }),
        revokeRelationship: (id: string, reason?: string) =>
          apiFetch<{ success: boolean; status: string }>(`/parent/relationships/${encodeURIComponent(id)}/revoke`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
          }),
        redeemInvitation: (data: { code: string; relationship_type?: string }) =>
          apiFetch<{ success: boolean; message: string; student?: any }>('/parent/invitations/redeem', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
            childDashboard: (email: string, signal?: AbortSignal) =>
              apiFetch<any>(`/parent/child/dashboard/${encodeURIComponent(email)}`, { signal }),
            childStats: (email: string, signal?: AbortSignal) =>
              apiFetch<any>(`/parent/child/stats/${encodeURIComponent(email)}`, { signal }),
            childAttendanceLogs: (email: string, params?: Record<string, string | number>, signal?: AbortSignal) => {
              const qs = params
                ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])).toString()
                : '';
              return apiFetch<any>(`/parent/child/attendance-logs/${encodeURIComponent(email)}${qs}`, { signal });
            },
            childTimetable: (email: string, signal?: AbortSignal) =>
              apiFetch<any>(`/parent/child/timetable/${encodeURIComponent(email)}`, { signal }),
            childLeaves: (email: string, signal?: AbortSignal) =>
              apiFetch<any[]>(`/parent/child/leaves/${encodeURIComponent(email)}`, { signal }),
            withdrawLeave: (leaveId: string) =>
              apiFetch<{ success: boolean; status: string }>(`/parent/child/leaves/${encodeURIComponent(leaveId)}/withdraw`, {
                method: 'POST',
              }),
            childDisputes: (email: string, signal?: AbortSignal) =>
              apiFetch<{ disputes: any[] }>(`/parent/child/disputes/${encodeURIComponent(email)}`, { signal }),
            submitDispute: (data: {
              student_email: string;
              session_id: string;
              reason: string;
              reason_category?: string;
              requested_status?: string;
              subject?: string;
            }) =>
              apiFetch<{ success: boolean; dispute: any }>('/attendance/disputes', {
                method: 'POST',
                body: JSON.stringify(data),
              }),
            contacts: (email: string, signal?: AbortSignal) =>
              apiFetch<{ contacts: any[] }>(`/parent/contacts/${encodeURIComponent(email)}`, { signal }),
            enquiries: (studentEmail?: string, signal?: AbortSignal) => {
              const qs = studentEmail ? `?student_email=${encodeURIComponent(studentEmail)}` : '';
              return apiFetch<{ enquiries: any[] }>(`/parent/enquiries${qs}`, { signal });
            },
            submitEnquiry: (data: { student_email: string; subject: string; category?: string; message: string }) =>
              apiFetch<{ success: boolean; enquiry: any }>('/parent/enquiries', {
                method: 'POST',
                body: JSON.stringify(data),
              }),
            profile: (signal?: AbortSignal) => apiFetch<{ profile: any }>('/parent/profile', { signal }),
            updateProfile: (data: Record<string, any>) =>
              apiFetch<{ success: boolean; profile: any }>('/parent/profile', {
                method: 'PATCH',
                body: JSON.stringify(data),
              }),
            submitAbsenceNotice: (data: {
              childEmail: string;
              reason: string;
              date?: string;
              start_date?: string;
              end_date?: string;
              category?: string;
              document_url?: string;
              document_name?: string;
            }) =>
              apiFetch<{ success: boolean; message: string; leave?: any }>('/parent/child/absence-notice', {
                method: 'POST',
                body: JSON.stringify(data),
              }),
            linkStudent: (data: {
              invitation_code?: string;
              student_email?: string;
              student_id?: string;
              relationship_type?: string;
            }) =>
              apiFetch<{ success: boolean; status?: string; message: string; student?: any }>('/parent/link-student', {
                method: 'POST',
                body: JSON.stringify(data),
              }),
            downloadReport: (email: string, format: 'csv' | 'excel' | 'html', type = 'overall') =>
              apiDownload(`/reports/student/${encodeURIComponent(email)}?format=${format}&type=${type}`, `ward_attendance_${type}.${format === 'excel' ? 'xls' : format}`),
          },
            devices: {
            list: (signal?: AbortSignal) => apiFetch<{ success: boolean; count: number; devices: any[] }>('/sessions/devices', { signal }),
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
            list: (params: { type?: string; unread?: boolean; limit?: number } = {}, signal?: AbortSignal) => {
              const qs = new URLSearchParams();
              if (params.type && params.type !== 'all') qs.set('type', params.type);
              if (params.unread) qs.set('unread', 'true');
              if (params.limit) qs.set('limit', String(params.limit));
              const str = qs.toString();
              return apiFetch<{ notifications: any[]; unread_count: number; preferences: any }>(`/notifications${str ? `?${str}` : ''}`, { signal });
            },
            markRead: (id: string) =>
              apiFetch<{ success: boolean; id: string; is_read: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, {
                method: 'PATCH',
              }),
            markAllRead: () =>
              apiFetch<{ success: boolean; message: string }>('/notifications/read-all', {
                method: 'PATCH',
              }),
          },
};
