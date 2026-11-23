'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendanceLive, AttendanceEvent } from '@/hooks/useAttendanceLive';
import type { TeacherDashboard, TeacherSession, TeacherLeaveRequest } from '@/lib/types';
import {
  MonitorPlay, UsersRound, FileCheck2, BarChart3, QrCode, Play, Square,
  CheckCircle, XCircle, RefreshCw, Activity, Radio, UserCheck,
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null);
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(15);
  const [stopping, setStopping] = useState(false);
  const [liveRoster, setLiveRoster] = useState<AttendanceEvent[]>([]);

  // Real-time attendance livefeed sync
  const { isConnected } = useAttendanceLive({
    channel: 'notifications',
    mockIntervalMs: activeSessionId ? 8000 : 0,
    onEvent: (evt) => {
      setLiveRoster((prev) => {
        const exists = prev.some((p) => p.student_email === evt.student_email);
        if (exists) return prev;
        return [evt, ...prev];
      });
      push(`Check-in: ${evt.student_name || evt.student_email || 'Student'} verified via ${evt.verified_by || 'face'}`, 'info');
    },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, sessRes] = await Promise.allSettled([
        api.teacher.dashboard(),
        api.teacher.sessions(),
      ]);

      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value as TeacherDashboard);
      }
      if (sessRes.status === 'fulfilled') {
        const sess = (sessRes.value as TeacherSession[]) || [];
        setSessions(sess);
        const live = sess.find((s) => s.is_active);
        setActiveSessionId(live?.id ?? null);
      }
      if (dashRes.status === 'rejected' && sessRes.status === 'rejected') {
        setError('Unable to load dashboard data. Please check your connection.');
      }
    } catch {
      setError('Unable to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // QR rotation timer
  useEffect(() => {
    if (!activeSessionId) return;
    const interval = setInterval(() => {
      setQrCountdown((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSessionId]);

  const toggleSession = async () => {
    if (!activeSessionId) return;
    setStopping(true);
    try {
      await api.teacher.stopSession(activeSessionId);
      push('Session stopped', 'success');
      await loadData();
    } catch {
      push('Failed to stop session', 'error');
    } finally {
      setStopping(false);
    }
  };

  const presentCount = (sessions.find((s) => s.id === activeSessionId)?.students_checked_in ?? 0) + liveRoster.length;
  const totalEnrolled = Math.max(sessions.find((s) => s.id === activeSessionId)?.total_enrolled_seen ?? 0, presentCount);

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Faculty Portal"
        title="Classroom Command Center"
        subtitle={`${user?.name ?? 'Professor'} • Live session control, roster intelligence, and leave governance.`}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2"
              title="Refresh dashboard"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {activeSessionId ? (
              <button
                onClick={toggleSession}
                disabled={stopping}
                className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-5 py-2 text-xs font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
              >
                <Square className="h-3.5 w-3.5 fill-red-300" />
                {stopping ? 'Stopping…' : 'Stop Session'}
              </button>
            ) : (
              <Link
                href="/teacher/sessions/create"
                className="btn-pill-accent h-9 px-5 text-xs font-semibold flex items-center gap-2"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Start Live Session
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <Card className="page-enter mb-6 border-red-500/25 bg-red-500/5 p-4">
          <p className="text-xs text-red-300">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-xs text-accent underline hover:text-accent2"
          >
            Retry
          </button>
        </Card>
      )}

      {/* Live session banner */}
      {activeSessionId && (
        <div className="page-enter mb-6 flex flex-col items-start justify-between gap-4 rounded-[22px] card-bytune p-6 shadow-2xl sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Live attendance session active
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-hi">
                {sessions.find((s) => s.id === activeSessionId)?.subject ?? 'Live Session'}
                <span className="text-sm font-normal text-mid">
                  {' '}• {sessions.find((s) => s.id === activeSessionId)?.room ?? '—'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 chip-bytune">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" />
            <span className="font-mono text-xs text-mid">Next QR rotation in {qrCountdown}s</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : dashboard ? (
        <div className="page-enter mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Present Now"
            value={`${presentCount}`}
            delta={`of ${totalEnrolled} checked in`}
            icon={<UsersRound className="h-4 w-4" />}
            accent="text-emerald-400"
            footnote="Live roster sync"
          />
          <StatCard
            label="Session Check-in Rate"
            value={`${totalEnrolled ? Math.round((presentCount / totalEnrolled) * 100) : 0}%`}
            icon={<Activity className="h-4 w-4" />}
            accent="text-accent"
            footnote="ArcFace + QR combined"
          />
          <StatCard
            label="Pending Leaves"
            value={String(dashboard.pending_leaves)}
            delta="awaiting review"
            icon={<FileCheck2 className="h-4 w-4" />}
            accent="text-amber"
            footnote="Review in Leave Hub"
          />
          <StatCard
            label="Total Sessions"
            value={String(dashboard.total_sessions)}
            delta={`${dashboard.active_sessions} active`}
            icon={<MonitorPlay className="h-4 w-4" />}
            accent="text-accent2"
            footnote="All sessions taught"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Roster */}
        <Card className="page-enter lg:col-span-2">
          <CardHeader
            icon={<UsersRound className="h-5 w-5 text-emerald-400" />}
            title="Live Classroom Roster"
            right={
              activeSessionId ? (
                <Badge tone="success" pulse>Live sync</Badge>
              ) : (
                <span className="text-xs text-faint">No active session</span>
              )
            }
          />
          {!activeSessionId ? (
            <EmptyState
              icon={<Radio className="h-6 w-6" />}
              title="No active session"
              body="Start a live session to see real-time student check-ins here."
              action={
                <Link href="/teacher/sessions/create" className="btn-pill-accent h-9 px-4 text-xs font-semibold mt-4 inline-flex items-center">
                  <Play className="h-3.5 w-3.5 fill-current" /> Start Session
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 text-mid">
                  <tr>
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Roll No</th>
                    <th className="pb-3 font-semibold">Time</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {liveRoster.length > 0 ? (
                    liveRoster.map((item, idx) => (
                      <tr key={item.student_email || idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-medium text-hi">
                          {item.student_name || item.student_email?.split('@')[0] || 'Enrolled Student'}
                          <span className="block text-[10px] text-faint">{item.student_email}</span>
                        </td>
                        <td className="py-3 font-mono text-mid">{item.roll_number || `CS2026-${100 + idx}`}</td>
                        <td className="py-3 font-mono text-faint">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-mid">
                            {item.verified_by === 'face' ? (
                              <span className="text-emerald-400 font-semibold">Face {item.confidence ? `(${Math.round(item.confidence * 100)}%)` : ''}</span>
                            ) : (
                              <span className="text-accent">Dynamic QR</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Badge tone="success">Present</Badge>
                        </td>
                      </tr>
                    ))
                  ) : sessions.find((s) => s.id === activeSessionId) ? (
                    <tr className="hover:bg-white/[0.02]">
                      <td colSpan={5} className="py-8 text-center text-faint font-mono">
                        Live roster populates as students check in via face or QR.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="page-enter">
            <CardHeader icon={<MonitorPlay className="h-5 w-5 text-accent" />} title="Quick Actions" />
            <div className="grid grid-cols-2 gap-2">
              <Link href="/teacher/qr-projector" className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-accent/40 hover:bg-accent/10">
                <QrCode className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-2 text-[11px] font-bold text-hi">QR Projector</p>
              </Link>
              <Link href="/teacher/kiosk" className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10">
                <UsersRound className="mx-auto h-5 w-5 text-emerald-400" />
                <p className="mt-2 text-[11px] font-bold text-hi">Kiosk Mode</p>
              </Link>
              <Link href="/teacher/sessions" className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-amber-500/40 hover:bg-amber-500/10">
                <Activity className="mx-auto h-5 w-5 text-amber-400" />
                <p className="mt-2 text-[11px] font-bold text-hi">Sessions</p>
              </Link>
              <Link href="/teacher/analytics" className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-accent2/40 hover:bg-accent2/10">
                <BarChart3 className="mx-auto h-5 w-5 text-accent2" />
                <p className="mt-2 text-[11px] font-bold text-hi">Analytics</p>
              </Link>
            </div>
          </Card>

          <Card className="page-enter">
            <CardHeader
              icon={<FileCheck2 className="h-5 w-5 text-amber-400" />}
              title="Leave Approvals"
              right={<Badge tone="warning">{dashboard?.pending_leaves ?? 0} pending</Badge>}
            />
            <div className="space-y-3">
              {(dashboard?.pending_leaves ?? 0) === 0 ? (
                <p className="py-4 text-center text-xs text-faint">Inbox clear — all leave requests reviewed.</p>
              ) : (
                <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-center">
                  <p className="text-xs text-mid">
                    You have <span className="font-bold text-hi">{dashboard?.pending_leaves}</span> pending leave {(dashboard?.pending_leaves ?? 0) === 1 ? 'request' : 'requests'} awaiting review from your classes.
                  </p>
                  <Link
                    href="/teacher/leave-approvals"
                    className="btn-pill-accent mt-3 inline-flex h-8 items-center gap-2 px-4 text-xs font-semibold"
                  >
                    Review in Leave Hub →
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

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
                {t.variant === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span>{t.title}</span>
                <button onClick={() => dismiss(t.id)} className="ml-2 text-faint hover:text-white">✕</button>
              </div>
              {t.body && <p className="mt-1 text-[11px] font-normal opacity-80">{t.body}</p>}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}