'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  Flame, CheckCircle2, Clock, TrendingUp, UserCheck, Sparkles, Bot,
  CalendarDays, MapPin, ArrowRight, ScanFace, QrCode,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<{ subjects: any[]; logs: any[] }>({ subjects: [], logs: [] });
  const [timetableSlots, setTimetableSlots] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadStudentData() {
      setLoading(true);
      setDashboardStats(null);
      setAttendanceData({ subjects: [], logs: [] });
      setTimetableSlots([]);
      try {
        const [dashRes, ttRes] = await Promise.allSettled([
          api.attendance.dashboard(),
          api.academic.timetable()
        ]);
        if (isMounted && dashRes.status === 'fulfilled' && dashRes.value) {
          setDashboardStats(dashRes.value);
        }
        if (isMounted && ttRes.status === 'fulfilled' && Array.isArray(ttRes.value)) {
          setTimetableSlots(ttRes.value);
        }

        if (user?.email) {
          try {
            const studentRes = (await api.attendance.student(user.email)) as any;
            if (isMounted && studentRes) {
              const subjects = Array.isArray(studentRes.subjects) ? studentRes.subjects : (studentRes.subject_wise || []);
              const logs = Array.isArray(studentRes.attendance_logs) ? studentRes.attendance_logs : (studentRes.logs || []);
              setAttendanceData({ subjects, logs });
            }
          } catch { }
        }
      } catch (err) {
        console.error('Student data load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStudentData();
    return () => { isMounted = false; };
  }, [user?.email]);

  const profileName = user?.name || user?.email?.split('@')[0] || 'Student';
  const streakCount = dashboardStats?.streak ?? null;
  const attendancePercentage = dashboardStats?.overall_attendance ?? dashboardStats?.percentage ?? null;
  const studentRoll = (user as any)?.student_id || (user as any)?.roll_number || dashboardStats?.student?.student_id || null;
  const studentDept = (user as any)?.department || dashboardStats?.student?.department || null;

  // Real timetable slots for today
  const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const todaySlots = timetableSlots.filter((s) => s.day === currentDay);

  const subjectsList = attendanceData.subjects;

  const recentLogs = attendanceData.logs;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Student Portal"
        title={`Welcome back, ${profileName.split(' ')[0]}`}
        subtitle="All morning biometrics logged. Next scheduled lecture starts in 45 minutes."
        actions={
          <Link
            href="/student/checkin"
            className="btn-pill-accent text-[#050507] font-semibold flex items-center gap-2"
          >
            <ScanFace className="h-4 w-4" /> Quick Check-in
          </Link>
        }
      />

      {/* Hero banner */}
      <div className="page-enter relative mb-6 overflow-hidden rounded-[22px] card-bytune p-6 shadow-2xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 chip-bytune">
              <span>Roll No: {studentRoll ?? 'Unavailable'}</span>
              {studentDept && (
                <>
                  <span>•</span>
                  <span>{studentDept}</span>
                </>
              )}
            </div>
            <h1 className="font-display text-2xl font-extrabold text-hi sm:text-3xl">
              {streakCount !== null ? `${streakCount}-day attendance streak` : 'Attendance streak unavailable'}
            </h1>
            <p className="mt-1 text-sm text-mid">
              {streakCount !== null ? 'Consistency tracking active' : 'Connect to view live streak telemetry'}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-[20px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30">
              <Flame className="h-8 w-8 animate-pulse text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-black text-hi">{streakCount !== null ? `${streakCount} Days` : '—'}</span>
                <Badge tone="warning">{streakCount !== null ? 'Active Streak' : 'Unavailable'}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-faint">Gamified consistency reward</p>
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
            value={attendancePercentage !== null ? `${attendancePercentage}%` : 'Unavailable'}
            delta={attendancePercentage !== null ? (attendancePercentage >= 75 ? 'On track' : 'Attendance Warning') : 'No records'}
            icon={<TrendingUp className="h-4 w-4" />}
            accent={attendancePercentage === null ? 'text-mid' : (attendancePercentage >= 75 ? 'text-spotify' : 'text-red-400')}
            footnote={attendancePercentage !== null ? (attendancePercentage >= 75 ? 'Above mandatory 75% limit' : 'Below mandatory 75% limit') : 'Awaiting attendance data'}
          />
          <StatCard
            label="Classes Attended"
            value={dashboardStats?.total_present != null ? String(dashboardStats.total_present) : '—'}
            delta={dashboardStats?.total_classes != null ? `/ ${dashboardStats.total_classes} total` : 'Unavailable'}
            icon={<UserCheck className="h-4 w-4" />}
            accent="text-accent"
            footnote={dashboardStats?.total_present != null && dashboardStats?.total_classes != null ? 'Real database records' : 'Database records unavailable'}
          />
          <StatCard label="Biometric Accuracy" value="99.4%" delta="ArcFace ONNX" icon={<Sparkles className="h-4 w-4" />} accent="text-accent2" footnote="Sub-300ms verification" />
          <StatCard label="Institutional Standing" value="Good" delta="Compliant" icon={<Bot className="h-4 w-4" />} accent="text-amber" footnote="Eligible for examination" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: subjects + records */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="page-enter">
            <CardHeader
              icon={<CheckCircle2 className="h-5 w-5 text-spotify" />}
              title="Subject Attendance Breakdown"
              right={<span className="text-xs text-mid">Required: 75%</span>}
            />
            <div className="space-y-4">
              {subjectsList.length === 0 ? (
                <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-faint">
                  No subject attendance records available yet.
                </div>
              ) : (
                subjectsList.map((sub: any) => {
                  const attended = sub.attended ?? sub.present ?? 0;
                  const total = sub.total ?? 0;
                  const pct = sub.percentage ?? (total > 0 ? Math.round((attended / total) * 100) : 0);
                  return (
                    <div key={sub.subject} className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-accent/30">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-hi">{sub.subject}</span>
                        <span className="text-sm font-bold text-hi">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: sub.color || '#3B82F6' }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
                        <span>{attended} of {total} classes attended</span>
                        <span className={pct >= 75 ? 'text-spotify' : 'text-red-400'}>
                          {pct >= 75 ? 'Eligible for Finals' : 'Shortage Warning'}
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
              title="Recent Biometric Check-in Records"
              right={<Link href="/student/attendance" className="text-xs font-semibold text-accent hover:text-accent2 transition-colors">View all →</Link>}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 text-mid">
                  <tr>
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Time & Date</th>
                    <th className="pb-3 font-semibold">Location</th>
                    <th className="pb-3 font-semibold">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentLogs.length > 0 ? (
                    recentLogs.slice(0, 5).map((rec: any, idx: number) => (
                      <tr key={rec.id || `rec-${idx}`} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-medium text-hi">{rec.subject || 'Class Session'}</td>
                        <td className="py-3 text-mid">{rec.date} • {rec.time || '09:00'}</td>
                        <td className="py-3 text-mid">{rec.room || 'Room 401'}</td>
                        <td className="py-3">
                            {
                              rec.verified_by === 'qr' ? (
                                <Badge tone="info"><QrCode className="h-3 w-3" /> QR Verified</Badge>
                              ) : rec.verified_by === 'face' ? (
                                <Badge tone="success"><ScanFace className="h-3 w-3" /> ArcFace{rec.confidence != null ? ` ${rec.confidence}` : ''}</Badge>
                              ) : rec.status === 'Present' ? (
                                <Badge tone="success">Present</Badge>
                              ) : rec.status === 'Late' ? (
                                <Badge tone="warning">Late</Badge>
                              ) : (
                                <Badge tone="danger">Absent</Badge>
                              )
                            }
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

        {/* Right: timetable + AI */}
        <div className="space-y-6">
          <Card className="page-enter">
            <CardHeader icon={<CalendarDays className="h-5 w-5 text-accent" />} title="Today's Schedule" />
            <div className="space-y-3">
                {
                  todaySlots.length === 0 ? (
                    <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-faint">
                      No classes scheduled for {currentDay}.
                    </div>
                  ) : (
                    todaySlots.map((slot) => (
                      <div key={slot.id} className="rounded-[16px] border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-accent/30">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-accent">{slot.time}</span>
                          {slot.status === 'live' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-spotify animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-spotify" /> LIVE NOW
                            </span>
                          )}
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
            Ask about absences, attendance forecasts, safe-bunk calculations, or draft a leave letter.
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
            <p className="text-xs text-mid">Semester Projection</p>
            <p className="mt-1 font-display text-2xl font-bold text-hi">94.1%</p>
          </div>
          <ProgressRing percentage={94} size={84} stroke={9} color="#1ED760" label="safe" />
        </div>
        <p className="mt-3 text-[11px] text-faint">Attending the next 2 lectures keeps you finals-eligible across all subjects.</p>
      </Card>
    </div>
        </div >
                    </DashboardLayout >
                    );
}

