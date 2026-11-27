'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, AlertTriangle, CheckCircle2, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  wardEmail: string;
  wardName: string;
  summary: any;
  onRefresh: () => void;
}

export function ParentAttendanceTab({ wardEmail, wardName, summary, onRefresh }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [disputeSession, setDisputeSession] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeCategory, setDisputeCategory] = useState('incorrect_absence');
  const [disputeMsg, setDisputeMsg] = useState('');
  const [disputeErr, setDisputeErr] = useState('');
  const [disputes, setDisputes] = useState<any[]>([]);

  useEffect(() => {
    setPage(1);
    setDisputeSession(null);
    setDisputeMsg('');
    setDisputeErr('');
  }, [wardEmail]);

  useEffect(() => {
    if (!wardEmail) return;
    const ctrl = new AbortController();
    setLoading(true);
    Promise.all([
      api.parent.childAttendanceLogs(
        wardEmail,
        {
          paginated: 1,
          page,
          limit: 12,
          status: statusFilter,
          subject: subjectFilter,
          search,
          from: fromDate,
          to: toDate,
        },
        ctrl.signal
      ),
      api.parent.childDisputes(wardEmail, ctrl.signal).catch(() => ({ disputes: [] })),
    ])
      .then(([hist, dispRes]) => {
        if (ctrl.signal.aborted) return;
        setRecords(Array.isArray(hist?.records) ? hist.records : []);
        setTotal(Number(hist?.total || 0));
        setDisputes(Array.isArray(dispRes?.disputes) ? dispRes.disputes : []);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setRecords([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [wardEmail, page, statusFilter, subjectFilter, search, fromDate, toDate]);

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeSession || !disputeReason.trim()) return;
    setDisputeErr('');
    setDisputeMsg('');
    try {
      await api.parent.submitDispute({
        student_email: wardEmail,
        session_id: disputeSession.session_id || disputeSession.id,
        subject: disputeSession.subject,
        reason_category: disputeCategory,
        reason: disputeReason.trim(),
        requested_status: 'Present',
      });
      setDisputeMsg('Attendance correction request submitted for faculty review.');
      setDisputeReason('');
      setDisputeSession(null);
      onRefresh();
      const refreshed = await api.parent.childDisputes(wardEmail).catch(() => ({ disputes: [] }));
      setDisputes(refreshed?.disputes || []);
    } catch (err: any) {
      setDisputeErr(err?.message || 'Unable to submit correction request.');
    }
  };

  const subjects = Array.isArray(summary?.subjects) ? summary.subjects : [];
  const forecast = summary?.forecast || {};
  const risk = summary?.risk || {};
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="space-y-6">
      {/* Deterministic Forecasting & Risk Intelligence */}
      <div className="rounded-[22px] card-surface p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber" />
            <span>Attendance Forecasting & Risk Intelligence — {wardName}</span>
          </h3>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-hi">
            Risk Level: {risk.level || summary?.standing || 'Unknown'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
            <p className="text-[11px] text-mid">Overall Rate</p>
            <p className="text-lg font-bold text-hi">
              {summary?.overall_attendance !== null && summary?.overall_attendance !== undefined ? `${summary.overall_attendance}%` : '—'}
            </p>
          </div>
          <div className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
            <p className="text-[11px] text-mid">Attended / Conducted</p>
            <p className="text-lg font-bold text-hi">{summary?.total_present ?? 0} / {summary?.total_conducted ?? 0}</p>
          </div>
          <div className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
            <p className="text-[11px] text-mid">Classes Needed for Target</p>
            <p className="text-lg font-bold text-amber">{forecast.classes_needed ?? 0}</p>
          </div>
          <div className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
            <p className="text-[11px] text-mid">Permissible Absences</p>
            <p className="text-lg font-bold text-spotify">{forecast.allowable_absences ?? 0}</p>
          </div>
        </div>

        {forecast.status_note && (
          <p className="text-xs text-mid bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5">
            {forecast.status_note} (Forecasts are mathematical projections based on current policy, not guaranteed outcomes.)
          </p>
        )}
      </div>

      {/* Filtered Attendance History */}
      <div className="rounded-[22px] card-surface p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            <span>Verified Attendance Ledger ({total})</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-faint absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search subject or code"
                className="rounded-xl bg-white/[0.04] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-hi placeholder-faint focus:outline-none focus:border-accent"
              />
            </div>
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
              className="rounded-xl bg-[#0B0B10] border border-white/10 px-3 py-1.5 text-xs text-hi focus:outline-none focus:border-accent"
            >
              <option value="">All Subjects</option>
              {subjects.map((s: any) => (
                <option key={s.subject} value={s.subject}>{s.subject}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-xl bg-[#0B0B10] border border-white/10 px-3 py-1.5 text-xs text-hi focus:outline-none focus:border-accent"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
              <option value="Excused">Excused</option>
              <option value="Approved Leave">Approved Leave</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-xs text-hi"
              aria-label="From date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-1.5 text-xs text-hi"
              aria-label="To date"
            />
          </div>
        </div>

        {disputeMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {disputeMsg}
          </div>
        )}
        {disputeErr && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {disputeErr}
          </div>
        )}

        {disputeSession && (
          <form onSubmit={handleDisputeSubmit} className="mb-5 rounded-[16px] border border-amber/30 bg-amber/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-hi">
                Request Correction: {disputeSession.subject} ({disputeSession.date})
              </p>
              <button type="button" onClick={() => setDisputeSession(null)} className="text-xs text-mid hover:text-hi">
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
                className="rounded-xl bg-[#0B0B10] border border-white/10 px-3 py-2 text-xs text-hi"
              >
                <option value="incorrect_absence">Incorrect Absence</option>
                <option value="incorrect_late_marking">Incorrect Late Marking</option>
                <option value="facial_recognition_failure">Facial Recognition Failure</option>
                <option value="qr_scanning_failure">QR Verification Failure</option>
                <option value="institutional_activity">Previously Approved Leave / Activity</option>
                <option value="other">Other Institutional Reason</option>
              </select>
              <input
                type="text"
                required
                minLength={5}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why this attendance record should be reviewed..."
                className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-hi placeholder-faint"
              />
            </div>
            <button type="submit" className="btn-pill-accent px-4 py-1.5 text-xs font-semibold">
              Submit Correction Request
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {loading ? (
            <p className="text-xs text-mid py-4">Loading attendance records...</p>
          ) : records.length === 0 ? (
            <p className="text-xs text-faint py-4">No attendance records match your filters.</p>
          ) : (
            records.map((rec: any) => (
              <div key={rec.id || `${rec.session_id}-${rec.date}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[16px] bg-white/[0.02] border border-white/5 p-3.5">
                <div>
                  <p className="text-xs font-bold text-hi">
                    {rec.subject || 'Class Session'} {rec.subject_code ? `(${rec.subject_code})` : ''}
                  </p>
                  <p className="text-[11px] text-mid">
                    {rec.date} • {rec.time || '—'} • Verified via {rec.verified_by || 'System'}
                    {rec.correction_status ? ` • Correction: ${rec.correction_status}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    rec.status === 'Present' ? 'bg-spotify/15 text-spotify' :
                    rec.status === 'Absent' ? 'bg-red-500/15 text-red-300' :
                    'bg-amber/15 text-amber'
                  }`}>
                    {rec.status}
                  </span>
                  {(rec.status === 'Absent' || rec.status === 'Late') && !rec.correction_status && (
                    <button
                      type="button"
                      onClick={() => { setDisputeSession(rec); setDisputeErr(''); setDisputeMsg(''); }}
                      className="text-[11px] font-semibold text-accent hover:underline"
                    >
                      Report Issue
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs text-mid">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-white/10 p-1.5 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-white/10 p-1.5 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Correction Request History */}
      {disputes.length > 0 && (
        <div className="rounded-[22px] card-surface p-6">
          <h3 className="font-display text-base font-bold text-hi mb-3 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber" />
            <span>Attendance Correction Requests</span>
          </h3>
          <div className="space-y-2.5">
            {disputes.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
                <div>
                  <p className="text-xs font-bold text-hi">{d.subject || d.session_id}</p>
                  <p className="text-[11px] text-mid">{d.reason}</p>
                  {d.remarks && <p className="text-[11px] text-faint mt-0.5">Reviewer: {d.remarks}</p>}
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-hi">
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
