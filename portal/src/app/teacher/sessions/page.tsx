'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import type { TeacherSession } from '@/lib/types';
import { Plus, MonitorPlay, QrCode, Square, RefreshCw, Activity } from 'lucide-react';

export default function TeacherSessionsPage() {
  const { toasts, push, dismiss } = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [search, setSearch] = useState('');
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.teacher.sessions();
      setSessions((data as TeacherSession[]) || []);
    } catch {
      push('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.subject.toLowerCase().includes(q) || (s.room || '').toLowerCase().includes(q);
  });

  const stopSession = async (id: string) => {
    setStoppingId(id);
    try {
      await api.teacher.stopSession(id);
      push('Session stopped', 'success');
      await loadSessions();
    } catch {
      push('Failed to stop session', 'error');
    } finally {
      setStoppingId(null);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Sessions"
        title="Session Management"
        subtitle="Start, monitor, and stop live attendance sessions with dynamic QR rotation and ArcFace verification."
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadSessions}
              className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/teacher/sessions/create" className="btn-pill-accent h-9 px-4 text-xs font-semibold flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> New Session
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Total Sessions</p>
            <p className="mt-2 font-display text-2xl font-semibold text-hi">{sessions.length}</p>
          </Card>
          <Card className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Active Now</p>
            <p className="mt-2 font-display text-2xl font-semibold text-emerald-400">
              {sessions.filter((s) => s.is_active).length}
            </p>
          </Card>
          <Card className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Avg Check-in Rate</p>
            <p className="mt-2 font-display text-2xl font-semibold text-accent">
              {sessions.length
                ? Math.round(sessions.reduce((a, s) => a + s.attendance_rate, 0) / sessions.length)
                : 0}%
            </p>
          </Card>
          <Card className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Total Check-ins</p>
            <p className="mt-2 font-display text-2xl font-semibold text-accent2">
              {sessions.reduce((a, s) => a + s.students_checked_in, 0)}
            </p>
          </Card>
        </div>
      )}

      <Card className="page-enter p-6">
        <CardHeader icon={<MonitorPlay className="h-5 w-5 text-accent" />} title="All Sessions" />
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-6 w-6" />}
            title="No sessions yet"
            body="Create your first attendance session to start tracking student check-ins."
            action={
              <Link href="/teacher/sessions/create" className="btn-pill-accent h-9 px-4 text-xs font-semibold mt-4 inline-flex items-center">
                <Plus className="h-3.5 w-3.5" /> Create Session
              </Link>
            }
          />
        ) : (
          <DataTable<TeacherSession>
            columns={[
              {
                key: 'subject',
                header: 'Subject',
                sortable: true,
                sortValue: (r) => r.subject,
                render: (r) => <span className="font-semibold text-hi">{r.subject}</span>,
              },
              {
                key: 'room',
                header: 'Room',
                render: (r) => <span className="font-mono text-mid text-[11.5px]">{r.room || '—'}</span>,
              },
              {
                key: 'start_time',
                header: 'Started',
                sortable: true,
                sortValue: (r) => r.start_time,
                render: (r) => (
                  <span className="font-mono text-mid text-[11.5px]">
                    {new Date(r.start_time).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'attendance_rate',
                header: 'Check-in Rate',
                sortable: true,
                sortValue: (r) => r.attendance_rate,
                render: (r) => (
                  <Badge tone={r.attendance_rate >= 80 ? 'success' : r.attendance_rate >= 60 ? 'warning' : 'danger'}>
                    {r.attendance_rate}%
                  </Badge>
                ),
              },
              {
                key: 'is_active',
                header: 'Status',
                render: (r) =>
                  r.is_active ? (
                    <Badge tone="success" pulse>Live</Badge>
                  ) : (
                    <Badge tone="neutral">Ended</Badge>
                  ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    {r.is_active && (
                      <button
                        onClick={() => stopSession(r.id)}
                        disabled={stoppingId === r.id}
                        className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <Square className="h-3 w-3 fill-current" />
                        {stoppingId === r.id ? 'Stopping…' : 'Stop'}
                      </button>
                    )}
                    <Link
                      href={`/teacher/qr-projector?session=${r.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-mid hover:bg-white/[0.06] transition-colors"
                    >
                      <QrCode className="h-3 w-3" /> QR
                    </Link>
                  </div>
                ),
              },
            ]}
            rows={filtered}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search subject or room…"
            pageSize={8}
            rowKey={(r) => r.id}
            emptyTitle="No sessions match your search."
          />
        )}
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