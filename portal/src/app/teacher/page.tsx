'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  MonitorPlay, UsersRound, FileCheck2, BarChart3, QrCode, Play, Square,
  CheckCircle, XCircle, RefreshCw, Activity,
} from 'lucide-react';
import { DEMO_PROFILES, MOCK_SESSIONS, MOCK_ROSTER, MOCK_LEAVE_REQUESTS } from '@/lib/demo-data';

export default function TeacherDashboardPage() {
  const profile = DEMO_PROFILES.teacher;
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(true);
  const [qrCounter, setQrCounter] = useState(15);
  const [roster, setRoster] = useState(MOCK_ROSTER);
  const [pendingLeaves, setPendingLeaves] = useState(MOCK_LEAVE_REQUESTS.filter((l) => l.status === 'pending'));

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      setQrCounter((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive]);

  const toggleStatus = (id: string) => {
    setRoster((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'present' ? 'absent' : 'present', time: s.status === 'present' ? '--' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : s
      )
    );
  };

  const presentCount = roster.filter((r) => r.status === 'present').length;
  const liveSession = MOCK_SESSIONS[0];

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Faculty Portal"
        title="Classroom Command Center"
        subtitle={`${profile.name} • ${liveSession.subject} (${liveSession.room})`}
        actions={
          <button
            onClick={() => setSessionActive(!sessionActive)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all ${sessionActive ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
          >
            {sessionActive ? <Square className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
            {sessionActive ? 'Stop Session' : 'Start Live Session'}
          </button>
        }
      />

      {/* Live session banner */}
        <div className="page-enter mb-6 flex flex-col items-start justify-between gap-4 rounded-[22px] card-bytune p-6 shadow-2xl sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${sessionActive ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                {sessionActive ? 'Live attendance session active' : 'Session stopped'}
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-white">
                {liveSession.subject} <span className="text-sm font-normal text-gray-400">• {liveSession.startTime} – {liveSession.endTime}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span className="font-mono text-xs text-gray-300">Next QR rotation in {qrCounter}s</span>
          </div>
        </div>

        {loading ? (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="page-enter mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Present Now" value={`${presentCount}`} delta={`of ${roster.length} registered`} icon={<UsersRound className="h-4 w-4" />} accent="text-emerald-400" footnote="Live roster sync" />
            <StatCard label="Session Check-in Rate" value={`${Math.round((presentCount / roster.length) * 100)}%`} delta="+6% vs last week" icon={<Activity className="h-4 w-4" />} accent="text-indigo-400" footnote="ArcFace + QR combined" />
            <StatCard label="Pending Leaves" value={String(pendingLeaves.length)} delta="awaiting review" icon={<FileCheck2 className="h-4 w-4" />} accent="text-amber-400" footnote="1-click approve / reject" />
            <StatCard label="Spoofs Blocked" value="3" delta="this session" icon={<QrCode className="h-4 w-4" />} accent="text-red-400" footnote="Expired token replays" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Roster */}
          <Card className="page-enter lg:col-span-2">
            <CardHeader
              icon={<UsersRound className="h-5 w-5 text-emerald-400" />}
              title="Live Classroom Roster"
              right={<span className="text-xs text-gray-400">Click status to override</span>}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 text-gray-400">
                  <tr>
                    <th className="pb-3 font-semibold">Student</th>
                    <th className="pb-3 font-semibold">Roll No</th>
                    <th className="pb-3 font-semibold">Time</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 text-right font-semibold">Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {roster.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-semibold text-white">{s.name}</td>
                      <td className="py-3 font-mono text-gray-400">{s.rollNo}</td>
                      <td className="py-3 text-gray-400">{s.time}</td>
                      <td className="py-3 text-gray-400">{s.method}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => toggleStatus(s.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${s.status === 'present'
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-300'
                            : 'bg-red-500/20 text-red-300 hover:bg-emerald-500/20 hover:text-emerald-300'
                            }`}
                        >
                          {s.status === 'present' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {s.status === 'present' ? 'Present' : 'Absent'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            <Card className="page-enter">
              <CardHeader icon={<MonitorPlay className="h-5 w-5 text-indigo-400" />} title="Quick Actions" />
              <div className="grid grid-cols-2 gap-2">
                <Link href="/teacher/qr-projector" className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10">
                  <QrCode className="mx-auto h-5 w-5 text-indigo-400" />
                  <p className="mt-2 text-[11px] font-bold text-white">QR Projector</p>
                </Link>
                <Link href="/teacher/kiosk" className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10">
                  <UsersRound className="mx-auto h-5 w-5 text-emerald-400" />
                  <p className="mt-2 text-[11px] font-bold text-white">Kiosk Mode</p>
                </Link>
                <Link href="/teacher/sessions" className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10">
                  <Activity className="mx-auto h-5 w-5 text-amber-400" />
                  <p className="mt-2 text-[11px] font-bold text-white">Sessions</p>
                </Link>
                <Link href="/teacher/analytics" className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-center transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10">
                  <BarChart3 className="mx-auto h-5 w-5 text-purple-400" />
                  <p className="mt-2 text-[11px] font-bold text-white">Analytics</p>
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
                {pendingLeaves.length === 0 && <p className="py-4 text-center text-xs text-gray-500">Inbox clear — all leave requests reviewed.</p>}
                {pendingLeaves.map((req) => (
                  <div key={req.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{req.studentName}</span>
                      <Badge tone="neutral">{req.category}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-gray-400">{req.reason}</p>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={() => setPendingLeaves((p) => p.filter((l) => l.id !== req.id))}
                        className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setPendingLeaves((p) => p.filter((l) => l.id !== req.id))}
                        className="flex-1 rounded-lg border border-red-500/30 bg-red-600/30 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-600/50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
    </DashboardLayout >
  );
}