'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Bot, Send, Sparkles, UserRound } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

interface Msg {
  sender: 'nexa' | 'user';
  text: string;
}

const INITIAL_MESSAGES: Msg[] = [
  {
    sender: 'nexa',
    text: "Hello Alice! I'm Nexa, your SmartFace academic advisor. I can answer questions about your attendance compliance, calculate how many classes you can safely miss, or draft leave requests.",
  },
  {
    sender: 'user',
    text: 'How many classes can I miss in Operating Systems before dropping below 75%?',
  },
  {
    sender: 'nexa',
    text: 'You currently have 88.6% in Operating Systems (39/44 lectures attended). You can safely miss up to 8 more lectures before reaching the critical 75.0% threshold. Would you like me to set an alert if you reach 80%?',
  },
];

const QUICK_PROMPTS = [
  'Calculate safe bunks for all subjects',
  'Draft medical leave application for tomorrow',
  'What is my lowest attended subject?',
  'Explain ArcFace anti-proxy protection',
];

export default function StudentAiChatPage() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = async (txt: string) => {
    if (!txt.trim() || typing) return;
    const userMsg: Msg = { sender: 'user', text: txt };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await api.ai.chat(txt);
      const replyText = res?.reply && res.reply.trim() ? res.reply : 'The AI assistant service is currently unavailable. Please try again later.';
      setMessages((m) => [
        ...m,
        {
          sender: 'nexa',
          text: replyText,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'The AI assistant service could not be reached. Please check your connection and retry.';
      setMessages((m) => [
        ...m,
        {
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
        subtitle="Gemini-powered academic advising for attendance forecasts, compliance thresholds, and leave drafting."
      />

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
              Online · ArcFace Neural Telemetry Active
            </p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-accent" />
        </div>

        {/* Message Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.sender === 'user' ? 'bg-white/10 text-mid' : 'bg-accent text-[#050507]'
                  }`}
                >
                  {m.sender === 'user' ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`rounded-[18px] px-4 py-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'rounded-tr-xs bg-gradient-to-r from-accent to-accent2 text-[#050507] font-medium shadow-md shadow-accent/15'
                      : 'rounded-tl-xs border border-white/[0.08] bg-surface text-hi'
                  }`}
                >
                  {m.text}
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

        {/* Input Bar */}
        <div className="border-t border-white/[0.08] bg-[#050507]/60 p-4">
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
              placeholder="Ask Nexa about attendance, bunk limits, or leave…"
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
