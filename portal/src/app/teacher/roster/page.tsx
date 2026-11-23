'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import type { TeacherStudent } from '@/lib/types';
import { UsersRound, RefreshCw, Search } from 'lucide-react';

export default function TeacherRosterPage() {
  const { toasts, push, dismiss } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'name' | 'rate'>('name');
  const reqIdRef = React.useRef(0);

  const loadStudents = useCallback(async () => {
    reqIdRef.current += 1;
    const currentId = reqIdRef.current;
    setLoading(true);
    try {
      const data = await api.teacher.students(search);
      if (currentId === reqIdRef.current) {
        setStudents((data as TeacherStudent[]) || []);
      }
    } catch {
      if (currentId === reqIdRef.current) {
        push('Failed to load students', 'error');
      }
    } finally {
      if (currentId === reqIdRef.current) {
        setLoading(false);
      }
    }
  }, [push, search]);

  useEffect(() => {
    const t = setTimeout(loadStudents, 250);
    return () => clearTimeout(t);
  }, [loadStudents]);

  const sortedStudents = [...students].sort((a, b) => {
    if (sort === 'rate') return b.attendance_rate - a.attendance_rate;
    return a.full_name.localeCompare(b.full_name);
  });

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Class Roster"
        title="Student Roster"
        subtitle="Every student who has checked into your sessions, with live attendance rates and last-seen timestamps."
        actions={
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, roll…"
                className="h-9 w-56 rounded-full border border-[var(--hairline)] bg-surface pl-9 pr-3.5 text-xs text-hi placeholder:text-faint transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
            </div>
            <button onClick={loadStudents} aria-label="Refresh students" className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Students</p>
          <p className="mt-2 font-display text-2xl font-semibold text-hi">{students.length}</p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Avg Attendance</p>
          <p className="mt-2 font-display text-2xl font-semibold text-emerald-400">
            {students.length
              ? Math.round(students.reduce((a, s) => a + s.attendance_rate, 0) / students.length)
              : 0}%
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">At Risk (&lt;75%)</p>
          <p className="mt-2 font-display text-2xl font-semibold text-amber-400">
            {students.filter((s) => s.attendance_rate < 75).length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Excellent (≥90%)</p>
          <p className="mt-2 font-display text-2xl font-semibold text-accent">
            {students.filter((s) => s.attendance_rate >= 90).length}
          </p>
        </Card>
      </div>

      <Card className="page-enter p-6">
        <CardHeader
          icon={<UsersRound className="h-5 w-5 text-emerald-400" />}
          title="Students in Your Sessions"
          right={
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-faint">Sort:</span>
              <button
                onClick={() => setSort('name')}
                className={`chip-bytune h-7 px-3 text-[11px] ${sort === 'name' ? 'chip-bytune-active' : ''}`}
              >
                Name
              </button>
              <button
                onClick={() => setSort('rate')}
                className={`chip-bytune h-7 px-3 text-[11px] ${sort === 'rate' ? 'chip-bytune-active' : ''}`}
              >
                Attendance
              </button>
            </div>
          }
        />
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <DataTable<TeacherStudent>
            columns={[
              {
                key: 'student',
                header: 'Student',
                sortable: true,
                sortValue: (r) => r.full_name,
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={r.avatar_url ?? undefined} name={r.full_name} size="sm" />
                    <div>
                      <p className="font-semibold text-hi">{r.full_name}</p>
                      <p className="font-mono text-[10.5px] text-faint">{r.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'student_id',
                header: 'Roll No',
                render: (r) => <span className="font-mono text-mid">{r.student_id || '—'}</span>,
              },
              {
                key: 'semester',
                header: 'Semester',
                render: (r) => <span className="text-mid">{r.semester || '—'}</span>,
              },
              {
                key: 'attendance_rate',
                header: 'Attendance',
                sortable: true,
                sortValue: (r) => r.attendance_rate,
                render: (r) => (
                  <Badge tone={r.attendance_rate >= 75 ? 'success' : 'danger'}>
                    {r.attendance_rate}%
                  </Badge>
                ),
              },
              {
                key: 'counts',
                header: 'Present / Total',
                render: (r) => (
                  <span className="font-mono text-mid">
                    {r.present_count} / {r.total_count}
                  </span>
                ),
              },
              {
                key: 'last_seen',
                header: 'Last Seen',
                sortable: true,
                sortValue: (r) => r.last_seen ?? '',
                render: (r) => (
                  <span className="font-mono text-[11.5px] text-mid">
                    {r.last_seen ? new Date(r.last_seen).toLocaleString() : 'Never'}
                  </span>
                ),
              },
            ]}
            rows={sortedStudents}
            search={search}
            onSearch={setSearch}
            searchPlaceholder="Search students…"
            pageSize={8}
            rowKey={(r) => r.id}
            emptyTitle="No students found in your sessions."
          />
        )}
      </Card>

      <Toasts toasts={toasts} dismiss={dismiss} />
    </DashboardLayout>
  );
}