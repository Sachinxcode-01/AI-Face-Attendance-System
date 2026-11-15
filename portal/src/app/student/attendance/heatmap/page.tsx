'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { MOCK_HEATMAP } from '@/lib/demo-data';

const LEVELS = [
  'bg-white/[0.04]',
  'bg-indigo-500/25',
  'bg-indigo-500/45',
  'bg-indigo-500/70',
  'bg-indigo-400',
];

export default function StudentHeatmapPage() {
  const total = MOCK_HEATMAP.reduce((a, d) => a + d.count, 0);
  const activeDays = MOCK_HEATMAP.filter((d) => d.count > 0).length;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Analytics"
        title="Check-in Heatmap"
        subtitle="Daily check-in intensity across the last 30 days."
      />

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-gray-400">Total Check-ins</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-400">Active Days</p>
          <p className="mt-1 font-display text-2xl font-bold text-emerald-400">{activeDays}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-400">Avg / Day</p>
          <p className="mt-1 font-display text-2xl font-bold text-indigo-400">{(total / Math.max(activeDays, 1)).toFixed(1)}</p>
        </Card>
      </div>

      <Card className="page-enter">
        <CardHeader icon={<CalendarDaysIcon />} title="Last 30 Days" subtitle="Darker cells indicate more check-ins that day" />
        <div className="grid grid-cols-7 gap-2">
          {MOCK_HEATMAP.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.count} check-ins`}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border border-white/5 ${LEVELS[d.intensity]} transition-transform hover:scale-105`}
            >
              <span className="text-[10px] font-bold text-white/90">{d.count}</span>
              <span className="text-[8px] text-gray-400">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-gray-500">
          Less
          {LEVELS.map((l, i) => (
            <span key={i} className={`h-3 w-3 rounded ${l}`} />
          ))}
          More
        </div>
      </Card>
    </DashboardLayout>
  );
}

function CalendarDaysIcon() {
  return (
    <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
