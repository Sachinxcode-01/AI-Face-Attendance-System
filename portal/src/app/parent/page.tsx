'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import {
  HeartHandshake,
  Bell,
  Calendar,
  CheckCircle2,
  FileText,
  Send,
  PhoneCall,
  UserPlus,
  RefreshCw,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, BASE_URL } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ParentAttendanceTab } from '@/features/parent/ParentAttendanceTab';
import { ParentTimetableTab } from '@/features/parent/ParentTimetableTab';
import { ParentLeavesTab } from '@/features/parent/ParentLeavesTab';
import { ParentReportsNexaTab } from '@/features/parent/ParentReportsNexaTab';
import { ParentProfileTab } from '@/features/parent/ParentProfileTab';

type ParentTab = 'overview' | 'attendance' | 'timetable' | 'leaves' | 'reports' | 'profile';

export default function ParentPortalPage() {
  const { user, authed, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ParentTab>('overview');
  const [absenceNotice, setAbsenceNotice] = useState('');
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [liveWards, setLiveWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wardError, setWardError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkMode, setLinkMode] = useState<'code' | 'request'>('code');
  const [linkInput, setLinkInput] = useState('');
  const [relationshipType, setRelationshipType] = useState('legal_guardian');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const [selectedWardEmail, setSelectedWardEmail] = useState<string>('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; time: string; description: string; type: string; read?: boolean }>>([]);

  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      }
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  const fetchWards = useCallback(async (signal?: AbortSignal) => {
    if (authLoading || !authed) return;
    setLoading(true);
    setWardError('');
    try {
      const children = await api.parent.children(signal);
      if (signal?.aborted) return;
      const list = Array.isArray(children) ? children : [];
      setLiveWards(list);
      setSelectedWardEmail((prev) => {
        if (prev && list.some((c: any) => c.email === prev)) return prev;
        return list[0]?.email || '';
      });
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setWardError(err?.message || 'Unable to load linked student records.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [authLoading, authed]);

  const fetchWardDashboard = useCallback(async (wardEmail: string, signal?: AbortSignal) => {
    if (!wardEmail) {
      setDashboard(null);
      setContacts([]);
      return;
    }
    setWardError('');
    try {
      const [dash, contactRes] = await Promise.all([
        api.parent.childDashboard(wardEmail, signal),
        api.parent.contacts(wardEmail, signal).catch(() => ({ contacts: [] })),
      ]);
      if (signal?.aborted) return;
      setDashboard(dash);
      setContacts(Array.isArray(contactRes?.contacts) ? contactRes.contacts : []);
      setLastSyncedAt(dash?.synced_at || new Date().toISOString());
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setWardError(err?.message || 'Unable to synchronise ward attendance data.');
        setDashboard(null);
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (authLoading || !authed) return;
    try {
      const res: any = await api.notifications.list();
      const items = Array.isArray(res) ? res : (res?.notifications || []);
      setNotifications(items.slice(0, 10).map((n: any, idx: number) => ({
        id: n.id || n._id || `notif_${idx}`,
        title: n.title || 'Update',
        time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent',
        description: n.message || '',
        type: n.type || 'info',
        read: Boolean(n.is_read ?? n.read),
      })));
    } catch {
      setNotifications([]);
    }
  }, [authLoading, authed]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchWards(ctrl.signal);
    fetchNotifications();
    return () => ctrl.abort();
  }, [fetchWards, fetchNotifications, user?.email]);

  useEffect(() => {
    setDashboard(null);
    setContacts([]);
    if (!selectedWardEmail) {
      return;
    }
    const ctrl = new AbortController();
    fetchWardDashboard(selectedWardEmail, ctrl.signal);
    return () => ctrl.abort();
  }, [selectedWardEmail, fetchWardDashboard]);

  // Real-time WebSocket updates & immediate revocation invalidation
  useEffect(() => {
    if (authLoading || !authed) return;
    const token = getToken();
    if (!token || typeof window === 'undefined') return;
    const wsBase = BASE_URL.replace(/^http/, 'ws');
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`${wsBase}/ws/notifications?token=${encodeURIComponent(token)}`);
      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload?.event === 'guardian_relationship_revoked') {
            setDashboard(null);
            fetchWards();
            return;
          }
          fetchNotifications();
          if (selectedWardEmail) fetchWardDashboard(selectedWardEmail);
        } catch { }
      };
    } catch { }
    return () => {
      if (ws && ws.readyState < 2) ws.close();
    };
  }, [authLoading, authed, selectedWardEmail, fetchWards, fetchWardDashboard, fetchNotifications]);

  const activeWardMeta = liveWards.find((w) => w.email === selectedWardEmail) || null;
  const activeWard = {
    name: activeWardMeta?.full_name || activeWardMeta?.email || 'No Linked Student Ward',
    email: activeWardMeta?.email || '',
    rollNo: activeWardMeta?.student_id || '—',
    department: activeWardMeta?.department || 'Institutional Academic Record',
    semester: activeWardMeta?.semester || '',
    college: activeWardMeta?.college || '',
  };

  const todayRecords: any[] = Array.isArray(dashboard?.today?.records) ? dashboard.today.records : [];
  const todayPresent = todayRecords.find((r) => r.status === 'Present' || r.status === 'Late');
  const isHoliday = Boolean(dashboard?.today?.is_holiday);

  const todayStatusLabel = !activeWard.email
    ? (loading ? 'Connecting to institutional gateway...' : 'No linked student ward')
    : isHoliday
      ? `Institutional Holiday (${dashboard?.today?.holiday_name || 'Holiday'})`
      : todayPresent
        ? `${todayPresent.status}: ${todayPresent.subject || 'Class Session'}`
        : todayRecords.length > 0
          ? `${todayRecords[0].status}: ${todayRecords[0].subject || 'Class Session'}`
          : 'No class attendance recorded yet today';

  const todaySubLabel = !activeWard.email
    ? 'Link an authorised ward to begin monitoring'
    : todayPresent
      ? `Verified via ${todayPresent.verified_by || 'System'} at ${todayPresent.time || '—'}`
      : 'Classroom attendance only — does not indicate physical campus location';

  const summary = dashboard?.summary || null;
  const subjects: any[] = Array.isArray(summary?.subjects) ? summary.subjects : [];

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    setLinkError('');
    setLinkSuccess('');
    try {
      const payload = linkMode === 'code'
        ? { invitation_code: linkInput.trim(), relationship_type: relationshipType }
        : (linkInput.includes('@')
          ? { student_email: linkInput.trim(), relationship_type: relationshipType }
          : { student_id: linkInput.trim(), relationship_type: relationshipType });
      const res = await api.parent.linkStudent(payload);
      if (res && res.success) {
        setLinkSuccess(res.message || 'Guardian request processed.');
        setLinkInput('');
        await fetchWards();
      }
    } catch (err: any) {
      setLinkError(err?.message || 'Failed to process guardian link.');
    }
  };

  const handleAbsenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWard.email) {
      setSubmitError('Please link and select a student ward before submitting an absence notice.');
      return;
    }
    if (!absenceNotice.trim() || absenceNotice.trim().length < 5) {
      setSubmitError('Please enter at least 5 characters describing the absence reason.');
      return;
    }
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    setSubmitError('');
    try {
      await api.parent.submitAbsenceNotice({
        childEmail: activeWard.email,
        reason: absenceNotice.trim(),
      });
      setAbsenceNotice('');
      setAbsenceSubmitted(true);
      fetchWardDashboard(activeWard.email);
      submitTimerRef.current = setTimeout(() => {
        setAbsenceSubmitted(false);
        submitTimerRef.current = null;
      }, 4000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to dispatch absence notice. Please try again.');
    }
  };

  const tabs: Array<{ id: ParentTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance & Forecast' },
    { id: 'timetable', label: 'Timetable & Notices' },
    { id: 'leaves', label: 'Leaves & Enquiries' },
    { id: 'reports', label: 'Reports & Nexa AI' },
    { id: 'profile', label: 'Profile & Privacy' },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-[#B6B6C2]">
      <Navbar currentRole="parent" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isOffline && (
          <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-2.5 text-xs text-amber flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>You are currently offline. Displayed records may be outdated until connection is restored.</span>
          </div>
        )}

        {/* Child Profile & Today's Attendance Status Banner */}
        <div id="children" className="relative overflow-hidden rounded-[22px] card-bytune p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                <HeartHandshake className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-amber uppercase tracking-wider">
                    Linked Student Profile
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 ml-2">
                    {liveWards.map((w) => (
                      <button
                        key={w.email}
                        type="button"
                        onClick={() => setSelectedWardEmail(w.email)}
                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${activeWard.email === w.email
                          ? 'bg-amber/20 text-amber border border-amber/40 shadow-sm'
                          : 'bg-white/5 text-mid border border-white/10 hover:bg-white/10'
                          }`}
                      >
                        {w.full_name || w.email}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setLinkError('');
                        setLinkSuccess('');
                        setShowLinkModal((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-[11px] font-semibold text-accent hover:bg-accent/20 transition cursor-pointer"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>Link Ward</span>
                    </button>
                  </div>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-hi">
                  {activeWard.name}
                </h1>
                <p className="text-xs text-mid mt-0.5">
                  Roll No: {activeWard.rollNo} • {activeWard.department}
                  {activeWard.semester ? ` • Sem ${activeWard.semester}` : ''}
                  {activeWard.college ? ` • ${activeWard.college}` : ''}
                </p>
              </div>
            </div>

            {/* Verified Attendance Status (Never fabricates campus presence) */}
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 sm:px-6 min-w-[240px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${todayPresent ? 'bg-spotify' : 'bg-amber'}`} />
                  <span className={`text-xs font-bold uppercase ${todayPresent ? 'text-spotify' : 'text-amber'}`}>
                    Today’s Attendance
                  </span>
                </div>
                {activeWard.email && (
                  <button
                    type="button"
                    onClick={() => fetchWardDashboard(activeWard.email)}
                    title="Sync latest records"
                    className="text-faint hover:text-hi transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-hi">{todayStatusLabel}</p>
              <p className="text-[11px] text-mid mt-0.5">{todaySubLabel}</p>
              {lastSyncedAt && (
                <p className="text-[10px] text-faint font-mono mt-1">
                  Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {showLinkModal && (
            <form onSubmit={handleLinkStudent} className="mt-5 pt-5 border-t border-white/10 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLinkMode('code')}
                  className={`px-3 py-1 rounded-full border ${linkMode === 'code' ? 'border-accent bg-accent/15 text-hi' : 'border-white/10 text-mid'}`}
                >
                  Single-Use Invitation Code
                </button>
                <button
                  type="button"
                  onClick={() => setLinkMode('request')}
                  className={`px-3 py-1 rounded-full border ${linkMode === 'request' ? 'border-accent bg-accent/15 text-hi' : 'border-white/10 text-mid'}`}
                >
                  Request Guardian Approval
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="rounded-xl bg-[#0B0B10] border border-white/10 px-3 py-2 text-xs text-hi"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="legal_guardian">Legal Guardian</option>
                  <option value="authorized_guardian">Authorized Guardian</option>
                </select>
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder={linkMode === 'code' ? 'Enter invitation code (e.g. SF-A1B2C3D4)' : 'Enter student institutional email'}
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2 text-xs text-hi placeholder-faint focus:outline-none focus:border-accent"
                />
                <button type="submit" className="btn-pill-accent px-4 py-2 text-xs font-semibold cursor-pointer">
                  {linkMode === 'code' ? 'Verify & Link' : 'Submit Request'}
                </button>
              </div>
              {linkError && (
                <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {linkError}
                </p>
              )}
              {linkSuccess && (
                <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {linkSuccess}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Navigation Pill Tabs (Matches Navbar visual language) */}
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-full bg-white/[0.03] p-1 border border-white/5 w-fit max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${activeTab === tab.id
                ? 'bg-white text-[#050507] font-bold shadow-sm'
                : 'text-mid hover:text-white hover:bg-white/5'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {wardError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {wardError}
            </span>
            <button type="button" onClick={() => fetchWards()} className="underline font-semibold">
              Retry
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Cols: Notifications Stream & Subject Health */}
            <div className="lg:col-span-7 space-y-6">
              <div id="notifications" className="rounded-[22px] card-surface p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber" />
                    <span>Real-Time Attendance & Arrival Alerts</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    {notifications.some((n) => !n.read) && (
                      <button
                        type="button"
                        onClick={async () => {
                          await api.notifications.markAllRead().catch(() => { });
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                        }}
                        className="text-[11px] font-semibold text-accent hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <span className="text-xs text-spotify font-mono">Live Sync</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-faint">No recent notifications.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={async () => {
                          if (!notif.read) {
                            await api.notifications.markRead(notif.id).catch(() => { });
                            setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
                          }
                        }}
                        className={`flex items-start gap-3.5 rounded-[16px] border p-4 hover:border-amber/30 transition-all cursor-pointer ${notif.read ? 'border-white/5 bg-white/[0.02]' : 'border-amber/30 bg-amber/[0.04]'
                          }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber border border-amber/20 mt-0.5">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-hi">{notif.title}</h4>
                            <span className="text-[11px] text-faint font-mono">{notif.time}</span>
                          </div>
                          <p className="text-xs text-mid mt-1">{notif.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Subject Attendance Health Radar */}
              <div className="rounded-[22px] card-surface p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    <span>Academic Attendance Health</span>
                  </h3>
                  <span className="text-xs text-spotify font-semibold">
                    {summary?.overall_attendance !== null && summary?.overall_attendance !== undefined
                      ? `${summary.overall_attendance}% Overall (${summary.standing})`
                      : 'No data yet'}
                  </span>
                </div>

                <div className="space-y-3">
                  {!activeWard.email ? (
                    <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-xs text-faint">
                      Link an authorised student ward to view subject-wise attendance.
                    </div>
                  ) : subjects.length === 0 ? (
                    <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-xs text-faint">
                      No attendance records found for this ward yet.
                    </div>
                  ) : (
                    subjects.map((sub: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-[16px] bg-white/[0.02] p-3 border border-white/5">
                        <div>
                          <p className="text-xs font-bold text-hi">{sub.subject}</p>
                          <span className="text-[11px] text-mid">
                            {sub.attended} of {sub.conducted} classes attended
                            {sub.classes_needed > 0 ? ` • Needs ${sub.classes_needed} consecutive` : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-hi">{sub.percentage ?? 0}%</span>
                          <span className={`block text-[10px] ${sub.eligible ? 'text-spotify' : 'text-amber'}`}>
                            {sub.eligible ? 'Eligible' : 'Shortage'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Direct Absence Submission & Verified Institutional Contacts */}
            <div className="lg:col-span-5 space-y-6">
              <div id="leave" className="rounded-[22px] card-surface p-6">
                <h3 className="font-display text-base font-bold text-hi mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber" />
                  <span>Submit Absence or Medical Notice</span>
                </h3>
                <p className="text-xs text-mid mb-4">
                  Directly notify faculty and administration about upcoming sick leaves or appointments.
                </p>

                <form onSubmit={handleAbsenceSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-mid mb-1">
                      Absence Reason & Dates
                    </label>
                    <textarea
                      rows={3}
                      value={absenceNotice}
                      onChange={(e) => setAbsenceNotice(e.target.value)}
                      placeholder="e.g. Medical appointment on Thursday morning..."
                      className="w-full rounded-[16px] bg-white/[0.04] border border-white/10 p-3 text-xs text-hi placeholder-faint focus:outline-none focus:border-accent"
                    />
                  </div>
                  {submitError && (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {submitError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!activeWard.email}
                    className="w-full h-10 rounded-full btn-pill-accent text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{absenceSubmitted ? 'Notice Dispatched!' : 'Submit Parent Notice'}</span>
                  </button>
                </form>
              </div>

              <div className="rounded-[22px] card-surface p-6">
                <h3 className="font-display text-base font-bold text-hi mb-3 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-spotify" />
                  <span>Institutional Support Channels</span>
                </h3>

                <div className="space-y-3 text-xs">
                  {contacts.length === 0 ? (
                    <div className="rounded-[16px] bg-white/[0.02] p-3 border border-white/5 text-mid">
                      Use the Leaves & Enquiries tab to contact your ward’s authorised academic coordinator.
                    </div>
                  ) : (
                    contacts.map((c, idx) => (
                      <div key={idx} className="rounded-[16px] bg-white/[0.02] p-3 border border-white/5">
                        <p className="font-bold text-hi">{c.title}</p>
                        <p className="text-mid text-[11px] mt-0.5">{c.role} • {c.channel}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && activeWard.email && (
          <ParentAttendanceTab
            wardEmail={activeWard.email}
            wardName={activeWard.name}
            summary={summary}
            onRefresh={() => fetchWardDashboard(activeWard.email)}
          />
        )}

        {activeTab === 'timetable' && activeWard.email && (
          <ParentTimetableTab
            wardEmail={activeWard.email}
            announcements={Array.isArray(dashboard?.announcements) ? dashboard.announcements : []}
          />
        )}

        {activeTab === 'leaves' && activeWard.email && (
          <ParentLeavesTab
            wardEmail={activeWard.email}
            wardName={activeWard.name}
            onRefresh={() => fetchWardDashboard(activeWard.email)}
          />
        )}

        {activeTab === 'reports' && activeWard.email && (
          <ParentReportsNexaTab wardEmail={activeWard.email} wardName={activeWard.name} />
        )}

        {activeTab === 'profile' && (
          <ParentProfileTab onRelationshipChanged={() => fetchWards()} />
        )}
      </main>
    </div>
  );
}
