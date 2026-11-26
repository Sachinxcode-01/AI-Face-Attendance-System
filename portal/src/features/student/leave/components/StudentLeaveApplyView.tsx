'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileCheck2, Send, Upload, Paperclip } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentDashboardQuery } from '@/features/student/dashboard/dashboard.queries';
import { useApplyLeaveMutation, useUploadLeaveDocMutation } from '../leave.queries';

const CATEGORIES = [
  'Medical',
  'Personal',
  'Emergency',
  'Academic',
  'Sports',
  'Institutional Activity',
  'Other',
] as const;

export function StudentLeaveApplyView() {
  const router = useRouter();
  const { user } = useAuth();
  const draftKey = user?.email ? `sf_leave_draft_${user.email}` : null;

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Medical');
  const [reason, setReason] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docName, setDocName] = useState('');
  const [error, setError] = useState('');

  const { data: dash } = useStudentDashboardQuery(user?.email);
  const applyLeave = useApplyLeaveMutation(user?.email);
  const uploadDoc = useUploadLeaveDocMutation();

  const policyInfo = dash
    ? {
        safeSlots: dash?.forecast?.allowableAbsences ?? null,
        leaveCountsAsPresent: Boolean(dash?.policy?.approvedLeaveCountsAsPresent),
        minPct: dash?.policy?.minPercentage ?? 75,
      }
    : null;

  useEffect(() => {
    if (!draftKey || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.category && CATEGORIES.includes(d.category)) setCategory(d.category);
        if (typeof d.reason === 'string') setReason(d.reason);
        if (typeof d.start === 'string') setStart(d.start);
        if (typeof d.end === 'string') setEnd(d.end);
      }
    } catch { }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ category, reason, start, end }));
    } catch { }
  }, [draftKey, category, reason, start, end]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Supporting document must be under 5 MB.');
      return;
    }
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadDoc.mutateAsync(fd);
      setDocUrl(res.document_url);
      setDocName(res.document_name || file.name);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Document upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user?.email) return setError('You must be authenticated to submit a leave application.');
    if (reason.trim().length < 5) return setError('Please provide a detailed reason (minimum 5 characters).');
    if (!start || !end) return setError('Select both start and end dates.');
    if (new Date(end) < new Date(start)) return setError('End date must be on or after the start date.');

    try {
      await applyLeave.mutateAsync({
        user_id: user.email,
        reason: reason.trim(),
        start_date: start,
        end_date: end,
        category,
        document_url: docUrl || undefined,
        document_name: docName || undefined,
      });
      if (draftKey && typeof localStorage !== 'undefined') {
        localStorage.removeItem(draftKey);
      }
      router.push('/student/leave');
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit leave application. Please try again.');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Leave Management"
        title="Apply for Leave"
        subtitle="Applications route to your department faculty and administration for digital review."
        backTo="/student/leave"
        backLabel="Back to leave list"
      />

      <Card className="page-enter max-w-2xl p-6 sm:p-7">
        <CardHeader icon={<FileCheck2 className="h-5 w-5 text-accent" />} title="New Leave Application" />
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Leave Type</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const isSelected = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-[14px] border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent/15 text-white shadow-[0_0_12px_rgba(143,139,255,0.2)]'
                        : 'border-white/[0.08] bg-white/[0.03] text-mid hover:border-white/20'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Reason</label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical appointment supported by clinic documentation…"
              className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2.5 text-xs text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Start date</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-xs text-hi focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">End date</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-xs text-hi focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">
              Supporting Document (Optional · PDF/JPG/PNG/WebP · Max 5MB)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="btn-pill-glass cursor-pointer text-xs h-9 px-3.5 flex items-center gap-2 font-medium">
                <Upload className="h-3.5 w-3.5 text-accent" />
                <span>{uploadDoc.isPending ? 'Uploading…' : 'Attach Document'}</span>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={handleDocUpload}
                  className="hidden"
                  disabled={uploadDoc.isPending}
                />
              </label>
              {docName && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                  <Paperclip className="h-3.5 w-3.5" /> {docName}
                </span>
              )}
            </div>
          </div>

          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">{error}</p>}

          <Button type="submit" loading={applyLeave.isPending} className="w-full py-3">
            <Send className="h-4 w-4" /> Submit Application
          </Button>
          <p className="text-center font-mono text-[11px] text-faint">
            {policyInfo?.safeSlots != null ? (
              <>
                Safe absence buffer at {policyInfo.minPct}% policy:{' '}
                <Badge tone={policyInfo.safeSlots > 0 ? 'success' : 'warning'}>
                  {policyInfo.safeSlots} class{policyInfo.safeSlots === 1 ? '' : 'es'}
                </Badge>
                {!policyInfo.leaveCountsAsPresent && ' · Approved leave does not automatically count as Present.'}
              </>
            ) : (
              'Draft is saved locally while you compose. Overlapping leave dates are automatically blocked.'
            )}
          </p>
        </form>
      </Card>
    </DashboardLayout>
  );
}
