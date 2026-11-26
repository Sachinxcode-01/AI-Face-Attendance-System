'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

export default function AdminAttendancePolicyPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>({ min_percentage: 75, late_counts_as_present: true, excused_counts_as_present: true, approved_leave_counts_as_present: false, dispute_deadline_days: 14 });
  const [history, setHistory] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [dRes, lRes, pRes] = await Promise.all([
        api.admin.disputes(),
        api.admin.leaves(),
        api.admin.policy.get(),
      ]);
      setDisputes(dRes?.disputes || []);
      setLeaves(lRes?.leaves || []);
      if (pRes?.policy) setPolicy((prev: any) => ({ ...prev, ...pRes.policy }));
      setHistory(pRes?.history || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load attendance oversight data.');
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.admin.policy.update({ ...policy, reason: reason || 'Admin policy update' });
      setNotice(`Policy v${res.version} published.`);
      setReason('');
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to save policy.'); }
  };

  const handleResolveDispute = async (id: string, action: string) => {
    try {
      await api.attendance.disputes.resolve(id, { action, remarks: `Admin ${action}` });
      setNotice(`Dispute ${action}.`);
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to resolve dispute.'); }
  };

  const handleLeaveAction = async (id: string, status: string) => {
    try {
      await api.leave.action(id, status, `Admin ${status}`);
      setNotice(`Leave ${status}.`);
      loadAll();
    } catch (err: any) { setError(err?.message || 'Failed to update leave.'); }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Governance"
        title="Attendance Policy, Disputes & Leave Oversight"
        subtitle="Configure versioned institutional attendance rules and resolve escalated requests."
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}
      {notice && <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5">
          <h3 className="font-display text-sm font-bold text-white mb-4">Attendance Policy Engine</h3>
          <form onSubmit={handleSavePolicy} className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Minimum Attendance (%)</label>
              <input type="number" min={0} max={100} value={policy.min_percentage ?? 75} onChange={(e) => setPolicy({ ...policy, min_percentage: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Dispute Deadline (Days)</label>
              <input type="number" min={1} max={90} value={policy.dispute_deadline_days ?? 14} onChange={(e) => setPolicy({ ...policy, dispute_deadline_days: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            </div>
            <label className="flex items-center gap-2 text-gray-300">
              <input type="checkbox" checked={Boolean(policy.late_counts_as_present)} onChange={(e) => setPolicy({ ...policy, late_counts_as_present: e.target.checked })} />
              <span>Late arrival counts as present</span>
            </label>
            <label className="flex items-center gap-2 text-gray-300">
              <input type="checkbox" checked={Boolean(policy.approved_leave_counts_as_present)} onChange={(e) => setPolicy({ ...policy, approved_leave_counts_as_present: e.target.checked })} />
              <span>Approved leave counts as present</span>
            </label>
            <input placeholder="Change reason (for audit log)" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
            <Button type="submit" className="w-full">Publish Policy Version</Button>
          </form>
          {history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-[11px] text-faint">
              <p className="font-semibold text-gray-300">Recent Policy Versions</p>
              {history.slice(0, 3).map((h: any, i: number) => (
                <p key={i}>v{h.version} by {h.changed_by} — {h.reason}</p>
              ))}
            </div>
          )}
        </Card>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <h3 className="font-display text-sm font-bold text-white mb-3">Attendance Disputes ({disputes.length})</h3>
            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {disputes.length === 0 ? <p className="text-faint">No disputes found.</p> : disputes.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <p className="font-semibold text-white">{d.student_email} • {d.subject || 'Session'}</p>
                    <p className="text-faint">{d.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'danger' : 'warning'}>{d.status}</Badge>
                    {['pending', 'teacher_reviewed', 'escalated', 'Pending'].includes(d.status) && (
                      <>
                        <button onClick={() => handleResolveDispute(d.id, 'approve')} className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300">Approve</button>
                        <button onClick={() => handleResolveDispute(d.id, 'reject')} className="rounded bg-red-500/15 px-2 py-1 text-red-300">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-sm font-bold text-white mb-3">Leave Applications ({leaves.length})</h3>
            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              {leaves.length === 0 ? <p className="text-faint">No leave applications found.</p> : leaves.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div>
                    <p className="font-semibold text-white">{l.user_id} ({l.category})</p>
                    <p className="text-faint">{l.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}>{l.status}</Badge>
                    {l.status === 'Pending' && (
                      <>
                        <button onClick={() => handleLeaveAction(l.id, 'Approved')} className="rounded bg-emerald-500/15 px-2 py-1 text-emerald-300">Approve</button>
                        <button onClick={() => handleLeaveAction(l.id, 'Rejected')} className="rounded bg-red-500/15 px-2 py-1 text-red-300">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
