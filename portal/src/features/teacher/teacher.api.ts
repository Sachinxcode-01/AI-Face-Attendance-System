'use client';

import { api } from '@/lib/api';
import type {
  TeacherDashboard,
  TeacherSession,
  TeacherAnalytics,
  TeacherLeaveRequest,
  TeacherDispute,
  TeacherReportSummary,
} from '@/lib/types';

export const teacherApi = {
  getDashboard: (signal?: AbortSignal) => api.teacher.dashboard(signal) as Promise<TeacherDashboard>,
  getSessions: (signal?: AbortSignal) => api.teacher.sessions(signal) as Promise<TeacherSession[]>,
  getSessionRoster: (sessionId: string, signal?: AbortSignal) => api.teacher.sessionRoster(sessionId, signal),
  startSession: (
    teacherEmail: string,
    subject: string,
    room: string,
    durationMinutes: number,
    options?: Record<string, unknown>
  ) => api.teacher.startSession(teacherEmail, subject, room, durationMinutes, options),
  transitionSession: (
    sessionId: string,
    action: string,
    payload?: { reason?: string; extend_minutes?: number; auto_mark_absent?: boolean }
  ) => api.teacher.transitionSession(sessionId, action, payload),
  stopSession: (sessionId: string) => api.teacher.stopSession(sessionId),
  regenerateQr: (sessionId: string, rotationSeconds?: number) => api.teacher.regenerateQr(sessionId, rotationSeconds),
  getQrToken: (sessionId: string) => api.teacher.qrToken(sessionId),
  getStudentsMeta: (params: Record<string, string>, signal?: AbortSignal) => api.teacher.studentsMeta(params, signal),
  getStudentHistory: (email: string, signal?: AbortSignal) => api.teacher.studentHistory(email, signal),
  batchMarkAttendance: (data: {
    session_id: string;
    reason?: string;
    records: Array<{ student_email?: string; student_id?: string; usn?: string; status: string; reason?: string }>;
  }) => api.attendance.batchMark(data),
  markFaceKiosk: (formData: FormData) => api.attendance.markFaceKiosk(formData),
  getKioskDiagnostics: (signal?: AbortSignal) => api.teacher.kioskDiagnostics(signal),
  getAnalytics: (subject?: string, signal?: AbortSignal) =>
    api.teacher.analytics(subject, signal) as Promise<TeacherAnalytics>,
  logIntervention: (data: {
    student_email: string;
    subject?: string;
    risk_level?: string;
    action_taken?: 'note' | 'reminder_sent' | 'escalated' | 'counseling_scheduled';
    note: string;
    escalated_to?: string;
  }) => api.teacher.logIntervention(data),
  sendStudentAlert: (data: { student_email: string; title?: string; message: string; priority?: string }) =>
    api.teacher.sendAlert(data),
  getLeaves: (params: Record<string, string>, signal?: AbortSignal) =>
    api.leave.teacherList(params, signal) as Promise<{ leaves: TeacherLeaveRequest[]; total: number }>,
  actLeave: (leaveId: string, status: string, remarks: string) => api.leave.action(leaveId, status, remarks),
  getDisputes: (signal?: AbortSignal) =>
    api.attendance.disputes.list(signal) as Promise<{ disputes: TeacherDispute[] }>,
  resolveDispute: (id: string, data: { action: string; remarks?: string; updated_status?: string }) =>
    api.attendance.disputes.resolve(id, data),
  getTimetable: (signal?: AbortSignal) => api.teacher.timetable.list(signal),
  getTimetableConflicts: (signal?: AbortSignal) => api.teacher.timetable.conflicts(signal),
  createTimetableSlot: (body: Record<string, unknown>) => api.teacher.timetable.create(body),
  updateTimetableSlot: (id: string, body: Record<string, unknown>) => api.teacher.timetable.update(id, body),
  deleteTimetableSlot: (id: string) => api.teacher.timetable.remove(id),
  downloadTimetableIcs: () => api.academic.downloadTimetableIcs(),
  getHolidays: () => api.academic.holidays(),
  getNotifications: (params: { type?: string; unread?: boolean; limit?: number }, signal?: AbortSignal) =>
    api.notifications.list(params, signal),
  markNotificationRead: (id: string) => api.notifications.markRead(id),
  markAllNotificationsRead: () => api.notifications.markAllRead(),
  broadcast: (title: string, message: string, priority: string, extra?: Record<string, unknown>) =>
    api.teacher.broadcast(title, message, priority, extra),
  getAnnouncements: (signal?: AbortSignal) => api.teacher.announcements.list(signal),
  createAnnouncement: (data: Record<string, unknown>) => api.teacher.announcements.create(data),
  deleteAnnouncement: (id: string) => api.teacher.announcements.remove(id),
  getReportSummary: (params: Record<string, string>) =>
    api.teacher.reportSummary(params) as Promise<TeacherReportSummary>,
  downloadReport: (params: Record<string, string>) => api.teacher.exportReportDownload(params),
  getNexaConversations: (signal?: AbortSignal) => api.ai.conversations(signal),
  sendNexaMessage: (
    message: string,
    language: string,
    opts?: { conversationId?: string; history?: Array<{ role: string; content: string }>; currentRoute?: string }
  ) => api.ai.chat(message, language, opts),
  deleteNexaConversation: (id: string) => api.ai.deleteConversation(id),
  sendNexaFeedback: (data: { responseId: string; rating: 'helpful' | 'not_helpful'; currentRoute?: string }) =>
    api.ai.feedback(data),
  getDevices: (signal?: AbortSignal) => api.devices.list(signal),
  disconnectDevice: (id: string) => api.devices.disconnect(id),
  logoutAllDevices: () => api.devices.logoutAll(),
  updateNotificationPreferences: (prefs: Parameters<typeof api.auth.updateNotificationPreferences>[0]) =>
    api.auth.updateNotificationPreferences(prefs),
};
