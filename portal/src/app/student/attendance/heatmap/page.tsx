'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CalendarDays, RefreshCw, AlertCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { HeatmapDay } from '@/lib/types';

const LEVELS = [
  'bg-white/[0.04] text-faint',
  'bg-accent/20 border-accent/30 text-accent',
  'bg-accent/40 border-accent/50 text-white',
  'bg-accent/70 border-accent/80 text-white',
  'bg-accent text-[#050507] font-bold shadow-md shadow-accent/25',
];

export default function StudentHeatmapPage() {
  const [days, setDays] = useState(30);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHeatmap = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.attendance.heatmap(days);
      if (data && Array.isArray(data.heatmap)) {
        setHeatmap(data.heatmap);
      } else {
        setHeatmap([]);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Unable to load attendance heatmap.');
      setHeatmap([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

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
            <Button variant="secondary" onClick={loadHeatmap} className="h-8 px-3 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        </Card>
      )}

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Total Check-ins</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-hi">{loading ? '—' : total}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Active Days</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-emerald-400">{loading ? '—' : activeDays}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Avg / Active Day</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-accent">{loading ? '—' : (activeDays > 0 ? (total / activeDays).toFixed(1) : '0.0')}</p>
        </Card>
      </div>

      <Card className="page-enter p-6">
        <CardHeader icon={<CalendarDays className="h-5 w-5 text-accent" />} title={`Last ${days} Days`} subtitle="Cell luminance correlates with daily lecture verification count" />
        {loading ? (
          <p className="py-10 text-center font-mono text-xs text-faint">Loading calendar heatmap…</p>
        ) : heatmap.length === 0 ? (
          <p className="py-10 text-center font-mono text-xs text-faint">No verification activity in this period.</p>
        ) : (
          <div className="grid grid-cols-7 gap-2.5 pt-2">
            {heatmap.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} check-in${d.count === 1 ? '' : 's'}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-[14px] border border-white/[0.06] ${LEVELS[d.intensity] || LEVELS[0]} transition-transform hover:scale-105`}
              >
                <span className="font-mono text-[11px] font-bold">{d.count}</span>
                <span className="font-mono text-[8.5px] uppercase opacity-75">{d.day}</span>
                <span className="font-mono text-[7.5px] opacity-60">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
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
