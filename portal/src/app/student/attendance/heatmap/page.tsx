'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { CalendarDays } from 'lucide-react';
import { MOCK_HEATMAP } from '@/lib/demo-data';

const LEVELS = [
  'bg-white/[0.04] text-faint',
  'bg-accent/20 border-accent/30 text-accent',
  'bg-accent/40 border-accent/50 text-white',
  'bg-accent/70 border-accent/80 text-white',
  'bg-accent text-[#050507] font-bold shadow-md shadow-accent/25',
];

export default function StudentHeatmapPage() {
  const total = MOCK_HEATMAP.reduce((a, d) => a + d.count, 0);
  const activeDays = MOCK_HEATMAP.filter((d) => d.count > 0).length;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Analytics"
        title="Check-in Heatmap"
        subtitle="Daily biometric verification intensity across the last 30 calendar days."
      />

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Total Check-ins</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-hi">{total}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Active Days</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-emerald-400">{activeDays}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Avg / Day</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-accent">{(total / Math.max(activeDays, 1)).toFixed(1)}</p>
        </Card>
      </div>

      <Card className="page-enter p-6">
        <CardHeader icon={<CalendarDays className="h-5 w-5 text-accent" />} title="Last 30 Days" subtitle="Cell luminance correlates with daily gate and lecture verification count" />
        <div className="grid grid-cols-7 gap-2.5 pt-2">
          {MOCK_HEATMAP.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count} check-ins`}
              className={`flex aspect-square flex-col items-center justify-center rounded-[14px] border border-white/[0.06] ${LEVELS[d.intensity]} transition-transform hover:scale-105`}
            >
              <span className="font-mono text-[11px] font-bold">{d.count}</span>
              <span className="font-mono text-[8.5px] uppercase opacity-75">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2 font-mono text-[11px] text-faint">
          <span>Less</span>
          {LEVELS.map((l, i) => (
            <span key={i} className={`h-3.5 w-3.5 rounded-md border border-white/5 ${l}`} />
          ))}
          <span>More</span>
        </div>
      </Card>
    </DashboardLayout>
  );
}
