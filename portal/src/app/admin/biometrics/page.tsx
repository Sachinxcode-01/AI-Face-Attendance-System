'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { ScanFace, ShieldCheck, Trash2, Activity } from 'lucide-react';

export default function AdminBiometricsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [bioRes, accRes] = await Promise.allSettled([
        api.admin.biometrics.list(),
        api.accuracy.metrics(168),
      ]);
      if (bioRes.status === 'fulfilled') setRecords(bioRes.value?.records || []);
      if (accRes.status === 'fulfilled') setMetrics(accRes.value?.summary || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load biometric operations.');
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleErase = async (id: string, email: string) => {
    try {
      await api.admin.biometrics.eraseUser(id);
      setNotice(`Biometric profile erased for ${email}.`);
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to erase biometric profile.');
    }
  };

  const enrolledCount = records.filter((r) => r.enrolled).length;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Biometric Operations"
        title="Biometric Enrolment & Recognition Centre"
        subtitle="Monitor enrolment readiness, consent records, and verified recognition telemetry. Raw embeddings are never exposed."
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Enrolled Profiles" value={String(enrolledCount)} icon={<ScanFace className="h-4 w-4" />} footnote={`Of ${records.length} listed students`} />
        <StatCard label="Verification Success" value={metrics ? `${metrics.successRate}%` : '—'} icon={<ShieldCheck className="h-4 w-4" />} footnote={metrics ? `${metrics.totalAttempts} attempts (7d)` : 'No recent attempts'} />
        <StatCard label="Estimated FAR / FRR" value={metrics ? `${metrics.estimatedFar} / ${metrics.estimatedFrr}` : '—'} icon={<Activity className="h-4 w-4" />} footnote={metrics?.biometricEngine || 'ArcFace buffalo_l'} />
        <StatCard label="Deletion Requests" value={String(records.filter((r) => r.deletion_requested).length)} icon={<Trash2 className="h-4 w-4" />} footnote="Pending privacy review" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-faint font-mono uppercase">
                <th className="py-3 px-3">Student</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Enrolment</th>
                <th className="py-3 px-3">Consent</th>
                <th className="py-3 px-3">Model Version</th>
                <th className="py-3 px-3 text-right">Privacy Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-white">{r.full_name}</p>
                    <p className="text-[11px] text-faint">{r.email}</p>
                  </td>
                  <td className="py-3 px-3">{r.department || '—'}</td>
                  <td className="py-3 px-3"><Badge tone={r.enrolled ? 'success' : 'warning'}>{r.enrolled ? 'Enrolled' : 'Not Enrolled'}</Badge></td>
                  <td className="py-3 px-3"><Badge tone={r.consent_given ? 'success' : 'neutral'}>{r.consent_given ? 'Granted' : 'Pending'}</Badge></td>
                  <td className="py-3 px-3 font-mono">{r.vector_version || '—'}</td>
                  <td className="py-3 px-3 text-right">
                    {r.enrolled && (
                      <button onClick={() => handleErase(r.id, r.email)} className="rounded bg-red-500/15 px-2.5 py-1 text-red-300 hover:bg-red-500/25">
                        Erase Biometrics
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
