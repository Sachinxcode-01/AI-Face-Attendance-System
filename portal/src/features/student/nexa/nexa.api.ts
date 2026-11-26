import { api } from '@/lib/api';

export const studentNexaApi = {
  getConversations: (signal?: AbortSignal) => api.ai.conversations(signal),
  chat: (
    message: string,
    language: 'en' | 'hi' | 'kn',
    opts: { conversationId?: string; history?: Array<{ role: string; content: string }>; currentRoute?: string }
  ) => api.ai.chat(message, language, opts),
  deleteConversation: (id: string) => api.ai.deleteConversation(id),
  sendFeedback: (data: {
    responseId: string;
    rating: 'helpful' | 'not_helpful';
    category?: string;
    feedback?: string;
    currentRoute?: string;
  }) => api.ai.feedback(data),
};
