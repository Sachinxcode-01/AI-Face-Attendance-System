'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentProfileApi } from './profile.api';

export function useStudentProfileExtrasQuery(email?: string | null) {
  return useQuery({
    queryKey: studentKeys.profileExtras(email),
    queryFn: ({ signal }) => studentProfileApi.getExtras(signal),
    enabled: Boolean(email),
    staleTime: 45_000,
  });
}

export function useUpdateProfileMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentProfileApi.updateProfile,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: studentKeys.profileExtras(email) });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}

export function useUploadAvatarMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentProfileApi.uploadAvatar,
    onSuccess: () => {
      if (email) qc.invalidateQueries({ queryKey: studentKeys.profileExtras(email) });
    },
  });
}

export function useDeleteBiometricMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentProfileApi.deleteBiometric,
    onSuccess: () => {
      if (email) {
        qc.invalidateQueries({ queryKey: studentKeys.profileExtras(email) });
        qc.invalidateQueries({ queryKey: studentKeys.biometricStatus(email) });
        qc.invalidateQueries({ queryKey: studentKeys.dashboard(email) });
      }
    },
  });
}

export function useDisconnectDeviceMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentProfileApi.disconnectDevice,
    onSuccess: () => {
      if (email) qc.invalidateQueries({ queryKey: studentKeys.profileExtras(email) });
    },
  });
}

export function useLogoutAllDevicesMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentProfileApi.logoutAllDevices,
    onSuccess: () => {
      if (email) qc.invalidateQueries({ queryKey: studentKeys.profileExtras(email) });
    },
  });
}
