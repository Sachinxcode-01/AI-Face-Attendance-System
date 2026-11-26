import { api } from '@/lib/api';

export const studentNotificationsApi = {
  listFeed: async (
    params: { type?: string; unread?: boolean; search?: string },
    signal?: AbortSignal
  ) => {
    const [notifRes, annRes] = await Promise.all([
      api.notifications.list({ type: params.type, unread: params.unread }, signal),
      api.academic.announcements({ search: params.search || '' }, signal),
    ]);
    return {
      notifications: Array.isArray(notifRes?.notifications) ? notifRes.notifications : [],
      unreadCount: notifRes?.unread_count ?? 0,
      announcements: Array.isArray(annRes?.announcements) ? annRes.announcements : [],
    };
  },
  markRead: (id: string) => api.notifications.markRead(id),
  markAllRead: () => api.notifications.markAllRead(),
};
