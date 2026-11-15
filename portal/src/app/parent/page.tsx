'use client';

import React, { useState } from 'react';
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

export default function ParentPortalPage() {
  const profile = DEMO_PROFILES.parent;
  const [absenceNotice, setAbsenceNotice] = useState('');
  const [absenceSubmitted, setAbsenceSubmitted] = useState(false);

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

  const handleAbsenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceNotice.trim()) return;
    setAbsenceSubmitted(true);
    setTimeout(() => {
      setAbsenceSubmitted(false);
      setAbsenceNotice('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-[#C8CCDF]">
      <Navbar currentRole="parent" />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Child Profile & Campus Status Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-amber-950/40 via-[#0E1428] to-indigo-950/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                <HeartHandshake className="h-8 w-8" />
              </div>
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Linked Student Profile
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {profile.childName}
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Roll No: {profile.childRollNo} • Computer Science & Engineering
                </p>
              </div>
            </div>

            {/* Current Real-time Presence Status */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:px-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-400 uppercase">Currently On Campus</span>
              </div>
              <p className="text-sm font-semibold text-white">In Lecture: Lab 402</p>
              <p className="text-[11px] text-gray-400">Arrived at 08:52 AM via North Gate</p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Notifications Stream & Subject Health */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 7 Cols: Real-time Arrival & Lecture Alerts Feed */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#0E1428] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-400" />
                  <span>Real-Time Attendance & Arrival Alerts</span>
                </h3>
                <span className="text-xs text-emerald-400 font-mono">Live Push Sync</span>
              </div>

              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-amber-500/30 transition-all"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                        <span className="text-[11px] text-gray-500 font-mono">{notif.time}</span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{notif.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Attendance Health Radar */}
            <div className="rounded-3xl border border-white/10 bg-[#0E1428] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-400" />
                  <span>Academic Attendance Health</span>
                </h3>
                <span className="text-xs text-emerald-400 font-semibold">88.6% Total (Safe Zone)</span>
              </div>

              <div className="space-y-3">
                {MOCK_SUBJECT_STATS.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">{sub.subject}</p>
                      <span className="text-[11px] text-gray-400">{sub.attended} of {sub.total} classes attended</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-white">{sub.percentage}%</span>
                      <span className="block text-[10px] text-emerald-400">Eligible</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Direct Absence Submission & Department Contacts */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Submit Absence Notice */}
            <div className="rounded-3xl border border-white/10 bg-[#0E1428] p-6">
              <h3 className="font-display text-base font-bold text-white mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                <span>Submit Absence or Medical Notice</span>
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Directly notify faculty and administration about upcoming sick leaves or appointments.
              </p>

              <form onSubmit={handleAbsenceSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Absence Reason & Dates
                  </label>
                  <textarea
                    rows={3}
                    value={absenceNotice}
                    onChange={(e) => setAbsenceNotice(e.target.value)}
                    placeholder="e.g. Alice has a medical appointment on Thursday morning..."
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{absenceSubmitted ? 'Notice Dispatched to Dean!' : 'Submit Parent Notice'}</span>
                </button>
              </form>
            </div>

            {/* Department Contacts */}
            <div className="rounded-3xl border border-white/10 bg-[#0E1428] p-6">
              <h3 className="font-display text-base font-bold text-white mb-3 flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-emerald-400" />
                <span>Department Faculty Contacts</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <p className="font-bold text-white">Prof. Marcus Vance (Head of AI)</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">marcus.vance@smartface.pro</p>
                </div>
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <p className="font-bold text-white">Campus Student Welfare Office</p>
                  <p className="text-gray-400 text-[11px] mt-0.5">+1 (555) 019-2834</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
