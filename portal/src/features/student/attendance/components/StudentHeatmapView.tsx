'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CalendarDays, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import type { HeatmapDay } from '@/lib/types';
import { useStudentHeatmapQuery } from '../attendance.queries';

const LEVELS = [
  'bg-white/[0.04] text-faint',
  'bg-accent/20 border-accent/30 text-accent',
  'bg-accent/40 border-accent/50 text-white',
  'bg-accent/70 border-accent/80 text-white',
  'bg-accent text-[#050507] font-bold shadow-md shadow-accent/25',
];

export function StudentHeatmapView() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const { data, isLoading: loading, error: queryError, refetch } = useStudentHeatmapQuery(user?.email, days);

  const heatmap: HeatmapDay[] = data && Array.isArray(data.heatmap) ? data.heatmap : [];
  const error = queryError ? (queryError instanceof ApiError ? queryError.message : 'Unable to load attendance heatmap.') : '';

  const total = heatmap.reduce((a, d) => a + d.count, 0);
  const activeDays = heatmap.filter((d) => d.count > 0).length;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Analytics"
        title="Check-in Heatmap"
        subtitle={`Daily biometric and QR verification intensity across the last ${days} calendar days.`}
        actions={
          <div className="flex items-center gap-2">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`chip-bytune h-8 px-3 text-xs ${days === d ? 'chip-bytune-active' : ''}`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between text-xs text-red-200">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-400" /> {error}</span>
            <Button variant="secondary" onClick={() => refetch()} className="h-8 px-3 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        </Card>
      )}

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Total Check-ins ({days}d)</p>
          <p className="mt-2 font-display text-2xl font-semibold text-hi">{total}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Active Class Days</p>
          <p className="mt-2 font-display text-2xl font-semibold text-emerald-400">{activeDays}</p>
        </Card>
        <Card className="col-span-2 sm:col-span-1 p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Consistency</p>
          <p className="mt-2 font-display text-2xl font-semibold text-accent">{days > 0 ? Math.round((activeDays / days) * 100) : 0}%</p>
        </Card>
      </div>

      <Card className="page-enter p-6">
        <CardHeader icon={<CalendarDays className="h-5 w-5 text-accent" />} title={`Last ${days} Days Activity Matrix`} />
        {loading ? (
          <p className="py-10 text-center font-mono text-xs text-faint">Loading heatmap activity…</p>
        ) : (
          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-10">
            {heatmap.map((d) => (
              <div
                key={d.date}
                title={`${d.date} (${d.day}): ${d.count} check-in(s)`}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border border-white/[0.06] text-xs transition-transform hover:scale-105 ${LEVELS[d.intensity] || LEVELS[0]}`}
              >
                <span className="font-mono text-[11px]">{d.count}</span>
                <span className="font-mono text-[9px] opacity-75">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
