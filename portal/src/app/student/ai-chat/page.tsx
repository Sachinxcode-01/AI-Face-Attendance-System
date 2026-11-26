'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Bot, Send, Sparkles, UserRound, Trash2, ThumbsUp, ThumbsDown, PlusCircle, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Msg {
  id: string;
  sender: 'nexa' | 'user';
  text: string;
  suggestedActions?: Array<{ type: string; label: string; route: string }>;
  feedback?: 'helpful' | 'not_helpful' | null;
}

const QUICK_PROMPTS = [
  'What is my current attendance?',
  'How many classes do I need to reach 75%?',
  'Which subject has my lowest attendance?',
  'What is my next class today?',
  'What is the status of my leave application?',
  'Create an attendance recovery plan',
];

export default function StudentAiChatPage() {
  const { user } = useAuth();
  const firstName = (user?.name || 'there').split(' ')[0];

  const buildWelcome = useCallback((): Msg => ({
    id: 'welcome',
    sender: 'nexa',
    text: `Hello ${firstName}! I'm Nexa, your SmartFace academic advisor. I retrieve your verified attendance records, deterministic target calculations, timetable, and leave status directly from the backend.`,
  }), [firstName]);

  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Msg[]>([buildWelcome()]);
  const [language, setLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.ai.conversations();
      const list = Array.isArray(res?.conversations) ? res.conversations : [];
      setConversations(list);
      if (!conversationId && list.length > 0 && Array.isArray(list[0].messages) && list[0].messages.length > 0) {
        setConversationId(list[0].id);
        setMessages(
          list[0].messages.map((m: any) => ({
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'nexa',
            text: m.content,
            suggestedActions: m.suggestedActions || [],
            feedback: m.feedback || null,
          }))
        );
      }
    } catch {
      /* keep current welcome state */
    }
  }, [conversationId]);

  useEffect(() => {
    if (user?.email) {
      loadConversations();
    }
  }, [user?.email, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const startNewChat = () => {
    setConversationId(undefined);
    setMessages([buildWelcome()]);
  };

  const selectConversation = (conv: any) => {
    setConversationId(conv.id);
    setMessages(
      (conv.messages || []).map((m: any) => ({
        id: m.id,
        sender: m.role === 'user' ? 'user' : 'nexa',
        text: m.content,
        suggestedActions: m.suggestedActions || [],
        feedback: m.feedback || null,
      }))
    );
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.ai.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        startNewChat();
      }
    } catch { }
  };

  const sendFeedback = async (msgId: string, rating: 'helpful' | 'not_helpful') => {
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, feedback: rating } : m)));
    try {
      await api.ai.feedback({ responseId: msgId, rating, currentRoute: '/student/ai-chat' });
    } catch { }
  };

  const send = async (txt: string) => {
    if (!txt.trim() || typing) return;
    const userMsg: Msg = { id: `u_${Date.now()}`, sender: 'user', text: txt.trim() };
    const nextHistory = messages
      .filter((m) => m.id !== 'welcome')
      .slice(-6)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));

    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await api.ai.chat(txt.trim(), language, {
        conversationId,
        history: nextHistory,
        currentRoute: '/student/ai-chat',
      });
      if (res?.conversationId) setConversationId(res.conversationId);
      const replyText = res?.reply && res.reply.trim()
        ? res.reply
        : 'The AI assistant service is currently unavailable. Please try again later.';
      setMessages((m) => [
        ...m,
        {
          id: res?.message?.id || `a_${Date.now()}`,
          sender: 'nexa',
          text: replyText,
          suggestedActions: Array.isArray(res?.suggestedActions) ? res.suggestedActions : [],
        },
      ]);
      loadConversations();
    } catch (err: unknown) {
      const msg = err instanceof ApiError
        ? err.message
        : 'The AI assistant service could not be reached. Please check your connection and retry.';
      setMessages((m) => [
        ...m,
        {
          id: `err_${Date.now()}`,
          sender: 'nexa',
          text: msg,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Copilot"
        title="Nexa AI Advisor"
        subtitle="Authorised academic assistant powered by deterministic attendance analytics and institutional policy."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'kn')}
              className="rounded-full border border-white/10 bg-surface px-3 py-1.5 text-xs text-hi focus:border-accent focus:outline-none"
              aria-label="Assistant language"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="kn">Kannada</option>
            </select>
            <button onClick={startNewChat} className="btn-pill-glass h-8 px-3 text-xs flex items-center gap-1.5">
              <PlusCircle className="h-3.5 w-3.5 text-accent" /> New Chat
            </button>
          </div>
        }
      />

      {conversations.length > 0 && (
        <div className="page-enter mb-4 flex flex-wrap items-center gap-2">
          {conversations.slice(0, 5).map((c) => (
            <div
              key={c.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] ${conversationId === c.id ? 'border-accent bg-accent/15 text-white' : 'border-white/10 bg-white/[0.03] text-mid'
                }`}
            >
              <button type="button" onClick={() => selectConversation(c)} className="truncate max-w-[160px]">
                {c.title || 'Conversation'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConversation(c.id)}
                className="text-faint hover:text-red-400"
                title="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Card className="page-enter flex h-[68vh] flex-col overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] bg-surface/60 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg shadow-accent/25">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-hi">Nexa AI</p>
            <p className="flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Online · Deterministic Attendance Engine Active
            </p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-accent" />
        </div>

        {/* Message Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.sender === 'user' ? 'bg-white/10 text-mid' : 'bg-accent text-[#050507]'
                        }`}
                    >
                      {m.sender === 'user' ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                      <div className="space-y-1.5">
                        <div
                          className={`rounded-[18px] px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${m.sender === 'user'
                              ? 'rounded-tr-xs bg-gradient-to-r from-accent to-accent2 text-[#050507] font-medium shadow-md shadow-accent/15'
                              : 'rounded-tl-xs border border-white/[0.08] bg-surface text-hi'
                            }`}
                        >
                          {m.text}
                        </div>
                        {m.sender === 'nexa' && m.id !== 'welcome' && (
                          <div className="flex flex-wrap items-center gap-2 pl-1">
                            {m.suggestedActions?.map((act, idx) => (
                              <Link
                                key={idx}
                                href={act.route}
                                className="chip-bytune h-6 px-2.5 text-[10px] text-accent flex items-center gap-1"
                              >
                                {act.label} <ArrowRight className="h-2.5 w-2.5" />
                              </Link>
                            ))}
                            <button
                              type="button"
                              onClick={() => sendFeedback(m.id, 'helpful')}
                              className={`p-1 rounded hover:bg-white/5 ${m.feedback === 'helpful' ? 'text-emerald-400' : 'text-faint'}`}
                              title="Helpful"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => sendFeedback(m.id, 'not_helpful')}
                              className={`p-1 rounded hover:bg-white/5 ${m.feedback === 'not_helpful' ? 'text-red-400' : 'text-faint'}`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
          ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="flex gap-1.5 rounded-[18px] rounded-tl-xs border border-white/[0.08] bg-surface px-4 py-3">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

        {/* Input Bar */ }
                < div className = "border-t border-white/[0.08] bg-[#050507]/60 p-4" >
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="chip-bytune text-[11px] h-7 px-3"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nexa about your attendance, target recovery, schedule, or leave…"
              className="flex-1 rounded-full border border-[var(--hairline)] bg-surface px-4 py-2.5 text-xs text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
            <button
              type="submit"
              className="btn-pill-accent h-10 w-10 rounded-full flex items-center justify-center p-0 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </Card>
    </DashboardLayout>
  );
}
