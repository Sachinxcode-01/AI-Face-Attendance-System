'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileCheck2, Send, CalendarRange } from 'lucide-react';

const CATEGORIES = ['Medical', 'Academic', 'Personal'] as const;

export default function ApplyLeavePage() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Medical');
  const [reason, setReason] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) return setError('Please describe the reason for leave.');
    if (!start || !end) return setError('Select both start and end dates.');
    if (new Date(end) < new Date(start)) return setError('End date must be after the start date.');
    setBusy(true);
    setTimeout(() => router.push('/student/leave'), 900);
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Leave Management"
        title="Apply for Leave"
        subtitle="Applications route to your professor and the Dean's office for approval."
        backTo="/student/leave"
        backLabel="Back to leave list"
      />

      <Card className="page-enter max-w-2xl">
        <CardHeader icon={<FileCheck2 className="h-5 w-5 text-indigo-400" />} title="New Leave Application" />
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                    category === c
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">Reason</label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical appointment out of province, supported by physician note…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">Start date</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-300">End date</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

          <Button type="submit" loading={busy} className="w-full py-3">
            <Send className="h-4 w-4" /> Submit Application
          </Button>
          <p className="text-center text-[10px] text-gray-500">
            You have <Badge tone="success">4 safe absence slots</Badge> before dropping below 75%.
          </p>
        </form>
      </Card>
    </DashboardLayout>
  );
}
