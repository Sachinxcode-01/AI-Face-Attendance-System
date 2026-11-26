'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentAttendanceApi } from './attendance.api';

export function useCreateDisputeMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentAttendanceApi.createDispute,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: [...studentKeys.all(email), 'attendance'] });
        qc.invalidateQueries({ queryKey: studentKeys.disputes(email) });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}
