import { api } from '@/lib/api';

export const studentProfileApi = {
  getExtras: async (signal?: AbortSignal) => {
    const [devRes, bioRes, profRes] = await Promise.allSettled([
      api.devices.list(signal),
      api.auth.biometricStatus(signal),
      api.auth.profile(signal),
    ]);
    return {
      devices: devRes.status === 'fulfilled' && Array.isArray(devRes.value?.devices) ? devRes.value.devices : [],
      bioStatus:
        bioRes.status === 'fulfilled' && bioRes.value
          ? {
              enrolled: Boolean(bioRes.value.enrolled),
              vector_version: bioRes.value.vector_version,
              updated_at: bioRes.value.updated_at,
            }
          : null,
      notificationPreferences:
        profRes.status === 'fulfilled' && profRes.value?.notification_preferences
          ? profRes.value.notification_preferences
          : null,
    };
  },
  updateProfile: api.student.updateProfile,
  uploadAvatar: api.student.uploadAvatar,
  changePassword: api.auth.changePassword,
  updateNotificationPreferences: api.auth.updateNotificationPreferences,
  deleteBiometric: api.auth.deleteBiometric,
  exportPrivacyData: api.auth.exportPrivacyData,
  requestAccountDeletion: api.auth.requestAccountDeletion,
  disconnectDevice: api.devices.disconnect,
  logoutAllDevices: api.devices.logoutAll,
};
