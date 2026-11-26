'use client';

import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { resolveMediaUrl } from '@/lib/api';
import { teacherApi } from '@/features/teacher/teacher.api';
import { useTeacherDisputesQuery } from '@/features/teacher/teacher.queries';
import type { TeacherDispute } from '@/lib/types';
import { queryClient } from '@/core/query/queryClient';
import { teacherKeys } from '@/core/query/queryKeys';
import {
  CheckCircle2, XCircle, MessageSquareMore, ShieldAlert, ExternalLink,
  FileText, Search, ArrowRight, History,
} from 'lucide-react';

type DisputeAction = 'approve' | 'excused' | 'clarification' | 'escalate' | 'reject';

export default function TeacherDisputesPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();

  const [tab, setTab] = useState<'Pending' | 'Clarification' | 'Escalated' | 'Resolved' | 'All'>('Pending');
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, error, refetch } = useTeacherDisputesQuery(user?.email);
  const disputes: TeacherDispute[] = data?.disputes ?? [];

  const counts = useMemo(() => {
    const c = { Pending: 0, Clarification: 0, Escalated: 0, Resolved: 0, All: disputes.length };
    for (const d of disputes) {
      if (d.status === 'Pending' || d.status === 'Under Review') c.Pending += 1;
      else if (d.status === 'Clarification') c.Clarification += 1;
      else if (d.status === 'Escalated') c.Escalated += 1;
      else c.Resolved += 1;
    }
    return c;
  }, [disputes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return disputes.filter((d) => {
      if (tab === 'Pending' && d.status !== 'Pending' && d.status !== 'Under Review') return false;
      if (tab === 'Clarification' && d.status !== 'Clarification') return false;
      if (tab === 'Escalated' && d.status !== 'Escalated') return false;
      if (tab === 'Resolved' && d.status !== 'Approved' && d.status !== 'Rejected') return false;
      if (q) {
        const hay = `${d.student_name || ''} ${d.student_email} ${d.student_id || ''} ${d.subject || ''} ${d.reason}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [disputes, tab, search]);

  const [activeDispute, setActiveDispute] = useState<TeacherDispute | null>(null);
  const [selectedAction, setSelectedAction] = useState<DisputeAction>('approve');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openResolve = (d: TeacherDispute, action: DisputeAction) => {
    setActiveDispute(d);
    setSelectedAction(action);
    setRemarks(
      action === 'approve'
        ? `Correction approved (${d.requested_status}).`
        : action === 'excused'
          ? 'Marked as Excused absence.'
          : ''
    );
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispute) return;
    if ((selectedAction === 'reject' || selectedAction === 'clarification' || selectedAction === 'escalate') && !remarks.trim()) {
      push('Please enter remarks for this dispute action.', 'info');
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.resolveDispute(activeDispute.id, {
        action: selectedAction,
        remarks: remarks.trim() || undefined,
        updated_status: selectedAction === 'excused' ? 'Excused' : activeDispute.requested_status,
      });
      push(`Dispute updated (${selectedAction})`, 'success');
      setActiveDispute(null);
      setRemarks('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherKeys.disputes(user?.email) }),
        queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(user?.email) }),
        queryClient.invalidateQueries({ queryKey: [...teacherKeys.all(user?.email), 'students'] }),
      ]);
    } catch (err) {
      push(err instanceof Error ? err.message : 'Failed to resolve dispute', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Toasts toasts={toasts} dismiss={dismiss} />
      <PageHeader
        kicker="Correction Workflow"
        title="Attendance Disputes & Corrections"
        subtitle="Inspect student correction requests, verify supporting evidence, and record audited status updates."
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          <span>{error instanceof Error ? error.message : 'Failed to load disputes'}</span>
          <button onClick={() => refetch()} className="underline hover:text-white">Retry</button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(k) => setTab(k)}
          tabs={[
            { value: 'Pending', label: `Pending (${counts.Pending})` },
            { value: 'Clarification', label: `Clarification (${counts.Clarification})` },
            { value: 'Escalated', label: `Escalated (${counts.Escalated})` },
            { value: 'Resolved', label: `Resolved (${counts.Resolved})` },
            { value: 'All', label: `All (${counts.All})` },
          ]}
        />
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, subject, reason..."
            className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-hi placeholder-faint focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<ShieldAlert className="h-6 w-6" />} title="No attendance disputes in this queue" body="Student correction requests for your classes appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const isActionable = d.status !== 'Approved' && d.status !== 'Rejected';
            return (
              <Card key={d.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-hi">
                        {d.student_name || d.student_email}
                      </span>
                      {d.student_id && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-mid">
                          {d.student_id}
                        </span>
                      )}
                      {d.subject && <Badge tone="info">{d.subject}</Badge>}
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                      {d.reason_category && <Badge tone="neutral">{d.reason_category}</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-faint">Requested change:</span>
                      <Badge tone={statusTone(d.original_status || 'Absent')}>{d.original_status || 'Absent'}</Badge>
                      <ArrowRight className="h-3 w-3 text-faint" />
                      <Badge tone={statusTone(d.requested_status)}>{d.requested_status}</Badge>
                      <span className="text-[11px] text-faint">• Submitted {new Date(d.created_at).toLocaleString()}</span>
                    </div>

                    <p className="rounded-xl border border-white/5 bg-black/25 px-3 py-2 text-xs text-hi">
                      {d.reason}
                    </p>

                    {d.remarks && (
                      <p className="text-xs text-mid">
                        Resolution note: {d.remarks} {d.resolved_by ? `(${d.resolved_by})` : ''}
                      </p>
                    )}

                    {d.evidence_url && (
                      <a
                        href={resolveMediaUrl(d.evidence_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {d.evidence_name || 'Inspect Supporting Evidence'}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {d.audit_trail && d.audit_trail.length > 0 && (
                      <div className="mt-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
                          <History className="h-3 w-3" /> Audit Trail
                        </p>
                        <div className="space-y-1">
                          {d.audit_trail.map((entry, idx) => (
                            <p key={idx} className="text-[11px] text-mid">
                              <span className="font-semibold text-hi">{entry.status}</span> by {entry.actor} ({entry.role}) — {entry.note || 'No note'}{' '}
                              <span className="text-faint">({new Date(entry.timestamp).toLocaleString()})</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isActionable && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => openResolve(d, 'approve')}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve ({d.requested_status})
                      </Button>
                      <Button variant="secondary" onClick={() => openResolve(d, 'excused')}>
                        Mark Excused
                      </Button>
                      <Button variant="secondary" onClick={() => openResolve(d, 'clarification')}>
                        <MessageSquareMore className="h-3.5 w-3.5" /> Clarify
                      </Button>
                      <Button variant="secondary" onClick={() => openResolve(d, 'escalate')}>
                        <ShieldAlert className="h-3.5 w-3.5" /> Escalate
                      </Button>
                      <Button variant="danger" onClick={() => openResolve(d, 'reject')}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(activeDispute)}
        onClose={() => setActiveDispute(null)}
        title={`Dispute Action — ${selectedAction.toUpperCase()}`}
      >
        <form onSubmit={handleResolve} className="space-y-4">
          {activeDispute && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-mid">
              <p className="font-semibold text-hi">{activeDispute.student_name || activeDispute.student_email}</p>
              <p>{activeDispute.subject || 'Session'} • Requested: {activeDispute.requested_status}</p>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-mid">
              Remarks {selectedAction === 'reject' || selectedAction === 'clarification' || selectedAction === 'escalate' ? '(Required)' : '(Audit note)'}
            </label>
            <textarea
              rows={3}
              required={selectedAction === 'reject' || selectedAction === 'clarification' || selectedAction === 'escalate'}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Document verification reason or rejection rationale..."
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setActiveDispute(null)}>Cancel</Button>
            <Button
              type="submit"
              variant={selectedAction === 'reject' ? 'danger' : 'primary'}
              loading={submitting}
            >
              Submit Decision
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
