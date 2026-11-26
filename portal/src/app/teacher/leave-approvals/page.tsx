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
import { useTeacherLeavesQuery } from '@/features/teacher/teacher.queries';
import type { TeacherLeaveRequest } from '@/lib/types';
import { queryClient } from '@/core/query/queryClient';
import { teacherKeys } from '@/core/query/queryKeys';
import {
  CheckCircle2, XCircle, ExternalLink, FileText, Search,
  AlertTriangle, MessageSquareMore, ShieldAlert, CalendarDays,
} from 'lucide-react';

export default function TeacherLeaveApprovalsPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();

        const [tab, setTab] = useState<'Pending' | 'Clarification' | 'Under Review' | 'Approved' | 'Rejected' | 'All'>('Pending');
        const [search, setSearch] = useState('');
        const [category, setCategory] = useState('');
        const [startDate, setStartDate] = useState('');
        const [endDate, setEndDate] = useState('');

        // Fetch all authorised leaves so counts and client/server filtering stay instantaneous
        const { data, isLoading, isFetching, error, refetch } = useTeacherLeavesQuery(user?.email, { status: 'All' });
        const allLeaves: TeacherLeaveRequest[] = data?.leaves ?? [];

        const filtered = useMemo(() => {
          const q = search.trim().toLowerCase();
          return allLeaves.filter((l) => {
            if (tab !== 'All' && l.status !== tab) return false;
            if (category && (l.category || '').toLowerCase() !== category.toLowerCase()) return false;
            if (startDate && l.end_date < startDate) return false;
            if (endDate && l.start_date > endDate) return false;
            if (q) {
              const hay = `${l.student_name || ''} ${l.user_id} ${l.student_id || ''} ${l.reason} ${l.category || ''}`.toLowerCase();
              if (!hay.includes(q)) return false;
            }
            return true;
          });
      }, [allLeaves, tab, category, startDate, endDate, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { Pending: 0, Clarification: 0, 'Under Review': 0, Approved: 0, Rejected: 0, All: allLeaves.length };
    for (const l of allLeaves) {
      if (l.status in map) map[l.status] += 1;
    }
  return map;
}, [allLeaves]);

