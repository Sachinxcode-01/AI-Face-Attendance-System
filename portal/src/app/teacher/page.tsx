'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, statusTone } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendanceLive, AttendanceEvent } from '@/hooks/useAttendanceLive';
import {
  useTeacherDashboardQuery,
  useTeacherSessionsQuery,
  useSessionRosterQuery,
  useSessionMutation,
} from '@/features/teacher/teacher.queries';
import type { TeacherSession } from '@/lib/types';
import {
  MonitorPlay, UsersRound, FileCheck2, BarChart3, QrCode, Play, Square,
  Pause, RefreshCw, Activity, Radio, CalendarDays, MapPin, AlertTriangle,
  BellRing, WifiOff, Bot, Clock,
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [liveEvents, setLiveEvents] = useState<AttendanceEvent[]>([]);

  const {
    data: dashboard,
    isLoading: dashLoading,
    isFetching: dashFetching,
    error: dashQueryError,
    refetch: refetchDash,
  } = useTeacherDashboardQuery(user?.email);

      const {
        data: sessions = [],
        isLoading: sessLoading,
        error: sessQueryError,
        refetch: refetchSessions,
      } = useTeacherSessionsQuery(user?.email);

      const activeSession = sessions.find((s) => s.is_active) ?? null;
      const activeSessionId = activeSession?.id ?? null;

      const { data: rosterData, refetch: refetchRoster } = useSessionRosterQuery(user?.email, activeSessionId);
      const sessionMut = useSessionMutation(user?.email);

    useEffect(() => {
      if (typeof window === 'undefined') return;
      setIsOnline(navigator.onLine);
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }, []);

    const [qrCountdown, setQrCountdown] = useState(15);
    useEffect(() => {
      if (!activeSessionId || activeSession?.status === 'paused') return;
      const rot = activeSession?.qr_rotation_seconds || 15;
      setQrCountdown(rot);
      const interval = setInterval(() => {
        setQrCountdown((prev) => (prev <= 1 ? rot : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
  }, [activeSessionId, activeSession?.status, activeSession?.qr_rotation_seconds]);

    const { isConnected } = useAttendanceLive({
      channel: 'notifications',
      invalidateStudentCache: true,
      onEvent: (evt) => {
        if (evt.type === 'attendance_update') {
          setLiveEvents((prev) => {
            const exists = prev.some((p) => p.student_email === evt.student_email && p.session_id === evt.session_id);
            return exists ? prev : [evt, ...prev].slice(0, 20);
          });
          push(`Check-in: ${evt.student_name || evt.student_email || 'Student'} via ${evt.verified_by || 'qr'}`, 'info');
          refetchRoster();
        } else if (evt.type === 'session_status') {
          refetchSessions();
          refetchDash();
        }
      },
    });

    const loadData = useCallback(async () => {
      await Promise.all([refetchDash(), refetchSessions(), activeSessionId ? refetchRoster() : Promise.resolve()]);
    }, [refetchDash, refetchSessions, refetchRoster, activeSessionId]);

    const handleLifecycle = async (action: string) => {
      if (!activeSessionId) return;
      try {
        const res = await sessionMut.mutateAsync({ sessionId: activeSessionId, action });
        push(res?.message || `Session ${action} completed`, 'success');
      } catch (err) {
        push(err instanceof Error ? err.message : `Failed to ${action} session`, 'error');
      }
    };

    const loading = dashLoading || sessLoading;
    const rosterStudents: any[] = rosterData?.students ?? [];
    const checkedInStudents = rosterStudents.filter((s) => s.recorded);
    const presentCount = activeSession
      ? (rosterData?.counts?.present ?? activeSession.students_checked_in ?? 0)
      : (dashboard?.attendance_today ?? 0);
    const totalEnrolled = activeSession
      ? Math.max(rosterData?.counts?.enrolled ?? 0, activeSession.total_enrolled_seen ?? 0, presentCount)
      : (dashboard?.total_assigned_students ?? dashboard?.students_monitored ?? 0);
    const overallRate = activeSession
      ? (totalEnrolled ? Math.round((presentCount / totalEnrolled) * 100) : 0)
      : (dashboard?.overall_attendance_rate ?? 0);

    const todaySchedule = dashboard?.today_schedule ?? [];
    const subjectWise = dashboard?.subject_wise_attendance ?? [];

    return (
      <DashboardLayout>
        <PageHeader
          kicker="Faculty Portal"
          title="Classroom Command Center"
          subtitle={`${dashboard?.teacher_name ?? user?.name ?? 'Professor'}${dashboard?.department ? ` · ${dashboard.department}` : ''}${dashboard?.academic_info?.semester ? ` · ${dashboard.academic_info.semester}` : ''}`}
          actions={
              <div className="flex flex-wrap items-center gap-2.5">
                {!isOnline && (
                  <Badge tone="danger"><WifiOff className="h-3 w-3" /> Offline</Badge>
                )}
                <Badge tone={isConnected ? 'success' : 'neutral'} pulse={isConnected}>
                  {isConnected ? 'WS Synced' : 'Polling'}
                </Badge>
                <button
                  onClick={loadData}
                  className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2"
                  title="Refresh dashboard"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${dashFetching ? 'animate-spin' : ''}`} />
                </button>
                {activeSessionId ? (
              <>
                <button
                  onClick={() => handleLifecycle(activeSession?.status === 'paused' ? 'resume' : 'pause')}
                  disabled={sessionMut.isPending}
                  className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  {activeSession?.status === 'paused' ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
                  {activeSession?.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={() => handleLifecycle('close')}
                  disabled={sessionMut.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-5 py-2 text-xs font-semibold text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  <Square className="h-3.5 w-3.5 fill-red-300" />
                  {sessionMut.isPending ? 'Updating…' : 'Close Session'}
                </button>
              </>
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

                {(dashQueryError && sessQueryError) && (
                  <Card className="page-enter mb-6 border-red-500/25 bg-red-500/5 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-red-300">Unable to load dashboard data. Please check your connection.</p>
                      <button onClick={loadData} className="text-xs text-accent underline hover:text-accent2">Retry</button>
                    </div>
                  </Card>
                )}

              {/* Live session banner */}
                { activeSession && (
                  <div className="page-enter mb-6 flex flex-col items-start justify-between gap-4 rounded-[22px] card-bytune p-6 shadow-2xl sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                          {activeSession.status !== 'paused' && (
                            <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-400 opacity-75" />
                          )}
                          <span className={`relative h-3 w-3 rounded-full ${activeSession.status === 'paused' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                            {activeSession.status === 'paused' ? 'Session paused' : 'Live attendance session active'}
                          </p>
                          <p className="mt-0.5 font-display text-lg font-bold text-hi">
                            {activeSession.subject}
                            <span className="text-sm font-normal text-mid">
                              {' '}• {activeSession.room || '—'}
                              {activeSession.section ? ` · Sec ${activeSession.section}` : ''}
                            </span>
                          </p>
                        </div>
                    </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 chip-bytune">
                          <RefreshCw className={`h-3.5 w-3.5 text-accent ${activeSession.status === 'paused' ? '' : 'animate-spin'}`} />
                          <span className="font-mono text-xs text-mid">
                            {activeSession.status === 'paused' ? 'QR Paused' : `Next QR rotation in ${qrCountdown}s`}
                          </span>
                        </div>
                        <Link href={`/teacher/qr-projector?session=${activeSession.id}`} className="btn-pill-glass h-8 px-3 text-[11px] font-semibold flex items-center gap-1.5">
                          <QrCode className="h-3.5 w-3.5 text-accent" /> Project QR
                        </Link>
                      </div>
                    </div>
      )}

                    {loading ? (
                      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                      </div>
                    ): dashQueryError ? (
                    <div className="mb-6 rounded-[22px] border border-amber-500/20 bg-amber-500/5 p-5 text-center">
                      <p className="text-xs text-amber-300 font-mono">Unable to load teacher metrics.</p>
                      <button onClick={loadData} className="mt-2 text-xs font-semibold text-accent underline">Retry metrics</button>
                    </div>
                    ) : dashboard ? (
                    <div className="page-enter mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        label={activeSession ? 'Present Now' : "Today's Check-ins"}
                        value={`${presentCount}`}
                        delta={activeSession ? `of ${totalEnrolled} enrolled` : `${dashboard.total_assigned_students ?? dashboard.students_monitored} assigned students`}
                        icon={<UsersRound className="h-4 w-4" />}
                        accent="text-emerald-400"
                        footnote={dashboard.last_synced_at ? `Synced ${new Date(dashboard.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live roster sync'}
                      />
                      <StatCard
                        label={activeSession ? 'Session Check-in Rate' : 'Overall Attendance'}
                        value={`${overallRate}%`}
                        delta={`${dashboard.shortage_students_count ?? 0} shortage · ${dashboard.critical_students_count ?? 0} critical`}
                        deltaUp={(dashboard.shortage_students_count ?? 0) === 0}
                        icon={<Activity className="h-4 w-4" />}
                        accent="text-accent"
                        footnote={`Min policy: ${dashboard.academic_info?.min_percentage ?? 75}%`}
                      />
                      <StatCard
                        label="Pending Reviews"
                        value={String((dashboard.pending_leaves ?? 0) + (dashboard.pending_disputes ?? 0))}
                        delta={`${dashboard.pending_leaves} leaves · ${dashboard.pending_disputes ?? 0} disputes`}
                        icon={<FileCheck2 className="h-4 w-4" />}
                        accent="text-amber"
                        footnote={`${dashboard.unread_notifications ?? 0} unread notifications`}
                      />
                      <StatCard
                        label="Teaching Load"
                        value={String(dashboard.total_sessions)}
                        delta={`${dashboard.active_sessions} active · ${dashboard.assigned_classes_count ?? 0} classes`}
                        icon={<MonitorPlay className="h-4 w-4" />}
                        accent="text-accent2"
                        footnote={`Today: ${dashboard.completed_lectures_today ?? 0} done · ${dashboard.upcoming_lectures_today ?? 0} upcoming`}
                      />
                    </div>
      ) : null}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 columns: Live Roster + Subject Breakdown */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="page-enter">
            <CardHeader
              icon={<UsersRound className="h-5 w-5 text-emerald-400" />}
              title={activeSession ? 'Live Classroom Roster' : 'Recent Attendance Activity'}
              right={
                activeSession ? (
                  <Badge tone="success" pulse>Live sync ({checkedInStudents.length}/{rosterStudents.length})</Badge>
                ) : (
                  <Link href="/teacher/sessions" className="text-xs font-semibold text-accent hover:text-accent2">Manage sessions →</Link>
                )
              }
            />
            {sessQueryError ? (
              <div className="p-8 text-center">
                <p className="text-xs text-amber-300 font-mono mb-2">Unable to load classroom sessions.</p>
                <button onClick={loadData} className="btn-pill-glass h-8 px-3 text-xs font-semibold">Retry Sessions</button>
              </div>
            ) : activeSession ? (
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
                    {checkedInStudents.length > 0 ? (
                      checkedInStudents.slice(0, 12).map((item) => (
                        <tr key={item.email} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-medium text-hi">
                            {item.full_name}
                            <span className="block text-[10px] text-faint">{item.email}</span>
                          </td>
                          <td className="py-3 font-mono text-mid">{item.student_id || item.usn || '—'}</td>
                          <td className="py-3 font-mono text-faint">
                            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-mid">
                              {item.verified_by === 'face' || item.verified_by === 'kiosk' ? (
                                <span className="text-emerald-400 font-semibold">
                                  Face {item.confidence != null ? `(${Math.round(item.confidence * 100)}%)` : ''}
                                </span>
                              ) : item.verified_by === 'manual' ? (
                                <span className="text-amber-400">Manual</span>
                              ) : (
                                <span className="text-accent">Dynamic QR</span>
                              )}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Badge tone={statusTone(String(item.status || 'present').toLowerCase())}>{item.status}</Badge>
                          </td>
                        </tr>
                      ))
                    ) : liveEvents.length > 0 ? (
                      liveEvents.map((item, idx) => (
                        <tr key={item.student_email || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-medium text-hi">{item.student_name || item.student_email}</td>
                          <td className="py-3 font-mono text-mid">{item.roll_number || '—'}</td>
                          <td className="py-3 font-mono text-faint">Just now</td>
                          <td className="py-3 font-mono text-accent">{item.verified_by || 'qr'}</td>
                          <td className="py-3 text-right"><Badge tone="success">Present</Badge></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-faint font-mono">
                          Waiting for students to check in via QR, Face Kiosk, or manual marking.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (dashboard?.recent_activity?.length ?? 0) > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 text-mid">
                    <tr>
                      <th className="pb-3 font-semibold">Student</th>
                      <th className="pb-3 font-semibold">Subject</th>
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dashboard!.recent_activity!.slice(0, 8).map((rec) => (
                      <tr key={rec.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-medium text-hi">
                          {rec.student_name}
                          <span className="block text-[10px] text-faint">{rec.roll_number || rec.student_email}</span>
                        </td>
                        <td className="py-3 text-mid">{rec.subject}</td>
                        <td className="py-3 font-mono text-faint">{new Date(rec.timestamp).toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <Badge tone={statusTone(rec.status.toLowerCase())}>{rec.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
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
            )}
          </Card>

          {/* Subject-wise attendance */}
          {subjectWise.length > 0 && (
            <Card className="page-enter">
              <CardHeader
                icon={<BarChart3 className="h-5 w-5 text-accent" />}
                title="Subject-Wise Attendance"
                right={<Link href="/teacher/analytics" className="text-xs font-semibold text-accent hover:text-accent2">Full analytics →</Link>}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {subjectWise.map((sub) => (
                  <div key={sub.subject} className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-hi truncate pr-2">{sub.subject}</span>
                      <Badge tone={sub.attendance_rate >= (dashboard?.academic_info?.min_percentage ?? 75) ? 'success' : 'warning'}>
                        {sub.attendance_rate}%
                      </Badge>
                    </div>
                    <p className="mt-1.5 font-mono text-[10.5px] text-faint">
                      {sub.sessions_count} session(s) · {sub.present_count}/{sub.conducted_marks} marks
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

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
                            <p className="mt-2 text-[11px] font-bold text-hi">Command Centre</p>
                          </Link>
                            <Link href="/teacher/ai-chat" className="rounded-[16px] border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-accent2/40 hover:bg-accent2/10">
                              <Bot className="mx-auto h-5 w-5 text-accent2" />
                              <p className="mt-2 text-[11px] font-bold text-hi">Nexa Copilot</p>
                            </Link>
                        </div>
                      </Card>

                      <Card className="page-enter">
                        <CardHeader
                          icon={<CalendarDays className="h-5 w-5 text-accent" />}
                          title="Today's Schedule"
                          right={<Link href="/teacher/timetable" className="text-xs text-accent hover:text-accent2">Timetable →</Link>}
                        />
            <div className="space-y-2.5">
              {dashboard?.is_today_holiday ? (
                <p className="py-4 text-center text-xs text-faint">Institutional holiday today.</p>
              ) : todaySchedule.length === 0 ? (
                <p className="py-4 text-center text-xs text-faint">No lectures scheduled for today.</p>
              ) : (
                todaySchedule.map((slot) => (
                  <div key={slot.id} className="rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold text-accent flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {slot.time}
                      </span>
                      <Badge tone={slot.status === 'live' ? 'success' : slot.status === 'cancelled' ? 'danger' : 'neutral'}>
                        {slot.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-hi">{slot.subject}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10.5px] text-faint">
                      <MapPin className="h-3 w-3" /> {slot.room}
                      {slot.substitute_faculty ? ` · Sub: ${slot.substitute_faculty}` : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

                      <Card className="page-enter">
                        <CardHeader
                          icon={<FileCheck2 className="h-5 w-5 text-amber-400" />}
                          title="Action Inbox"
                          right={<Badge tone="warning">{(dashboard?.pending_leaves ?? 0) + (dashboard?.pending_disputes ?? 0)} open</Badge>}
                        />
                        <div className="space-y-2.5">
                          <Link href="/teacher/leave-approvals" className="flex items-center justify-between rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5 hover:border-accent/30 transition-colors">
                            <span className="text-xs text-hi">Pending Leave Requests</span>
                            <Badge tone={(dashboard?.pending_leaves ?? 0) > 0 ? 'warning' : 'neutral'}>{dashboard?.pending_leaves ?? 0}</Badge>
                          </Link>
                          <Link href="/teacher/disputes" className="flex items-center justify-between rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5 hover:border-accent/30 transition-colors">
                            <span className="text-xs text-hi flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Attendance Disputes</span>
                            <Badge tone={(dashboard?.pending_disputes ?? 0) > 0 ? 'warning' : 'neutral'}>{dashboard?.pending_disputes ?? 0}</Badge>
                          </Link>
                          <Link href="/teacher/notifications" className="flex items-center justify-between rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5 hover:border-accent/30 transition-colors">
                            <span className="text-xs text-hi flex items-center gap-1.5"><BellRing className="h-3.5 w-3.5 text-accent" /> Unread Notifications</span>
                            <Badge tone={(dashboard?.unread_notifications ?? 0) > 0 ? 'info' : 'neutral'}>{dashboard?.unread_notifications ?? 0}</Badge>
                          </Link>
                        </div>
                      </Card>
                    </div>
                  </div>

              <Toasts toasts={toasts} dismiss={dismiss} />
            </DashboardLayout>
  );
}
