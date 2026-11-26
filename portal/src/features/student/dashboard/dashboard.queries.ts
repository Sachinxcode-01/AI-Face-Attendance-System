'use client';

import { useQuery } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentDashboardApi } from './dashboard.api';

export function useStudentDashboardQuery(email?: string | null) {
  return useQuery({
    queryKey: studentKeys.dashboard(email),
    queryFn: ({ signal }) => studentDashboardApi.getDashboard(signal),
    enabled: Boolean(email),
    staleTime: 20_000,
  });
}
