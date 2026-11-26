import { api } from '@/lib/api';

export const studentAnalyticsApi = {
  getAnalytics: (email: string, target: number, signal?: AbortSignal) =>
    api.attendance.analytics(email, target, signal),
  simulateForecast: (data: { target: number; attend_upcoming: number; miss_upcoming: number; subject?: string }) =>
    api.attendance.simulateForecast(data),
};
