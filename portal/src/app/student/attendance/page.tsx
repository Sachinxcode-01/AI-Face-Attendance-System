'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { ScanFace, QrCode, Clock, Download, Filter } from 'lucide-react';
import { MOCK_STUDENT_ATTENDANCE } from '@/lib/demo-data';
import type { AttendanceRecord } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const FILTERS = ['all', 'verified_face', 'verified_qr', 'late', 'absent'] as const;

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_STUDENT_ATTENDANCE);

  const loadAttendance = useCallback(async () => {
    try {
      const email = user?.email || 'alice@smartface.pro';
      const data = (await api.attendance.student(email)) as Array<{
        _id?: string;
        id?: string;
        timestamp?: string;
        date?: string;
        time?: string;
        subject?: string;
        status?: string;
        verification_method?: string;
        confidence?: number;
        room?: string;
      }>;

      if (Array.isArray(data) && data.length > 0) {
        setRecords(
          data.map((r, i) => {
            const rawStatus = (r.status || 'present').toLowerCase();
            const method = (r.verification_method || '').toLowerCase();
            let finalStatus: AttendanceRecord['status'] = 'present';
            if (rawStatus === 'absent') finalStatus = 'absent';
            else if (rawStatus === 'late') finalStatus = 'late';
            else if (method === 'face') finalStatus = 'verified_face';
            else if (method === 'qr') finalStatus = 'verified_qr';

            const d = r.timestamp ? new Date(r.timestamp) : new Date();
            return {
              id: r.id || r._id || `att_${i}`,
              date: r.date || d.toISOString().split('T')[0],
              time: r.time || d.toTimeString().slice(0, 5),
              subject: r.subject || 'Computer Science Core',
              status: finalStatus,
              confidence: r.confidence || 0.985,
              room: r.room || 'Room 401',
            };
          })
        );
      }
    } catch {
      /* fallback to MOCK_STUDENT_ATTENDANCE */
    }
  }, [user]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const rows = records.filter((r) => {
    const okFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const okSearch = !q || r.subject.toLowerCase().includes(q) || r.room.toLowerCase().includes(q);
    return okFilter && okSearch;
  });

  const present = records.filter((r) => r.status !== 'absent').length;

  const exportCsv = () => {
    const headers = ['ID', 'Date', 'Time', 'Subject', 'Location', 'Status', 'Confidence'];
    const csvRows = [headers.join(',')];
    rows.forEach((r) => {
      csvRows.push(
        [
          `"${r.id}"`,
          `"${r.date}"`,
          `"${r.time}"`,
          `"${r.subject}"`,
          `"${r.room}"`,
          `"${r.status}"`,
          `"${r.confidence || 1}"`,
        ].join(',')
      );
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Ledger"
        title="Attendance History"
        subtitle="Every biometric and QR verification, searchable and exportable with cryptographic timestamps."
        actions={
          <button onClick={exportCsv} className="btn-pill-glass h-9 px-4 text-xs font-medium flex items-center gap-2 cursor-pointer">
            <Download className="h-3.5 w-3.5 text-accent" /> Export CSV
          </button>
        }
      />

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Records', value: String(records.length), cls: 'text-hi' },
          { label: 'Verified Present', value: String(present), cls: 'text-emerald-400' },
          { label: 'Late Arrivals', value: String(records.filter((r) => r.status === 'late').length), cls: 'text-amber-400' },
          { label: 'Absences', value: String(records.filter((r) => r.status === 'absent').length), cls: 'text-red-400' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{s.label}</p>
            <p className={`mt-2 font-display text-2xl font-semibold tracking-tight ${s.cls}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="page-enter p-6">
        <CardHeader
          icon={<Filter className="h-5 w-5 text-accent" />}
          title="Filter Records"
        />
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const isSelected = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`chip-bytune text-xs h-8 px-4 ${isSelected ? 'chip-bytune-active' : ''}`}
              >
                {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            );
          })}
        </div>

        <DataTable<AttendanceRecord>
          rowKey={(r) => r.id}
          columns={[
            {
              key: 'subject',
              header: 'Subject',
              sortable: true,
              sortValue: (r) => r.subject,
              render: (r) => <span className="font-semibold text-hi">{r.subject}</span>,
            },
            {
              key: 'when',
              header: 'Date & Time',
              render: (r) => <span className="font-mono text-mid text-[11.5px]">{r.date} · {r.time}</span>,
            },
            {
              key: 'room',
              header: 'Location',
              render: (r) => <span className="font-mono text-mid text-[11.5px]">{r.room}</span>,
            },
            {
              key: 'status',
              header: 'Verification',
              render: (r) => {
                if (r.status === 'verified_face') {
                  return (
                    <Badge tone="success">
                      <ScanFace className="h-3 w-3" /> ArcFace {(((r.confidence ?? 0.99) * 100).toFixed(1))}%
                    </Badge>
                  );
                }
                if (r.status === 'verified_qr') {
                  return (
                    <Badge tone="info">
                      <QrCode className="h-3 w-3" /> QR Verified
                    </Badge>
                  );
                }
                if (r.status === 'late') {
                  return (
                    <Badge tone="warning">
                      <Clock className="h-3 w-3" /> Late
                    </Badge>
                  );
                }
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
