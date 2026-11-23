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
import { DEMO_PROFILES, MOCK_STUDENT_ATTENDANCE, MOCK_SUBJECT_STATS, MOCK_TIMETABLE } from '@/lib/demo-data';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const profile = user || DEMO_PROFILES.student;
  const [loading, setLoading] = useState(true);
  const [liveCheckins, setLiveCheckins] = useState(3);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    api.attendance.dashboard()
      .then((data) => {
        if (data) setDashboardStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const iv = setInterval(() => setLiveCheckins((n) => n + Math.floor(Math.random() * 2)), 8000);
    return () => clearInterval(iv);
  }, []);

  const todaySlots = MOCK_TIMETABLE.filter((s) => s.day === 'Mon');

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Student Portal"
        title={`Welcome back, ${profile.name.split(' ')[0]}`}
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
                <span>Roll No: {profile.rollNo}</span>
                <span>•</span>
                <span>{profile.department}</span>
              </div>
                <h1 className="font-display text-2xl font-extrabold text-hi sm:text-3xl">
                  {dashboardStats?.streak ?? profile.streakDays ?? 18}-day attendance streak
                </h1>
                  <p className="mt-1 text-sm text-mid">
                    {profile.streakTier || 'Golden Blaze'} tier • 6 more days until <span className="font-semibold text-amber-400">Diamond Inferno</span>
                  </p>
                </div>
                  <div className="flex items-center gap-4 rounded-[20px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 sm:p-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30">
                      <Flame className="h-8 w-8 animate-pulse text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-2xl font-black text-hi">{dashboardStats?.streak ?? profile.streakDays ?? 18} Days</span>
                        <Badge tone="warning">{profile.streakTier || 'Golden Blaze'}</Badge>
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
                  value={`${dashboardStats?.overall_attendance ?? 88.6}%`}
                  delta={(dashboardStats?.overall_attendance ?? 88.6) >= 75 ? '+2.1% this week' : 'Attendance Warning'}
                  icon={<TrendingUp className="h-4 w-4" />}
                  accent={(dashboardStats?.overall_attendance ?? 88.6) >= 75 ? 'text-spotify' : 'text-red-400'}
                  footnote={(dashboardStats?.overall_attendance ?? 88.6) >= 75 ? 'Above mandatory 75% limit' : 'Below mandatory 75% limit'}
                />
                <StatCard label="Classes Attended" value={String(dashboardStats?.total_present ?? 95)} delta={`/ ${dashboardStats?.total_classes ?? 107} total`} icon={<UserCheck className="h-4 w-4" />} accent="text-accent" footnote="12 authorized absences" />
                <StatCard label="Biometric Accuracy" value="99.4%" delta="ArcFace ONNX" icon={<Sparkles className="h-4 w-4" />} accent="text-accent2" footnote="Sub-300ms verification" />
                <StatCard label="Live Check-ins Today" value={String(liveCheckins)} delta="real-time" icon={<Bot className="h-4 w-4" />} accent="text-amber" footnote="Campus gate + classroom" />
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
                    {MOCK_SUBJECT_STATS.map((sub) => (
                  <div key={sub.subject} className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-accent/30">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-hi">{sub.subject}</span>
                      <span className="text-sm font-bold text-hi">{sub.percentage}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sub.percentage}%`, backgroundColor: sub.color }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-faint">
                      <span>{sub.attended} of {sub.total} classes attended</span>
                      <span className={sub.percentage >= 75 ? 'text-spotify' : 'text-red-400'}>
                        {sub.percentage >= 75 ? 'Eligible for Finals' : 'Shortage Warning'}
                      </span>
                    </div>
                  </div>
                ))}
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
                    {MOCK_STUDENT_ATTENDANCE.slice(0, 5).map((rec) => (
                      <tr key={rec.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-medium text-hi">{rec.subject}</td>
                        <td className="py-3 text-mid">{rec.date} • {rec.time}</td>
                        <td className="py-3 text-mid">{rec.room}</td>
                        <td className="py-3">
                          {rec.status === 'verified_face' ? (
                            <Badge tone="success"><ScanFace className="h-3 w-3" /> ArcFace {(((rec.confidence ?? 0.99) * 100).toFixed(1))}%</Badge>
                          ) : rec.status === 'verified_qr' ? (
                            <Badge tone="info"><QrCode className="h-3 w-3" /> QR Verified</Badge>
                          ) : rec.status === 'late' ? (
                            <Badge tone="warning">Late</Badge>
                          ) : (
                            <Badge tone="danger">Absent</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
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
                        {todaySlots.map((slot) => (
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
                                ))}
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
        </div>
                    </DashboardLayout>
                    );
}

