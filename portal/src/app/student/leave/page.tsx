'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Plus, CalendarRange } from 'lucide-react';
import { MOCK_LEAVE_REQUESTS } from '@/lib/demo-data';

export default function StudentLeavePage() {
  const [requests] = useState(MOCK_LEAVE_REQUESTS.filter((r) => r.rollNo === 'CS-2024-042'));

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Leave Management"
        title="Leave Requests"
        subtitle="Track the status of every application submitted to faculty and dean advisors."
        actions={
          <Link
            href="/student/leave/apply"
            className="btn-pill-accent h-9 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Request
          </Link>
        }
      />

      <div className="page-enter mb-6 grid grid-cols-3 gap-4">
        {(
          [
            { label: 'Approved', value: requests.filter((r) => r.status === 'approved').length, tone: 'success' as const },
            { label: 'Pending', value: requests.filter((r) => r.status === 'pending').length, tone: 'warning' as const },
            { label: 'Rejected', value: requests.filter((r) => r.status === 'rejected').length, tone: 'danger' as const },
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
        {requests.length === 0 && (
          <Card className="page-enter py-12 text-center text-xs text-faint font-mono">
            No leave requests yet.{' '}
            <Link href="/student/leave/apply" className="text-accent underline hover:text-accent2">
              Submit your first request
            </Link>
            .
          </Card>
        )}
        {requests.map((req) => (
          <Card key={req.id} className="page-enter flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-display text-sm font-semibold text-hi">{req.category} Leave</span>
                <Badge tone={statusTone(req.status)}>{req.status}</Badge>
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-mono text-faint">
                <CalendarRange className="h-3.5 w-3.5 text-accent" /> {req.startDate} to {req.endDate}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-mid">{req.reason}</p>
            </div>
            <div className="text-left font-mono text-[11px] text-faint sm:text-right">
              <p>Requested: {req.startDate}</p>
              <p className="mt-0.5 text-accent">{req.id}</p>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
