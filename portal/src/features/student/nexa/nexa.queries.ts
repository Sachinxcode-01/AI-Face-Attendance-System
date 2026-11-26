'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/query/queryKeys';
import { studentNexaApi } from './nexa.api';

export function useNexaConversationsQuery(email?: string | null) {
  return useQuery({
    queryKey: studentKeys.nexaConversations(email),
    queryFn: ({ signal }) => studentNexaApi.getConversations(signal),
    enabled: Boolean(email),
    staleTime: 30_000,
    select: (res) => (Array.isArray(res?.conversations) ? res.conversations : []),
  });
}

export function useSendNexaMessageMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      message: string;
      language: 'en' | 'hi' | 'kn';
      opts: { conversationId?: string; history?: Array<{ role: string; content: string }>; currentRoute?: string };
    }) => studentNexaApi.chat(args.message, args.language, args.opts),
    onSuccess: () => {
      if (email) qc.invalidateQueries({ queryKey: studentKeys.nexaConversations(email) });
    },
  });
}

export function useDeleteNexaConversationMutation(email?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentNexaApi.deleteConversation,
    onSuccess: () => {
      if (email) qc.invalidateQueries({ queryKey: studentKeys.nexaConversations(email) });
    },
  });
}

export function useNexaFeedbackMutation() {
  return useMutation({
    mutationFn: studentNexaApi.sendFeedback,
  });
}
