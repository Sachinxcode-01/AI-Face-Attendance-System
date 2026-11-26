'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTeacherSessionsQuery,
  useSessionRosterQuery,
  useSessionMutation,
  useBatchMarkMutation,
} from '@/features/teacher/teacher.queries';
import type { TeacherSession } from '@/lib/types';
import {
  Plus, MonitorPlay, QrCode, Square, RefreshCw, Activity,
  Pause, Play, Clock, CheckCircle2, XCircle, ClipboardCheck,
} from 'lucide-react';

const MANUAL_STATUSES = [
  'Present',
  'Absent',
  'Late',
  'Excused',
  'Approved leave',
  'Medical leave',
  'Pending verification',
  'Manually recorded',
];

export default function TeacherSessionsPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();
  const [search, setSearch] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [overrideReason, setOverrideReason] = useState('');
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [finaliseConfirmOpen, setFinaliseConfirmOpen] = useState(false);
  const [autoMarkAbsent, setAutoMarkAbsent] = useState(true);

  const { data: sessions = [], isLoading: loading, isFetching, error, refetch } = useTeacherSessionsQuery(user?.email);
  const { data: rosterDetail, isLoading: rosterLoading, refetch: refetchRoster } = useSessionRosterQuery(user?.email, selectedSessionId);
  const sessionMut = useSessionMutation(user?.email);
  const batchMarkMut = useBatchMarkMutation(user?.email);

  const filtered = sessions.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.subject.toLowerCase().includes(q) || (s.room || '').toLowerCase().includes(q);
  });

    const handleAction = async (id: string, action: string, payload?: { reason?: string; extend_minutes?: number; auto_mark_absent?: boolean }) => {
      try {
        const res = await sessionMut.mutateAsync({ sessionId: id, action, payload });
        push(res?.message || `Session updated (${action})`, 'success');
        if (action === 'cancel') {
          setCancelModalId(null);
          setCancelReason('');
        }
        if (action === 'finalise') {
          setFinaliseConfirmOpen(false);
        }
        if (selectedSessionId === id) {
          await refetchRoster();
        }
      } catch (err) {
        push(err instanceof Error ? err.message : `Failed to ${action} session`, 'error');
      }
    };

    const handleSaveManualEdits = async () => {
      if (!selectedSessionId) return;
      const entries = Object.entries(draftEdits);
      if (entries.length === 0) {
        push('No attendance changes to save', 'info');
        return;
      }
      try {
        const res = await batchMarkMut.mutateAsync({
          session_id: selectedSessionId,
          reason: overrideReason.trim() || undefined,
          records: entries.map(([student_email, status]) => ({
            student_email,
            status,
            reason: overrideReason.trim() || undefined,
          })),
        });
        if (res.failed_count > 0) {
          push(`Saved ${res.updated_count} record(s), ${res.failed_count} rejected (check override reason).`, 'error');
        } else {
          push(`Saved ${res.updated_count} manual attendance record(s).`, 'success');
          setDraftEdits({});
          setOverrideReason('');
        }
        await refetchRoster();
      } catch (err) {
        push(err instanceof Error ? err.message : 'Failed to save manual attendance', 'error');
      }
    };

    const markAllDraft = (status: string) => {
      const students: any[] = rosterDetail?.students ?? [];
      const next: Record<string, string> = {};
      for (const s of students) {
        next[s.email] = status;
      }
      setDraftEdits(next);
    };

    const sessionDetail = rosterDetail?.session;
    const counts = rosterDetail?.counts;
    const rosterStudents: any[] = rosterDetail?.students ?? [];

    return (
      <DashboardLayout>
        <PageHeader
          kicker="Attendance Command Centre"
          title="Session Management"
          subtitle="Manage full session lifecycles: schedule, start, pause, resume, extend, review, and finalise attendance."
          actions={
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => refetch()}
                className="btn-pill-glass h-9 px-4 text-xs font-semibold flex items-center gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/teacher/sessions/create" className="btn-pill-accent h-9 px-4 text-xs font-semibold flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" /> New Session
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Total Sessions</p>
              <p className="mt-2 font-display text-2xl font-semibold text-hi">{sessions.length}</p>
            </Card>
            <Card className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Active Now</p>
              <p className="mt-2 font-display text-2xl font-semibold text-emerald-400">
                {sessions.filter((s) => s.is_active).length}
              </p>
            </Card>
            <Card className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Avg Check-in Rate</p>
              <p className="mt-2 font-display text-2xl font-semibold text-accent">
                {sessions.length
                  ? Math.round(sessions.reduce((a, s) => a + s.attendance_rate, 0) / sessions.length)
                  : 0}%
              </p>
            </Card>
            <Card className="p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-faint">Total Check-ins</p>
              <p className="mt-2 font-display text-2xl font-semibold text-accent2">
                {sessions.reduce((a, s) => a + s.students_checked_in, 0)}
              </p>
            </Card>
          </div>
        )}

        <Card className="page-enter p-6">
          <CardHeader icon={<MonitorPlay className="h-5 w-5 text-accent" />} title="All Sessions" />
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-xs text-red-400">Failed to load sessions. Please check your connection.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="btn-pill-accent inline-flex h-8 items-center gap-2 px-4 text-xs font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No sessions yet"
              body="Create your first attendance session to start tracking student check-ins."
              action={
                <Link href="/teacher/sessions/create" className="btn-pill-accent h-9 px-4 text-xs font-semibold mt-4 inline-flex items-center">
                  <Plus className="h-3.5 w-3.5" /> Create Session
                </Link>
              }
            />
          ) : (
            <DataTable<TeacherSession>
              columns={[
                {
                  key: 'subject',
                  header: 'Subject',
                  sortable: true,
                  sortValue: (r) => r.subject,
                  render: (r) => (
                    <div>
                      <span className="font-semibold text-hi">{r.subject}</span>
                      {(r.section || r.semester) && (
                        <span className="block font-mono text-[10px] text-faint">
                          {[r.semester ? `Sem ${r.semester}` : null, r.section ? `Sec ${r.section}` : null].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'room',
                  header: 'Room',
                  render: (r) => <span className="font-mono text-mid text-[11.5px]">{r.room || '—'}</span>,
                },
                {
                  key: 'start_time',
                  header: 'Started',
                  sortable: true,
                  sortValue: (r) => r.start_time,
                  render: (r) => (
                    <span className="font-mono text-mid text-[11.5px]">
                      {new Date(r.start_time).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'attendance_rate',
                  header: 'Check-in',
                  sortable: true,
                  sortValue: (r) => r.attendance_rate,
                  render: (r) => (
                    <Badge tone={r.attendance_rate >= 80 ? 'success' : r.attendance_rate >= 60 ? 'warning' : 'danger'}>
                      {r.students_checked_in}/{r.total_enrolled_seen} ({r.attendance_rate}%)
                    </Badge>
                  ),
                },
                {
                  key: 'status',
                  header: 'Lifecycle',
                  render: (r) => {
                    const st = r.status || (r.is_active ? 'active' : 'closed');
                    return (
                      <Badge tone={statusTone(st === 'resumed' ? 'live' : st === 'finalised' ? 'approved' : st)} pulse={st === 'active' || st === 'resumed'}>
                        {st.replace('_', ' ')}
                      </Badge>
                    );
                  },
                },
                {
                  key: 'actions',
                        header: 'Controls',
                render: (r) => {
                  const st = r.status || (r.is_active ? 'active' : 'closed');
                      return (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSessionId(r.id);
                            setDraftEdits({});
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent hover:bg-accent/20 transition-colors"
                        >
                          <ClipboardCheck className="h-3 w-3" /> Command
                        </button>
                      {(st === 'scheduled' || st === 'ready') && (
                        <button
                          onClick={() => handleAction(r.id, 'activate')}
                          disabled={sessionMut.isPending}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
                        >
                          <Play className="h-3 w-3" /> Start
                        </button>
                      )}
                      {(st === 'active' || st === 'resumed') && (
                        <>
                          <button
                            onClick={() => handleAction(r.id, 'pause')}
                            disabled={sessionMut.isPending}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300"
                          >
                            <Pause className="h-3 w-3" /> Pause
                          </button>
                          <button
                            onClick={() => handleAction(r.id, 'close')}
                            disabled={sessionMut.isPending}
                            className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-300"
                          >
                            <Square className="h-3 w-3" /> Close
                          </button>
                        </>
                      )}
                      {st === 'paused' && (
                        <button
                          onClick={() => handleAction(r.id, 'resume')}
                          disabled={sessionMut.isPending}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300"
                        >
                          <Play className="h-3 w-3" /> Resume
                        </button>
                      )}
                      {r.is_active && (
                        <Link
                          href={`/teacher/qr-projector?session=${r.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-mid hover:bg-white/[0.06]"
                        >
                          <QrCode className="h-3 w-3" /> QR
                        </Link>
                      )}
                    </div>
                  );
                },
              },
            ]}
          rows={filtered}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search subject or room…"
          pageSize={8}
          rowKey={(r) => r.id}
          emptyTitle="No sessions match your search."
          />
        )}
        </Card>

                  {/* Live Session Command & Manual Attendance Drawer Modal */}
                  <Modal
                    open={Boolean(selectedSessionId)}
                    onClose={() => setSelectedSessionId(null)}
                    title={sessionDetail ? `${sessionDetail.subject} — Command & Roster` : 'Session Command Centre'}
                    wide
                  >
                    {rosterLoading || !sessionDetail ? (
                      <div className="space-y-3 py-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-40 w-full" />
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                        {/* Telemetry Strip */}
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {[
                            ['Enrolled', counts?.enrolled ?? 0, 'text-hi'],
                            ['Present', counts?.present ?? 0, 'text-emerald-400'],
                            ['Absent', counts?.absent ?? 0, 'text-red-400'],
                            ['Late', counts?.late ?? 0, 'text-amber-400'],
                            ['Duplicates', counts?.duplicate_attempts ?? 0, 'text-mid'],
                            ['Failed', counts?.failed_verifications ?? 0, 'text-red-300'],
                          ].map(([lbl, val, cls]) => (
                            <div key={String(lbl)} className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5 text-center">
                              <p className="font-mono text-[10px] uppercase text-faint">{lbl}</p>
                              <p className={`mt-1 font-display text-lg font-bold ${cls}`}>{val}</p>
                            </div>
                          ))}
                        </div>

                        {/* Lifecycle Action Bar */}
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <Badge tone="info">{sessionDetail.status.replace('_', ' ')}</Badge>
                          {sessionDetail.remaining_seconds > 0 && (
                            <span className="font-mono text-[11px] text-mid flex items-center gap-1">
                              <Clock className="h-3 w-3 text-accent" /> {Math.ceil(sessionDetail.remaining_seconds / 60)}m left
                            </span>
                          )}
                          <div className="ml-auto flex flex-wrap gap-1.5">
                            {['active', 'paused', 'resumed'].includes(sessionDetail.status) && (
                              <button
                                onClick={() => handleAction(sessionDetail.id, 'extend', { extend_minutes: 15 })}
                                disabled={sessionMut.isPending}
                                className="chip-bytune h-7 px-2.5 text-[11px]"
                              >
                                +15 min
                              </button>
                            )}
                            {sessionDetail.status === 'active' || sessionDetail.status === 'resumed' ? (
                              <button
                                onClick={() => handleAction(sessionDetail.id, 'pause')}
                                disabled={sessionMut.isPending}
                                className="chip-bytune h-7 px-2.5 text-[11px] text-amber-300"
                              >
                                Pause
                              </button>
                            ) : sessionDetail.status === 'paused' ? (
                              <button
                                onClick={() => handleAction(sessionDetail.id, 'resume')}
                                disabled={sessionMut.isPending}
                                className="chip-bytune h-7 px-2.5 text-[11px] text-emerald-300"
                              >
                                Resume
                              </button>
                            ) : null}
                            {['active', 'paused', 'resumed', 'closed'].includes(sessionDetail.status) && (
                              <button
                                onClick={() => handleAction(sessionDetail.id, 'under_review')}
                                disabled={sessionMut.isPending}
                                className="chip-bytune h-7 px-2.5 text-[11px] text-accent"
                              >
                                Review
                              </button>
                            )}
                            {['closed', 'under_review'].includes(sessionDetail.status) && (
                              <button
                                onClick={() => setFinaliseConfirmOpen(true)}
                                disabled={sessionMut.isPending}
                                className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-[11px] font-semibold text-emerald-300"
                              >
                                <CheckCircle2 className="inline h-3 w-3 mr-1" />Finalise
                              </button>
                            )}
                            {!['finalised', 'cancelled'].includes(sessionDetail.status) && (
                              <button
                                onClick={() => setCancelModalId(sessionDetail.id)}
                                disabled={sessionMut.isPending}
                                className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-300"
                              >
                                <XCircle className="inline h-3 w-3 mr-1" />Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bulk Manual Attendance Controls */}
                        {!['finalised', 'cancelled'].includes(sessionDetail.status) && (
                          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-mid">Manual Attendance Controls</span>
                              <div className="flex gap-1.5">
                                <button type="button" onClick={() => markAllDraft('Present')} className="chip-bytune h-6 px-2.5 text-[10px]">Mark All Present</button>
                                <button type="button" onClick={() => markAllDraft('Absent')} className="chip-bytune h-6 px-2.5 text-[10px]">Mark All Absent</button>
                                {Object.keys(draftEdits).length > 0 && (
                                  <button type="button" onClick={() => setDraftEdits({})} className="chip-bytune h-6 px-2.5 text-[10px] text-red-300">Reset ({Object.keys(draftEdits).length})</button>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                type="text"
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                placeholder="Reason for manual marking / override (required when changing existing records)…"
                                className="flex-1 rounded-xl border border-[var(--hairline)] bg-surface px-3 py-1.5 text-xs text-hi placeholder:text-faint focus:border-accent focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleSaveManualEdits}
                                disabled={batchMarkMut.isPending || Object.keys(draftEdits).length === 0}
                                className="btn-pill-accent h-8 px-4 text-xs font-semibold disabled:opacity-40"
                              >
                                {batchMarkMut.isPending ? 'Saving…' : `Save (${Object.keys(draftEdits).length})`}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Session Roster Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-white/5 text-mid">
                              <tr>
                                <th className="pb-2 font-semibold">Student</th>
                                <th className="pb-2 font-semibold">Method</th>
                                <th className="pb-2 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {rosterStudents.map((st) => {
                                const currentVal = draftEdits[st.email] ?? st.status;
                                const locked = st.is_finalised || ['finalised', 'cancelled'].includes(sessionDetail.status);
                                return (
                                  <tr key={st.email}>
                                    <td className="py-2.5">
                                      <span className="font-medium text-hi">{st.full_name}</span>
                                      <span className="block font-mono text-[10px] text-faint">
                                        {st.student_id || st.email}
                                        {st.approved_leave ? ` · On Approved Leave` : ''}
                                      </span>
                                    </td>
                                    <td className="py-2.5 font-mono text-[11px] text-mid">{st.verified_by}</td>
                                    <td className="py-2.5">
                                      {locked ? (
                                        <Badge tone={statusTone(String(currentVal).toLowerCase())}>{currentVal}</Badge>
                                      ) : (
                                        <select
                                          value={currentVal}
                                          onChange={(e) => setDraftEdits((prev) => ({ ...prev, [st.email]: e.target.value }))}
                                          className="rounded-lg border border-[var(--hairline)] bg-surface px-2 py-1 text-[11px] text-hi focus:border-accent focus:outline-none"
                                        >
                                          {MANUAL_STATUSES.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                          ))}
                                        </select>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {rosterStudents.length === 0 && (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-xs text-faint font-mono">No enrolled students found for this session.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </Modal>

                  {/* Cancel Session Modal */}
                  <Modal open={Boolean(cancelModalId)} onClose={() => setCancelModalId(null)} title="Cancel Attendance Session">
                    <div className="space-y-4">
                      <p className="text-xs text-mid">Cancelled sessions are excluded from student attendance totals and preserved in the audit log.</p>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation…"
                        className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3.5 py-2 text-xs text-hi placeholder:text-faint focus:border-accent focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setCancelModalId(null)} className="btn-pill-glass h-8 px-4 text-xs">Back</button>
                        <button
                          onClick={() => cancelModalId && handleAction(cancelModalId, 'cancel', { reason: cancelReason })}
                          disabled={sessionMut.isPending}
                          className="rounded-full bg-red-500/20 border border-red-500/30 px-4 py-1.5 text-xs font-semibold text-red-300"
                        >
                          Confirm Cancel
                        </button>
                      </div>
                    </div>
                  </Modal>

                  {/* Finalise Confirmation Modal */}
                  <Modal open={finaliseConfirmOpen} onClose={() => setFinaliseConfirmOpen(false)} title="Finalise Session Attendance">
                    <div className="space-y-4">
                      <p className="text-xs text-mid">Finalising locks all attendance records for this session from further direct edits.</p>
                      <label className="flex items-center gap-2 text-xs text-hi">
                        <input type="checkbox" checked={autoMarkAbsent} onChange={(e) => setAutoMarkAbsent(e.target.checked)} />
                        Auto-mark unrecorded enrolled students as Absent (or Approved leave)
                      </label>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setFinaliseConfirmOpen(false)} className="btn-pill-glass h-8 px-4 text-xs">Back</button>
                        <button
                          onClick={() => selectedSessionId && handleAction(selectedSessionId, 'finalise', { auto_mark_absent: autoMarkAbsent })}
                          disabled={sessionMut.isPending}
                          className="btn-pill-accent h-8 px-4 text-xs font-semibold"
                        >
                          Finalise Records
                        </button>
                      </div>
                    </div>
                  </Modal>

                  <Toasts toasts={toasts} dismiss={dismiss} />
                </DashboardLayout>
                );
}
