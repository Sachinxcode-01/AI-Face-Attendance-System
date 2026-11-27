'use client';

import React, { useState } from 'react';
import { Bot, Download, Send } from 'lucide-react';
import { api, BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Props {
  wardEmail: string;
  wardName: string;
}

const SUGGESTED_QUESTIONS = [
  'What is my child’s current overall attendance?',
  'Which subject has the lowest attendance and how many classes are needed?',
  'What is the status of recent leave applications?',
  'Explain the institution’s attendance policy.',
];

export function ParentReportsNexaTab({ wardEmail, wardName }: Props) {
  const [downloading, setDownloading] = useState('');
  const [reportErr, setReportErr] = useState('');

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);

  React.useEffect(() => {
    setMessages([]);
    setConversationId(null);
  }, [wardEmail]);

  const handleDownload = async (format: 'csv' | 'excel' | 'html', type: string) => {
    setReportErr('');
    setDownloading(`${type}-${format}`);
    try {
      await api.parent.downloadReport(wardEmail, format, type);
    } catch (err: any) {
      setReportErr(err?.message || 'Report download failed.');
    } finally {
      setDownloading('');
    }
  };

  const askNexa = async (question: string) => {
    const q = question.trim();
    if (!q || asking) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setAsking(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          message: q,
          student_email: wardEmail,
          conversationId,
          currentRoute: '/parent',
        }),
      });
      const data = await res.json();
      if (data?.conversationId) setConversationId(data.conversationId);
      const reply = data?.reply || data?.answer || data?.detail || 'Nexa AI could not generate a response right now.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Unable to reach Nexa AI right now. Please try again.' }]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 rounded-[22px] card-surface p-6 space-y-4">
        <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
          <Download className="h-5 w-5 text-accent" />
          <span>Attendance Reports & Export — {wardName}</span>
        </h3>
        <p className="text-xs text-mid">
          Informational attendance reports generated from verified academic records (not institution-certified transcripts).
        </p>

        {['overall', 'monthly', 'shortage'].map((type) => (
          <div key={type} className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-hi capitalize">{type} Attendance Report</p>
              <p className="text-[11px] text-faint">Includes subject breakdown & verified ledger</p>
            </div>
            <div className="flex items-center gap-1.5">
              {(['csv', 'excel', 'html'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  disabled={Boolean(downloading)}
                  onClick={() => handleDownload(fmt, type)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-hi hover:bg-white/10 uppercase"
                >
                  {fmt === 'html' ? 'Print' : fmt}
                </button>
              ))}
            </div>
          </div>
        ))}
        {reportErr && <p className="text-xs text-red-300">{reportErr}</p>}
      </div>

      <div className="lg:col-span-7 rounded-[22px] card-surface p-6 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
            <Bot className="h-5 w-5 text-amber" />
            <span>Nexa AI — Parent Intelligence Copilot</span>
          </h3>
          <span className="text-[11px] text-faint">Scoped to {wardName}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => askNexa(q)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-mid hover:text-hi hover:border-amber/40 transition"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-[220px] max-h-[340px] overflow-y-auto space-y-3 rounded-[16px] bg-white/[0.02] border border-white/5 p-4 mb-3">
          {messages.length === 0 ? (
            <p className="text-xs text-faint">
              Ask Nexa about {wardName}’s attendance percentage, recovery targets, leave status, or institutional policies.
            </p>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`rounded-xl px-3.5 py-2.5 text-xs ${
                m.role === 'user' ? 'bg-accent/15 text-hi ml-8' : 'bg-white/[0.04] text-mid mr-8'
              }`}>
                <p className="text-[10px] font-bold uppercase mb-1 text-faint">{m.role === 'user' ? 'You' : 'Nexa AI'}</p>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askNexa(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Nexa about ${wardName}...`}
            className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2 text-xs text-hi placeholder-faint focus:outline-none focus:border-accent"
          />
          <button type="submit" disabled={asking} className="btn-pill-accent px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            <span>{asking ? '...' : 'Ask'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
