const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface RegisterPayload {
  [key: string]: unknown;
}

export interface ApplyLeavePayload {
  user_id: string;
  reason: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
}

const DEFAULT_TIMEOUT_MS = 15000;

export function safeRedirect(target: string): string {
  if (!target || typeof target !== "string") return "/login";
  const trimmed = target.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return trimmed;
  }
  return "/login";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const isFormData = options.body instanceof FormData;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });

    const text = await response.text();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: Record<string, any>;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text || "Invalid response format" };
    }

    if (!response.ok) {
      const errorMsg =
        typeof data.detail === "string"
          ? data.detail
          : typeof data.message === "string"
          ? data.message
          : `HTTP Error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Authentication
  loginPassword: (email: string, password: string) =>
    request("/auth/login-password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  sendOtp: (email: string) =>
    request("/auth/login-otp/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request("/auth/login-otp/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  register: (data: RegisterPayload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: (token: string) =>
    request("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  listStudents: (token: string) =>
    request("/auth/students", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  googleLogin: (email: string, name: string, role: string = "student") =>
    request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ email, name, role }),
    }),

  forgotPassword: (email: string) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, newPassword: string) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, new_password: newPassword }),
    }),

  // Attendance
  getStudentStats: (email: string, token: string) =>
    request(`/student/stats/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAdminStats: (token: string) =>
    request("/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getActivityLog: (token: string) =>
    request("/admin/activity-log", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getActiveSession: () =>
    request("/sessions/active"),

  startSession: (teacherEmail: string, subject: string) =>
    request("/sessions/start", {
      method: "POST",
      body: JSON.stringify({ teacher_email: teacherEmail, subject }),
    }),

  stopSession: (sessionId: string) =>
    request("/sessions/stop", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
    }),

  // Leave Management
  getLeaveBalance: (email: string, token: string) =>
    request(`/leave/balance/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  applyLeave: (data: ApplyLeavePayload, token: string) =>
    request("/leave/apply", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  getStudentLeaves: (email: string, token: string) =>
    request(`/leave/student/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPendingLeaves: (token: string) =>
    request("/leave/admin/pending", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  leaveAction: (leaveId: string, status: string, remarks: string, token: string) =>
    request("/leave/action", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ leave_id: leaveId, status, remarks }),
    }),

  // Notifications
  getNotifications: (email: string, token: string) =>
    request(`/notifications/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

    markNotificationsRead: (ids: string[], token: string) =>
    request("/notifications/mark-read", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids }),
    }),

  askAi: (email: string, query: string, token: string) =>
    request("/ai/ask", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email, query }),
    }),

  getParentChildren: (token: string) =>
    request("/parent/children", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getParentChildStats: (email: string, token: string) =>
    request(`/parent/child/stats/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getParentChildLeaves: (email: string, token: string) =>
    request(`/parent/child/leaves/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getParentChildAttendanceLogs: (email: string, token: string) =>
    request(`/parent/child/attendance-logs/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  logout: (token: string) =>
    request("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSessions: (token: string) =>
    request("/auth/sessions/active", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  revokeSession: (sessionId: string, token: string) =>
    request(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  logoutAll: (token: string) =>
    request("/auth/sessions/logout-all", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSystemAuditLogs: (token: string) =>
    request("/system/audit-logs", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSystemDbStats: (token: string) =>
    request("/system/db-stats", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSecurityLogs: (token: string) =>
    request("/security/logs", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  completeProfile: (data: Record<string, unknown>, token: string) =>
    request("/auth/update-profile", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  registerFaceBiometrics: (images: string[], token: string) =>
    request("/auth/register-biometric", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ images }),
    }),

  getMe: (token: string) =>
    request("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  uploadAvatar: (formData: FormData, token: string) =>
    request("/auth/upload-avatar", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }),

  // Reports (server-side CSV/Excel/JSON export)
  getStudentReport: (email: string, token: string, format: string = "json") =>
    request(`/reports/student/${email}?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getClassReport: (sessionId: string, token: string, format: string = "json") =>
    request(`/reports/class/${sessionId}?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getDepartmentReport: (dept: string, token: string, format: string = "json") =>
    request(`/reports/department/${encodeURIComponent(dept)}?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Mark Attendance (QR & Face)
  markAttendance: (studentEmail: string, sessionId: string, qrCode: string, token: string) =>
    request("/attendance/mark", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ student_email: studentEmail, session_id: sessionId, qr_code: qrCode }),
    }),

  markFaceAttendance: (formData: FormData, token: string) =>
    request("/attendance/mark/face", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }),

  // Academic Timetable
  getTimetable: (token: string) =>
    request("/academic/timetable", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // System Health
  getHealth: () =>
    request("/health"),
};

