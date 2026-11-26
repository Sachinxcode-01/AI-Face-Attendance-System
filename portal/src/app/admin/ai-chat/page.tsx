'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Bot, Send } from 'lucide-react';

export default function AdminNexaAiPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hello! I am Nexa AI, your institutional administration copilot. Ask me about active sessions, pending disputes, leaves, security alerts, or attendance policies.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const res = await api.ai.chat(text, 'en', { currentRoute: '/admin/ai-chat' });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply || 'No response received.' }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: err?.message || 'Unable to reach Nexa AI.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Institutional Copilot"
        title="Nexa AI — Admin Operations Assistant"
        subtitle="Institution-scoped operational intelligence. Nexa never accesses biometric embeddings or modifies records autonomously."
      />
      <Card>
        <div className="space-y-3 max-h-[420px] overflow-y-auto mb-4 pr-1 text-xs">
          {messages.map((m, i) => (
            <div key={i} className={`rounded-2xl p-3.5 ${m.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30 ml-12 text-white' : 'bg-white/[0.03] border border-white/10 mr-12 text-gray-200'}`}>
              <p className="font-mono text-[10px] uppercase text-faint mb-1 flex items-center gap-1">
                {m.role === 'assistant' && <Bot className="h-3 w-3 text-accent" />} {m.role}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Nexa about institutional attendance, pending disputes, or alerts..."
            className="flex-1 rounded-full border border-white/10 bg-[#08080c] px-4 py-2.5 text-xs text-white"
          />
          <Button type="submit" loading={sending}><Send className="h-4 w-4" /> Send</Button>
        </form>
      </Card>
    </DashboardLayout>
  );
}
