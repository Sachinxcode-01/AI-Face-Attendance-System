import { api } from '@/lib/api';

export const studentTimetableApi = {
  getSummary: (signal?: AbortSignal) => api.academic.timetableSummary(signal),
  downloadIcs: () => api.academic.downloadTimetableIcs(),
};
