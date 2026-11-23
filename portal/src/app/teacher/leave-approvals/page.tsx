'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import type { TeacherLeaveRequest } from '@/lib/types';
import { FileCheck2, RefreshCw, CheckCircle, XCircle, CalendarRange, MessageSquare } from 'lucide-react';

export default function TeacherLeaveApprovalsPage() {
  const { toasts, push, dismiss } = useToast();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<TeacherLeaveRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const reqGenRef = React.useRef(0);

  const loadLeaves = useCallback(async () => {
    reqGenRef.current += 1;
    const currentGen = reqGenRef.current;
    setLoading(true);
    try {
      const data = await api.leave.pending();
      if (currentGen === reqGenRef.current) {
        setLeaves((data as TeacherLeaveRequest[]) || []);
      }
    } catch {
      if (currentGen === reqGenRef.current) {
        push('Failed to load leave requests', 'error');
      }
    } finally {
      if (currentGen === reqGenRef.current) {
        setLoading(false);
      }
    }
  }, [push]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const act = async (leave: TeacherLeaveRequest, action: 'Approved' | 'Rejected') => {
    setProcessingIds((prev) => ({ ...prev, [leave.id]: true }));
    try {
      await api.leave.action(leave.id, action, remarks[leave.id] || '');
      push(`Leave ${action.toLowerCase()}`, 'success');
      await loadLeaves();
    } catch {
      push(`Failed to ${action.toLowerCase()} leave`, 'error');
    } finally {
      setProcessingIds((prev) => {
        const next = { ...prev };
        delete next[leave.id];
        return next;
      });
    }
  };

  const visible = filter === 'pending'
    ? leaves.filter((l) => l.status === 'Pending' || l.status === 'Under Review')
    : leaves;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Leave Governance"
        title="Leave Approvals"
        subtitle="Review student leave requests with one-click approval, rejection, and auditable remarks."
        actions={
          <button onClick={loadLeaves} className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="page-enter mb-6 grid grid-cols-3 gap-4">
        <Card className="p-5 text-center">
          <p className="font-display text-2xl font-semibold text-amber-400">
            {leaves.filter((l) => l.status === 'Pending' || l.status === 'Under Review').length}
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">Pending</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="font-display text-2xl font-semibold text-emerald-400">
            {leaves.filter((l) => l.status === 'Approved').length}
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">Approved</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="font-display text-2xl font-semibold text-red-400">
            {leaves.filter((l) => l.status === 'Rejected').length}
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">Rejected</p>
        </Card>
      </div>

      <Card className="page-enter p-6">
        <CardHeader
          icon={<FileCheck2 className="h-5 w-5 text-amber-400" />}
          title="Leave Requests"
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('pending')}
                className={`chip-bytune h-7 px-3 text-[11px] ${filter === 'pending' ? 'chip-bytune-active' : ''}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`chip-bytune h-7 px-3 text-[11px] ${filter === 'all' ? 'chip-bytune-active' : ''}`}
              >
                All
              </button>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<FileCheck2 className="h-6 w-6" />}
            title="Inbox clear"
            body="No leave requests match this filter right now."
          />
        ) : (
          <div className="space-y-3.5">
            {visible.map((leave) => (
              <Card key={leave.id} className="flex flex-col gap-3 border-white/5 bg-white/[0.02] p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-sm font-semibold text-hi">{leave.user_id}</span>
                    <Badge tone={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'warning'}>
                      {leave.status}
                    </Badge>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-faint">
                    <CalendarRange className="h-3.5 w-3.5 text-accent" /> {leave.start_date} → {leave.end_date}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-mid">{leave.reason}</p>
                  {leave.remarks && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-faint">
                      <MessageSquare className="h-3 w-3" /> {leave.remarks}
                    </p>
                  )}
                </div>

                {(leave.status === 'Pending' || leave.status === 'Under Review') ? (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px]">
                    <input
                      type="text"
                      value={remarks[leave.id] || ''}
                      onChange={(e) => setRemarks((prev) => ({ ...prev, [leave.id]: e.target.value }))}
                      placeholder="Optional remarks…"
                      className="h-9 w-full rounded-xl border border-[var(--hairline)] bg-surface px-3 text-xs text-hi placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(leave, 'Approved')}
                        disabled={Boolean(processingIds[leave.id])}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => act(leave, 'Rejected')}
                        disabled={Boolean(processingIds[leave.id])}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-[11px] text-faint sm:text-right">
                    {new Date(leave.created_at).toLocaleDateString()}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}