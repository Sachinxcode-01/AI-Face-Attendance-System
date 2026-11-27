'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherDashboardQuery, useTeacherNexaConversationsQuery, useTeacherSendNexaMutation, useTeacherDeleteNexaMutation } from '@/features/teacher/teacher.queries';
import { teacherApi } from '@/features/teacher/teacher.api';
import {
  Bot, Send, Sparkles, Plus, Trash2, ThumbsUp, ThumbsDown, ShieldCheck,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  responseId?: string;
  rated?: 'helpful' | 'not_helpful';
}

const TEACHER_PROMPTS = [
  'Who is below 75% attendance across my classes?',
  'Summarize my attendance sessions today',
  'Which subject has the lowest attendance rate?',
  'Who has 3 or more consecutive absences?',
  'How many pending leave and dispute requests do I have?',
  'What is my next scheduled class today?',
];

export default function TeacherAiChatPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();

  const { data: dash } = useTeacherDashboardQuery(user?.email);
  const { data: conversations = [] } = useTeacherNexaConversationsQuery(user?.email);
  const sendMutation = useTeacherSendNexaMutation(user?.email);
  const deleteMutation = useTeacherDeleteNexaMutation(user?.email);

  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const loadConversation = (conv: { id: string; messages?: Array<{ role: string; content: string }> }) => {
    setConversationId(conv.id);
    setMessages(
      (conv.messages ?? []).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))
    );
  };

  const handleSend = async (promptText?: string) => {
    const text = (promptText ?? input).trim();
    if (!text || sendMutation.isPending) return;
    if (!promptText) setInput('');

    const nextHistory = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextHistory);

    try {
      const res = await sendMutation.mutateAsync({
        message: text,
        language,
        opts: {
          conversationId,
          history: nextHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          currentRoute: '/teacher/ai-chat',
        },
      });
      if (res.conversationId) setConversationId(res.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          responseId: res.message?.id || `${Date.now()}`,
        },
      ]);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Nexa AI request failed', 'error');
    }
  };

  const handleFeedback = async (idx: number, rating: 'helpful' | 'not_helpful') => {
    const msg = messages[idx];
    if (!msg?.responseId) return;
    try {
      await teacherApi.sendNexaFeedback({
        responseId: msg.responseId,
        rating,
        currentRoute: '/teacher/ai-chat',
      });
      setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, rated: rating } : m)));
      push('Feedback recorded', 'success');
    } catch {
      // non-blocking
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (conversationId === id) {
        setConversationId(undefined);
        setMessages([]);
      }
      push('Conversation deleted', 'info');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Failed to delete conversation', 'error');
    }
  };

  return (
    <DashboardLayout>
      <Toasts toasts={toasts} dismiss={dismiss} />
      <PageHeader
        kicker="Faculty Copilot"
        title="Nexa AI — Classroom Intelligence"
        subtitle="Ask grounded questions about your assigned classes, shortage students, leaves, disputes, and timetable."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'kn')}
              aria-label="Response language"
              className="rounded-full border border-white/10 bg-[#101016] px-3 py-2 text-xs text-hi"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                setConversationId(undefined);
                setMessages([]);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> New Thread
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        {/* Conversation Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader
            icon={<Bot className="h-4 w-4" />}
            title="Faculty Threads"
            subtitle={dash ? `${dash.assigned_subjects?.length ?? 0} assigned subjects` : undefined}
          />
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Scoped strictly to your institution &amp; authorised classes.</span>
          </div>
          {conversations.length === 0 ? (
            <p className="py-4 text-center text-xs text-faint">No saved conversations yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
              {conversations.map((c: { id: string; title?: string; updated_at?: string; messages?: Array<{ role: string; content: string }> }) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition ${conversationId === c.id
                      ? 'border-accent/40 bg-accent/10 text-hi'
                      : 'border-white/5 bg-white/[0.02] text-mid hover:border-white/15'
                    }`}
                >
                  <button
                    onClick={() => loadConversation(c)}
                    className="min-w-0 flex-1 truncate text-left font-medium"
                  >
                    {c.title || 'Faculty Query'}
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(c.id)}
                    className="text-faint hover:text-red-400"
                    title="Delete thread"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Main Chat Area */}
        <Card className="flex flex-col lg:col-span-3 min-h-[540px]">
          <CardHeader
            icon={<Sparkles className="h-4 w-4" />}
            title="Grounded Teacher Assistant"
            subtitle="Deterministic metrics + AI guidance — cannot fabricate student counts or expose biometrics."
            right={<Badge tone="info">{user?.department || 'Faculty'}</Badge>}
          />

          {/* Quick Prompt Chips */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {TEACHER_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={sendMutation.isPending}
                className="chip-bytune px-3 py-1.5 text-[11px] text-mid transition hover:border-accent/40 hover:text-hi disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-4 max-h-[420px]">
            {messages.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center text-center text-xs text-faint">
                <Bot className="mb-2 h-8 w-8 text-accent/60" />
                <p className="font-medium text-mid">Ask Nexa about your classes, risk alerts, leaves, or schedule.</p>
                <p className="mt-1">Try clicking one of the quick prompts above.</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                        ? 'bg-accent text-black font-medium'
                        : 'border border-white/10 bg-white/[0.04] text-hi'
                      }`}
                  >
                    {m.content}
                    {m.role === 'assistant' && m.responseId && (
                      <div className="mt-2 flex items-center gap-2 border-t border-white/10 pt-1.5 text-[10px] text-faint">
                        <span>Helpful?</span>
                        <button
                          onClick={() => handleFeedback(i, 'helpful')}
                          className={`hover:text-emerald-400 ${m.rated === 'helpful' ? 'text-emerald-400' : ''}`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(i, 'not_helpful')}
                          className={`hover:text-red-400 ${m.rated === 'not_helpful' ? 'text-red-400' : ''}`}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-mid">
                  Analyzing authorised classroom metrics...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="mt-4 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about students below 75%, today's schedule, pending leaves..."
              className="flex-1 rounded-full border border-white/15 bg-black/40 px-4 py-2.5 text-xs text-hi placeholder-faint focus:border-accent focus:outline-none"
            />
            <Button type="submit" loading={sendMutation.isPending}>
              <Send className="h-3.5 w-3.5" /> Ask Nexa
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
