'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, statusTone } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import {
  Flame, CheckCircle2, Clock, TrendingUp, UserCheck, Sparkles, Bot,
  CalendarDays, MapPin, ArrowRight, ScanFace, QrCode, RefreshCw, AlertTriangle, BellRing, FileCheck2, WifiOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { useAttendanceLive } from '@/hooks/useAttendanceLive';
import { useStudentDashboardQuery } from '../dashboard.queries';

export function StudentDashboardView() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const {
    data: dashboardStats,
    isLoading: loading,
    isFetching: refreshing,
    error: queryError,
    refetch,
  } = useStudentDashboardQuery(user?.email);

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

  useAttendanceLive({
    channel: 'notifications',
    invalidateStudentCache: true,
  });

  const error = queryError
    ? (queryError instanceof ApiError ? queryError.message : 'Failed to synchronize dashboard data.')
    : '';

  const studentMeta = dashboardStats?.student;
  const profileName = studentMeta?.name || user?.name || user?.email?.split('@')[0] || 'Student';
  const streakCount = dashboardStats?.streak ?? null;
  const conducted = dashboardStats?.total_conducted ?? 0;
  const attended = dashboardStats?.total_present ?? 0;
  const missed = dashboardStats?.total_missed ?? 0;
  const attendancePercentage = conducted > 0 ? dashboardStats?.overall_attendance : null;
  const minThreshold = dashboardStats?.policy?.minPercentage ?? 75;
  const studentRoll = studentMeta?.student_id || studentMeta?.roll_number || user?.rollNo || null;
  const studentDept = studentMeta?.department || user?.department || null;
  const semesterLabel = studentMeta?.semester || dashboardStats?.policy?.currentSemester || null;
  const academicYear = studentMeta?.academic_year || dashboardStats?.policy?.academicYear || null;

  const todaySlots: any[] = Array.isArray(dashboardStats?.today_classes) ? dashboardStats.today_classes : [];
  const upcomingSlots: any[] = Array.isArray(dashboardStats?.upcoming_classes) ? dashboardStats.upcoming_classes : [];
  const subjectsList: any[] = Array.isArray(dashboardStats?.subjects) ? dashboardStats.subjects : [];
  const recentLogs: any[] = Array.isArray(dashboardStats?.recent_logs) ? dashboardStats.recent_logs : [];
  const counts = dashboardStats?.counts || { pending_leaves: 0, pending_disputes: 0, unread_notifications: 0 };
  const forecast = dashboardStats?.forecast;
  const risk = dashboardStats?.risk;
  const bioAcc = dashboardStats?.biometric_accuracy;

  const nextUpcoming = upcomingSlots[0];
  const dynamicSubtitle = error
    ? 'Unable to reach live attendance telemetry.'
    : loading
      ? 'Synchronizing verified academic attendance records…'
      : nextUpcoming
        ? `Next scheduled class: ${nextUpcoming.subject} (${nextUpcoming.time})${nextUpcoming.minutes_until_start != null ? ` in ${nextUpcoming.minutes_until_start} min` : ''}.`
        : conducted === 0
          ? 'No classes conducted yet. Check in once your first session begins.'
          : `${attended} of ${conducted} conducted classes attended${semesterLabel ? ` · ${semesterLabel}` : ''}${academicYear ? ` (${academicYear})` : ''}.`;

  const standingValue = dashboardStats?.standing || (conducted === 0 ? 'No Records' : 'Unavailable');
  const projectionPct = forecast?.maxPossiblePercentage ?? attendancePercentage ?? 0;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Student Portal"
        title={`Welcome back, ${profileName.split(' ')[0]}`}
        subtitle={dynamicSubtitle}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!isOnline && (
              <Badge tone="danger"><WifiOff className="h-3 w-3" /> Offline</Badge>
            )}
            <Button
              variant="secondary"
              onClick={() => refetch()}
              loading={refreshing}
              className="h-9 px-3.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync
            </Button>
            <Link
              href="/student/checkin"
              className="btn-pill-accent text-[#050507] font-semibold flex items-center gap-2"
            >
              <ScanFace className="h-4 w-4" /> Quick Check-in
            </Link>
          </div>
        }
      />

      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-red-200">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" onClick={() => refetch()} className="h-8 px-3 text-xs">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Hero banner */}
      <div className="page-enter relative mb-6 overflow-hidden rounded-[22px] card-bytune p-6 shadow-2xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex flex-wrap items-center gap-2 chip-bytune">
              <span>Roll No: {studentRoll ?? 'Not Assigned'}</span>
              {studentDept && (
                <>
                  <span>•</span>
                  <span>{studentDept}</span>
                </>
              )}
              {semesterLabel && (
                <>
                  <span>•</span>
                  <span>{semesterLabel}</span>
                </>
              )}
            </div>
            <h1 className="font-display text-2xl font-extrabold text-hi sm:text-3xl">
              {streakCount !== null ? `${streakCount}-day attendance streak` : 'Attendance streak loading'}
            </h1>
            <p className="mt-1 text-sm text-mid">
              {dashboardStats?.last_synced_at
                ? `Last synced ${new Date(dashboardStats.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Awaiting synchronization'}
              {academicYear ? ` · Academic Year ${academicYear}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-[20px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30">
              <Flame className="h-8 w-8 animate-pulse text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-black text-hi">{streakCount !== null ? `${streakCount} Days` : '—'}</span>
                <Badge tone={streakCount && streakCount > 0 ? 'warning' : 'neutral'}>
                  {streakCount && streakCount > 0 ? 'Active Streak' : 'No Streak'}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-faint">Consecutive present class days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="page-enter mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Overall Attendance"
            value={attendancePercentage !== null ? `${attendancePercentage}%` : '—'}
            delta={attendancePercentage !== null ? (attendancePercentage >= minThreshold ? 'Eligible' : 'Shortage') : '0 Conducted'}
            deltaUp={attendancePercentage === null || attendancePercentage >= minThreshold}
            icon={<TrendingUp className="h-4 w-4" />}
            accent={attendancePercentage === null ? 'text-mid' : (attendancePercentage >= minThreshold ? 'text-spotify' : 'text-red-400')}
            footnote={attendancePercentage !== null ? `Policy threshold: ${minThreshold}% (${missed} missed)` : 'No conducted classes yet'}
          />
          <StatCard
            label="Classes Attended"
            value={dashboardStats ? String(attended) : '—'}
            delta={dashboardStats ? `/ ${conducted} conducted` : 'Unavailable'}
            icon={<UserCheck className="h-4 w-4" />}
            accent="text-accent"
            footnote={dashboardStats?.today_status ? `Today: ${dashboardStats.today_status.attended_count}/${dashboardStats.today_status.scheduled_count} logged` : 'Database verified'}
          />
          <StatCard
            label="Biometric Status"
            value={bioAcc != null ? `${bioAcc}%` : (studentMeta?.biometric_registered ? 'Enrolled' : 'Not Enrolled')}
            delta={studentMeta?.biometric_registered ? 'ArcFace Ready' : 'Action Needed'}
            deltaUp={Boolean(studentMeta?.biometric_registered)}
            icon={<Sparkles className="h-4 w-4" />}
            accent="text-accent2"
            footnote={bioAcc != null ? 'Observed recognition confidence' : (studentMeta?.biometric_registered ? '512-dim template stored securely' : 'Enroll face in Check-in or Profile')}
          />
          <StatCard
            label="Eligibility & Alerts"
            value={standingValue}
            delta={risk?.riskLevel || 'Evaluated'}
            deltaUp={!risk || risk.riskLevel === 'Safe'}
            icon={<Bot className="h-4 w-4" />}
            accent={risk?.riskLevel === 'Critical shortage' ? 'text-red-400' : 'text-amber'}
            footnote={`${counts.pending_leaves} pending leave · ${counts.pending_disputes} corrections · ${counts.unread_notifications} unread`}
          />
        </div>
      )}

      {/* Actionable Risk & Shortage Alerts + Quick Status Bar */}
      {!loading && dashboardStats && (counts.unread_notifications > 0 || counts.pending_leaves > 0 || counts.pending_disputes > 0 || (risk && risk.riskLevel !== 'Safe')) && (
        <div className="page-enter mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/student/notifications" className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-3.5 flex items-center justify-between hover:border-accent/40 transition-colors">
            <span className="flex items-center gap-2 text-xs text-hi"><BellRing className="h-4 w-4 text-accent" /> Unread Notifications</span>
            <Badge tone={counts.unread_notifications > 0 ? 'warning' : 'neutral'}>{counts.unread_notifications}</Badge>
          </Link>
          <Link href="/student/leave" className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-3.5 flex items-center justify-between hover:border-accent/40 transition-colors">
            <span className="flex items-center gap-2 text-xs text-hi"><FileCheck2 className="h-4 w-4 text-accent" /> Pending Leaves</span>
            <Badge tone={counts.pending_leaves > 0 ? 'info' : 'neutral'}>{counts.pending_leaves}</Badge>
          </Link>
          <Link href="/student/attendance" className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-3.5 flex items-center justify-between hover:border-accent/40 transition-colors">
            <span className="flex items-center gap-2 text-xs text-hi"><AlertTriangle className="h-4 w-4 text-amber-400" /> Pending Corrections</span>
            <Badge tone={counts.pending_disputes > 0 ? 'warning' : 'neutral'}>{counts.pending_disputes}</Badge>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="page-enter">
            <CardHeader
              icon={<CheckCircle2 className="h-5 w-5 text-spotify" />}
              title="Subject Attendance Breakdown"
              right={<span className="text-xs text-mid">Required: {minThreshold}%</span>}
            />
            <div className="space-y-4">
              {subjectsList.length === 0 ? (
                <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-faint">
                  No subject attendance records available yet.
                </div>
              ) : (
                subjectsList.map((sub: any) => {
                  const subAttended = sub.attended ?? sub.present ?? 0;
                  const subTotal = sub.conducted ?? sub.total ?? 0;
                  const pct = sub.percentage ?? (subTotal > 0 ? Math.round((subAttended / subTotal) * 100) : 0);
                  const isEligible = pct >= minThreshold;
                  return (
                    <div key={sub.subject} className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-accent/30">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold text-hi">{sub.subject}</span>
                          {sub.faculty_name && <span className="ml-2 text-[11px] text-faint">· {sub.faculty_name}</span>}
                        </div>
                        <span className="text-sm font-bold text-hi">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: sub.color || '#3B82F6' }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
                        <span>{subAttended} of {subTotal} conducted classes attended</span>
                        <span className={isEligible ? 'text-spotify' : 'text-red-400'}>
                          {isEligible
                            ? `Eligible (${sub.allowable_absences ?? 0} safe skip${sub.allowable_absences === 1 ? '' : 's'})`
                            : `Shortage — attend ${sub.classes_needed ?? 'more'} consecutive`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="page-enter">
            <CardHeader
              icon={<Clock className="h-5 w-5 text-spotify" />}
              title="Recent Attendance Activity"
              right={<Link href="/student/attendance" className="text-xs font-semibold text-accent hover:text-accent2 transition-colors">View all →</Link>}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 text-mid">
                  <tr>
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Date & Time</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentLogs.length > 0 ? (
                    recentLogs.slice(0, 5).map((rec: any, idx: number) => (
                      <tr key={rec.id || `rec-${idx}`} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-medium text-hi">{rec.subject || 'Class Session'}</td>
                        <td className="py-3 text-mid">{rec.date} • {rec.time}</td>
                        <td className="py-3 text-mid">{rec.room || 'Campus'}</td>
                        <td className="py-3">
                          {rec.status === 'Absent' ? (
                            <Badge tone="danger">Absent</Badge>
                          ) : rec.status === 'Late' ? (
                            <Badge tone="warning">Late</Badge>
                          ) : rec.verified_by === 'qr' ? (
                            <Badge tone="info"><QrCode className="h-3 w-3" /> QR Verified</Badge>
                          ) : rec.verified_by === 'face' ? (
                            <Badge tone="success">
                              <ScanFace className="h-3 w-3" /> ArcFace{typeof rec.confidence === 'number' ? ` ${(rec.confidence * 100).toFixed(0)}%` : ''}
                            </Badge>
                          ) : (
                            <Badge tone={statusTone(String(rec.status || 'present').toLowerCase())}>{rec.status || 'Present'}</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-xs text-faint">
                        No recent attendance logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="page-enter">
            <CardHeader
              icon={<CalendarDays className="h-5 w-5 text-accent" />}
              title="Today's Schedule"
              right={<Link href="/student/timetable" className="text-xs text-accent hover:text-accent2">Full week →</Link>}
            />
            <div className="space-y-3">
              {todaySlots.length === 0 ? (
                <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-faint">
                  {dashboardStats?.today_status?.is_holiday
                    ? 'Institutional holiday today — no scheduled classes.'
                    : 'No classes scheduled for today.'}
                </div>
              ) : (
                todaySlots.map((slot) => (
                  <div key={slot.id} className={`rounded-[16px] border p-3.5 transition-all hover:border-accent/30 ${slot.is_cancelled ? 'border-red-500/20 bg-red-500/5 opacity-75' : 'border-white/5 bg-white/[0.02]'}`}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-accent">{slot.time}</span>
                      {slot.status === 'live' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-spotify animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-spotify" /> LIVE NOW
                        </span>
                      ) : slot.is_cancelled ? (
                        <Badge tone="danger">Cancelled</Badge>
                      ) : slot.today_attendance_status ? (
                        <Badge tone={statusTone(String(slot.today_attendance_status).toLowerCase())}>{slot.today_attendance_status}</Badge>
                      ) : null}
                    </div>
                    <h4 className="text-sm font-bold text-hi">{slot.subject}</h4>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-mid">
                      <span>{slot.professor}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {slot.room}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="page-enter">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-[#050507] shadow-lg shadow-accent/25">
                <Bot className="h-7 w-7 text-[#050507]" />
              </div>
              <h3 className="font-display text-base font-bold text-hi">Nexa AI Copilot</h3>
              <p className="mt-1 text-xs leading-relaxed text-mid">
                Ask about your real attendance, deterministic recovery plans, upcoming classes, or leave status.
              </p>
              <Link
                href="/student/ai-chat"
                className="mt-4 btn-pill-accent w-full text-xs font-semibold flex items-center justify-center gap-2"
              >
                Open Nexa Chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          <Card className="page-enter">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-mid">
                  {forecast?.maxPossiblePercentage != null ? 'Max Semester Projection' : 'Current Eligibility Forecast'}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-hi">
                  {conducted > 0 ? `${projectionPct}%` : '—'}
                </p>
              </div>
              <ProgressRing
                percentage={conducted > 0 ? Math.round(projectionPct) : 0}
                size={84}
                stroke={9}
                color={attendancePercentage !== null && attendancePercentage < minThreshold ? '#F59E0B' : '#1ED760'}
                label={conducted > 0 ? (forecast?.eligible ? 'safe' : 'recover') : 'none'}
              />
            </div>
            <p className="mt-3 text-[11px] text-faint">
              {forecast?.statusNote || 'Attendance forecast will compute once classes are conducted.'}
            </p>
            <Link href="/student/analytics" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-accent2">
              Open Attendance Calculator <ArrowRight className="h-3 w-3" />
            </Link>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
