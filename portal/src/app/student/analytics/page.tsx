'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MOCK_ANALYTICS, MOCK_SUBJECT_STATS } from '@/lib/demo-data';

export default function StudentAnalyticsPage() {
  const weeklyMax = Math.max(...MOCK_ANALYTICS.weekly.map((w) => w.total), 5);

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Analytics"
        title="Attendance Insights"
        subtitle="Longitudinal performance metrics, weekly compliance rhythms, and risk forecasting."
      />

      <div className="page-enter mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ProgressRing percentage={88.6} size={140} stroke={12} color="#8F8BFF" label="overall" />
          <p className="mt-3 font-display text-sm font-semibold text-hi">Overall Attendance</p>
          <p className="font-mono text-[11px] text-faint">95 of 107 lectures verified</p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <CardHeader title="Weekly Attendance Pattern" subtitle="Lectures verified vs scheduled per day this week" />
          <div className="flex h-48 items-end gap-3 pt-4">
            {MOCK_ANALYTICS.weekly.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-[10.5px] font-semibold text-mid">{d.attended}/{d.total}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-accent to-accent2 transition-all duration-500 shadow-[0_0_12px_rgba(143,139,255,0.2)]"
                  style={{ height: `${(d.attended / weeklyMax) * 100}%` }}
                />
                <span className="font-mono text-[11px] text-faint">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="page-enter p-6">
          <CardHeader title="Subject Performance" subtitle="Attendance percentage vs 75% mandatory threshold" />
          <div className="space-y-4 pt-2">
            {MOCK_SUBJECT_STATS.map((s) => (
              <div key={s.subject}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-hi">{s.subject}</span>
                  <span className="font-mono text-mid">{s.percentage}%</span>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div className="absolute inset-y-0 left-0 w-[75%] border-r-2 border-amber-400/80" title="75% threshold" />
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-accent to-accent2"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="page-enter p-6">
          <CardHeader title="Semester Trajectory" subtitle="Weekly aggregate attendance rate across the semester" />
          <div className="flex h-44 items-end gap-2.5 pt-4">
            {MOCK_ANALYTICS.monthlyTrend.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-accent/50 to-accent transition-all duration-500"
                  style={{ height: `${v}%` }}
                />
                <span className="font-mono text-[9.5px] text-faint">W{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-[11px] text-faint">
            Target benchmark: &gt;85% overall average across 16 academic weeks.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
