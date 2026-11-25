'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import {
  HeartHandshake,
  Bell,
  Calendar,
  CheckCircle2,
  MapPin,
  Clock,
  AlertCircle,
  FileText,
  Send,
  ShieldCheck,
  PhoneCall,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function ParentPortalPage() {
  const { user, authed, loading: authLoading } = useAuth();
  const [absenceNotice, setAbsenceNotice] = useState('');
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [liveWards, setLiveWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const wards = liveWards;
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const activeWard = wards.find((w) => w.id === selectedWardId) || wards[0] || {
    id: 'ward-placeholder',
    name: 'No Linked Student Ward',
    email: '',
    rollNo: '—',
    department: 'SmartFace Institute of Technology',
    status: loading ? 'Connecting to institutional gateway...' : 'No ward linked yet',
    location: 'Real-time telemetry',
    onCampus: false,
    stats: [],
    statsUnavailable: false,
  };

  useEffect(() => {
    if (authLoading || !authed) return;
    let isMounted = true;
    async function fetchParentData() {
      setLoading(true);
      try {
        const children = await api.parent.children();
        if (isMounted && Array.isArray(children) && children.length > 0) {
          const mapped = await Promise.all(
            children.map(async (c: any, idx: number) => {
              let stats: any[] = [];
              let statsUnavailable = false;
              let onCampus = false;
              let status = 'Not on campus';
              let location = 'Awaiting check-in';
              try {
                const liveStats = await api.parent.childStats(c.email);
                if (liveStats && Array.isArray(liveStats.subjects)) {
                  stats = liveStats.subjects.map((s: any) => {
                    const present = s.present ?? 0;
                    const total = s.total ?? 0;
                    return {
                      subject: s.subject || 'Academic Session',
                      attended: present,
                      total,
                      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
                      color: '#10B981',
                    };
                  });
                }
              } catch {
                statsUnavailable = true;
              }
              try {
                const logs = await api.parent.childAttendanceLogs(c.email);
                const todayStr = new Date().toISOString().split('T')[0];
                const todayLog = Array.isArray(logs) ? logs.find((l: any) => l.date === todayStr && l.status === 'Present') : null;
                if (todayLog) {
                  onCampus = true;
                  status = `Checked-in: ${todayLog.subject || 'Class'}`;
                  location = `Verified via ${todayLog.verifiedBy || 'Biometrics'}`;
                } else if (Array.isArray(logs) && logs.length > 0 && logs[0].status === 'Present') {
                  status = `Last check-in: ${logs[0].date}`;
                  location = `Verified via ${logs[0].verifiedBy || 'Biometrics'}`;
                }
              } catch { }
              return {
                id: `ward-${idx}`,
                name: c.full_name || c.email,
                email: c.email,
                rollNo: c.student_id || '—',
                department: c.department || 'Engineering',
                status,
                location,
                onCampus,
                stats,
                statsUnavailable,
              };
            })
          );
          setLiveWards(mapped);
          setSelectedWardId(mapped[0]?.id || '');
        } else if (isMounted) {
          setLiveWards([]);
          setSelectedWardId('');
        }
      } catch (err) {
        console.error('Fetch parent data error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchParentData();
    return () => {
      isMounted = false;
    };
  }, [authLoading, authed, user?.email]);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    setLinkError('');
    setLinkSuccess('');
    try {
      const isEmail = linkInput.includes('@');
      const res = await api.parent.linkStudent(
        isEmail ? { student_email: linkInput.trim() } : { student_id: linkInput.trim() }
      );
      if (res && res.success) {
        setLinkSuccess(res.message || 'Student linked successfully.');
        setLinkInput('');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      setLinkError(err.message || 'Failed to link student.');
    }
  };

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; time: string; description: string; type: string }>>([]);

  useEffect(() => {
    api.notifications.list()
      .then((res: any) => {
        const items = Array.isArray(res) ? res : (res?.notifications || []);
        setNotifications(items.slice(0, 10).map((n: any, idx: number) => ({
          id: n.id || n._id || `notif_${idx}`,
          title: n.title || 'Update',
          time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Recent',
          description: n.message || '',
          type: n.type || 'info',
        })));
      })
      .catch(() => setNotifications([]));
  }, []);

  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  const handleAbsenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWard.email) {
      setSubmitError('Please link and select a student ward before submitting an absence notice.');
      return;
    }
    if (!absenceNotice.trim()) return;
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }
    setSubmitError('');
    try {
      await api.parent.submitAbsenceNotice({
        childEmail: activeWard.email,
        reason: absenceNotice.trim(),
      });
      setAbsenceNotice('');
      setAbsenceSubmitted(true);
      submitTimerRef.current = setTimeout(() => {
        setAbsenceSubmitted(false);
        submitTimerRef.current = null;
      }, 4000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to dispatch absence notice. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-[#B6B6C2]">
      <Navbar currentRole="parent" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Child Profile & Campus Status Banner */}
        <div className="relative overflow-hidden rounded-[22px] card-bytune p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                <HeartHandshake className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-amber uppercase tracking-wider">
                    Linked Student Profile
                  </span>
                  {/* Multi-child switcher pills */}
                  <div className="flex items-center gap-1.5 ml-2">
                    {wards.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWardId(w.id)}
                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${activeWard.id === w.id
                          ? 'bg-amber/20 text-amber border border-amber/40 shadow-sm'
                          : 'bg-white/5 text-mid border border-white/10 hover:bg-white/10'
                          }`}
                      >
                        {w.name}
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
                </p>
              </div>
            </div>

            {/* Current Real-time Presence Status */}
            <div className="rounded-[20px] border border-spotify/30 bg-spotify/10 p-4 sm:px-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-spotify animate-ping" />
                <span className="text-xs font-bold text-spotify uppercase">Currently On Campus</span>
              </div>
              <p className="text-sm font-semibold text-hi">{activeWard.status}</p>
              <p className="text-[11px] text-mid">Arrived via {activeWard.location}</p>
            </div>
          </div>

          {showLinkModal && (
            <form onSubmit={handleLinkStudent} className="mt-5 pt-5 border-t border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Enter student email or student ID (e.g. bob@smartface.pro)"
                  className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2 text-xs text-hi placeholder-faint focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="btn-pill-accent px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Confirm Link
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

        {/* 2-Column Grid: Notifications Stream & Subject Health */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left 7 Cols: Real-time Arrival & Lecture Alerts Feed */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-[22px] card-surface p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-hi flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber" />
                  <span>Real-Time Attendance & Arrival Alerts</span>
                </h3>
                <span className="text-xs text-spotify font-mono">Live Push Sync</span>
              </div>

              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3.5 rounded-[16px] border border-white/5 bg-white/[0.02] p-4 hover:border-amber/30 transition-all"
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
                ))}
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
                  {activeWard.stats.length > 0
                    ? `${Math.round(activeWard.stats.reduce((acc: number, s: any) => acc + (Number(s.percentage) || 0), 0) / activeWard.stats.length)}% Avg`
                    : 'No data yet'}
                </span>
              </div>

              <div className="space-y-3">
                {
                  activeWard.statsUnavailable ? (
                    <div className="rounded-[16px] border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300">
                      Attendance statistics are currently unavailable. Please try again shortly.
                    </div>
                  ) : activeWard.stats.length === 0 ? (
                    <div className="rounded-[16px] border border-white/5 bg-white/[0.02] p-4 text-xs text-faint">
                      No attendance records found for this ward yet.
                    </div>
                  ) : (
                    activeWard.stats.map((sub: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-[16px] bg-white/[0.02] p-3 border border-white/5">
                        <div>
                          <p className="text-xs font-bold text-hi">{sub.subject}</p>
                          <span className="text-[11px] text-mid">{sub.attended} of {sub.total} classes attended</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-hi">{sub.percentage}%</span>
                          <span className="block text-[10px] text-spotify">Eligible</span>
                        </div>
                      </div>
                    ))
                  )}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Direct Absence Submission & Department Contacts */}
          <div className="lg:col-span-5 space-y-6">

            {/* Submit Absence Notice */}
            <div className="rounded-[22px] card-surface p-6">
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
                    placeholder="e.g. Alice has a medical appointment on Thursday morning..."
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
                  <span>{absenceSubmitted ? 'Notice Dispatched to Dean!' : 'Submit Parent Notice'}</span>
                </button>
              </form>
            </div>

            {/* Department Contacts */}
            <div className="rounded-[22px] card-surface p-6">
              <h3 className="font-display text-base font-bold text-hi mb-3 flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-spotify" />
                <span>Department Faculty Contacts</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="rounded-[16px] bg-white/[0.02] p-3 border border-white/5">
                  <p className="font-bold text-hi">Prof. Marcus Vance (Head of AI)</p>
                  <p className="text-mid text-[11px] mt-0.5">marcus.vance@smartface.pro</p>
                </div>
                <div className="rounded-[16px] bg-white/[0.02] p-3 border border-white/5">
                  <p className="font-bold text-hi">Campus Student Welfare Office</p>
                  <p className="text-mid text-[11px] mt-0.5">+1 (555) 019-2834</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
