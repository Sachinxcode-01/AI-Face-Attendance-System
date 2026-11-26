'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  ScanFace, QrCode, Clock, Download, Filter, CheckCircle2,
  FileSpreadsheet, FileText, RefreshCw, AlertCircle, MessageSquareWarning, Eye,
} from 'lucide-react';
import type { AttendanceRecord } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';

const FILTERS = [
  'all',
  'present',
  'verified_face',
  'verified_qr',
  'late',
  'absent',
  'excused',
  'medical leave',
  'approved leave',
  'pending verification',
  'cancelled session',
] as const;

const DISPUTE_REASONS = [
  { value: 'facial_recognition_failure', label: 'Facial recognition failure' },
  { value: 'qr_scanning_failure', label: 'QR scanning failure' },
  { value: 'incorrect_absence', label: 'Incorrect absence' },
  { value: 'incorrect_late_marking', label: 'Incorrect late marking' },
  { value: 'network_failure', label: 'Network failure' },
  { value: 'faculty_recording_error', label: 'Faculty recording error' },
  { value: 'institutional_activity', label: 'Approved institutional activity' },
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'other', label: 'Other valid reason' },
];

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [allSubjects, setAllSubjects] = useState<string[]>([]);
  const [allSemesters, setAllSemesters] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

    // Detail & Correction modals
    const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
    const [disputeTarget, setDisputeTarget] = useState<AttendanceRecord | null>(null);
    const [disputeCategory, setDisputeCategory] = useState('facial_recognition_failure');
    const [disputeRequestedStatus, setDisputeRequestedStatus] = useState<'Present' | 'Excused' | 'Late'>('Present');
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeBusy, setDisputeBusy] = useState(false);
    const [disputeMsg, setDisputeMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [disputes, setDisputes] = useState<any[]>([]);

    const fetchAttendance = useCallback(async () => {
      const email = user?.email;
      if (!email) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const [histRes, dispRes] = await Promise.all([
          api.attendance.student(email, {
            limit: 200,
            status: filter !== 'all' ? filter : '',
            subject: subjectFilter !== 'all' ? subjectFilter : '',
            semester: semesterFilter !== 'all' ? semesterFilter : '',
            start_date: startDate,
            end_date: endDate,
          }),
          api.attendance.disputes.list().catch(() => ({ disputes: [] })),
        ]);

            const rawList = Array.isArray(histRes)
              ? histRes
              : (Array.isArray(histRes?.records) ? histRes.records : (Array.isArray(histRes?.logs) ? histRes.logs : []));

                  setRecords(
                    rawList.map((r: any, i: number) => {
                      const rawStatus = (r.status || 'Present').toLowerCase();
                      const method = (r.verified_by || r.verification_method || '').toLowerCase();
                      let finalStatus: AttendanceRecord['status'] = 'present';
                      if (rawStatus === 'absent') finalStatus = 'absent';
                      else if (rawStatus === 'late') finalStatus = 'late';
                      else if (rawStatus.includes('excused')) finalStatus = 'excused';
                      else if (rawStatus.includes('medical')) finalStatus = 'medical_leave';
                      else if (rawStatus.includes('approved')) finalStatus = 'approved_leave';
                      else if (rawStatus.includes('pending')) finalStatus = 'pending_verification';
                      else if (rawStatus.includes('cancelled')) finalStatus = 'cancelled_session';
                      else if (rawStatus.includes('not recorded')) finalStatus = 'not_recorded';
                      else if (method === 'face') finalStatus = 'verified_face';
                      else if (method === 'qr') finalStatus = 'verified_qr';
                      else if (method === 'manual') finalStatus = 'manually_recorded';

            return {
              id: r.id || r._id || `att_${i}`,
              receipt_id: r.receipt_id,
              session_id: r.session_id,
              date: r.date || '—',
              time: r.time || '—',
              scheduled_time: r.scheduled_time,
              registration_time: r.registration_time,
              subject: r.subject || 'Class Session',
              subject_code: r.subject_code,
              faculty_name: r.faculty_name,
              status: finalStatus,
              raw_status: r.status || 'Present',
              verified_by: r.verified_by,
              confidence: typeof r.confidence === 'number' ? r.confidence : null,
              room: r.room || 'Campus Room',
              correction_status: r.correction_status,
              correction_id: r.correction_id,
              remarks: r.remarks,
              semester: r.semester,
              updated_at: r.updated_at,
            };
          })
      );
  if (Array.isArray(histRes?.all_subjects)) setAllSubjects(histRes.all_subjects);
  if (Array.isArray(histRes?.all_semesters)) setAllSemesters(histRes.all_semesters);
  if (histRes?.summary) setSummary(histRes.summary);
  setDisputes(Array.isArray(dispRes?.disputes) ? dispRes.disputes : []);
} catch (err: unknown) {
  setError(err instanceof ApiError ? err.message : 'Unable to load attendance ledger.');
} finally {
  setLoading(false);
}
  }, [user?.email, filter, subjectFilter, semesterFilter, startDate, endDate]);

useEffect(() => {
  fetchAttendance();
  }, [fetchAttendance]);

