'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function AdminGovernancePage() {
  const [sysLogs, setSysLogs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [aRes, bRes, sRes] = await Promise.all([
        api.admin.auditLogs(),
        api.admin.backups(),
        api.admin.settings.get(),
      ]);
      setSysLogs(aRes?.system_logs || []);
      setBackups(bRes?.backups || []);
      setSettings(sRes?.settings || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load governance data.');
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.admin.settings.update({
        name: settings.name,
        address: settings.address,
        admin_email: settings.admin_email,
        governance_config: settings.governance_config,
      });
      setNotice('Institutional settings & retention policies updated.');
    } catch (err: any) {
      setError(err?.message || 'Failed to update settings.');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Compliance & Audit"
        title="Governance, Audit Centre & Backups"
        subtitle="Tamper-resistant administrative audit trail, retention configuration, and backup readiness."
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="font-display text-sm font-bold text-white mb-3">Institutional Settings &amp; Data Retention</h3>
          {settings ? (
            <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
              <input value={settings.name || ''} onChange={(e) => setSettings({ ...settings, name: e.target.value })} placeholder="Institution Name" className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
              <input value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Campus Address" className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
              <input value={settings.admin_email || ''} onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })} placeholder="Official Admin Email" className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-faint block mb-1">Attendance Retention (Days)</label>
                  <input type="number" value={settings.governance_config?.attendance_retention_days ?? 1825} onChange={(e) => setSettings({ ...settings, governance_config: { ...settings.governance_config, attendance_retention_days: Number(e.target.value) } })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="text-faint block mb-1">Security Snapshot Retention (Days)</label>
                  <input type="number" value={settings.governance_config?.security_snapshot_retention_days ?? 30} onChange={(e) => setSettings({ ...settings, governance_config: { ...settings.governance_config, security_snapshot_retention_days: Number(e.target.value) } })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
                </div>
              </div>
              <Button type="submit">Save Configuration</Button>
            </form>
          ) : <p className="text-xs text-faint">No institution settings linked.</p>}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-white">Backup &amp; Recovery Readiness ({backups.length})</h3>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await api.admin.verifyBackup();
                  setNotice('Backup readiness snapshot verified.');
                  loadAll();
                } catch (err: any) {
                  setError(err?.message || 'Backup verification failed.');
                }
              }}
            >
              Verify Snapshot
            </Button>
          </div>
          <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
            {backups.length === 0 ? <p className="text-faint">No backup metadata records recorded yet.</p> : backups.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                <div>
                  <p className="font-mono text-white">{b.backup_id}</p>
                  <p className="text-faint">{b.backup_type} • {new Date(b.restore_point).toLocaleString()}</p>
                </div>
                <Badge tone={b.status === 'SUCCESS' ? 'success' : 'warning'}>{b.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-sm font-bold text-white mb-3">Protected Administrative Audit Trail</h3>
        <div className="space-y-2 text-xs max-h-80 overflow-y-auto font-mono">
          {sysLogs.map((l) => (
            <div key={l.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
              <div>
                <span className="text-accent">[{l.module}]</span> <span className="text-white font-semibold">{l.action}</span> — {l.actor_email}
              </div>
              <span className="text-faint">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
