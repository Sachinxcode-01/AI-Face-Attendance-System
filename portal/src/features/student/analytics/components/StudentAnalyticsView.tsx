'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { Calculator, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { useStudentAnalyticsQuery, useSimulateForecastMutation } from '../analytics.queries';

export function StudentAnalyticsView() {
  const { user } = useAuth();
  const [target, setTarget] = useState<number>(75);
  const [customTarget, setCustomTarget] = useState<string>('75');

  const [simSubject, setSimSubject] = useState('all');
  const [simAttend, setSimAttend] = useState(5);
  const [simMiss, setSimMiss] = useState(0);
  const [simResult, setSimResult] = useState<any>(null);
  const [simError, setSimError] = useState('');

  const { data, isLoading: loading, error: queryError, refetch } = useStudentAnalyticsQuery(user?.email, target);
  const simulate = useSimulateForecastMutation();

  const error = simError || (queryError ? (queryError instanceof ApiError ? queryError.message : 'Unable to load attendance analytics.') : '');

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimError('');
    try {
      const res = await simulate.mutateAsync({
        target,
        attend_upcoming: simAttend,
        miss_upcoming: simMiss,
        subject: simSubject === 'all' ? undefined : simSubject,
      });
      setSimResult(res?.simulation || null);
    } catch (err: unknown) {
      setSimError(err instanceof ApiError ? err.message : 'Simulation failed.');
    }
  };

  const overallPct = data ? Math.round((data.overall_percentage <= 1 && data.overall_percentage > 0 && !data.has_records ? data.overall_percentage * 100 : data.overall_percentage) * 10) / 10 : 0;
  const weekly: any[] = data?.weekly_trends || [];
  const subjects: any[] = data?.subjects || [];
  const monthly: any[] = data?.monthly_trends || [];
  const weeklyMax = Math.max(...weekly.map((w) => w.total || 0), 1);
  const forecast = data?.forecast;
  const risk = data?.risk;

  const riskTone =
    risk?.riskLevel === 'Critical shortage' ? 'danger'
      : risk?.riskLevel === 'At risk' || risk?.riskLevel === 'Attention required' ? 'warning'
        : 'success';

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Analytics & Forecasting"
        title="Attendance Insights"
        subtitle="Deterministic attendance calculator, what-if simulator, recovery planning, and risk intelligence."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {[75, 80, 85].map((t) => (
              <button
                key={t}
                onClick={() => { setTarget(t); setCustomTarget(String(t)); }}
                className={`chip-bytune h-8 px-3 text-xs ${target === t ? 'chip-bytune-active' : ''}`}
              >
                {t}% Target
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={100}
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="w-16 rounded-full border border-[var(--hairline)] bg-surface px-2.5 py-1 text-center font-mono text-xs text-hi focus:border-accent focus:outline-none"
                aria-label="Custom target percentage"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  const n = Math.min(100, Math.max(1, Number(customTarget) || 75));
                  setTarget(n);
                }}
                className="h-8 px-3 text-xs"
              >
                Apply
              </Button>
            </div>
          </div>
        }
      />

      {loading ? (
        <Card className="p-8 text-center text-sm text-mid">Loading live attendance analytics...</Card>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" onClick={() => refetch()} className="h-8 px-3 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </Card>
      ) : !data ? (
        <Card className="p-8 text-center text-sm text-mid">No attendance analytics available yet.</Card>
      ) : (
        <>
          <div className="page-enter mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center p-6 text-center">
              <ProgressRing percentage={data.has_records ? overallPct : 0} size={140} stroke={12} color="#8F8BFF" label="overall" />
              <p className="mt-3 font-display text-sm font-semibold text-hi">
                {data.has_records ? `${overallPct}% (${data.total_present}/${data.total_conducted})` : 'No Conducted Classes'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {risk && <Badge tone={riskTone}>{risk.riskLevel}</Badge>}
                <Badge tone="neutral">Target: {target}%</Badge>
              </div>
              {forecast && <p className="mt-2.5 font-mono text-[11px] text-mid">{forecast.statusNote}</p>}
              {forecast?.estimated_recovery_date && (
                <p className="mt-1 font-mono text-[10.5px] text-accent">
                  Est. recovery date: {forecast.estimated_recovery_date}
                </p>
              )}
            </Card>

            <Card className="p-6 lg:col-span-2">
              <CardHeader title="Weekly Attendance Pattern" subtitle="Confirmed attended vs conducted sessions per week" />
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
                          style={{ height: `${total > 0 ? Math.max(8, Math.min(100, (attended / weeklyMax) * 100)) : 4}%` }}
                        />
                        <span className="font-mono text-[11px] text-faint">{d.day || d.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="page-enter p-6">
              <CardHeader
                icon={<Calculator className="h-5 w-5 text-accent" />}
                title="What-If Attendance Simulator"
                subtitle="Deterministic forecast — clearly distinct from confirmed records"
              />
              <form onSubmit={runSimulation} className="space-y-4 text-xs">
                <div>
                  <label className="mb-1 block font-mono text-[11px] uppercase text-mid">Scope</label>
                  <select
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                  >
                    <option value="all">Overall Attendance ({data.total_present ?? 0}/{data.total_conducted ?? 0})</option>
                    {subjects.map((s) => (
                      <option key={s.subject} value={s.subject}>
                        {s.subject} ({s.attended ?? s.present ?? 0}/{s.conducted ?? s.total ?? 0})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase text-mid">Attend Next (Classes)</label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={simAttend}
                      onChange={(e) => setSimAttend(Math.max(0, parseInt(e.target.value || '0', 10)))}
                      className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 font-mono text-xs text-hi focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase text-mid">Miss Next (Classes)</label>
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={simMiss}
                      onChange={(e) => setSimMiss(Math.max(0, parseInt(e.target.value || '0', 10)))}
                      className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 font-mono text-xs text-hi focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
                <Button type="submit" loading={simulate.isPending} className="w-full">Run Deterministic Forecast</Button>
                {simResult && (
                  <div className="rounded-xl border border-accent/30 bg-accent/10 p-3.5 space-y-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-accent font-semibold">Forecast Result (Hypothetical)</span>
                      <Badge tone={simResult.eligible ? 'success' : 'danger'}>
                        {simResult.currentPercentage != null ? `${simResult.currentPercentage}%` : '—'}
                      </Badge>
                    </div>
                    <p className="text-hi">{simResult.attended}/{simResult.conducted} classes · {simResult.statusNote}</p>
                  </div>
                )}
              </form>
            </Card>

            <Card className="page-enter p-6">
              <CardHeader
                icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
                title="Explainable Risk Intelligence"
                subtitle="Rule-based early warning & recovery plan"
              />
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="text-mid">Risk Classification</span>
                  <Badge tone={riskTone}>{risk?.riskLevel || 'Safe'}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="text-mid">Trend & Consecutive Absences</span>
                  <span className="font-mono text-hi">{risk?.trendDirection || 'stable'} · {risk?.consecutiveAbsences ?? 0} consecutive</span>
                </div>
                {risk?.reasons?.map((r: string, i: number) => (
                  <p key={i} className="text-mid">• {r}</p>
                ))}
                {risk?.recommendations?.map((rec: string, i: number) => (
                  <p key={i} className="font-mono text-[11px] text-accent flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" /> {rec}
                  </p>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="page-enter p-6">
              <CardHeader title="Subject Recovery Plan" subtitle={`Subject-wise attendance vs ${target}% target`} />
              {subjects.length === 0 ? (
                <p className="py-8 text-center text-xs text-faint">No subject-level attendance records yet.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  {subjects.map((s) => {
                    const pct = Math.round((s.percentage <= 1 && s.percentage > 0 && !s.conducted ? s.percentage * 100 : s.percentage) * 10) / 10;
                    return (
                      <div key={s.subject}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-hi">{s.subject}</span>
                          <span className="font-mono text-mid">
                            {pct}% ({s.attended ?? s.present ?? 0}/{s.conducted ?? s.total ?? 0})
                          </span>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className="absolute inset-y-0 left-0 border-r-2 border-amber-400/80"
                            style={{ width: `${target}%` }}
                            title={`${target}% threshold`}
                          />
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-accent to-accent2"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        {s.status_note && (
                          <p className="mt-1 font-mono text-[10.5px] text-faint">
                            {s.status_note}{s.estimated_recovery_date ? ` (Est. ${s.estimated_recovery_date})` : ''}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="page-enter p-6">
              <CardHeader title="Monthly Trajectory" subtitle="Aggregate confirmed attendance rate across recent months" />
              {monthly.length === 0 ? (
                <p className="py-8 text-center text-xs text-faint">No monthly trajectory data yet.</p>
              ) : (
                <div className="flex h-44 items-end gap-2.5 pt-4">
                  {monthly.map((m, i) => {
                    const pct = Math.min(100, Math.round(m.percentage ?? m.rate ?? 0));
                    return (
                      <div key={m.label || m.month || i} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="font-mono text-[10px] text-mid">{pct}%</span>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-accent/50 to-accent transition-all duration-500"
                          style={{ height: `${Math.max(4, pct)}%` }}
                        />
                        <span className="font-mono text-[9.5px] text-faint">{m.label || m.month || `M${i + 1}`}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-4 font-mono text-[11px] text-faint">
                Institutional target benchmark: {data.policy?.minPercentage ?? 75}% mandatory eligibility.
              </p>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
