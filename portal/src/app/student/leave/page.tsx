'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge, statusTone } from '@/components/ui/Badge';
import { FileCheck2, Plus, CalendarRange } from 'lucide-react';
import { MOCK_LEAVE_REQUESTS } from '@/lib/demo-data';

export default function StudentLeavePage() {
  const [requests, setRequests] = useState(MOCK_LEAVE_REQUESTS.filter((r) => r.rollNo === 'CS-2024-042'));

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Leave Management"
        title="Leave Requests"
        subtitle="Track the status of every application submitted to the Dean's office."
        actions={
          <Link
            href="/student/leave/apply"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-600"
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
          <Card key={s.label} className="p-4 text-center">
            <p className={`font-display text-2xl font-bold ${s.tone === 'success' ? 'text-emerald-400' : s.tone === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
              {s.value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {requests.length === 0 && (
          <Card className="page-enter py-10 text-center text-xs text-gray-500">
            No leave requests yet. <Link href="/student/leave/apply" className="text-indigo-400 hover:underline">Submit your first request</Link>.
          </Card>
        )}
        {requests.map((req) => (
          <Card key={req.id} className="page-enter flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">{req.category} Leave</span>
                <Badge tone={statusTone(req.status)}>{req.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-gray-300">{req.reason}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                <CalendarRange className="h-3 w-3" /> {req.startDate} → {req.endDate}
              </p>
            </div>
            <span className="font-mono text-[10px] text-gray-600">{req.id.toUpperCase()}</span>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