const [decisionLeave, setDecisionLeave] = useState<TeacherLeaveRequest | null>(null);
const [decisionStatus, setDecisionStatus] = useState<'Approved' | 'Rejected' | 'Clarification' | 'Under Review'>('Approved');
const [remarks, setRemarks] = useState('');
const [submitting, setSubmitting] = useState(false);

  const openDecision = (leave: TeacherLeaveRequest, targetStatus: typeof decisionStatus) => {
    setDecisionLeave(leave);
    setDecisionStatus(targetStatus);
    setRemarks(
      targetStatus === 'Approved'
        ? 'Approved by faculty.'
        : targetStatus === 'Under Review'
          ? 'Escalated / marked under review for verification.'
          : ''
    );
  };

  const submitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionLeave) return;
    if ((decisionStatus === 'Rejected' || decisionStatus === 'Clarification') && !remarks.trim()) {
      push('Please provide remarks explaining your decision or clarification request.', 'info');
      return;
    }
    setSubmitting(true);
    try {
      await teacherApi.actLeave(decisionLeave.id, decisionStatus, remarks.trim());
      push(`Leave request marked as ${decisionStatus}`, 'success');
      setDecisionLeave(null);
      setRemarks('');
      await queryClient.invalidateQueries({ queryKey: [...teacherKeys.all(user?.email), 'leaves'] });
      await queryClient.invalidateQueries({ queryKey: teacherKeys.dashboard(user?.email) });
    } catch (err) {
      push(err instanceof Error ? err.message : 'Failed to update leave status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const actionableStatuses = new Set(['Pending', 'Under Review', 'Clarification']);

  return (
    <DashboardLayout>
      <Toasts toasts={toasts} dismiss={dismiss} />
      <PageHeader
        kicker="Faculty Review"
        title="Leave Approvals & Excused Requests"
        subtitle="Review institutional student leave applications, inspect uploaded evidence, check overlapping sessions, and log decisions."
        actions={
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
        }
      />

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            <span>{error instanceof Error ? error.message : 'Failed to load leave requests'}</span>
            <button onClick={() => refetch()} className="underline hover:text-white">Retry</button>
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs
            active={tab}
            onChange={(k) => setTab(k)}
            tabs={[
              { value: 'Pending', label: `Pending (${counts.Pending})` },
              { value: 'Clarification', label: `Clarification (${counts.Clarification})` },
              { value: 'Under Review', label: `Escalated (${counts['Under Review']})` },
              { value: 'Approved', label: `Approved (${counts.Approved})` },
              { value: 'Rejected', label: `Rejected (${counts.Rejected})` },
              { value: 'All', label: `All (${counts.All})` },
            ]}
          />
        </div>

            {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or reason..."
                className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 text-xs text-hi placeholder-faint focus:border-accent/50 focus:outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-full border border-white/10 bg-[#101016] px-4 py-2 text-xs text-hi focus:border-accent/50 focus:outline-none"
              aria-label="Filter by leave category"
            >
              <option value="">All Categories</option>
              <option value="Medical">Medical</option>
              <option value="Personal">Personal</option>
              <option value="Academic">Academic / On-Duty</option>
              <option value="Emergency">Emergency</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="From date"
              className="rounded-full border border-white/10 bg-[#101016] px-4 py-2 text-xs text-hi focus:border-accent/50 focus:outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="To date"
              className="rounded-full border border-white/10 bg-[#101016] px-4 py-2 text-xs text-hi focus:border-accent/50 focus:outline-none"
            />
          </div>

                        {isLoading ? (
                          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
                        ) : filtered.length === 0 ? (
                          <EmptyState
                            icon={<CalendarDays className="h-6 w-6" />}
                            title={`No ${tab === 'All' ? '' : `${tab.toLowerCase()} `}leave applications`}
                            body="Matching requests within your department or classes will appear here."
                          />
                        ) : (
                          <div className="space-y-3">
                            {filtered.map((l) => {
                              const canAct = actionableStatuses.has(l.status);
                              return (
                                <Card key={l.id}>
                                  <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1 space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-display text-sm font-bold text-hi">
                                          {l.student_name || l.user_id}
                                        </span>
                                        {l.student_id && (
                                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-mid">
                                            {l.student_id}
                                          </span>
                                        )}
                                        {l.category && <Badge tone="neutral">{l.category}</Badge>}
                                        <Badge tone={statusTone(l.status)}>{l.status}</Badge>
                                        {l.has_overlap && (
                                          <Badge tone="warning">
                                            <AlertTriangle className="mr-1 h-3 w-3" /> Overlapping Leave
                                          </Badge>
                                        )}
                                      </div>

                                      <p className="text-xs text-mid">
                                        {l.user_id}
                                        {l.department ? ` • ${l.department}` : ''}
                                        {l.semester ? ` • Sem ${l.semester}` : ''}
                                        {l.section ? ` • Sec ${l.section}` : ''}
                                      </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-hi">
                                            <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1">
                                              <CalendarDays className="h-3.5 w-3.5 text-accent" />
                                              {l.start_date} &rarr; {l.end_date}
                                            </span>
                                            <span className="text-[11px] text-faint">
                                              Submitted {new Date(l.created_at).toLocaleString()}
                                            </span>
                                          </div>

                                          <p className="rounded-xl border border-white/5 bg-black/25 px-3 py-2 text-xs text-hi">
                                            {l.reason}
                                          </p>

                                          {l.remarks && (
                                            <p className="text-xs text-faint">
                                              Faculty remarks: <span className="text-mid">{l.remarks}</span>
                                              {l.reviewed_by ? ` — by ${l.reviewed_by}` : ''}
                                            </p>
                                          )}

                                          {l.document_url && (
                      <a
                        href={resolveMediaUrl(l.document_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {l.document_name || 'View Supporting Document'}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                                          )}
                                        </div>

                                        {canAct && (
                                          <div className="flex flex-wrap gap-2">
                                            <Button onClick={() => openDecision(l, 'Approved')}>
                                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                            </Button>
                                            <Button variant="secondary" onClick={() => openDecision(l, 'Clarification')}>
                                              <MessageSquareMore className="h-3.5 w-3.5" /> Clarify
                                            </Button>
                                            <Button variant="secondary" onClick={() => openDecision(l, 'Under Review')}>
                                              <ShieldAlert className="h-3.5 w-3.5" /> Escalate
                                            </Button>
                                            <Button variant="danger" onClick={() => openDecision(l, 'Rejected')}>
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
                      open={Boolean(decisionLeave)}
                      onClose={() => setDecisionLeave(null)}
                      title={`Confirm Leave Action — ${decisionStatus}`}
                    >
                      <form onSubmit={submitDecision} className="space-y-4">
                        {decisionLeave && (
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-mid">
                            <p className="font-semibold text-hi">{decisionLeave.student_name || decisionLeave.user_id}</p>
                            <p>{decisionLeave.start_date} &rarr; {decisionLeave.end_date} ({decisionLeave.category || 'Leave'})</p>
                          </div>
                        )}
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-mid">
                            Remarks {decisionStatus === 'Rejected' || decisionStatus === 'Clarification' ? '(Required)' : '(Optional)'}
                          </label>
                          <textarea
                            rows={3}
                            required={decisionStatus === 'Rejected' || decisionStatus === 'Clarification'}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add reason, clarification question, or policy note..."
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                          />
                        </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setDecisionLeave(null)}>Cancel</Button>
                        <Button
                          type="submit"
                          variant={decisionStatus === 'Rejected' ? 'danger' : 'primary'}
                          loading={submitting}
                        >
                          Confirm {decisionStatus}
                        </Button>
                      </div>
                    </form>
                  </Modal>
                </DashboardLayout>
              );
}