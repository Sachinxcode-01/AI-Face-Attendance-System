'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { teacherKeys } from '@/core/query/queryKeys';
import { queryClient } from '@/core/query/queryClient';
import { teacherApi } from './teacher.api';

export function useTeacherDashboardQuery(email?: string | null) {
  return useQuery({
    queryKey: teacherKeys.dashboard(email),
    queryFn: ({ signal }) => teacherApi.getDashboard(signal),
    enabled: Boolean(email),
    staleTime: 20_000,
  });
}

export function useTeacherSessionsQuery(email?: string | null) {
  return useQuery({
    queryKey: teacherKeys.sessions(email),
    queryFn: ({ signal }) => teacherApi.getSessions(signal),
    enabled: Boolean(email),
    staleTime: 15_000,
  });
}

export function useSessionRosterQuery(email?: string | null, sessionId?: string | null) {
  return useQuery({
    queryKey: teacherKeys.sessionRoster(email, sessionId),
    queryFn: ({ signal }) => teacherApi.getSessionRoster(sessionId!, signal),
    enabled: Boolean(email && sessionId),
    staleTime: 10_000,
  });
}

export function useTeacherStudentsQuery(email?: string | null, params: Record<string, string> = {}) {
  return useQuery({
    queryKey: teacherKeys.students(email, params),
    queryFn: ({ signal }) => teacherApi.getStudentsMeta(params, signal),
    enabled: Boolean(email),
    staleTime: 20_000,
  });
}

export function useTeacherAnalyticsQuery(email?: string | null, subject = 'all') {
  return useQuery({
    queryKey: teacherKeys.analytics(email, subject),
    queryFn: ({ signal }) => teacherApi.getAnalytics(subject, signal),
    enabled: Boolean(email),
    staleTime: 30_000,
  });
}

export function useTeacherLeavesQuery(email?: string | null, params: Record<string, string> = {}) {
  return useQuery({
    queryKey: teacherKeys.leaves(email, params),
    queryFn: ({ signal }) => teacherApi.getLeaves(params, signal),
    enabled: Boolean(email),
    staleTime: 15_000,
  });
}

export function useTeacherDisputesQuery(email?: string | null) {
  return useQuery({
    queryKey: teacherKeys.disputes(email),
    queryFn: ({ signal }) => teacherApi.getDisputes(signal),
    enabled: Boolean(email),
    staleTime: 15_000,
  });
}

export function useTeacherTimetableQuery(email?: string | null) {
  return useQuery({
    queryKey: teacherKeys.timetable(email),
    queryFn: ({ signal }) => teacherApi.getTimetable(signal),
    enabled: Boolean(email),
    staleTime: 30_000,
  });
}

export function useTeacherNotificationsQuery(
  email?: string | null,
  params: { type?: string; unread?: boolean; limit?: number } = {}
) {
  return useQuery({
    queryKey: teacherKeys.notifications(email, params as Record<string, string | boolean>),
    queryFn: ({ signal }) => teacherApi.getNotifications(params, signal),
    enabled: Boolean(email),
    staleTime: 15_000,
  });
}

export function useTeacherAnnouncementsQuery(email?: string | null) {
  return useQuery({
    queryKey: teacherKeys.announcements(email),
    queryFn: ({ signal }) => teacherApi.getAnnouncements(signal),
    enabled: Boolean(email),
    staleTime: 20_000,
  });
}

export function useKioskDiagnosticsQuery(email?: string | null) {
  return useQuery({
    queryKey: teacherKeys.kioskDiagnostics(email),
    queryFn: ({ signal }) => teacherApi.getKioskDiagnostics(signal),
    enabled: Boolean(email),
    staleTime: 15_000,
  });
}

export function useSessionMutation(email?: string | null) {
  return useMutation({
    mutationFn: (vars: { sessionId: string; action: string; payload?: { reason?: string; extend_minutes?: number; auto_mark_absent?: boolean } }) =>
      teacherApi.transitionSession(vars.sessionId, vars.action, vars.payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(email) });
      queryClient.invalidateQueries({ queryKey: teacherKeys.sessions(email) });
      queryClient.invalidateQueries({ queryKey: teacherKeys.sessionRoster(email, vars.sessionId) });
    },
  });
}

export function useBatchMarkMutation(email?: string | null) {
  return useMutation({
    mutationFn: teacherApi.batchMarkAttendance,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(email) });
      queryClient.invalidateQueries({ queryKey: teacherKeys.sessions(email) });
      queryClient.invalidateQueries({ queryKey: teacherKeys.sessionRoster(email, vars.session_id) });
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all(email), 'students'] });
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all(email), 'analytics'] });
    },
  });
}

export function useTeacherNexaConversationsQuery(email?: string | null) {
  return useQuery({
    queryKey: teacherKeys.nexaConversations(email),
    queryFn: ({ signal }) => teacherApi.getNexaConversations(signal),
    select: (data) => data?.conversations ?? [],
    enabled: Boolean(email),
  });
}

export function useTeacherSendNexaMutation(email?: string | null) {
  return useMutation({
    mutationFn: ({
      message,
      language,
      opts,
    }: {
      message: string;
      language: string;
      opts?: { conversationId?: string; history?: Array<{ role: string; content: string }>; currentRoute?: string };
    }) => teacherApi.sendNexaMessage(message, language, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.nexaConversations(email) });
    },
  });
}

export function useTeacherDeleteNexaMutation(email?: string | null) {
  return useMutation({
    mutationFn: (id: string) => teacherApi.deleteNexaConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.nexaConversations(email) });
    },
  });
}
