'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import type { TeacherSession } from '@/lib/types';
import { ChevronLeft, ScanFace, QrCode, MonitorPlay, RefreshCw } from 'lucide-react';

export default function TeacherKioskPage() {
  const { toasts, push, dismiss } = useToast();
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.teacher.sessions();
      setSessions((data as TeacherSession[]) || []);
      const live = ((data as TeacherSession[]) || []).find((s) => s.is_active);
      if (live && !selectedId) setSelectedId(live.id);
    } catch {
      push('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  }, [push, selectedId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const selected = sessions.find((s) => s.id === selectedId) || null;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Biometric Kiosk"
        title="Kiosk Mode"
        subtitle="Dedicated check-in kiosk view for classroom door stations. Students verify identity via ArcFace or dynamic QR."
        backTo="/teacher/sessions"
        backLabel="Back to Sessions"
        actions={
          <button onClick={loadSessions} className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kiosk display */}
        <Card className="page-enter lg:col-span-2 flex min-h-[420px] flex-col items-center justify-center bg-gradient-to-b from-[#0B0B12] to-[#050507] p-10 text-center">
          {selected ? (
            <>
              {selected.is_active ? (
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <ScanFace className="h-10 w-10 text-emerald-400" />
                  <span className="absolute inset-0 animate-ping rounded-full border border-emerald-400/30" />
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <ScanFace className="h-10 w-10 text-faint" />
                </div>
              )}
              <h2 className="mt-6 font-display text-2xl font-bold text-hi">{selected.subject}</h2>
              <p className="mt-1 font-mono text-xs text-mid">
                {selected.room || 'Main Hall'} • {new Date(selected.start_time).toLocaleString()}
              </p>
              {selected.is_active ? (
                <>
                  <div className="mt-6 flex items-center gap-3">
                    <Badge tone="success" pulse>Accepting check-ins</Badge>
                    <Badge tone="info">
                      <QrCode className="h-3 w-3" /> QR enabled
                    </Badge>
                  </div>
                  <p className="mt-6 max-w-sm text-xs leading-relaxed text-faint">
                    Students verify identity at the door station or scan the projected QR code. Verification completes in under 2 seconds.
                  </p>
                </>
              ) : (
                <div className="mt-6 flex items-center justify-center">
                  <Badge tone="neutral">Session ended</Badge>
                </div>
              )}
              <p className="mt-4 font-display text-4xl font-semibold text-emerald-400">
                {selected.students_checked_in}
                <span className="ml-2 text-sm font-normal text-mid">/ {selected.total_enrolled_seen} checked in</span>
              </p>
            </>
          ) : (
            <div>
              <MonitorPlay className="mx-auto h-10 w-10 text-faint" />
              <p className="mt-4 font-display text-base font-semibold text-hi">No active session</p>
              <p className="mt-1 text-xs text-mid">Start a session to activate the kiosk.</p>
              <Link href="/teacher/sessions/create" className="btn-pill-accent mt-5 inline-flex h-9 items-center gap-2 px-5 text-xs font-semibold">
                Start a Session
              </Link>
            </div>
          )}
        </Card>

        {/* Session list */}
        <Card className="page-enter p-6">
          <CardHeader icon={<MonitorPlay className="h-5 w-5 text-accent" />} title="Sessions" />
          <div className="space-y-2">
            {sessions.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full rounded-[16px] border p-3.5 text-left transition-all ${
                  selectedId === s.id
                    ? 'border-accent/40 bg-accent/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-hi">{s.subject}</span>
                  {s.is_active && <Badge tone="success" pulse>Live</Badge>}
                </div>
                <p className="mt-1 font-mono text-[10.5px] text-faint">
                  {s.students_checked_in} checked in • {s.attendance_rate}%
                </p>
              </button>
            ))}
            {sessions.length === 0 && !loading && (
              <p className="py-6 text-center text-xs text-faint font-mono">No sessions found.</p>
            )}
          </div>
        </Card>
      </div>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}