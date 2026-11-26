'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentAnalyticsApi } from './analytics.api';

export function useStudentAnalyticsQuery(email?: string | null, target = 75) {
  return useQuery({
    queryKey: studentKeys.analytics(email, target),
    queryFn: ({ signal }) => studentAnalyticsApi.getAnalytics(email!, target, signal),
    enabled: Boolean(email),
    staleTime: 30_000,
  });
}

export function useSimulateForecastMutation() {
  return useMutation({
    mutationFn: studentAnalyticsApi.simulateForecast,
  });
}
