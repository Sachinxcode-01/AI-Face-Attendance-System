'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

interface AnalyticsData {
  overall_percentage: number;
  subjects: Array<{ subject: string; percentage: number; present?: number; total?: number }>;
  weekly_trends: Array<{ day?: string; label?: string; attended?: number; present?: number; total?: number }>;
  monthly_trends: Array<{ label?: string; percentage?: number; rate?: number }>;
}

export default function StudentAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    apiFetch<AnalyticsData>(`/attendance/analytics/${encodeURIComponent(user.email)}`)
      .then((res) => {
        if (!active) return;
        setData(res);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Unable to load attendance analytics.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.email]);

  const overallPct = data ? Math.round((data.overall_percentage <= 1 ? data.overall_percentage * 100 : data.overall_percentage) * 10) / 10 : 0;
  const weekly = data?.weekly_trends || [];
  const subjects = data?.subjects || [];
  const monthly = data?.monthly_trends || [];
  const weeklyMax = Math.max(...weekly.map((w) => w.total || 0), 1);

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Analytics"
        title="Attendance Insights"
        subtitle="Longitudinal performance metrics, weekly compliance rhythms, and risk forecasting."
      />

        {loading ? (
          <Card className="p-8 text-center text-sm text-mid">Loading live attendance analytics...</Card>
        ) : error ? (
          <Card className="border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">{error}</Card>
        ) : !data ? (
          <Card className="p-8 text-center text-sm text-mid">No attendance analytics available yet.</Card>
        ) : (
        <>
            <div className="page-enter mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="flex flex-col items-center justify-center p-6 text-center">
                <ProgressRing percentage={overallPct} size={140} stroke={12} color="#8F8BFF" label="overall" />
                <p className="mt-3 font-display text-sm font-semibold text-hi">Overall Attendance</p>
                <p className="font-mono text-[11px] text-faint">Computed from verified session records</p>
              </Card>

                  <Card className="p-6 lg:col-span-2">
                    <CardHeader title="Weekly Attendance Pattern" subtitle="Lectures verified vs scheduled per day" />
                    {weekly.length === 0 ? (
                      <p className="py-10 text-center text-xs text-faint">No weekly pattern data recorded yet.</p>
                    ) : (
                      <div className="flex h-48 items-end gap-3 pt-4">
                        {weekly.map((d, idx) => {
                          const attended = d.attended ?? d.present ?? 0;
                          const total = d.total ?? attended;
                          return (
                            <div key={d.day || d.label || idx} className="flex flex-1 flex-col items-center gap-2">
                              <span className="font-mono text-[10.5px] font-semibold text-mid">{attended}/{total}</span>
                              <div
                                className="w-full rounded-t-lg bg-gradient-to-t from-accent to-accent2 transition-all duration-500 shadow-[0_0_12px_rgba(143,139,255,0.2)]"
                                style={{ height: `${Math.min(100, (attended / weeklyMax) * 100)}%` }}
                              />
                              <span className="font-mono text-[11px] text-faint">{d.day || d.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                          <Card className="page-enter p-6">
                            <CardHeader title="Subject Performance" subtitle="Attendance percentage vs 75% mandatory threshold" />
                            {subjects.length === 0 ? (
                              <p className="py-8 text-center text-xs text-faint">No subject-level attendance records yet.</p>
                            ) : (
                <div className="space-y-4 pt-2">
                  {subjects.map((s) => {
                    const pct = Math.round((s.percentage <= 1 ? s.percentage * 100 : s.percentage) * 10) / 10;
                    return (
                      <div key={s.subject}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-hi">{s.subject}</span>
                          <span className="font-mono text-mid">{pct}%</span>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                          <div className="absolute inset-y-0 left-0 w-[75%] border-r-2 border-amber-400/80" title="75% threshold" />
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-accent to-accent2"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="page-enter p-6">
              <CardHeader title="Monthly Trajectory" subtitle="Aggregate attendance rate across recent months" />
              {monthly.length === 0 ? (
                <p className="py-8 text-center text-xs text-faint">No monthly trajectory data yet.</p>
              ) : (
                <div className="flex h-44 items-end gap-2.5 pt-4">
                  {monthly.map((m, i) => {
                    const pct = Math.min(100, Math.round((m.percentage ?? m.rate ?? 0)));
                    return (
                      <div key={m.label || i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-accent/50 to-accent transition-all duration-500"
                          style={{ height: `${pct}%` }}
                        />
                        <span className="font-mono text-[9.5px] text-faint">{m.label || `M${i + 1}`}</span>
                      </div>
                    );
                  })}
                </div>
              )}
                            <p className="mt-4 font-mono text-[11px] text-faint">
                              Target benchmark: &gt;75% mandatory institutional eligibility.
                            </p>
                          </Card>
                        </div>
        </>
      )}
              </DashboardLayout>
              );
}
