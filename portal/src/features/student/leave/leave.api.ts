import { api } from '@/lib/api';

export const studentLeaveApi = {
  list: (email: string, signal?: AbortSignal) => api.leave.student(email, signal),
  apply: (data: {
    user_id: string;
    reason: string;
    start_date: string;
    end_date: string;
    category?: string;
    document_url?: string;
    document_name?: string;
  }) => api.leave.apply(data),
  uploadDocument: (formData: FormData) => api.leave.uploadDocument(formData),
  withdraw: (leaveId: string) => api.leave.withdraw(leaveId),
};
