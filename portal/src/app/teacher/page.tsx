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
  const [pendingLeaves, setPendingLeaves] = useState<TeacherLeaveRequest[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(15);
  const [stopping, setStopping] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, sess, leaves] = await Promise.all([
        api.teacher.dashboard(),
        api.teacher.sessions(),
        api.leave.pending(),
      ]);
      setDashboard(dash as TeacherDashboard);
      setSessions((sess as TeacherSession[]) || []);
      setPendingLeaves(((leaves as TeacherLeaveRequest[]) || []).filter((l) => l.status === 'Pending' || l.status === 'Under Review'));
      const live = ((sess as TeacherSession[]) || []).find((s) => s.is_active);
      setActiveSessionId(live?.id ?? null);
    } catch (err) {
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

  // Fetch QR token when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setQrToken(null);
      return;
    }
    api.teacher.qrToken(activeSessionId)
      .then((data) => {
        const d = data as { token?: string; qr_code?: string } | null;
        setQrToken(d?.token || d?.qr_code || null);
      })
      .catch(() => setQrToken(null));
  }, [activeSessionId, qrCountdown]);

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

  const presentCount = sessions.find((s) => s.id === activeSessionId)?.students_checked_in ?? 0;
  const totalEnrolled = sessions.find((s) => s.id === activeSessionId)?.total_enrolled_seen ?? 0;

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
            delta="+6% vs last week"
            icon={<Activity className="h-4 w-4" />}
            accent="text-accent"
            footnote="ArcFace + QR combined"
          />
          <StatCard
            label="Pending Leaves"
            value={String(pendingLeaves.length)}
            delta="awaiting review"
            icon={<FileCheck2 className="h-4 w-4" />}
            accent="text-amber"
            footnote="1-click approve / reject"
          />
          <StatCard
            label="Total Sessions"
            value={String(dashboard.total_sessions)}
            delta={`${dashboard.active_sessions} active`}
            icon={<MonitorPlay className="h-4 w-4" />}
            accent="text-accent2"
            footnote="This semester"
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
                  {sessions.find((s) => s.id === activeSessionId) && (
                    <tr className="hover:bg-white/[0.02]">
                      <td colSpan={5} className="py-8 text-center text-faint font-mono">
                        Live roster populates as students check in via face or QR.
                      </td>
                    </tr>
                  )}
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
              right={<Badge tone="warning">{pendingLeaves.length} pending</Badge>}
            />
            <div className="space-y-3">
              {pendingLeaves.length === 0 && (
                <p className="py-4 text-center text-xs text-faint">Inbox clear — all leave requests reviewed.</p>
              )}
              {pendingLeaves.slice(0, 3).map((req) => (
                <div key={req.id} className="rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-hi">{req.user_id}</span>
                    <Badge tone="warning">{req.status}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-mid">{req.reason}</p>
                  <div className="mt-2.5 flex gap-2">
                    <Link
                      href="/teacher/leave-approvals"
                      className="flex-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-bold hover:bg-emerald-500/30 transition-colors text-center"
                    >
                      Approve
                    </Link>
                    <Link
                      href="/teacher/leave-approvals"
                      className="flex-1 rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/30 transition-colors text-center"
                    >
                      Reject
                    </Link>
                  </div>
                </div>
              ))}
              {pendingLeaves.length > 3 && (
                <Link href="/teacher/leave-approvals" className="block text-center text-[11px] text-accent hover:underline">
                  View all {pendingLeaves.length} requests →
                </Link>
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