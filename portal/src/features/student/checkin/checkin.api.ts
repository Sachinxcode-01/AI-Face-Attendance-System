import { api } from '@/lib/api';

export const studentCheckinApi = {
  getActiveSession: (signal?: AbortSignal) => api.sessions.active(signal),
  getBiometricStatus: (signal?: AbortSignal) => api.auth.biometricStatus(signal),
  registerBiometric: (formData: FormData) => api.auth.registerBiometric(formData),
  markQr: (payload: { sessionId: string; qrCode: string; lat?: number; lng?: number }) =>
    api.attendance.markQr(payload.sessionId, payload.qrCode, payload.lat, payload.lng),
  markFace: (formData: FormData) => api.attendance.markFace(formData),
};
