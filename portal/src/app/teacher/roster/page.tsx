'use client';

import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Toasts } from '@/components/ui/Toasts';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherStudentsQuery } from '@/features/teacher/teacher.queries';
import { teacherApi } from '@/features/teacher/teacher.api';
import type { TeacherStudent } from '@/lib/types';
import {
  Search, Download, UsersRound, History, BellRing, AlertTriangle,
  CheckCircle2, ShieldAlert, CalendarCheck, Fingerprint,
} from 'lucide-react';

function csvEscape(val: unknown): string {
  let s = String(val ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export default function TeacherRosterPage() {
  const { user } = useAuth();
  const { toasts, push, dismiss } = useToast();

  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  const [semester, setSemester] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

    const queryParams = useMemo(() => {
      const p: Record<string, string> = {};
      if (search.trim()) p.search = search.trim();
      if (subject) p.subject = subject;
      if (section) p.section = section;
      if (semester) p.semester = semester;
      if (statusFilter && statusFilter !== 'all') p.status = statusFilter;
      return p;
    }, [search, subject, section, semester, statusFilter]);

    const { data, isLoading, isFetching, error, refetch } = useTeacherStudentsQuery(user?.email, queryParams);
    const students: TeacherStudent[] = data?.students ?? [];
    const subjects: string[] = data?.subjects ?? [];
    const sections: string[] = data?.sections ?? [];
    const semesters: string[] = data?.semesters ?? [];
    const minThreshold: number = data?.policy_min_percentage ?? 75;

    // Student history modal
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyDetail, setHistoryDetail] = useState<{
      student?: { email?: string; name?: string; full_name?: string };
      summary?: {
        overall_attendance?: number;
        total_present?: number;
        total_conducted?: number;
        risk?: { level?: string };
        forecast?: { classes_needed?: number };
      } | null;
      records?: Array<{
        id?: string;
        _id?: string;
        subject?: string;
        status: string;
        verified_by?: string;
        method?: string;
        timestamp?: string;
        date?: string;
        reason?: string;
      }>;
      interventions?: Array<{ id: string; action_taken: string; note: string; subject?: string; created_at: string }>;
    } | null>(null);

    // Intervention / reminder modal
    const [actionStudent, setActionStudent] = useState<TeacherStudent | null>(null);
    const [actionType, setActionType] = useState<'reminder_sent' | 'note' | 'counseling_scheduled' | 'escalated'>('reminder_sent');
    const [actionNote, setActionNote] = useState('');
    const [sendAlertToo, setSendAlertToo] = useState(true);
    const [submittingAction, setSubmittingAction] = useState(false);

    const openHistory = async (student: TeacherStudent) => {
      setHistoryOpen(true);
      setHistoryLoading(true);
      setHistoryDetail({ student });
      try {
          const res = await teacherApi.getStudentHistory(student.email);
          setHistoryDetail(res);
        } catch (err) {
          push(err instanceof Error ? err.message : 'Failed to load student attendance history', 'error');
        } finally {
          setHistoryLoading(false);
        }
      };

      const openIntervention = (student: TeacherStudent) => {
        setActionStudent(student);
        setActionType('reminder_sent');
        setActionNote(
          student.attendance_rate < minThreshold
            ? `Attendance is ${student.attendance_rate}% (below ${minThreshold}% requirement). Please meet faculty or attend upcoming classes.`
            : 'Academic attendance follow-up note.'
        );
        setSendAlertToo(true);
      };

      const handleSaveIntervention = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionStudent || !actionNote.trim()) return;
        setSubmittingAction(true);
        try {
          await teacherApi.logIntervention({
            student_email: actionStudent.email,
            subject: subject || undefined,
            risk_level: actionStudent.risk_level || (actionStudent.attendance_rate < 65 ? 'critical' : actionStudent.attendance_rate < minThreshold ? 'warning' : 'safe'),
            action_taken: actionType,
            note: actionNote.trim(),
          });
          if (sendAlertToo) {
            await teacherApi.sendStudentAlert({
              student_email: actionStudent.email,
              title: `Attendance Notice${subject ? ` (${subject})` : ''}`,
              message: actionNote.trim(),
              priority: actionStudent.attendance_rate < 65 ? 'Urgent' : 'High',
            });
          }
          push(sendAlertToo ? `Intervention logged & notification sent to ${actionStudent.full_name}` : 'Intervention note saved', 'success');
          setActionStudent(null);
          setActionNote('');
        } catch (err) {
          push(err instanceof Error ? err.message : 'Failed to record intervention', 'error');
        } finally {
          setSubmittingAction(false);
        }
};

