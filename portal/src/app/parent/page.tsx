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
  PhoneCall
} from 'lucide-react';
import { DEMO_PROFILES, MOCK_SUBJECT_STATS } from '@/lib/demo-data';
import { api } from '@/lib/api';

export default function ParentPortalPage() {
  const profile = DEMO_PROFILES.parent;
  const [absenceNotice, setAbsenceNotice] = useState('');
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);
  const [liveWards, setLiveWards] = useState<any[]>([]);

  // Multi-ward linked students default
  const defaultWards = [
    {
      id: 'w1',
      name: profile.childName || 'Alice Smith',
      email: 'alice.smith@smartface.pro',
      rollNo: profile.childRollNo || 'CS-2024-042',
      department: 'Computer Science & Engineering',
      status: 'In Lecture: Lab 402',
      location: 'North Gate entrance at 08:52 AM',
      onCampus: true,
      stats: MOCK_SUBJECT_STATS,
    },
    {
      id: 'w2',
      name: 'Ethan Smith',
      email: 'ethan.smith@smartface.pro',
      rollNo: 'ECE-2025-019',
      department: 'Electronics & Communication',
      status: 'Checked-in: Main Library',
      location: 'South Gate entrance at 09:10 AM',
      onCampus: true,
      stats: [
        { subject: 'Digital Signal Processing', attended: 22, total: 24, percentage: 91.6, color: '#10B981' },
        { subject: 'VLSI Design & Architecture', attended: 20, total: 22, percentage: 90.9, color: '#6366F1' },
        { subject: 'Embedded Systems Lab', attended: 18, total: 20, percentage: 90.0, color: '#3B82F6' },
      ],
    },
  ];
  const wards = liveWards.length > 0 ? liveWards : defaultWards;
  const [selectedWardId, setSelectedWardId] = useState('w1');
  const activeWard = wards.find((w) => w.id === selectedWardId) || wards[0];

  useEffect(() => {
    let isMounted = true;
    async function fetchParentData() {
      try {
        const children = await api.parent.children();
        if (isMounted && Array.isArray(children) && children.length > 0) {
          const mapped = await Promise.all(
            children.map(async (c: any, idx: number) => {
              let stats = MOCK_SUBJECT_STATS;
              try {
                const liveStats = await api.parent.childStats(c.email);
                if (liveStats && liveStats.subjects) {
                  stats = liveStats.subjects.map((s: any) => ({
                    subject: s.subject || 'Core Session',
                    attended: s.present || 0,
                    total: s.total || 0,
                    percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 100,
                    color: '#10B981',
                  }));
                }
              } catch {}
              return {
                id: `ward-${idx}`,
                name: c.full_name || c.email,
                email: c.email,
                rollNo: c.student_id || 'STU-001',
                department: c.department || 'General',
                status: 'Checked-in',
                location: 'Campus Biometric Gate',
                onCampus: true,
                stats,
              };
            })
          );
          setLiveWards(mapped);
          setSelectedWardId(mapped[0].id);
        }
      } catch {
        // Keep default demonstration wards if not authenticated as parent
      }
    }
    fetchParentData();
    return () => {
      isMounted = false;
    };
  }, []);

  const notifications = [
    {
      id: '1',
      title: 'Biometric Check-in at Campus Gate',
      time: '08:52 AM Today',
      description: 'Alice verified identity via Face Recognition camera at North Gate entrance.',
      type: 'checkin',
    },
    {
      id: '2',
      title: 'Class Attendance Logged',
      time: '09:02 AM Today',
      description: 'Marked present for Neural Networks & Deep Learning in Lab 402.',
      type: 'class',
    },
    {
      id: '3',
      title: 'Hackathon Leave Approved',
      time: 'Yesterday 04:15 PM',
      description: 'Dean approved academic leave for 20 Nov - 22 Nov (ACM Regional Hackathon).',
      type: 'leave',
    },
  ];

  const submitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    };
  }, []);

  const handleAbsenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceNotice.trim()) return;
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
    }
    const reasonToSend = absenceNotice;
    setAbsenceNotice('');
    setAbsenceSubmitted(true);
    try {
      if (activeWard.email) {
        await api.parent.submitAbsenceNotice({
          childEmail: activeWard.email,
          reason: reasonToSend,
        });
      }
    } catch {}
    submitTimerRef.current = setTimeout(() => {
      setAbsenceSubmitted(false);
      submitTimerRef.current = null;
    }, 4000);
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
                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                          activeWard.id === w.id
                            ? 'bg-amber/20 text-amber border border-amber/40 shadow-sm'
                            : 'bg-white/5 text-mid border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {w.name}
                      </button>
                    ))}
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
                            <span className="text-xs text-spotify font-semibold">88.6% Total (Safe Zone)</span>
                        </div>

                        <div className="space-y-3">
                          {activeWard.stats.map((sub: any, idx: number) => (
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
                          ))}
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

                                <button
                                  type="submit"
                                  className="w-full h-10 rounded-full btn-pill-accent text-xs font-semibold flex items-center justify-center gap-2"
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
