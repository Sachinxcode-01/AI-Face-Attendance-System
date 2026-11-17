'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { apiFetch } from '@/lib/api';
import { BellRing, Megaphone, Send, Loader2, Users } from 'lucide-react';

const PRIORITIES = ['Low', 'Normal', 'High', 'Critical'] as const;

export default function TeacherNotificationsPage() {
  const { toasts, push, dismiss } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<string>('Normal');
  const [sending, setSending] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      push('Message is required', 'error');
      return;
    }
    setSending(true);
    try {
      await apiFetch('/teacher/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim() || 'Classroom Announcement',
          message: message.trim(),
          priority,
        }),
      });
      push('Broadcast sent to students', 'success');
      setTitle('');
      setMessage('');
      setPriority('Normal');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Broadcast failed', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Communications"
        title="Notifications"
        subtitle="Broadcast classroom announcements to your students with priority levels and full delivery auditing."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Composer */}
        <Card className="page-enter lg:col-span-2 p-6">
          <CardHeader icon={<Megaphone className="h-5 w-5 text-accent" />} title="New Broadcast" subtitle="Delivered in-app, via WebSocket, and by email per student preferences." />
          <form onSubmit={send} className="space-y-4">
            <div>
              <label htmlFor="ntf-title" className="mb-1.5 block text-xs font-semibold text-mid">Title</label>
              <input
                id="ntf-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Guest lecture this Friday"
                maxLength={120}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <div>
              <label htmlFor="ntf-message" className="mb-1.5 block text-xs font-semibold text-mid">Message</label>
              <textarea
                id="ntf-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your announcement…"
                required
                rows={5}
                maxLength={1000}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-sm text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
              <p className="mt-1 text-right font-mono text-[10px] text-faint">{message.length}/1000</p>
            </div>
            <div>
              <label htmlFor="ntf-priority" className="mb-1.5 block text-xs font-semibold text-mid">Priority</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`chip-bytune h-8 px-4 text-xs font-semibold ${priority === p ? 'chip-bytune-active' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" loading={sending} className="h-10 px-6 text-xs font-semibold">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Send Broadcast
            </Button>
          </form>
        </Card>

        {/* Delivery info */}
        <Card className="page-enter p-6">
          <CardHeader icon={<BellRing className="h-5 w-5 text-accent2" />} title="Delivery" />
          <div className="space-y-3 text-xs text-mid">
            <div className="flex items-center gap-3 rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5">
              <Users className="h-4 w-4 text-accent" />
              <div>
                <p className="font-semibold text-hi">In-app</p>
                <p className="mt-0.5 text-faint">Stored per student, marked unread</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5">
              <BellRing className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-hi">Real-time</p>
                <p className="mt-0.5 text-faint">Pushed over WebSocket when connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5">
              <Megaphone className="h-4 w-4 text-amber-400" />
              <div>
                <p className="font-semibold text-hi">Email</p>
                <p className="mt-0.5 text-faint">Respect each student&apos;s notification preferences</p>
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-white/5 pt-4">
            <Badge tone="info">Audited</Badge>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              Every broadcast is recorded in the campus audit trail with your email, recipient count, and timestamp.
            </p>
          </div>
        </Card>
      </div>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}