const rows = records.filter((r) => {
  const q = search.toLowerCase();
  return (
    !q ||
    r.subject.toLowerCase().includes(q) ||
    (r.subject_code || '').toLowerCase().includes(q) ||
    (r.faculty_name || '').toLowerCase().includes(q) ||
    r.room.toLowerCase().includes(q) ||
    (r.receipt_id || '').toLowerCase().includes(q)
  );
});

const handleBackendExport = async (format: 'csv' | 'excel' | 'html') => {
  if (!user?.email) return;
  setExporting(true);
  try {
    await api.attendance.downloadReport(user.email, {
      format,
      subject: subjectFilter !== 'all' ? subjectFilter : '',
      status: filter !== 'all' ? filter : '',
      start_date: startDate,
      end_date: endDate,
    });
  } catch (err: unknown) {
    setError(err instanceof ApiError ? err.message : 'Report export failed.');
  } finally {
    setExporting(false);
  }
};

  const submitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTarget) return;
    if (disputeReason.trim().length < 5) {
      setDisputeMsg({ ok: false, text: 'Please provide a detailed explanation (minimum 5 characters).' });
      return;
    }
    setDisputeBusy(true);
    setDisputeMsg(null);
    try {
      await api.attendance.disputes.create({
        session_id: disputeTarget.session_id || disputeTarget.id,
        attendance_id: disputeTarget.id,
        subject: disputeTarget.subject,
        reason_category: disputeCategory,
        requested_status: disputeRequestedStatus,
        reason: disputeReason.trim(),
      });
      setDisputeMsg({ ok: true, text: 'Correction request submitted to faculty for review.' });
      setDisputeReason('');
      await fetchAttendance();
      setTimeout(() => {
        setDisputeTarget(null);
        setDisputeMsg(null);
      }, 1200);
    } catch (err: unknown) {
      setDisputeMsg({ ok: false, text: err instanceof ApiError ? err.message : 'Failed to submit correction request.' });
    } finally {
      setDisputeBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        kicker="Attendance Ledger"
        title="Attendance History"
        subtitle="Verified class records, correction requests, and institution-compliant attendance report exports."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBackendExport('csv')}
              disabled={exporting}
              className="btn-pill-glass h-9 px-3.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-accent" /> CSV
            </button>
            <button
              onClick={() => handleBackendExport('excel')}
              disabled={exporting}
              className="btn-pill-glass h-9 px-3.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Excel
            </button>
            <button
              onClick={() => handleBackendExport('html')}
              disabled={exporting}
              className="btn-pill-glass h-9 px-3.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" /> Printable Report
            </button>
          </div>
        }
      />

      {error && (
        <Card className="mb-6 border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center justify-between gap-3 text-xs text-red-200">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-400" /> {error}</span>
            <Button variant="secondary" onClick={fetchAttendance} className="h-8 px-3 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </div>
        </Card>
      )}

      <div className="page-enter mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Conducted', value: String(summary?.conducted ?? records.length), cls: 'text-hi' },
          { label: 'Verified Attended', value: String(summary?.attended ?? records.filter((r) => r.status !== 'absent').length), cls: 'text-emerald-400' },
          { label: 'Late Arrivals', value: String(summary?.late ?? records.filter((r) => r.status === 'late').length), cls: 'text-amber-400' },
          { label: 'Absences', value: String(summary?.missed ?? records.filter((r) => r.status === 'absent').length), cls: 'text-red-400' },
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
          right={
            <button onClick={fetchAttendance} className="text-xs font-mono text-accent hover:text-accent2 flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          }
        />

        {/* Subject, Semester & Date Range Filters */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
          >
            <option value="all">All Subjects</option>
            {allSubjects.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
          >
            <option value="all">All Semesters</option>
            {allSemesters.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start date"
            className="rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End date"
            className="rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
          />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const isSelected = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`chip-bytune text-xs h-8 px-3.5 ${isSelected ? 'chip-bytune-active' : ''}`}
              >
                {f === 'all' ? 'All' : f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
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
              render: (r) => (
                <div>
                  <span className="font-semibold text-hi">{r.subject}</span>
                  {r.faculty_name && <p className="text-[10.5px] text-faint">{r.faculty_name}</p>}
                </div>
              ),
            },
            {
              key: 'when',
              header: 'Date & Time',
              sortable: true,
              sortValue: (r) => `${r.date} ${r.time}`,
              render: (r) => <span className="font-mono text-mid text-[11.5px]">{r.date} · {r.time}</span>,
            },
            {
              key: 'room',
              header: 'Location',
              render: (r) => <span className="font-mono text-mid text-[11.5px]">{r.room}</span>,
            },
            {
              key: 'status',
              header: 'Status & Verification',
              render: (r) => {
                if (r.status === 'verified_face') {
                  return (
                    <Badge tone="success">
                      <ScanFace className="h-3 w-3" /> ArcFace {typeof r.confidence === 'number' ? `${(r.confidence * 100).toFixed(1)}%` : ''}
                    </Badge>
                  );
                }
                if (r.status === 'verified_qr') {
                  return <Badge tone="info"><QrCode className="h-3 w-3" /> QR Verified</Badge>;
                }
                  if (r.status === 'present' || r.status === 'manually_recorded') {
                    return <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> {r.raw_status || 'Present'}</Badge>;
                  }
                  if (r.status === 'late') {
                    return <Badge tone="warning"><Clock className="h-3 w-3" /> Late</Badge>;
                  }
                  return <Badge tone={statusTone(r.status)}>{r.raw_status || r.status.replace(/_/g, ' ')}</Badge>;
                },
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRecord(r)}
                    className="chip-bytune h-7 px-2.5 text-[10.5px]"
                    title="View details"
                  >
                    <Eye className="h-3 w-3" /> Details
                  </button>
                  {r.correction_status ? (
                    <Badge tone={statusTone(r.correction_status.toLowerCase())}>{r.correction_status}</Badge>
                  ) : (
                    <button
                      onClick={() => {
                        setDisputeTarget(r);
                        setDisputeMsg(null);
                      }}
                      className="chip-bytune h-7 px-2.5 text-[10.5px] text-amber-300"
                      title="Request attendance correction"
                    >
                      <MessageSquareWarning className="h-3 w-3" /> Dispute
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rows={rows}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search subject, faculty, room, or receipt ID…"
          pageSize={8}
          emptyTitle={loading ? 'Loading attendance records…' : 'No attendance records match your filters.'}
        />
      </Card>

      {/* Correction Requests History */}
      <Card className="page-enter mt-6 p-6">
        <CardHeader
          icon={<MessageSquareWarning className="h-5 w-5 text-amber-400" />}
          title="Attendance Correction Requests"
          subtitle="Formal dispute resolution trail reviewed by faculty or administration"
        />
        {disputes.length === 0 ? (
          <p className="py-4 text-center text-xs font-mono text-faint">No attendance correction requests submitted.</p>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div key={d.id} className="rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-hi">{d.subject || `Session ${d.session_id}`}</span>
                    <Badge tone={statusTone(String(d.status || 'pending').toLowerCase())}>{d.status}</Badge>
                    <span className="font-mono text-[10px] text-faint">Requested: {d.requested_status}</span>
                  </div>
                  <p className="mt-1 text-xs text-mid">{d.reason}</p>
                  {d.remarks && (
                    <p className="mt-1 font-mono text-[11px] text-accent">Reviewer remarks: {d.remarks}</p>
                  )}
                </div>
                <span className="font-mono text-[10.5px] text-faint">
                  {d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Record Details Modal */}
      <Modal
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Attendance Record Details"
      >
        {selectedRecord && (
          <div className="space-y-2.5 text-xs">
            {[
              ['Subject', `${selectedRecord.subject}${selectedRecord.subject_code ? ` (${selectedRecord.subject_code})` : ''}`],
              ['Faculty', selectedRecord.faculty_name || 'Faculty'],
              ['Class Date & Time', `${selectedRecord.date} · ${selectedRecord.time}`],
              ['Scheduled Slot', selectedRecord.scheduled_time || 'Session window'],
              ['Room / Location', selectedRecord.room],
              ['Status', selectedRecord.raw_status || selectedRecord.status],
              ['Verification Method', selectedRecord.verified_by || '—'],
              ['Session ID', selectedRecord.session_id || '—'],
              ['Receipt Reference', selectedRecord.receipt_id || '—'],
              ['Correction Status', selectedRecord.correction_status || 'None'],
              ['Remarks', selectedRecord.remarks || 'None'],
              ['Last Updated', selectedRecord.updated_at ? new Date(selectedRecord.updated_at).toLocaleString() : '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
                <span className="font-mono text-[11px] text-faint">{k}</span>
                <span className="text-right font-mono text-hi">{v}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Correction Request Modal */}
      <Modal
        open={Boolean(disputeTarget)}
        onClose={() => setDisputeTarget(null)}
        title="Request Attendance Correction"
      >
        {disputeTarget && (
          <form onSubmit={submitDispute} className="space-y-4 text-xs">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="font-semibold text-hi">{disputeTarget.subject}</p>
              <p className="mt-0.5 font-mono text-[11px] text-faint">{disputeTarget.date} · {disputeTarget.time} · Current: {disputeTarget.raw_status}</p>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-mid">Reason Category</label>
              <select
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
              >
                {DISPUTE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-mid">Requested Status</label>
              <select
                value={disputeRequestedStatus}
                onChange={(e) => setDisputeRequestedStatus(e.target.value as 'Present' | 'Excused' | 'Late')}
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Excused">Excused</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase text-mid">Explanation</label>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe what happened (e.g., network dropped during QR submission, faculty verified manually)…"
                className="w-full rounded-xl border border-[var(--hairline)] bg-surface px-3 py-2 text-xs text-hi focus:border-accent focus:outline-none"
              />
            </div>
            {disputeMsg && (
              <p className={`rounded-xl border px-3 py-2 font-mono ${disputeMsg.ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                {disputeMsg.text}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDisputeTarget(null)}>Cancel</Button>
              <Button type="submit" loading={disputeBusy}>Submit Request</Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
