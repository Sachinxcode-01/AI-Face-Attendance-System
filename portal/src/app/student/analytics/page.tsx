'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { MOCK_SUBJECT_STATS, MOCK_ANALYTICS } from '@/lib/demo-data';

export default function StudentAnalyticsPage() {
  const weeklyMax = 6;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Analytics"
        title="Attendance Analytics"
        subtitle="Subject-wise breakdown, weekly patterns, and semester trajectory."
      />

      <div className="page-enter mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <ProgressRing percentage={88.6} size={140} stroke={12} color="#6366F1" label="overall" />
          <p className="mt-3 text-sm font-bold text-white">Overall Attendance</p>
          <p className="text-[11px] text-gray-500">95 of 107 classes attended</p>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <CardHeader title="Weekly Pattern" subtitle="Classes attended per day this week" />
          <div className="flex h-48 items-end gap-3">
            {MOCK_ANALYTICS.weekly.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400">{d.attended}/{d.total}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-500"
                  style={{ height: `${(d.attended / weeklyMax) * 100}%` }}
                />
                <span className="text-[10px] text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="page-enter">
          <CardHeader title="Subject Performance" subtitle="Attendance rate vs 75% requirement" />
          <div className="space-y-4">
            {MOCK_SUBJECT_STATS.map((s) => (
              <div key={s.subject}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{s.subject}</span>
                  <span className="font-mono text-gray-400">{s.percentage}%</span>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="absolute inset-y-0 left-0 w-[75%] border-r-2 border-amber-400/60" title="75% threshold" />
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="page-enter">
          <CardHeader title="Semester Trajectory" subtitle="Overall attendance trend across the term" />
          <div className="flex h-44 items-end gap-2">
            {MOCK_ANALYTICS.monthlyTrend.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-700/60 to-indigo-400/80"
                  style={{ height: `${v}%` }}
                />
                <span className="text-[9px] text-gray-500">W{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">
            Trend is <span className="font-semibold text-emerald-400">positive</span> — current pace projects 94.1% by finals.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
