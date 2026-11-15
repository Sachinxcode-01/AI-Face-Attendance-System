'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Bot, Send, UserRound, Sparkles } from 'lucide-react';
import { DEMO_PROFILES } from '@/lib/demo-data';

interface Msg {
  sender: 'nexa' | 'user';
  text: string;
}

const QUICK_PROMPTS = [
  'What is my current attendance?',
  'How many classes can I bunk?',
  'Draft a leave letter',
  'Which subject is at risk?',
];

function nexaReply(q: string): string {
  const s = q.toLowerCase();
  if (s.includes('bunk') || s.includes('safe') || s.includes('absence')) {
    return 'You have 4 safe absence slots in Operating Systems before dropping below the 75% requirement. Submit any planned absence via Leave Requests so it is pre-authorized.';
  }
  if (s.includes('leave') || s.includes('letter') || s.includes('draft')) {
    return 'Here is a draft leave letter: "Dear Dean, I request leave from [start] to [end] due to [reason]. My attendance in core subjects remains above the 75% threshold. Thank you." Replace the placeholders and submit via Leave Requests.';
  }
  if (s.includes('risk') || s.includes('short') || s.includes('below')) {
    return 'Linear Algebra & Statistics is your lowest subject at 76.9% — only 1.9 points above the threshold. Attending the next two Thursday lectures gives you a safe buffer.';
  }
  if (s.includes('attendance') || s.includes('percent') || s.includes('current')) {
    return 'Your overall attendance is 88.6% (95 of 107 classes). Neural Networks leads at 92.8%, and you are on a 14-day Golden Blaze streak.';
  }
  if (s.includes('hello') || s.includes('hi') || s.includes('hey')) {
    return `Hello ${DEMO_PROFILES.student.name.split(' ')[0]}! I am Nexa. Ask me about your attendance, safe bunk slots, at-risk subjects, or request a leave letter draft.`;
  }
  return 'Based on your recent attendance history, your Neural Networks course is at 92.8%. If you attend the next 2 lectures, your semester projection climbs to 94.1%!';
}

export default function StudentAiChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { sender: 'nexa', text: `Hi ${DEMO_PROFILES.student.name.split(' ')[0]}! I am Nexa, your SmartFace academic copilot. Your overall attendance is 88.6% with a 14-day Golden Blaze streak! How can I assist you today?` },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { sender: 'user', text: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { sender: 'nexa', text: nexaReply(q) }]);
      setTyping(false);
    }, 700);
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="AI Advisor"
        title="Nexa AI Copilot"
        subtitle="Gemini-powered academic advising for attendance, forecasts, and leave drafting."
      />

      <Card className="page-enter flex h-[65vh] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-white/10 bg-indigo-950/40 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Nexa</p>
            <p className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Online • SmartFace LLM Advisor
            </p>
          </div>
          <Sparkles className="ml-auto h-4 w-4 text-indigo-400" />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[85%] gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${m.sender === 'user' ? 'bg-white/10 text-gray-300' : 'bg-indigo-600 text-white'}`}>
                  {m.sender === 'user' ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${m.sender === 'user'
                  ? 'rounded-br-sm bg-indigo-600 text-white'
                  : 'rounded-bl-sm border border-white/10 bg-white/[0.05] text-gray-200'
                  }`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 bg-black/30 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-semibold text-gray-300 transition-all hover:border-indigo-500/40 hover:text-white"
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
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Nexa about attendance, bunk limits, or leave…"
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
            />
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 text-white transition-colors hover:bg-indigo-500">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </Card>
    </DashboardLayout>
  );
}
