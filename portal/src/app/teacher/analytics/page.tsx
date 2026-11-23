'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import type { TeacherAnalytics } from '@/lib/types';
import { BarChart3, RefreshCw, ScanFace, QrCode, MonitorPlay, Activity, TrendingUp } from 'lucide-react';

export default function TeacherAnalyticsPage() {
  const { toasts, push, dismiss } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.teacher.analytics();
      setAnalytics(data as TeacherAnalytics);
    } catch {
      push('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const maxWeekly = Math.max(1, ...(analytics?.weekly_trends || []).map((w) => w.present));

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Insights"
        title="Course Analytics"
        subtitle="Attendance performance, verification method mix, and weekly trends across every session you teach."
        actions={
          <button onClick={load} className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {loading ? (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : analytics ? (
        <div className="page-enter mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Attendance Rate"
            value={`${analytics.attendance_rate}%`}
            delta={analytics.attendance_rate >= 75 ? 'Healthy' : 'Below 75%'}
            deltaUp={analytics.attendance_rate >= 75}
            icon={<Activity className="h-4 w-4" />}
            accent="text-emerald-400"
            footnote="Across all sessions"
          />
          <StatCard
            label="Total Sessions"
            value={String(analytics.total_sessions)}
            delta={`${analytics.present_marks} present marks`}
            icon={<MonitorPlay className="h-4 w-4" />}
            accent="text-accent"
            footnote="This semester"
          />
          <StatCard
            label="Face Verification"
            value={String(analytics.face_scans)}
            delta={analytics.avg_confidence != null ? `${analytics.avg_confidence}% avg conf` : 'ArcFace 512d'}
            icon={<ScanFace className="h-4 w-4" />}
            accent="text-accent2"
            footnote="Biometric check-ins"
          />
          <StatCard
            label="QR Check-ins"
            value={String(analytics.qr_scans)}
            delta={`${analytics.manual_scans} manual`}
            icon={<QrCode className="h-4 w-4" />}
            accent="text-amber"
            footnote="Dynamic token scans"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly trend chart */}
        <Card className="page-enter lg:col-span-2 p-6">
          <CardHeader
            icon={<TrendingUp className="h-5 w-5 text-accent" />}
            title="Weekly Attendance Trend"
            subtitle="Present marks per week across your sessions"
            right={<Badge tone="info">Last 8 weeks</Badge>}
          />
          <div className="mt-4 flex h-56 items-end gap-3">
            {(analytics?.weekly_trends || []).map((week) => (
              <div key={`${week.year}-${week.week}`} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-[10px] font-semibold text-hi">{week.rate}%</span>
                <div className="flex h-40 w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-accent/40 to-accent transition-all duration-500"
                    style={{ height: `${Math.max(4, (week.present / maxWeekly) * 100)}%` }}
                    title={`Week ${week.week}: ${week.present}/${week.total} present`}
                  />
                </div>
                <span className="font-mono text-[10px] text-faint">W{week.week}</span>
              </div>
            ))}
            {(analytics?.weekly_trends || []).length === 0 && (
              <p className="w-full py-10 text-center text-xs text-faint font-mono">
                No attendance data yet — start a session to build trends.
              </p>
            )}
          </div>
        </Card>

        {/* Verification method mix */}
        <Card className="page-enter p-6">
          <CardHeader icon={<BarChart3 className="h-5 w-5 text-accent2" />} title="Verification Mix" />
          {analytics && analytics.present_marks > 0 ? (
            <div className="space-y-4">
              {[
                { label: 'Face', value: analytics.face_scans, color: 'bg-emerald-400' },
                { label: 'QR', value: analytics.qr_scans, color: 'bg-accent' },
                { label: 'Manual', value: analytics.manual_scans, color: 'bg-amber-400' },
              ].map((m) => {
                const pct = Math.round((m.value / analytics.present_marks) * 100);
                return (
                  <div key={m.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-hi">{m.label}</span>
                      <span className="font-mono text-mid">{m.value} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/[0.06]">
                      <div className={`h-2 rounded-full ${m.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-faint font-mono">No check-ins recorded yet.</p>
          )}
        </Card>
      </div>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}