const exportRosterCsv = () => {
  if (!students.length) {
    push('No students in current filtered roster to export', 'info');
    return;
  }
  const headers = [
    'Full Name', 'Email', 'Student ID', 'Roll No', 'Department', 'Semester', 'Section',
    'Present', 'Conducted', 'Absent', 'Late', 'Attendance %', 'Risk Level',
    'Consecutive Absences', 'Active Leave', 'Pending Corrections',
  ];
  const lines = [
    headers.map(csvEscape).join(','),
    ...students.map((s) =>
      [
        s.full_name,
        s.email,
        s.student_id || '',
        s.roll_number || '',
        s.department || '',
        s.semester || '',
        s.section || '',
        s.present_count,
        s.total_count,
        s.absent_count ?? 0,
        s.late_count ?? 0,
        `${s.attendance_rate}%`,
        s.risk_level || 'safe',
        s.consecutive_absences ?? 0,
        s.has_active_leave ? 'Yes' : 'No',
        s.pending_corrections ?? 0,
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `authorised_roster_${subject || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  push(`Exported ${students.length} student records`, 'success');
};

const safeCount = students.filter((s) => s.attendance_rate >= minThreshold).length;
const riskCount = students.filter((s) => s.attendance_rate < minThreshold).length;
const activeLeaveCount = students.filter((s) => s.has_active_leave).length;

return (
  <DashboardLayout>
    <Toasts toasts={toasts} dismiss={dismiss} />
    <PageHeader
      kicker="Faculty Workspace"
      title="Classroom Roster & Student Intelligence"
      subtitle={`Authorised enrolment, subject-wise rates (policy min ${minThreshold}%), leave/correction flags, and interventions.`}
      actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
              Refresh
            </Button>
            <Button onClick={exportRosterCsv}>
              <Download className="h-3.5 w-3.5" /> Export Roster CSV
            </Button>
          </div>
        }
      />

            {error && (
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                <span>{error instanceof Error ? error.message : 'Unable to fetch roster data'}</span>
                <button onClick={() => refetch()} className="underline hover:text-white">Retry</button>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-5">
              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, USN, roll number..."
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 pl-11 pr-4 text-xs text-hi placeholder-faint focus:border-accent/50 focus:outline-none"
                />
              </div>

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-full border border-white/10 bg-[#101016] px-4 py-2.5 text-xs text-hi focus:border-accent/50 focus:outline-none"
                aria-label="Filter by subject"
              >
                <option value="">All Assigned Subjects</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>

              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="rounded-full border border-white/10 bg-[#101016] px-4 py-2.5 text-xs text-hi focus:border-accent/50 focus:outline-none"
                aria-label="Filter by section"
              >
                <option value="">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-1/2 rounded-full border border-white/10 bg-[#101016] px-3 py-2.5 text-xs text-hi focus:border-accent/50 focus:outline-none"
                  aria-label="Filter by semester"
                >
                  <option value="">All Sems</option>
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>Sem {sem}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-1/2 rounded-full border border-white/10 bg-[#101016] px-3 py-2.5 text-xs text-hi focus:border-accent/50 focus:outline-none"
                  aria-label="Filter by risk status"
                >
                  <option value="all">All Status</option>
                  <option value="safe">Safe (&ge;{minThreshold}%)</option>
                  <option value="warning">Warning (65-{minThreshold}%)</option>
                  <option value="critical">Critical (&lt;65%)</option>
                  <option value="on_leave">On Leave</option>
                </select>
              </div>
            </div>

              {/* Summary Chips */}
              <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
                <span className="chip-bytune inline-flex items-center gap-1.5 px-3 py-1.5 text-mid">
                  <UsersRound className="h-3.5 w-3.5 text-accent" />
                  <strong className="text-hi">{students.length}</strong> Shown
                </span>
                <span className="chip-bytune inline-flex items-center gap-1.5 px-3 py-1.5 text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {safeCount} Above {minThreshold}%
                </span>
                <span className="chip-bytune inline-flex items-center gap-1.5 px-3 py-1.5 text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> {riskCount} Shortage Risk
                </span>
                <span className="chip-bytune inline-flex items-center gap-1.5 px-3 py-1.5 text-sky-300">
                  <CalendarCheck className="h-3.5 w-3.5" /> {activeLeaveCount} Active Leave
                </span>
              </div>

              <Card>
                <CardHeader
                  icon={<UsersRound className="h-4 w-4" />}
                  title={subject ? `Roster — ${subject}` : 'Authorised Classroom Roster'}
                  subtitle="Click History to inspect attendance logs or Warn/Note to log academic interventions."
                />
        {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : students.length === 0 ? (
                  <EmptyState icon={<UsersRound className="h-6 w-6" />} title="No students match your filters" body="Adjust subject, section, semester, or search query." />
                ) : (
                  <DataTable<TeacherStudent>
                    rowKey={(s) => s.email}
                    rows={students}
                    pageSize={12}
                    columns={[
                      {
                        key: 'name',
                        header: 'Student',
                        sortable: true,
                        sortValue: (r) => r.full_name,
                        render: (r) => (
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                              {r.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-hi">{r.full_name}</p>
                              <p className="text-[11px] text-faint">{r.email}</p>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'meta',
                        header: 'ID / Cohort',
                        render: (r) => (
                          <div className="text-xs">
                            <p className="font-mono text-hi">{r.student_id || r.roll_number || '—'}</p>
                            <p className="text-[11px] text-faint">
                              {[r.department, r.semester ? `Sem ${r.semester}` : null, r.section ? `Sec ${r.section}` : null].filter(Boolean).join(' • ') || '—'}
                            </p>
                          </div>
                        ),
                      },
                      {
                        key: 'rate',
                        header: 'Attendance',
                        sortable: true,
                        sortValue: (r) => r.attendance_rate,
                        render: (r) => (
                  <div className="w-36">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                      <span className={r.attendance_rate >= minThreshold ? 'text-emerald-400' : r.attendance_rate >= 65 ? 'text-amber-300' : 'text-red-400'}>
                        {r.attendance_rate}%
                      </span>
                      <span className="text-[10px] font-normal text-faint">
                        {r.present_count}/{r.total_count}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${r.attendance_rate >= minThreshold ? 'bg-emerald-400' : r.attendance_rate >= 65 ? 'bg-amber-400' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, r.attendance_rate))}%` }}
                      />
                    </div>
                  </div>
                        ),
                      },
                      {
                        key: 'flags',
                        header: 'Risk & Indicators',
                        render: (r) => {
                          const risk = r.risk_level || (r.attendance_rate < 65 ? 'critical' : r.attendance_rate < minThreshold ? 'warning' : 'safe');
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              <Badge tone={statusTone(risk)}>{risk}</Badge>
                              {r.has_active_leave && <Badge tone="info">On Leave</Badge>}
                              {(r.pending_corrections ?? 0) > 0 && (
                                <Badge tone="warning">{r.pending_corrections} Dispute</Badge>
                              )}
                              {(r.consecutive_absences ?? 0) >= 3 && (
                                <Badge tone="danger">{r.consecutive_absences}x Absent</Badge>
                              )}
                              {r.biometric_enrolled ? (
                                <span title="Biometric enrolled (template protected)" className="inline-flex items-center text-emerald-400">
                                  <Fingerprint className="h-3.5 w-3.5" />
                                </span>
                              ) : null}
                            </div>
                          );
                        },
                      },
                      {
                        key: 'actions',
                        header: 'Actions',
                        render: (r) => (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => openHistory(r)}
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-hi hover:border-accent/40 hover:text-accent"
                    >
                      <History className="h-3 w-3" /> History
                    </button>
                    <button
                      onClick={() => openIntervention(r)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/20"
                    >
                      <BellRing className="h-3 w-3" /> Warn / Note
                    </button>
                  </div>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>

              {/* Student Attendance History Modal */}
              <Modal
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                title={
                  historyDetail?.student
                    ? `Attendance History — ${historyDetail.student.full_name || historyDetail.student.name || historyDetail.student.email}`
                    : 'Student Attendance History'
                }
                wide
              >
                {historyLoading ? (
                  <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                ) : (
                  <div className="space-y-4">
                    {historyDetail?.summary && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                          <p className="text-[10px] uppercase text-faint">Overall Rate</p>
                          <p className="font-mono text-lg font-bold text-hi">{historyDetail.summary.overall_attendance ?? 0}%</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                          <p className="text-[10px] uppercase text-faint">Attended</p>
                          <p className="font-mono text-lg font-bold text-emerald-400">{historyDetail.summary.total_present ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                          <p className="text-[10px] uppercase text-faint">Conducted</p>
                          <p className="font-mono text-lg font-bold text-hi">{historyDetail.summary.total_conducted ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                          <p className="text-[10px] uppercase text-faint">Risk Tier</p>
                          <p className="font-mono text-sm font-bold uppercase text-amber-300">
                            {historyDetail.summary.risk?.level || 'safe'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10">
                      {!historyDetail?.records?.length ? (
                        <p className="p-4 text-center text-xs text-faint">No class attendance records found for this student in your sessions.</p>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase text-faint">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Subject</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Method / Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {historyDetail.records.map((rec, idx) => (
                              <tr key={rec.id || rec._id || idx}>
                                <td className="px-3 py-2 text-mid">
                                  {rec.timestamp ? new Date(rec.timestamp).toLocaleDateString() : rec.date || '—'}
                                </td>
                                <td className="px-3 py-2 font-medium text-hi">{rec.subject || '—'}</td>
                                <td className="px-3 py-2"><Badge tone={statusTone(rec.status)}>{rec.status}</Badge></td>
                                <td className="px-3 py-2 text-[11px] text-faint">
                                  {rec.verified_by || rec.method || 'system'}{rec.reason ? ` — ${rec.reason}` : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {historyDetail?.interventions && historyDetail.interventions.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">Logged Faculty Interventions</p>
                        <div className="space-y-1.5">
                          {historyDetail.interventions.map((iv) => (
                            <div key={iv.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                              <div className="flex items-center justify-between">
                                <Badge tone="info">{iv.action_taken.replace('_', ' ')}</Badge>
                                <span className="text-[10px] text-faint">{new Date(iv.created_at).toLocaleString()}</span>
                              </div>
                              <p className="mt-1 text-mid">{iv.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Modal>

              {/* Intervention / Warning Modal */}
              <Modal
                open={Boolean(actionStudent)}
                onClose={() => setActionStudent(null)}
                title={actionStudent ? `Intervention — ${actionStudent.full_name}` : 'Log Intervention'}
              >
                <form onSubmit={handleSaveIntervention} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-mid">Action Type</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value as typeof actionType)}
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                    >
                      <option value="reminder_sent">Send Attendance Warning / Reminder</option>
                      <option value="counseling_scheduled">Schedule Academic Counseling</option>
                      <option value="note">Record Confidential Faculty Note</option>
                      <option value="escalated">Escalate to Department / Advisor</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-mid">Message / Intervention Note</label>
                    <textarea
                      required
                      rows={3}
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
                      placeholder="Explain attendance shortage concern or next steps..."
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-mid">
                    <input
                      type="checkbox"
                      checked={sendAlertToo}
                      onChange={(e) => setSendAlertToo(e.target.checked)}
                      className="rounded border-white/20"
                    />
                    Also send direct notification to student (and linked guardian if configured)
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setActionStudent(null)}>Cancel</Button>
                    <Button type="submit" loading={submittingAction}>
                      <ShieldAlert className="h-3.5 w-3.5" /> Save Intervention
                    </Button>
                  </div>
                </form>
              </Modal>
            </DashboardLayout>
            );
}