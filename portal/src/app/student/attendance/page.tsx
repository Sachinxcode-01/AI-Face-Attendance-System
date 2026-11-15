'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, statusTone } from '@/components/ui/Badge';
import { ScanFace, QrCode, Clock, Download, Filter } from 'lucide-react';
import { MOCK_STUDENT_ATTENDANCE } from '@/lib/demo-data';
import type { AttendanceRecord } from '@/lib/types';

const FILTERS = ['all', 'verified_face', 'verified_qr', 'late', 'absent'] as const;

export default function StudentAttendancePage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [search, setSearch] = useState('');

  const rows = MOCK_STUDENT_ATTENDANCE.filter((r) => {
    const okFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const okSearch = !q || r.subject.toLowerCase().includes(q) || r.room.toLowerCase().includes(q);
    return okFilter && okSearch;
  });

  const present = MOCK_STUDENT_ATTENDANCE.filter((r) => r.status !== 'absent').length;

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Ledger"
        title="Attendance History"
        subtitle="Every biometric and QR verification, searchable and exportable."
        actions={
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Records', value: String(MOCK_STUDENT_ATTENDANCE.length), cls: 'text-white' },
          { label: 'Verified Present', value: String(present), cls: 'text-emerald-400' },
          { label: 'Late Arrivals', value: String(MOCK_STUDENT_ATTENDANCE.filter((r) => r.status === 'late').length), cls: 'text-amber-400' },
          { label: 'Absences', value: String(MOCK_STUDENT_ATTENDANCE.filter((r) => r.status === 'absent').length), cls: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`mt-1 font-display text-2xl font-bold ${s.cls}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="page-enter">
        <CardHeader
          icon={<Filter className="h-5 w-5 text-indigo-400" />}
          title="Filter Records"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white/[0.04] text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        <DataTable<AttendanceRecord>
          rowKey={(r) => r.id}
          columns={[
            { key: 'subject', header: 'Subject', sortable: true, sortValue: (r) => r.subject, render: (r) => <span className="font-semibold text-white">{r.subject}</span> },
            { key: 'when', header: 'Date & Time', render: (r) => <span className="text-gray-400">{r.date} • {r.time}</span> },
            { key: 'room', header: 'Location', render: (r) => <span className="font-mono text-gray-400">{r.room}</span> },
            {
              key: 'status', header: 'Verification', render: (r) => {
                if (r.status === 'verified_face') return <Badge tone="success"><ScanFace className="h-3 w-3" /> ArcFace {(((r.confidence ?? 0.99) * 100).toFixed(1))}%</Badge>;
                if (r.status === 'verified_qr') return <Badge tone="info"><QrCode className="h-3 w-3" /> QR Verified</Badge>;
                if (r.status === 'late') return <Badge tone="warning"><Clock className="h-3 w-3" /> Late</Badge>;
                return <Badge tone="danger">Absent</Badge>;
              },
            },
          ]}
          rows={rows}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search subject or room…"
          pageSize={6}
          emptyTitle="No attendance records match your filters."
        />
      </Card>
    </DashboardLayout>
  );
}
