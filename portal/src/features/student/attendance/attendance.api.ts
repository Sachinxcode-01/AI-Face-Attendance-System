import { api } from '@/lib/api';

export interface AttendanceHistoryFilters {
  status?: string;
  subject?: string;
  semester?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export const studentAttendanceApi = {
  getHistory: (email: string, filters: AttendanceHistoryFilters, signal?: AbortSignal) =>
    api.attendance.student(
      email,
      {
        limit: filters.limit ?? 200,
        status: filters.status && filters.status !== 'all' ? filters.status : '',
        subject: filters.subject && filters.subject !== 'all' ? filters.subject : '',
        semester: filters.semester && filters.semester !== 'all' ? filters.semester : '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
      },
      signal
    ),
  getDisputes: (signal?: AbortSignal) => api.attendance.disputes.list(signal),
  createDispute: (data: {
    session_id: string;
    subject?: string;
    reason_category?: string;
    reason: string;
    requested_status?: 'Present' | 'Excused' | 'Late';
    attendance_id?: string;
  }) => api.attendance.disputes.create(data),
  getHeatmap: (days: number, signal?: AbortSignal) => api.attendance.heatmap(days, signal),
  downloadReport: (email: string, params: Record<string, string>) =>
    api.attendance.downloadReport(email, params),
};
