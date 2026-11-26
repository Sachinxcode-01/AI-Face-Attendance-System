'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { BarChart3, AlertTriangle, Download, Activity } from 'lucide-react';

export default function AdminAnalyticsReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [risk, setRisk] = useState<any>(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [s, h, r] = await Promise.all([
        api.admin.principalSummary(),
        api.admin.healthScore(),
        api.admin.riskCritical(),
      ]);
      setSummary(s);
      setHealth(h);
      setRisk(r);
    } catch (err: any) {
      setError(err?.message || 'Failed to load institutional analytics.');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Institutional Intelligence"
        title="Analytics, Early Warning & Reports"
        subtitle="Verified attendance distributions, department comparisons, and explainable shortage risk monitoring."
        actions={
          <Button variant="secondary" onClick={() => api.admin.exportStudentsCsv()}>
            <Download className="h-4 w-4" /> Export Student Roster CSV
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Institutional Health" value={health ? `${health.health_score}/100` : '—'} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Overall Attendance" value={summary ? `${summary.institution_attendance}%` : '—'} icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Critical (<60%)" value={String(risk?.below_60?.length ?? 0)} icon={<AlertTriangle className="h-4 w-4" />} accent="text-red-400" />
        <StatCard label="Warning (<75%)" value={String(risk?.below_75?.length ?? 0)} icon={<AlertTriangle className="h-4 w-4" />} accent="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Department Attendance Comparison</h3>
          <div className="space-y-3 text-xs">
            {Object.entries(summary?.department_comparison || {}).map(([dept, rate]: [string, any]) => (
              <div key={dept} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-white font-semibold">{dept}</span>
                  <span className="font-mono text-accent">{rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, Number(rate) || 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Early Warning Shortage Students</h3>
          <div className="space-y-2 text-xs max-h-72 overflow-y-auto">
            {[...(risk?.below_60 || []), ...(risk?.below_75 || [])].slice(0, 20).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <div>
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="text-[11px] text-faint">{s.student_id} • {s.absences} absences</p>
                </div>
                <Badge tone={s.risk === 'Critical' ? 'danger' : 'warning'}>{s.attendance}%</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
