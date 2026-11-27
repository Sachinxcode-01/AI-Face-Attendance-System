'use client';

import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Send, Upload } from 'lucide-react';
import { api, BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Props {
  wardEmail: string;
  wardName: string;
  onRefresh: () => void;
}

export function ParentLeavesTab({ wardEmail, wardName, onRefresh }: Props) {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [category, setCategory] = useState('Medical');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [docInfo, setDocInfo] = useState<{ url: string; name: string } | null>(null);
  const [leaveMsg, setLeaveMsg] = useState('');
  const [leaveErr, setLeaveErr] = useState('');

  const [enqSubject, setEnqSubject] = useState('');
  const [enqCategory, setEnqCategory] = useState('attendance_enquiry');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqMsg, setEnqMsg] = useState('');
  const [enqErr, setEnqErr] = useState('');

  const loadData = (signal?: AbortSignal) => {
    if (!wardEmail) return;
    Promise.all([
      api.parent.childLeaves(wardEmail, signal).catch(() => []),
      api.parent.enquiries(wardEmail, signal).catch(() => ({ enquiries: [] })),
    ]).then(([l, e]) => {
      if (signal?.aborted) return;
      setLeaves(Array.isArray(l) ? l : []);
      setEnquiries(Array.isArray(e?.enquiries) ? e.enquiries : []);
    });
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadData(ctrl.signal);
    return () => ctrl.abort();
  }, [wardEmail]);

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLeaveErr('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/leave/upload-document`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Upload failed');
      setDocInfo({ url: data.document_url, name: data.document_name });
    } catch (err: any) {
      setLeaveErr(err?.message || 'Document upload failed.');
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveErr('');
    setLeaveMsg('');
    try {
      await api.parent.submitAbsenceNotice({
        childEmail: wardEmail,
        category,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        document_url: docInfo?.url,
        document_name: docInfo?.name,
      });
      setReason('');
      setDocInfo(null);
      setLeaveMsg('Leave application submitted for review.');
      loadData();
      onRefresh();
    } catch (err: any) {
      setLeaveErr(err?.message || 'Unable to submit leave application.');
    }
  };

  const handleWithdraw = async (leaveId: string) => {
    try {
      await api.parent.withdrawLeave(leaveId);
      loadData();
      onRefresh();
    } catch (err: any) {
      setLeaveErr(err?.message || 'Unable to withdraw leave.');
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnqErr('');
    setEnqMsg('');
    try {
      await api.parent.submitEnquiry({
        student_email: wardEmail,
        subject: enqSubject.trim(),
        category: enqCategory,
        message: enqMessage.trim(),
      });
      setEnqSubject('');
      setEnqMessage('');
      setEnqMsg('Institutional enquiry submitted.');
      loadData();
    } catch (err: any) {
      setEnqErr(err?.message || 'Unable to submit enquiry.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-6 space-y-6">
        <div className="rounded-[22px] card-surface p-6">
          <h3 className="font-display text-base font-bold text-hi mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber" />
            <span>Submit Guardian Leave Application — {wardName}</span>
          </h3>
          <form onSubmit={handleLeaveSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl bg-[#0B0B10] border border-white/10 px-3 py-2 text-xs text-hi"
              >
                <option value="Medical">Medical Leave</option>
                <option value="Personal">Personal Leave</option>
                <option value="Emergency">Emergency Leave</option>
                <option value="Family">Family Leave</option>
                <option value="Academic">Academic Leave</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-hi"
                required
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-hi"
                required
              />
            </div>
            <textarea
              rows={3}
              required
              minLength={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide detailed leave reason..."
              className="w-full rounded-[16px] bg-white/[0.04] border border-white/10 p-3 text-xs text-hi placeholder-faint"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-mid cursor-pointer hover:text-hi">
                <Upload className="h-3.5 w-3.5" />
                <span>{docInfo ? docInfo.name : 'Attach PDF/Image (max 5MB)'}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleUploadDoc} className="hidden" />
              </label>
              <button type="submit" className="btn-pill-accent px-5 py-2 text-xs font-semibold">
                Submit Leave
              </button>
            </div>
            {leaveErr && <p className="text-xs text-red-300">{leaveErr}</p>}
            {leaveMsg && <p className="text-xs text-emerald-300">{leaveMsg}</p>}
          </form>
        </div>

        <div className="rounded-[22px] card-surface p-6">
          <h3 className="font-display text-base font-bold text-hi mb-3">Leave Application History</h3>
          {leaves.length === 0 ? (
            <p className="text-xs text-faint">No leave applications found for this ward.</p>
          ) : (
            <div className="space-y-2.5">
              {leaves.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
                  <div>
                    <p className="text-xs font-bold text-hi">
                      {l.category || 'Leave'} • {l.start_date} to {l.end_date}
                    </p>
                    <p className="text-[11px] text-mid">{l.reason}</p>
                    {l.remarks && <p className="text-[11px] text-faint">Remarks: {l.remarks}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-hi">{l.status}</span>
                    {['Pending', 'Under Review', 'Clarification'].includes(l.status) && (
                      <button type="button" onClick={() => handleWithdraw(l.id)} className="text-[11px] text-red-300 hover:underline">
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-6 space-y-6">
        <div className="rounded-[22px] card-surface p-6">
          <h3 className="font-display text-base font-bold text-hi mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-spotify" />
            <span>Institutional Enquiry Channel</span>
          </h3>
          <form onSubmit={handleEnquirySubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={enqSubject}
                onChange={(e) => setEnqSubject(e.target.value)}
                placeholder="Enquiry subject"
                className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-hi placeholder-faint"
              />
              <select
                value={enqCategory}
                onChange={(e) => setEnqCategory(e.target.value)}
                className="rounded-xl bg-[#0B0B10] border border-white/10 px-3 py-2 text-xs text-hi"
              >
                <option value="attendance_enquiry">Attendance Enquiry</option>
                <option value="policy_clarification">Policy Clarification</option>
                <option value="leave_followup">Leave Follow-up</option>
                <option value="correction_followup">Correction Follow-up</option>
                <option value="general">General Institutional Query</option>
              </select>
            </div>
            <textarea
              rows={3}
              required
              value={enqMessage}
              onChange={(e) => setEnqMessage(e.target.value)}
              placeholder="Write your message to the authorised department coordinator..."
              className="w-full rounded-[16px] bg-white/[0.04] border border-white/10 p-3 text-xs text-hi placeholder-faint"
            />
            <button type="submit" className="btn-pill-accent px-5 py-2 text-xs font-semibold inline-flex items-center gap-2">
              <Send className="h-3.5 w-3.5" />
              <span>Send Enquiry</span>
            </button>
            {enqErr && <p className="text-xs text-red-300">{enqErr}</p>}
            {enqMsg && <p className="text-xs text-emerald-300">{enqMsg}</p>}
          </form>
        </div>

        <div className="rounded-[22px] card-surface p-6">
          <h3 className="font-display text-base font-bold text-hi mb-3">Previous Enquiries</h3>
          {enquiries.length === 0 ? (
            <p className="text-xs text-faint">No enquiries submitted yet.</p>
          ) : (
            <div className="space-y-2.5">
              {enquiries.map((eq: any) => (
                <div key={eq.id} className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-hi">{eq.subject}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-amber uppercase">{eq.status}</span>
                  </div>
                  <p className="text-[11px] text-mid mt-1">{eq.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
