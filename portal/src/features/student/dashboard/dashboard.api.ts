import { api } from '@/lib/api';

export const studentDashboardApi = {
  getDashboard: (signal?: AbortSignal) => api.attendance.dashboard(signal),
};
