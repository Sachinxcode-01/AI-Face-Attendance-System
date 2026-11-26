'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, CalendarRange, RefreshCw, AlertCircle, Undo2, Paperclip } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError, BASE_URL } from '@/lib/api';
import type { LeaveRequest } from '@/lib/types';

function mapStatus(raw: string): LeaveRequest['status'] {
  const s = (raw || 'pending').toLowerCase().trim();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'under review' || s === 'under_review') return 'under_review';
  if (s === 'clarification' || s === 'clarification requested') return 'clarification';
  if (s === 'withdrawn') return 'withdrawn';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'draft') return 'draft';
  return 'pending';
}

export default function StudentLeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

    const fetchLeaves = useCallback(async () => {
      const email = user?.email;
      if (!email) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await api.leave.student(email);
        if (Array.isArray(data)) {
          setRequests(
            data.map((l: any) => {
              const validStatus = mapStatus(l.status);
              const reasonMatch = String(l.reason || '').match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
              const category = (l.category || (reasonMatch ? reasonMatch[1] : 'Academic')) as LeaveRequest['category'];
              const cleanReason = reasonMatch ? reasonMatch[2] : (l.reason || '');

                  return {
                    id: l.id || l._id,
                    studentName: user?.name || user?.email || 'Student',
                    rollNo: user?.rollNo || user?.student_id || '',
                    reason: cleanReason,
                    category,
                    startDate: l.start_date ? String(l.start_date).split('T')[0] : '—',
                    endDate: l.end_date ? String(l.end_date).split('T')[0] : '—',
                    status: validStatus,
                    rawStatus: l.status || 'Pending',
                    remarks: l.remarks || undefined,
                    reviewedBy: l.reviewed_by || undefined,
                    reviewedAt: l.reviewed_at || undefined,
                    documentUrl: l.document_url || undefined,
                    documentName: l.document_name || undefined,
                    statusHistory: Array.isArray(l.status_history) ? l.status_history : [],
                    createdAt: l.created_at || undefined,
                  };
                })
          );
        } else {
          setRequests([]);
        }
      } catch (err: unknown) {
        setError(err instanceof ApiError ? err.message : 'Unable to load leave requests.');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }, [user?.email, user?.name, user?.rollNo, user?.student_id]);

    useEffect(() => {
      fetchLeaves();
  }, [fetchLeaves]);

  const handleWithdraw = async (id: string) => {
    setWithdrawingId(id);
    setError('');
    try {
      await api.leave.withdraw(id);
      await fetchLeaves();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to withdraw leave request.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const openDocument = async (docUrl: string, name?: string) => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('sf_token') : null;
      const res = await fetch(`${BASE_URL}${docUrl}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Unable to open attachment.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.download = name || 'leave_document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Unable to download supporting document.');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Leave Management"
        title="Leave Requests"
        subtitle="Track the status, review remarks, and approval timeline of your submitted leave applications."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={fetchLeaves} loading={loading} className="h-9 px-3 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Link
              href="/student/leave/apply"
              className="btn-pill-accent h-9 px-4 text-xs font-semibold flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> New Request
            </Link>
          </div>
        }
      />

      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between text-xs text-red-200">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-400" /> {error}</span>
            <Button variant="secondary" onClick={fetchLeaves} className="h-8 px-3 text-xs">Retry</Button>
          </div>
        </Card>
      )}

      <div className="page-enter mb-6 grid grid-cols-3 gap-4">
        {(
          [
            { label: 'Approved', value: requests.filter((r) => r.status === 'approved').length, tone: 'success' as const },
            { label: 'Pending / Review', value: requests.filter((r) => ['pending', 'under_review', 'clarification'].includes(r.status)).length, tone: 'warning' as const },
            { label: 'Rejected / Withdrawn', value: requests.filter((r) => ['rejected', 'withdrawn', 'cancelled'].includes(r.status)).length, tone: 'danger' as const },
          ]
        ).map((s) => (
          <Card key={s.label} className="p-5 text-center">
            <p className={`font-display text-2xl font-semibold tracking-tight ${s.tone === 'success' ? 'text-emerald-400' : s.tone === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
              {s.value}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-faint">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3.5">
          { loading && (
            <Card className="page-enter py-12 text-center text-xs text-faint font-mono">
              Loading leave history…
            </Card>
          )}
        {!loading && requests.length === 0 && (
          <Card className="page-enter py-12 text-center text-xs text-faint font-mono">
            No leave requests yet.{' '}
            <Link href="/student/leave/apply" className="text-accent underline hover:text-accent2">
              Submit your first request
            </Link>
            .
          </Card>
        )}
                {requests.map((req) => {
                  const canWithdraw = ['pending', 'under_review', 'clarification'].includes(req.status);
                  return (
            <Card key={req.id} className="page-enter flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-display text-sm font-semibold text-hi">{req.category} Leave</span>
                  <Badge tone={statusTone(req.status)}>{req.rawStatus || req.status}</Badge>
                </div>
                <p className="flex items-center gap-1.5 text-xs font-mono text-faint">
                  <CalendarRange className="h-3.5 w-3.5 text-accent" /> {req.startDate} to {req.endDate}
                </p>
                <p className="text-xs leading-relaxed text-mid">{req.reason}</p>
                {req.remarks && (
                  <p className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 font-mono text-[11px] text-accent">
                    Reviewer remarks: {req.remarks}
                  </p>
                )}
                {req.documentUrl && (
                  <button
                    type="button"
                    onClick={() => openDocument(req.documentUrl!, req.documentName)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline"
                  >
                    <Paperclip className="h-3 w-3" /> {req.documentName || 'View supporting document'}
                  </button>
                )}
                {req.statusHistory && req.statusHistory.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-2">
                    {req.statusHistory.map((h, i) => (
                      <span key={i} className="font-mono text-[10px] text-faint">
                        {h.status} ({h.timestamp ? new Date(h.timestamp).toLocaleDateString() : ''}){i < req.statusHistory!.length - 1 ? ' →' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start gap-2 font-mono text-[11px] text-faint sm:items-end">
                <p>Submitted: {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : req.startDate}</p>
                <p className="text-accent">{req.id}</p>
                {canWithdraw && (
                  <Button
                    type="button"
                    variant="danger"
                    loading={withdrawingId === req.id}
                    onClick={() => handleWithdraw(req.id)}
                    className="h-7 px-3 text-[11px]"
                  >
                    <Undo2 className="h-3 w-3" /> Withdraw
                  </Button>
                )}
              </div>
          </Card>
        );
        })}
      </div>
    </DashboardLayout>
  );
}
