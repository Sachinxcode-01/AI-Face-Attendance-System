'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileCheck2, Send } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = ['Medical', 'Academic', 'Personal'] as const;

export default function ApplyLeavePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Medical');
  const [reason, setReason] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user?.email) return setError('You must be authenticated to submit a leave application.');
    if (!reason.trim()) return setError('Please describe the reason for leave.');
    if (!start || !end) return setError('Select both start and end dates.');
    if (new Date(end) < new Date(start)) return setError('End date must be after the start date.');

    setBusy(true);
    try {
      await api.leave.apply({
        user_id: user.email,
        reason: `[${category}] ${reason.trim()}`,
        start_date: start,
        end_date: end,
        category,
      });
      router.push('/student/leave');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to submit leave application. Please try again.';
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Leave Management"
        title="Apply for Leave"
        subtitle="Applications route to your faculty advisor and the Dean's office for digital approval."
        backTo="/student/leave"
        backLabel="Back to leave list"
      />

      <Card className="page-enter max-w-2xl p-6 sm:p-7">
        <CardHeader icon={<FileCheck2 className="h-5 w-5 text-accent" />} title="New Leave Application" />
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-mid">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => {
                const isSelected = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex-1 rounded-[14px] border px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
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
              placeholder="e.g. Medical appointment supported by institutional health center slip…"
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

          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 font-mono">{error}</p>}

          <Button type="submit" loading={busy} className="w-full py-3">
            <Send className="h-4 w-4" /> Submit Application
          </Button>
          <p className="text-center font-mono text-[11px] text-faint">
            You have <Badge tone="success">4 safe absence slots</Badge> before dropping below 75%.
          </p>
        </form>
      </Card>
    </DashboardLayout>
  );
}
