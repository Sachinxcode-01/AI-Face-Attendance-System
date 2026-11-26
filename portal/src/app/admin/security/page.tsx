'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [status, setStatus] = useState('Under review');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      const res = await api.admin.security.logs(statusFilter);
      setLogs(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load security incidents.');
    }
  }, [statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleSave = async () => {
    if (!selected) return;
    try {
      await api.admin.security.updateIncident({
        log_id: selected.id,
        status,
        assigned_to: assignedTo,
        resolution_notes: notes,
      });
      setSelected(null);
      loadLogs();
    } catch (err: any) {
      setError(err?.message || 'Failed to update incident.');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Security Operations"
        title="Security Sentinel & Incident Management"
        subtitle="Human-reviewed security incident lifecycle. Failed facial matches never automatically label individuals as offenders."
        actions={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-xs text-white">
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Under review">Under review</option>
            <option value="Investigating">Investigating</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
            <option value="False positive">False positive</option>
          </select>
        }
      />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div>}

      <Card>
        <div className="space-y-3 text-xs">
          {logs.length === 0 ? (
            <p className="py-8 text-center text-faint">No security incidents found.</p>
          ) : logs.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div>
                <p className="font-semibold text-white">{l.location} • <span className="uppercase text-faint">{l.type}</span></p>
                <p className="text-[11px] text-faint">{new Date(l.timestamp).toLocaleString()} {l.assigned_to ? `• Assigned: ${l.assigned_to}` : ''}</p>
                {l.resolution_notes && <p className="mt-1 text-gray-300">{l.resolution_notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={l.status === 'Resolved' || l.status === 'False positive' ? 'success' : 'danger'}>{l.status}</Badge>
                <Button variant="secondary" onClick={() => { setSelected(l); setStatus(l.status); setAssignedTo(l.assigned_to || ''); setNotes(l.resolution_notes || ''); }}>
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Incident Investigation">
        <div className="space-y-3 text-xs">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white">
            <option value="Active">Active</option>
            <option value="Under review">Under review</option>
            <option value="Investigating">Investigating</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
            <option value="False positive">False positive</option>
            <option value="Closed">Closed</option>
          </select>
          <input placeholder="Assign Investigator Email" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <textarea rows={3} placeholder="Investigation Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#08080c] px-3 py-2 text-white" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
