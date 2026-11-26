'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentCheckinApi } from './checkin.api';

export function useActiveSessionQuery(email?: string | null) {
  return useQuery({
    queryKey: studentKeys.activeSession(email),
    queryFn: ({ signal }) => studentCheckinApi.getActiveSession(signal),
    enabled: Boolean(email),
    staleTime: 10_000,
  });
}

export function useBiometricStatusQuery(email?: string | null) {
  return useQuery({
    queryKey: studentKeys.biometricStatus(email),
    queryFn: ({ signal }) => studentCheckinApi.getBiometricStatus(signal),
    enabled: Boolean(email),
    staleTime: 60_000,
  });
}

function invalidateAttendanceState(qc: ReturnType<typeof useQueryClient>, email?: string | null) {
  if (!email) return;
  qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
  qc.invalidateQueries({ queryKey: [...studentKeys.all(email), 'attendance'] });
  qc.invalidateQueries({ queryKey: [...studentKeys.all(email), 'analytics'] });
  qc.invalidateQueries({ queryKey: [...studentKeys.all(email), 'heatmap'] });
}

export function useEnrollBiometricMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentCheckinApi.registerBiometric,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: studentKeys.biometricStatus(email) });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}

/**
 * Attendance mutations deliberately avoid optimistic success updates:
 * attendance only appears confirmed after authoritative backend verification.
 */
export function useMarkQrAttendanceMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentCheckinApi.markQr,
    onSuccess: () => invalidateAttendanceState(qc, email),
  });
}

export function useMarkFaceAttendanceMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentCheckinApi.markFace,
    onSuccess: () => invalidateAttendanceState(qc, email),
  });
}
