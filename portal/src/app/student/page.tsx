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

export default function StudentDashboardPage() {
  const profile = DEMO_PROFILES.student;
  const [loading, setLoading] = useState(true);
  const [liveCheckins, setLiveCheckins] = useState(3);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    const iv = setInterval(() => setLiveCheckins((n) => n + Math.floor(Math.random() * 3)), 5000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98]"
          >
            <ScanFace className="h-4 w-4" /> Quick Check-in
          </Link>
        }
      />

      {/* Hero banner */}
      <div className="page-enter relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-950/60 via-[#0E1428] to-purple-950/50 p-6 backdrop-blur-xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              <span>Roll No: {profile.rollNo}</span>
              <span>•</span>
              <span>{profile.department}</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              {profile.streakDays}-day attendance streak
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {profile.streakTier} tier • 6 more days until <span className="font-semibold text-amber-400">Diamond Inferno</span>
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30">
              <Flame className="h-8 w-8 animate-pulse text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-black text-white">{profile.streakDays} Days</span>
                <Badge tone="warning">{profile.streakTier}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">Gamified consistency reward</p>
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
          <StatCard label="Overall Attendance" value="88.6%" delta="+2.1% this week" icon={<TrendingUp className="h-4 w-4" />} accent="text-emerald-400" footnote="Above mandatory 75% limit" />
          <StatCard label="Classes Attended" value="95" delta="/ 107 total" icon={<UserCheck className="h-4 w-4" />} accent="text-indigo-400" footnote="12 authorized absences" />
          <StatCard label="Biometric Accuracy" value="99.4%" delta="ArcFace ONNX" icon={<Sparkles className="h-4 w-4" />} accent="text-purple-400" footnote="Sub-300ms verification" />
          <StatCard label="Live Check-ins Today" value={String(liveCheckins)} delta="real-time" icon={<Bot className="h-4 w-4" />} accent="text-amber-400" footnote="Campus gate + classroom" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: subjects + records */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="page-enter">
            <CardHeader
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Subject Attendance Breakdown"
              right={<span className="text-xs text-gray-400">Required: 75%</span>}
            />
            <div className="space-y-4">
              {MOCK_SUBJECT_STATS.map((sub) => (
                <div key={sub.subject} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-indigo-500/20">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{sub.subject}</span>
                    <span className="text-sm font-bold text-white">{sub.percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${sub.percentage}%`, backgroundColor: sub.color }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>{sub.attended} of {sub.total} classes attended</span>
                    <span className={sub.percentage >= 75 ? 'text-emerald-400' : 'text-red-400'}>
                      {sub.percentage >= 75 ? 'Eligible for Finals' : 'Shortage Warning'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="page-enter">
            <CardHeader
              icon={<Clock className="h-5 w-5 text-emerald-400" />}
              title="Recent Biometric Check-in Records"
              right={<Link href="/student/attendance" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">View all →</Link>}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 text-gray-400">
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
                      <td className="py-3 font-medium text-white">{rec.subject}</td>
                      <td className="py-3 text-gray-400">{rec.date} • {rec.time}</td>
                      <td className="py-3 text-gray-400">{rec.room}</td>
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
            <CardHeader icon={<CalendarDays className="h-5 w-5 text-purple-400" />} title="Today's Schedule" />
            <div className="space-y-3">
              {todaySlots.map((slot) => (
                <div key={slot.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-indigo-500/30">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-indigo-400">{slot.time}</span>
                    {slot.status === 'live' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE NOW
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white">{slot.subject}</h4>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                    <span>{slot.professor}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {slot.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="page-enter">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-display text-base font-bold text-white">Nexa AI Copilot</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                Ask about absences, attendance forecasts, safe-bunk calculations, or draft a leave letter.
              </p>
              <Link
                href="/student/ai-chat"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600/30 px-4 py-2.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30 transition-all hover:bg-indigo-600/50"
              >
                Open Nexa Chat <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          <Card className="page-enter">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Semester Projection</p>
                <p className="mt-1 font-display text-2xl font-bold text-white">94.1%</p>
              </div>
              <ProgressRing percentage={94} size={84} stroke={9} color="#10B981" label="safe" />
            </div>
            <p className="mt-3 text-[11px] text-gray-500">Attending the next 2 lectures keeps you finals-eligible across all subjects.</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

