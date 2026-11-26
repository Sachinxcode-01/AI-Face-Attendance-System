'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentNotificationsApi } from './notifications.api';

export function useStudentNotificationsQuery(
  email?: string | null,
  filters: { type?: string; unread?: boolean; search?: string } = {}
) {
  return useQuery({
    queryKey: studentKeys.notifications(email, filters),
    queryFn: ({ signal }) => studentNotificationsApi.listFeed(filters, signal),
    enabled: Boolean(email),
    staleTime: 20_000,
  });
}

export function useMarkNotificationReadMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentNotificationsApi.markRead,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: [...studentKeys.all(email), 'notifications'] });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}

export function useMarkAllNotificationsReadMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentNotificationsApi.markAllRead,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: [...studentKeys.all(email), 'notifications'] });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}
