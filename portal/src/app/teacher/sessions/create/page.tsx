'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Play, Loader2 } from 'lucide-react';

export default function CreateSessionPage() {
  const router = useRouter();
  const { toasts, push, dismiss } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      push('Subject is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.teacher.startSession(
        user?.email || '',
        subject.trim(),
        room.trim() || 'Main Hall',
        duration
      );
      push('Session started successfully', 'success');
      router.push('/teacher/sessions');
    } catch (err) {
      push('Failed to start session. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="New Session"
        title="Start Attendance Session"
        subtitle="Launch a live attendance session with dynamic QR rotation and ArcFace biometric verification."
        backTo="/teacher/sessions"
        backLabel="Back to Sessions"
      />

      <Card className="page-enter max-w-2xl p-6">
        <CardHeader icon={<Play className="h-5 w-5 text-accent" />} title="Session Details" />
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="subject" className="mb-1.5 block text-xs font-semibold text-mid">
              Subject / Course Name
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Neural Networks & Deep Learning"
              required
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div>
            <label htmlFor="room" className="mb-1.5 block text-xs font-semibold text-mid">
              Room / Location
            </label>
            <input
              id="room"
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Lab 402"
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div>
            <label htmlFor="duration" className="mb-1.5 block text-xs font-semibold text-mid">
              Duration (minutes)
            </label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-sm text-hi transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-pill-accent h-10 px-6 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              {submitting ? 'Starting…' : 'Start Live Session'}
            </button>
            <Link
              href="/teacher/sessions"
              className="btn-pill-glass h-10 px-5 text-xs font-semibold flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Cancel
            </Link>
          </div>
        </form>
      </Card>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-[16px] border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl ${
                t.variant === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : t.variant === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-300'
                  : 'border-white/10 bg-white/[0.06] text-hi'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{t.title}</span>
                <button onClick={() => dismiss(t.id)} className="ml-2 text-faint hover:text-white">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}